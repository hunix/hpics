import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-device-id, x-device-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface RFSignalCapture {
  signal_type: 'sub_ghz' | 'nfc' | 'rfid' | 'infrared' | 'bluetooth' | 'wifi' | 'cellular' | 'unknown';
  frequency_hz?: number;
  bandwidth_hz?: number;
  protocol?: string;
  modulation?: string;
  signal_strength_dbm?: number;
  raw_data?: string;
  decoded_data?: Record<string, unknown>;
  device_fingerprint?: Record<string, unknown>;
  location?: { lat: number; lng: number };
  location_name?: string;
  mission_id?: string;
  device_id?: string;
}

interface AnalysisResult {
  threat_classification: 'benign' | 'suspicious' | 'hostile' | 'unknown';
  analysis: {
    signal_characteristics: Record<string, unknown>;
    known_protocols: string[];
    potential_devices: string[];
    threat_indicators: string[];
    recommendations: string[];
  };
  confidence: number;
}

// Known RF protocol signatures
const KNOWN_PROTOCOLS: Record<string, { name: string; frequencies: number[]; threat_level: string }> = {
  'garage_door': { name: 'Garage Door Opener', frequencies: [300000000, 315000000, 390000000], threat_level: 'benign' },
  'car_key': { name: 'Car Key Fob', frequencies: [315000000, 433920000], threat_level: 'benign' },
  'tire_pressure': { name: 'TPMS Sensor', frequencies: [315000000, 433920000], threat_level: 'benign' },
  'weather_station': { name: 'Weather Station', frequencies: [433920000], threat_level: 'benign' },
  'wireless_doorbell': { name: 'Wireless Doorbell', frequencies: [315000000, 433920000], threat_level: 'benign' },
  'baby_monitor': { name: 'Baby Monitor', frequencies: [49000000, 900000000], threat_level: 'low' },
  'wireless_mic': { name: 'Wireless Microphone', frequencies: [470000000, 698000000], threat_level: 'suspicious' },
  'surveillance_bug': { name: 'Potential Surveillance Device', frequencies: [88000000, 108000000, 433920000, 868000000], threat_level: 'hostile' },
  'gps_tracker': { name: 'GPS Tracker', frequencies: [433920000, 868000000, 915000000], threat_level: 'hostile' },
  'cell_jammer': { name: 'Cell Phone Jammer', frequencies: [850000000, 1900000000, 2100000000], threat_level: 'hostile' },
};

// NFC/RFID card type detection
const CARD_TYPES: Record<string, { name: string; security_level: string; cloneable: boolean }> = {
  'mifare_classic': { name: 'MIFARE Classic', security_level: 'low', cloneable: true },
  'mifare_plus': { name: 'MIFARE Plus', security_level: 'medium', cloneable: false },
  'mifare_desfire': { name: 'MIFARE DESFire', security_level: 'high', cloneable: false },
  'em4100': { name: 'EM4100 125kHz', security_level: 'none', cloneable: true },
  'hid_prox': { name: 'HID Proximity', security_level: 'low', cloneable: true },
  'hid_iclass': { name: 'HID iCLASS', security_level: 'medium', cloneable: false },
  'ntag': { name: 'NTAG (NXP)', security_level: 'low', cloneable: true },
  'iso14443a': { name: 'ISO 14443A', security_level: 'medium', cloneable: false },
  'felica': { name: 'FeliCa (Sony)', security_level: 'high', cloneable: false },
};

function analyzeSubGhzSignal(capture: RFSignalCapture): AnalysisResult {
  const freq = capture.frequency_hz || 0;
  const matchedProtocols: string[] = [];
  let threatLevel: 'benign' | 'suspicious' | 'hostile' | 'unknown' = 'unknown';
  const threatIndicators: string[] = [];
  const recommendations: string[] = [];

  // Match against known protocols
  for (const [key, protocol] of Object.entries(KNOWN_PROTOCOLS)) {
    for (const knownFreq of protocol.frequencies) {
      if (Math.abs(freq - knownFreq) < 1000000) { // Within 1MHz
        matchedProtocols.push(protocol.name);
        if (protocol.threat_level === 'hostile') {
          threatIndicators.push(`Potential ${protocol.name} detected`);
          threatLevel = 'hostile';
        } else if (protocol.threat_level === 'suspicious' && threatLevel !== 'hostile') {
          threatLevel = 'suspicious';
        }
      }
    }
  }

  // Analyze signal strength
  if (capture.signal_strength_dbm && capture.signal_strength_dbm > -30) {
    threatIndicators.push('Very strong signal - device likely within 10 meters');
  }

  // Check for suspicious patterns
  if (freq >= 88000000 && freq <= 108000000) {
    threatIndicators.push('FM band - common for analog surveillance bugs');
    recommendations.push('Perform physical sweep of area');
    if (threatLevel === 'unknown') threatLevel = 'suspicious';
  }

  if (matchedProtocols.length === 0) {
    threatIndicators.push('Unknown signal protocol');
    recommendations.push('Capture additional samples for analysis');
    recommendations.push('Cross-reference with mission target profiles');
  }

  return {
    threat_classification: threatLevel,
    analysis: {
      signal_characteristics: {
        frequency_hz: capture.frequency_hz,
        bandwidth_hz: capture.bandwidth_hz,
        modulation: capture.modulation,
        signal_strength_dbm: capture.signal_strength_dbm,
      },
      known_protocols: matchedProtocols,
      potential_devices: matchedProtocols.length > 0 ? matchedProtocols : ['Unknown Device'],
      threat_indicators: threatIndicators,
      recommendations: recommendations.length > 0 ? recommendations : ['Continue monitoring'],
    },
    confidence: matchedProtocols.length > 0 ? 0.85 : 0.4,
  };
}

function analyzeNfcRfidSignal(capture: RFSignalCapture): AnalysisResult {
  const decoded = capture.decoded_data || {};
  const cardType = decoded.card_type as string || 'unknown';
  const threatIndicators: string[] = [];
  const recommendations: string[] = [];

  const cardInfo = CARD_TYPES[cardType.toLowerCase()];
  
  if (cardInfo) {
    if (cardInfo.cloneable) {
      threatIndicators.push(`${cardInfo.name} is vulnerable to cloning`);
      recommendations.push('Consider upgrading to higher security credential');
    }
    if (cardInfo.security_level === 'none' || cardInfo.security_level === 'low') {
      threatIndicators.push('Low security credential detected');
    }
  }

  // Analyze UID patterns
  if (decoded.uid) {
    const uid = decoded.uid as string;
    if (uid.startsWith('00000000') || uid.startsWith('FFFFFFFF')) {
      threatIndicators.push('Suspicious UID pattern - possible clone');
    }
  }

  return {
    threat_classification: threatIndicators.length > 1 ? 'suspicious' : 'benign',
    analysis: {
      signal_characteristics: {
        card_type: cardInfo?.name || 'Unknown',
        security_level: cardInfo?.security_level || 'unknown',
        cloneable: cardInfo?.cloneable ?? true,
        uid: decoded.uid,
        atqa: decoded.atqa,
        sak: decoded.sak,
      },
      known_protocols: cardInfo ? [cardInfo.name] : [],
      potential_devices: ['Access Card', 'ID Badge', 'Payment Card'],
      threat_indicators: threatIndicators,
      recommendations,
    },
    confidence: cardInfo ? 0.9 : 0.5,
  };
}

function analyzeBluetoothSignal(capture: RFSignalCapture): AnalysisResult {
  const decoded = capture.decoded_data || {};
  const fingerprint = capture.device_fingerprint || {};
  const threatIndicators: string[] = [];
  const recommendations: string[] = [];

  // Analyze device class
  const deviceClass = fingerprint.device_class as string;
  const deviceName = decoded.device_name as string;

  // Check for suspicious Bluetooth devices
  const suspiciousPatterns = ['tracker', 'tile', 'airtag', 'smarttag', 'chipolo'];
  if (deviceName && suspiciousPatterns.some(p => deviceName.toLowerCase().includes(p))) {
    threatIndicators.push('Potential tracking device detected');
    recommendations.push('Verify ownership of tracking device');
  }

  // Check for hidden Bluetooth devices
  if (!deviceName || deviceName === '') {
    threatIndicators.push('Unnamed Bluetooth device - could be covert');
  }

  // Strong signal nearby
  if (capture.signal_strength_dbm && capture.signal_strength_dbm > -50) {
    threatIndicators.push('Device very close - within 5 meters');
  }

  return {
    threat_classification: threatIndicators.length > 0 ? 'suspicious' : 'benign',
    analysis: {
      signal_characteristics: {
        device_name: deviceName || 'Unknown',
        device_class: deviceClass,
        mac_address: fingerprint.mac_address,
        signal_strength: capture.signal_strength_dbm,
      },
      known_protocols: ['Bluetooth'],
      potential_devices: deviceClass ? [deviceClass] : ['Unknown Bluetooth Device'],
      threat_indicators: threatIndicators,
      recommendations: recommendations.length > 0 ? recommendations : ['Monitor for repeated appearances'],
    },
    confidence: 0.75,
  };
}

function analyzeSignal(capture: RFSignalCapture): AnalysisResult {
  switch (capture.signal_type) {
    case 'sub_ghz':
      return analyzeSubGhzSignal(capture);
    case 'nfc':
    case 'rfid':
      return analyzeNfcRfidSignal(capture);
    case 'bluetooth':
      return analyzeBluetoothSignal(capture);
    default:
      return {
        threat_classification: 'unknown',
        analysis: {
          signal_characteristics: {},
          known_protocols: [],
          potential_devices: ['Unknown'],
          threat_indicators: ['Unrecognized signal type'],
          recommendations: ['Manual analysis required'],
        },
        confidence: 0.2,
      };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, ...data } = await req.json();

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    switch (action) {
      case 'capture_signal': {
        const capture = data.capture as RFSignalCapture;
        const analysis = analyzeSignal(capture);

        // Store the capture with analysis
        const { data: stored, error: storeError } = await supabase
          .from('rf_signal_captures')
          .insert({
            user_id: user.id,
            device_id: capture.device_id || null,
            mission_id: capture.mission_id || null,
            signal_type: capture.signal_type,
            frequency_hz: capture.frequency_hz || null,
            bandwidth_hz: capture.bandwidth_hz || null,
            protocol: capture.protocol || null,
            modulation: capture.modulation || null,
            signal_strength_dbm: capture.signal_strength_dbm || null,
            decoded_data: capture.decoded_data || null,
            device_fingerprint: capture.device_fingerprint || null,
            threat_classification: analysis.threat_classification,
            analysis: analysis.analysis,
            location: capture.location || null,
            location_name: capture.location_name || null,
            captured_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (storeError) {
          throw storeError;
        }

        // If high threat, create mission event
        if (analysis.threat_classification === 'hostile' || analysis.threat_classification === 'suspicious') {
          if (capture.mission_id) {
            await supabase.from('mission_events').insert({
              user_id: user.id,
              mission_id: capture.mission_id,
              device_id: capture.device_id || null,
              event_type: 'detection',
              event_data: {
                capture_id: stored.id,
                signal_type: capture.signal_type,
                threat_classification: analysis.threat_classification,
                frequency_hz: capture.frequency_hz,
              },
              severity: analysis.threat_classification === 'hostile' ? 'critical' : 'warning',
              location: capture.location || null,
            });
          }
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            capture_id: stored.id,
            analysis,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'analyze_signal': {
        const capture = data.capture as RFSignalCapture;
        const analysis = analyzeSignal(capture);

        return new Response(
          JSON.stringify({ analysis }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_captures': {
        const { mission_id, signal_type, threat_only, limit = 50 } = data;

        let query = supabase
          .from('rf_signal_captures')
          .select('*')
          .eq('user_id', user.id)
          .order('captured_at', { ascending: false })
          .limit(limit);

        if (mission_id) {
          query = query.eq('mission_id', mission_id);
        }
        if (signal_type) {
          query = query.eq('signal_type', signal_type);
        }
        if (threat_only) {
          query = query.in('threat_classification', ['suspicious', 'hostile']);
        }

        const { data: captures, error } = await query;

        if (error) throw error;

        return new Response(
          JSON.stringify({ captures }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_threat_summary': {
        const { data: captures, error } = await supabase
          .from('rf_signal_captures')
          .select('threat_classification, signal_type')
          .eq('user_id', user.id)
          .gte('captured_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

        if (error) throw error;

        const summary = {
          total: captures?.length || 0,
          hostile: captures?.filter(c => c.threat_classification === 'hostile').length || 0,
          suspicious: captures?.filter(c => c.threat_classification === 'suspicious').length || 0,
          benign: captures?.filter(c => c.threat_classification === 'benign').length || 0,
          by_type: {} as Record<string, number>,
        };

        captures?.forEach(c => {
          summary.by_type[c.signal_type] = (summary.by_type[c.signal_type] || 0) + 1;
        });

        return new Response(
          JSON.stringify({ summary }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Unknown action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error: unknown) {
    console.error('RF Signal Intelligence error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

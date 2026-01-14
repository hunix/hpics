import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SDRScanParams {
  device_id: string;
  start_frequency_hz: number;
  end_frequency_hz: number;
  step_hz?: number;
  sample_rate?: number;
  dwell_time_ms?: number;
  mission_id?: string;
}

interface SignalDetection {
  frequency_hz: number;
  bandwidth_hz: number;
  power_dbm: number;
  modulation: string | null;
  protocol: string | null;
  classification: 'known' | 'unknown' | 'suspicious';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const action = url.pathname.split('/').pop();

    switch (action) {
      case 'spectrum-scan': {
        const params: SDRScanParams = await req.json();
        
        const scanResult = {
          scan_id: crypto.randomUUID(),
          device_id: params.device_id,
          start_frequency_hz: params.start_frequency_hz,
          end_frequency_hz: params.end_frequency_hz,
          step_hz: params.step_hz || 10000,
          sample_rate: params.sample_rate || 2400000,
          dwell_time_ms: params.dwell_time_ms || 50,
          status: 'initiated',
          started_at: new Date().toISOString(),
        };

        // Queue command to SDR device
        await supabase.from('hardware_commands').insert({
          user_id: user.id,
          device_id: params.device_id,
          mission_id: params.mission_id || null,
          command_type: 'spectrum_scan',
          command_data: scanResult,
          priority: 5,
        });

        return new Response(JSON.stringify({ success: true, scan: scanResult }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'analyze-signal': {
        const { capture_id, signal_data } = await req.json();
        
        const analysis = analyzeSignal(signal_data);
        
        if (capture_id) {
          await supabase.from('rf_signal_captures').update({
            analysis: analysis,
            threat_classification: analysis.threat_classification,
          }).eq('id', capture_id);
        }

        return new Response(JSON.stringify({ success: true, analysis }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'detect-signals': {
        const { spectrum_data, threshold_dbm = -80 } = await req.json();
        
        const detections: SignalDetection[] = detectSignals(spectrum_data, threshold_dbm);

        return new Response(JSON.stringify({ 
          success: true, 
          detections,
          count: detections.length,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'frequency-hopping-detect': {
        const { captures, time_window_ms = 1000 } = await req.json();
        
        const hoppingAnalysis = detectFrequencyHopping(captures, time_window_ms);

        return new Response(JSON.stringify({ success: true, analysis: hoppingAnalysis }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'known-frequencies': {
        const knownFrequencies = getKnownFrequencyDatabase();
        return new Response(JSON.stringify({ success: true, frequencies: knownFrequencies }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Unknown action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('SDR Intelligence error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function analyzeSignal(signalData: Record<string, unknown>) {
  const frequency = signalData.frequency_hz as number || 0;
  const power = signalData.power_dbm as number || -100;
  const bandwidth = signalData.bandwidth_hz as number || 0;

  let classification: 'benign' | 'suspicious' | 'hostile' | 'unknown' = 'unknown';
  let threat_classification = 'unknown';
  const insights: string[] = [];

  // Common frequency band analysis
  if (frequency >= 2400000000 && frequency <= 2500000000) {
    insights.push('2.4GHz ISM band - WiFi/Bluetooth region');
    classification = 'benign';
  } else if (frequency >= 5150000000 && frequency <= 5850000000) {
    insights.push('5GHz WiFi band');
    classification = 'benign';
  } else if (frequency >= 433000000 && frequency <= 434000000) {
    insights.push('433MHz ISM - Common IoT/keyfob frequency');
    if (power > -30) {
      insights.push('Strong signal - possible nearby transmitter');
      classification = 'suspicious';
    }
  } else if (frequency >= 868000000 && frequency <= 870000000) {
    insights.push('868MHz LoRa/SRD band');
    classification = 'benign';
  } else if (frequency >= 902000000 && frequency <= 928000000) {
    insights.push('915MHz ISM band (Americas)');
    classification = 'benign';
  }

  // Suspicious patterns
  if (bandwidth < 1000 && power > -40) {
    insights.push('Narrow bandwidth, strong signal - possible surveillance device');
    classification = 'suspicious';
    threat_classification = 'suspicious';
  }

  if (bandwidth > 5000000) {
    insights.push('Wideband signal - possible spread spectrum');
  }

  return {
    frequency_hz: frequency,
    bandwidth_hz: bandwidth,
    power_dbm: power,
    classification,
    threat_classification,
    insights,
    modulation_estimate: estimateModulation(bandwidth, signalData),
    analyzed_at: new Date().toISOString(),
  };
}

function estimateModulation(bandwidth: number, _data: Record<string, unknown>): string {
  if (bandwidth < 25000) return 'FM Narrow';
  if (bandwidth < 200000) return 'FM/FSK';
  if (bandwidth < 2000000) return 'OFDM/QAM';
  return 'Wideband/Spread Spectrum';
}

function detectSignals(spectrumData: number[], thresholdDbm: number): SignalDetection[] {
  const detections: SignalDetection[] = [];
  let inSignal = false;
  let signalStart = 0;
  let peakPower = -200;

  for (let i = 0; i < spectrumData.length; i++) {
    const power = spectrumData[i];
    
    if (power > thresholdDbm && !inSignal) {
      inSignal = true;
      signalStart = i;
      peakPower = power;
    } else if (power > thresholdDbm && inSignal) {
      peakPower = Math.max(peakPower, power);
    } else if (power <= thresholdDbm && inSignal) {
      inSignal = false;
      const centerBin = Math.floor((signalStart + i) / 2);
      detections.push({
        frequency_hz: centerBin * 10000, // Placeholder calculation
        bandwidth_hz: (i - signalStart) * 10000,
        power_dbm: peakPower,
        modulation: null,
        protocol: null,
        classification: peakPower > -30 ? 'suspicious' : 'unknown',
      });
    }
  }

  return detections;
}

function detectFrequencyHopping(captures: Array<Record<string, unknown>>, timeWindowMs: number) {
  const hoppingPatterns: Array<{
    frequencies: number[];
    hop_rate_hz: number;
    pattern_type: string;
  }> = [];

  if (captures.length < 3) {
    return { detected: false, patterns: [], message: 'Insufficient data for hopping detection' };
  }

  // Sort by timestamp
  const sorted = [...captures].sort((a, b) => 
    new Date(a.captured_at as string).getTime() - new Date(b.captured_at as string).getTime()
  );

  // Look for rapid frequency changes
  const frequencyChanges: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const timeDiff = new Date(sorted[i].captured_at as string).getTime() - 
                     new Date(sorted[i-1].captured_at as string).getTime();
    
    if (timeDiff < timeWindowMs) {
      const freqDiff = Math.abs((sorted[i].frequency_hz as number) - (sorted[i-1].frequency_hz as number));
      if (freqDiff > 100000) { // 100kHz change
        frequencyChanges.push(freqDiff);
      }
    }
  }

  const detected = frequencyChanges.length >= 2;
  
  if (detected) {
    hoppingPatterns.push({
      frequencies: sorted.map(c => c.frequency_hz as number),
      hop_rate_hz: frequencyChanges.length > 0 ? 
        1000 / (timeWindowMs / frequencyChanges.length) : 0,
      pattern_type: 'pseudo-random',
    });
  }

  return {
    detected,
    patterns: hoppingPatterns,
    analysis: {
      total_captures: captures.length,
      frequency_changes: frequencyChanges.length,
      time_window_ms: timeWindowMs,
    },
  };
}

function getKnownFrequencyDatabase() {
  return [
    { range: [87500000, 108000000], name: 'FM Broadcast', type: 'commercial' },
    { range: [144000000, 148000000], name: '2m Amateur Band', type: 'amateur' },
    { range: [315000000, 315000000], name: '315MHz Keyfobs', type: 'consumer' },
    { range: [433050000, 434790000], name: '433MHz ISM', type: 'ism' },
    { range: [440000000, 450000000], name: '70cm Amateur', type: 'amateur' },
    { range: [462562500, 467712500], name: 'FRS/GMRS', type: 'consumer' },
    { range: [868000000, 870000000], name: '868MHz SRD (EU)', type: 'ism' },
    { range: [902000000, 928000000], name: '915MHz ISM (US)', type: 'ism' },
    { range: [1227600000, 1227600000], name: 'GPS L2', type: 'navigation' },
    { range: [1575420000, 1575420000], name: 'GPS L1', type: 'navigation' },
    { range: [2400000000, 2500000000], name: '2.4GHz ISM (WiFi/BT)', type: 'ism' },
    { range: [5150000000, 5850000000], name: '5GHz WiFi', type: 'ism' },
  ];
}

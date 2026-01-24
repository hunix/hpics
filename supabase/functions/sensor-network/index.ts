import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SensorReading {
  node_id: string;
  sensor_type: string;
  value: number;
  unit: string;
  timestamp?: string;
}

interface AlertRule {
  sensor_type: string;
  condition: 'above' | 'below' | 'equals' | 'between';
  threshold: number;
  threshold_high?: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
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
    const deviceApiKey = req.headers.get('X-Device-API-Key');
    
    let userId: string | null = null;

    // Support both user auth and device API key
    if (authHeader) {
      const { data: { user }, error } = await supabase.auth.getUser(
        authHeader.replace('Bearer ', '')
      );
      if (!error && user) userId = user.id;
    } else if (deviceApiKey) {
      const { data: device } = await supabase
        .from('hardware_devices')
        .select('user_id')
        .eq('device_id', deviceApiKey)
        .single();
      if (device) userId = device.user_id;
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const action = url.pathname.split('/').pop();

    switch (action) {
      case 'ingest': {
        const { readings, node_id } = await req.json() as { 
          readings: SensorReading[]; 
          node_id: string;
        };

        // Update node last reading time
        await supabase.from('sensor_network_nodes').update({
          last_reading_at: new Date().toISOString(),
        }).eq('id', node_id);

        // Insert readings
        const insertData = readings.map(reading => ({
          user_id: userId,
          node_id: reading.node_id || node_id,
          sensor_type: reading.sensor_type,
          value: reading.value,
          unit: reading.unit,
          reading_quality: 1.0,
          recorded_at: reading.timestamp || new Date().toISOString(),
        }));

        const { error: insertError } = await supabase
          .from('sensor_readings')
          .insert(insertData);

        if (insertError) throw insertError;

        // Check alert rules
        const alerts = await checkAlertRules(supabase, userId!, node_id, readings);

        return new Response(JSON.stringify({ 
          success: true, 
          readings_count: readings.length,
          alerts,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'nodes': {
        const { data: nodes, error } = await supabase
          .from('sensor_network_nodes')
          .select('*')
          .eq('user_id', userId)
          .order('last_reading_at', { ascending: false });

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, nodes }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'register-node': {
        const nodeData = await req.json();

        const { data, error } = await supabase
          .from('sensor_network_nodes')
          .upsert({
            user_id: userId,
            node_address: nodeData.node_address,
            node_name: nodeData.node_name,
            node_type: nodeData.node_type || 'arduino',
            sensors: nodeData.sensors || [],
            location: nodeData.location || null,
            location_description: nodeData.location_description || null,
            zone_name: nodeData.zone_name || null,
            is_active: true,
            alert_rules: nodeData.alert_rules || [],
          }, { onConflict: 'user_id,node_address' })
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, node: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'readings': {
        const nodeId = url.searchParams.get('node_id');
        const sensorType = url.searchParams.get('sensor_type');
        const hours = parseInt(url.searchParams.get('hours') || '24');

        const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

        let query = supabase
          .from('sensor_readings')
          .select('*')
          .eq('user_id', userId)
          .gte('recorded_at', since)
          .order('recorded_at', { ascending: false })
          .limit(1000);

        if (nodeId) query = query.eq('node_id', nodeId);
        if (sensorType) query = query.eq('sensor_type', sensorType);

        const { data, error } = await query;

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, readings: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'aggregate': {
        const nodeId = url.searchParams.get('node_id');
        const sensorType = url.searchParams.get('sensor_type');
        const hours = parseInt(url.searchParams.get('hours') || '24');

        const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

        let query = supabase
          .from('sensor_readings')
          .select('value, sensor_type, recorded_at')
          .eq('user_id', userId)
          .gte('recorded_at', since);

        if (nodeId) query = query.eq('node_id', nodeId);
        if (sensorType) query = query.eq('sensor_type', sensorType);

        const { data, error } = await query;

        if (error) throw error;

        // Calculate aggregates
        const aggregates = calculateAggregates(data || []);

        return new Response(JSON.stringify({ success: true, aggregates }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'set-alerts': {
        const { node_id, rules } = await req.json() as { 
          node_id: string; 
          rules: AlertRule[];
        };

        const { error } = await supabase
          .from('sensor_network_nodes')
          .update({ alert_rules: rules })
          .eq('id', node_id)
          .eq('user_id', userId);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'zone-status': {
        const { data: nodes, error } = await supabase
          .from('sensor_network_nodes')
          .select('zone_name, is_active, last_reading_at')
          .eq('user_id', userId)
          .eq('is_active', true);

        if (error) throw error;

        // Group by zone
        const zones = (nodes || []).reduce((acc, node) => {
          const zone = node.zone_name || 'Unassigned';
          if (!acc[zone]) {
            acc[zone] = { nodes: 0, active: 0, last_reading: null };
          }
          acc[zone].nodes++;
          
          const lastReading = node.last_reading_at ? new Date(node.last_reading_at) : null;
          if (lastReading && Date.now() - lastReading.getTime() < 5 * 60 * 1000) {
            acc[zone].active++;
          }
          
          if (!acc[zone].last_reading || 
              (lastReading && lastReading > new Date(acc[zone].last_reading))) {
            acc[zone].last_reading = node.last_reading_at;
          }
          
          return acc;
        }, {} as Record<string, { nodes: number; active: number; last_reading: string | null }>);

        return new Response(JSON.stringify({ success: true, zones }), {
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
    console.error('Sensor Network error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function checkAlertRules(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  nodeId: string,
  readings: SensorReading[]
) {
  const { data: node } = await supabase
    .from('sensor_network_nodes')
    .select('alert_rules, node_name')
    .eq('id', nodeId)
    .single();

  if (!node?.alert_rules || !Array.isArray(node.alert_rules)) {
    return [];
  }

  const triggeredAlerts: Array<{
    rule: AlertRule;
    reading: SensorReading;
    triggered_at: string;
  }> = [];

  for (const reading of readings) {
    for (const rule of node.alert_rules as AlertRule[]) {
      if (rule.sensor_type !== reading.sensor_type) continue;

      let triggered = false;
      switch (rule.condition) {
        case 'above':
          triggered = reading.value > rule.threshold;
          break;
        case 'below':
          triggered = reading.value < rule.threshold;
          break;
        case 'equals':
          triggered = reading.value === rule.threshold;
          break;
        case 'between':
          triggered = reading.value >= rule.threshold && 
                     reading.value <= (rule.threshold_high || rule.threshold);
          break;
      }

      if (triggered) {
        triggeredAlerts.push({
          rule,
          reading,
          triggered_at: new Date().toISOString(),
        });

        // Create mission event for critical alerts
        if (rule.severity === 'critical' || rule.severity === 'high') {
          await supabase.from('mission_events').insert({
            user_id: userId,
            mission_id: null,
            device_id: null,
            event_type: 'alert',
            event_data: {
              source: 'sensor_network',
              node_id: nodeId,
              node_name: node.node_name,
              alert: rule.message,
              reading: reading,
            },
            severity: rule.severity === 'critical' ? 'critical' : 'alert',
          });
        }
      }
    }
  }

  return triggeredAlerts;
}

function calculateAggregates(readings: Array<{ value: number; sensor_type: string; recorded_at: string }>) {
  const bySensorType = readings.reduce((acc, r) => {
    if (!acc[r.sensor_type]) {
      acc[r.sensor_type] = [];
    }
    acc[r.sensor_type].push(r.value);
    return acc;
  }, {} as Record<string, number[]>);

  const aggregates: Record<string, {
    min: number;
    max: number;
    avg: number;
    count: number;
    stddev: number;
  }> = {};

  for (const [sensorType, values] of Object.entries(bySensorType)) {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
    const stddev = Math.sqrt(variance);

    aggregates[sensorType] = { min, max, avg, count: values.length, stddev };
  }

  return aggregates;
}

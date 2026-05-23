import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": (Deno.env.get("CORS_ALLOWED_ORIGIN") ?? "*"),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    ...init,
    headers: { ...corsHeaders, "Content-Type": "application/json", ...(init.headers ?? {}) },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  if (url.searchParams.get("healthCheck") === "1") {
    return json({ ok: true, function: "sensor-network", timestamp: Date.now() });
  }

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return json({ error: "Unauthorized" }, { status: 401 });

    const pathSegments = url.pathname.split("/").filter(Boolean);
    const subRoute = pathSegments[pathSegments.length - 1];

    if (subRoute === "zone-status") {
      // Aggregate sensor_network_nodes into per-zone counts and the
      // most-recent reading timestamp within that zone.
      const { data: nodes, error: nodesErr } = await supabase
        .from("sensor_network_nodes")
        .select("zone_name, is_active, last_reading_at")
        .eq("user_id", user.id);
      if (nodesErr) return json({ error: nodesErr.message }, { status: 500 });

      const zones: Record<string, { nodes: number; active: number; last_reading: string | null }> = {};
      for (const node of nodes ?? []) {
        const zone = node.zone_name || "Unassigned";
        if (!zones[zone]) zones[zone] = { nodes: 0, active: 0, last_reading: null };
        zones[zone].nodes++;
        if (node.is_active) zones[zone].active++;
        if (node.last_reading_at) {
          if (!zones[zone].last_reading || node.last_reading_at > zones[zone].last_reading!) {
            zones[zone].last_reading = node.last_reading_at;
          }
        }
      }
      return json({ zones });
    }

    if (subRoute === "sensors") {
      const { data, error } = await supabase
        .from("sensor_network_nodes")
        .select("*")
        .eq("user_id", user.id);
      if (error) return json({ error: error.message }, { status: 500 });
      return json({ sensors: data ?? [] });
    }

    if (subRoute === "readings") {
      const { data, error } = await supabase
        .from("sensor_readings")
        .select("*")
        .eq("user_id", user.id)
        .order("recorded_at", { ascending: false })
        .limit(100);
      if (error) return json({ error: error.message }, { status: 500 });
      return json({ readings: data ?? [] });
    }

    if (subRoute === "register-node") {
      const body = await req.json().catch(() => ({}));
      if (!body?.node_address) return json({ error: "node_address required" }, { status: 400 });
      const { data, error } = await supabase
        .from("sensor_network_nodes")
        .insert({
          user_id: user.id,
          node_address: body.node_address,
          node_name: body.node_name ?? null,
          node_type: body.node_type ?? null,
          zone_name: body.zone_name ?? null,
          location: body.location ?? null,
          location_description: body.location_description ?? null,
          sensors: body.sensors ?? null,
          alert_rules: body.alert_rules ?? null,
          hardware_device_id: body.hardware_device_id ?? null,
          is_active: body.is_active ?? true,
        })
        .select()
        .single();
      if (error) return json({ error: error.message }, { status: 500 });
      return json({ node: data });
    }

    if (subRoute === "set-alerts") {
      const body = await req.json().catch(() => ({}));
      if (!body?.node_id) return json({ error: "node_id required" }, { status: 400 });
      const { error } = await supabase
        .from("sensor_network_nodes")
        .update({ alert_rules: body.rules ?? null, updated_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("id", body.node_id);
      if (error) return json({ error: error.message }, { status: 500 });
      return json({ ok: true });
    }

    if (subRoute === "aggregate" || pathSegments.includes("aggregate")) {
      const nodeId = url.searchParams.get("node_id");
      const sensorType = url.searchParams.get("sensor_type");
      const hours = Math.max(1, Math.min(24 * 30, Number(url.searchParams.get("hours") ?? "24")));
      const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

      let query = supabase
        .from("sensor_readings")
        .select("node_id, sensor_type, value, recorded_at")
        .eq("user_id", user.id)
        .gte("recorded_at", since);
      if (nodeId) query = query.eq("node_id", nodeId);
      if (sensorType) query = query.eq("sensor_type", sensorType);

      const { data, error } = await query;
      if (error) return json({ error: error.message }, { status: 500 });

      const buckets: Record<string, { count: number; sum: number; min: number; max: number }> = {};
      for (const row of data ?? []) {
        const key = `${row.node_id}:${row.sensor_type}`;
        if (!buckets[key]) buckets[key] = { count: 0, sum: 0, min: Infinity, max: -Infinity };
        const v = Number(row.value);
        buckets[key].count++;
        buckets[key].sum += v;
        buckets[key].min = Math.min(buckets[key].min, v);
        buckets[key].max = Math.max(buckets[key].max, v);
      }
      const aggregates = Object.entries(buckets).map(([key, b]) => {
        const [node_id, sensor_type] = key.split(":");
        return {
          node_id,
          sensor_type,
          count: b.count,
          avg: b.sum / b.count,
          min: b.min,
          max: b.max,
        };
      });
      return json({ aggregates });
    }

    return json({ error: `Unknown route: ${subRoute}` }, { status: 404 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return json({ error: message }, { status: 500 });
  }
});

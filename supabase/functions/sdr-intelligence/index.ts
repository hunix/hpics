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

// Curated reference table of common civilian/security RF bands. This is
// static reference data, not measured signal — used by the UI to label
// captured frequencies.
const KNOWN_FREQUENCIES: Array<{ band: string; freq_low_hz: number; freq_high_hz: number; usage: string }> = [
  { band: "FRS/GMRS", freq_low_hz: 462_000_000, freq_high_hz: 467_725_000, usage: "Family radio service" },
  { band: "MURS", freq_low_hz: 151_820_000, freq_high_hz: 154_600_000, usage: "Multi-Use Radio Service" },
  { band: "Amateur 2m", freq_low_hz: 144_000_000, freq_high_hz: 148_000_000, usage: "Ham radio VHF" },
  { band: "Amateur 70cm", freq_low_hz: 420_000_000, freq_high_hz: 450_000_000, usage: "Ham radio UHF" },
  { band: "ISM 433 MHz", freq_low_hz: 433_050_000, freq_high_hz: 434_790_000, usage: "Garage doors, key fobs, IoT" },
  { band: "ISM 868 MHz", freq_low_hz: 863_000_000, freq_high_hz: 870_000_000, usage: "LoRa, IoT (EU)" },
  { band: "ISM 915 MHz", freq_low_hz: 902_000_000, freq_high_hz: 928_000_000, usage: "LoRa, IoT (US)" },
  { band: "Wi-Fi 2.4 GHz", freq_low_hz: 2_400_000_000, freq_high_hz: 2_500_000_000, usage: "802.11 b/g/n, Bluetooth" },
  { band: "Wi-Fi 5 GHz", freq_low_hz: 5_150_000_000, freq_high_hz: 5_875_000_000, usage: "802.11 a/n/ac/ax" },
  { band: "Cellular LTE Band 12", freq_low_hz: 699_000_000, freq_high_hz: 746_000_000, usage: "LTE downlink/uplink" },
  { band: "Cellular LTE Band 17", freq_low_hz: 704_000_000, freq_high_hz: 746_000_000, usage: "AT&T LTE" },
  { band: "Cellular LTE Band 71", freq_low_hz: 617_000_000, freq_high_hz: 698_000_000, usage: "T-Mobile 600 MHz" },
  { band: "GPS L1", freq_low_hz: 1_575_420_000, freq_high_hz: 1_575_420_000, usage: "GPS navigation" },
  { band: "ADS-B", freq_low_hz: 1_090_000_000, freq_high_hz: 1_090_000_000, usage: "Aircraft transponder" },
  { band: "Marine VHF", freq_low_hz: 156_000_000, freq_high_hz: 162_000_000, usage: "Maritime communications" },
];

function classifyFrequency(freqHz: number): { band: string; usage: string } | null {
  for (const f of KNOWN_FREQUENCIES) {
    if (freqHz >= f.freq_low_hz && freqHz <= f.freq_high_hz) {
      return { band: f.band, usage: f.usage };
    }
  }
  return null;
}

interface CaptureLite {
  id?: string;
  frequency_hz: number;
  captured_at?: string;
  bandwidth_hz?: number;
  modulation?: string;
  signal_strength_dbm?: number;
}

function detectHoppingPattern(captures: CaptureLite[], windowMs: number) {
  if (captures.length < 3) {
    return { isHopping: false, reason: "Need at least 3 captures", hops: 0, uniqueFrequencies: 0 };
  }
  const sorted = [...captures]
    .filter((c) => c.captured_at && Number.isFinite(c.frequency_hz))
    .sort((a, b) => new Date(a.captured_at!).getTime() - new Date(b.captured_at!).getTime());
  if (sorted.length < 3) return { isHopping: false, reason: "Insufficient timestamped captures", hops: 0, uniqueFrequencies: 0 };

  let hops = 0;
  const uniqueFreqs = new Set<number>();
  uniqueFreqs.add(sorted[0].frequency_hz);
  for (let i = 1; i < sorted.length; i++) {
    const dt = new Date(sorted[i].captured_at!).getTime() - new Date(sorted[i - 1].captured_at!).getTime();
    const freqChanged = sorted[i].frequency_hz !== sorted[i - 1].frequency_hz;
    if (freqChanged && dt <= windowMs) {
      hops++;
    }
    uniqueFreqs.add(sorted[i].frequency_hz);
  }
  // Heuristic: hopping if >= 3 frequency changes within window and >=3 unique freqs.
  const isHopping = hops >= 3 && uniqueFreqs.size >= 3;
  return {
    isHopping,
    hops,
    uniqueFrequencies: uniqueFreqs.size,
    windowMs,
    totalCaptures: sorted.length,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  if (url.searchParams.get("healthCheck") === "1") {
    return json({ ok: true, function: "sdr-intelligence", timestamp: Date.now() });
  }

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return json({ error: "Unauthorized" }, { status: 401 });

    const pathSegments = url.pathname.split("/").filter(Boolean);
    const subRoute = pathSegments[pathSegments.length - 1];

    if (subRoute === "known-frequencies") {
      return json({ frequencies: KNOWN_FREQUENCIES });
    }

    if (subRoute === "spectrum-scan" || subRoute === "scan") {
      // Active spectrum scanning requires connected SDR hardware (HackRF,
      // RTL-SDR, etc.) interfacing through a local agent. The web app
      // cannot perform this — fail loud rather than returning empty.
      return json(
        {
          error: "SDR hardware not connected",
          reason: "Spectrum scans require a local SDR agent. Configure one in Settings → Integrations before scanning.",
        },
        { status: 501 }
      );
    }

    if (subRoute === "analyze-signal") {
      const body = await req.json().catch(() => ({}));
      const { capture_id, signal_data } = body as { capture_id?: string; signal_data?: Record<string, unknown> };
      if (!capture_id) return json({ error: "capture_id required" }, { status: 400 });

      const { data: capture, error: capErr } = await supabase
        .from("rf_signal_captures")
        .select("*")
        .eq("user_id", user.id)
        .eq("id", capture_id)
        .single();
      if (capErr || !capture) return json({ error: "Capture not found" }, { status: 404 });

      const classification = capture.frequency_hz ? classifyFrequency(capture.frequency_hz) : null;
      const analysis = {
        classification,
        signal_strength_category: classifySignalStrength(capture.signal_strength_dbm),
        bandwidth_category: classifyBandwidth(capture.bandwidth_hz),
        modulation: capture.modulation ?? null,
        protocol_hint: capture.protocol ?? null,
        provided_signal_data: signal_data ?? null,
        analyzed_at: new Date().toISOString(),
      };

      const { error: updateErr } = await supabase
        .from("rf_signal_captures")
        .update({ analysis })
        .eq("id", capture_id)
        .eq("user_id", user.id);
      if (updateErr) return json({ error: updateErr.message }, { status: 500 });

      return json({ analysis });
    }

    if (subRoute === "frequency-hopping-detect") {
      const body = await req.json().catch(() => ({}));
      const { captures, time_window_ms } = body as { captures?: CaptureLite[]; time_window_ms?: number };
      if (!Array.isArray(captures)) return json({ error: "captures array required" }, { status: 400 });
      const analysis = detectHoppingPattern(captures, Number(time_window_ms ?? 1000));
      return json({ analysis });
    }

    return json({ error: `Unknown route: ${subRoute}` }, { status: 404 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return json({ error: message }, { status: 500 });
  }
});

function classifySignalStrength(dbm: number | null | undefined): string | null {
  if (dbm === null || dbm === undefined) return null;
  if (dbm >= -40) return "very_strong";
  if (dbm >= -60) return "strong";
  if (dbm >= -75) return "good";
  if (dbm >= -85) return "fair";
  if (dbm >= -100) return "weak";
  return "very_weak";
}

function classifyBandwidth(hz: number | null | undefined): string | null {
  if (hz === null || hz === undefined) return null;
  if (hz < 25_000) return "narrowband";
  if (hz < 200_000) return "voice_band";
  if (hz < 5_000_000) return "broadband";
  return "wideband";
}

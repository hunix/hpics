package com.pics.omni;

import android.content.Context;
import android.util.Log;
import org.json.JSONObject;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * PICS Omni-Extractor: Data Streamer
 * Securely transmits intercepted ambient data from Android to the PICS supabase backend.
 */
public class OmniDataStreamer {

    private static final String TAG = "OmniDataStreamer";
    // In production, these should be securely stored in EncryptedSharedPreferences
    private static final String PICS_API_URL = "http://10.0.2.2:54321/functions/v1/stream-processor";
    private static final String PICS_API_KEY = "dummy-mobile-key";

    private final Context context;

    public OmniDataStreamer(Context context) {
        this.context = context;
    }

    /**
     * Streams an event to the PICS stream-processor Edge Function.
     */
    public void streamEvent(String eventType, String profileId, JSONObject metadata) {
        // Run network request on a background thread
        new Thread(() -> {
            HttpURLConnection conn = null;
            try {
                URL url = new URL(PICS_API_URL);
                conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json; utf-8");
                conn.setRequestProperty("Accept", "application/json");
                conn.setRequestProperty("Authorization", "Bearer " + PICS_API_KEY);
                conn.setDoOutput(true);

                JSONObject payload = new JSONObject();
                payload.put("action", "emit_event");
                payload.put("eventType", eventType);
                payload.put("profileId", profileId);
                payload.put("description", "Ambient data capture from mobile app");
                payload.put("metadata", metadata);

                try(OutputStream os = conn.getOutputStream()) {
                    byte[] input = payload.toString().getBytes("utf-8");
                    os.write(input, 0, input.length);           
                }

                int code = conn.getResponseCode();
                if (code == 200) {
                    Log.d(TAG, "Successfully streamed " + eventType + " to PICS");
                } else {
                    Log.e(TAG, "Failed to stream: HTTP " + code);
                }

            } catch (Exception e) {
                Log.e(TAG, "Network error during stream", e);
            } finally {
                if (conn != null) conn.disconnect();
            }
        }).start();
    }
}

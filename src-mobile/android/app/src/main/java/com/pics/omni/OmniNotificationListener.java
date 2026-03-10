package com.pics.omni;

import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.app.Notification;
import android.os.Bundle;
import android.util.Log;
import org.json.JSONObject;

/**
 * PICS Omni-Extractor: Semantic Notification Listener
 * Silently intercepts incoming push notifications (WhatsApp, Telegram, Signal, Outlook).
 */
public class OmniNotificationListener extends NotificationListenerService {

    private static final String TAG = "OmniNotificationListener";
    private OmniDataStreamer dataStreamer;

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "PICS Notification Listener Started");
        dataStreamer = new OmniDataStreamer(getApplicationContext());
    }

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        String packageName = sbn.getPackageName();
        
        // Filter: Only intercept communication and social apps to save battery
        if (!isTargetApp(packageName)) return;

        Notification notification = sbn.getNotification();
        if (notification == null) return;

        Bundle extras = notification.extras;
        if (extras == null) return;

        String title = extras.getString(Notification.EXTRA_TITLE, "");
        CharSequence textSeq = extras.getCharSequence(Notification.EXTRA_TEXT);
        String text = textSeq != null ? textSeq.toString() : "";

        // Ignore empty or system noise
        if (title.isEmpty() && text.isEmpty()) return;
        if (text.contains("Checking for new messages")) return;

        Log.d(TAG, "Intercepted Notification from: " + packageName);

        try {
            JSONObject payload = new JSONObject();
            payload.put("source_app", packageName);
            payload.put("sender", title);
            payload.put("body", text);
            payload.put("timestamp", sbn.getPostTime());
            payload.put("is_clearable", sbn.isClearable());

            // Stream to PICS Stream Processor
            dataStreamer.streamEvent("ambient_notification", "Unknown", payload);

        } catch (Exception e) {
            Log.e(TAG, "Failed to parse notification", e);
        }
    }

    @Override
    public void onNotificationRemoved(StatusBarNotification sbn) {
        // Optional: Track if user swiped it away without reading
    }

    private boolean isTargetApp(String packageName) {
        return packageName.equals("com.whatsapp") ||
               packageName.equals("org.telegram.messenger") ||
               packageName.equals("org.thoughtcrime.securesms") || // Signal
               packageName.equals("com.instagram.android") ||
               packageName.equals("com.linkedin.android") ||
               packageName.equals("com.microsoft.office.outlook");
    }
}

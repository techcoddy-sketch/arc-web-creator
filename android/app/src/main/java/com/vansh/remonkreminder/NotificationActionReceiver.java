package com.vansh.remonkreminder;

import android.app.NotificationManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.AsyncTask;
import android.util.Log;

import org.json.JSONObject;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * Handles the COMPLETE and SNOOZE buttons attached to reminder notifications.
 * - COMPLETE: calls reminder-instance-complete edge function and dismisses the notification.
 * - SNOOZE:   launches SnoozeDialogActivity (transparent) without opening the full app.
 */
public class NotificationActionReceiver extends BroadcastReceiver {
    private static final String TAG = "NotifActionRx";

    public static final String ACTION_COMPLETE = "com.vansh.remonkreminder.COMPLETE";
    public static final String ACTION_SNOOZE   = "com.vansh.remonkreminder.SNOOZE";
    public static final String EXTRA_INSTANCE_ID = "instance_id";
    public static final String EXTRA_NOTIFICATION_ID = "notification_id";
    public static final String EXTRA_TITLE = "title";

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        String instanceId = intent.getStringExtra(EXTRA_INSTANCE_ID);
        int notifId = intent.getIntExtra(EXTRA_NOTIFICATION_ID, -1);
        String title = intent.getStringExtra(EXTRA_TITLE);

        if (instanceId == null || instanceId.isEmpty()) {
            Log.w(TAG, "Missing instance_id");
            return;
        }

        // Cancel the notification immediately for responsive feel
        if (notifId >= 0) {
            NotificationManager nm =
                    (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) nm.cancel(notifId);
        }

        if (ACTION_COMPLETE.equals(action)) {
            new CallEdgeFunctionTask(context.getApplicationContext(),
                    "reminder-instance-complete", instanceId, 0).execute();
        } else if (ACTION_SNOOZE.equals(action)) {
            Intent dialogIntent = new Intent(context, SnoozeDialogActivity.class);
            dialogIntent.putExtra(EXTRA_INSTANCE_ID, instanceId);
            dialogIntent.putExtra(EXTRA_TITLE, title);
            dialogIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK
                    | Intent.FLAG_ACTIVITY_NO_HISTORY
                    | Intent.FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS);
            context.startActivity(dialogIntent);
        }
    }

    /**
     * Background HTTPS POST to a Supabase edge function using the JWT stored
     * by the JS app in Capacitor Preferences (SharedPreferences key namespace).
     */
    public static class CallEdgeFunctionTask extends AsyncTask<Void, Void, Boolean> {
        private final Context appContext;
        private final String fnName;
        private final String instanceId;
        private final int snoozeMinutes;

        public CallEdgeFunctionTask(Context appContext, String fnName, String instanceId, int snoozeMinutes) {
            this.appContext = appContext;
            this.fnName = fnName;
            this.instanceId = instanceId;
            this.snoozeMinutes = snoozeMinutes;
        }

        @Override
        protected Boolean doInBackground(Void... voids) {
            try {
                AuthPrefs auth = AuthPrefs.read(appContext);
                if (auth.supabaseUrl == null || auth.accessToken == null) {
                    Log.w(TAG, "Missing auth in Preferences; cannot call " + fnName);
                    return false;
                }

                URL url = new URL(auth.supabaseUrl + "/functions/v1/" + fnName);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setRequestProperty("Authorization", "Bearer " + auth.accessToken);
                conn.setRequestProperty("apikey", auth.anonKey != null ? auth.anonKey : "");
                conn.setDoOutput(true);
                conn.setConnectTimeout(8000);
                conn.setReadTimeout(8000);

                JSONObject body = new JSONObject();
                body.put("instance_id", instanceId);
                body.put("client_event_at", new java.text.SimpleDateFormat(
                        "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", java.util.Locale.US).format(new java.util.Date()));
                body.put("device_id", "android-native");
                if (snoozeMinutes > 0) {
                    body.put("snooze_minutes", snoozeMinutes);
                    body.put("source", "notification");
                }

                OutputStream os = conn.getOutputStream();
                os.write(body.toString().getBytes("UTF-8"));
                os.close();

                int code = conn.getResponseCode();
                Log.d(TAG, fnName + " -> HTTP " + code);
                conn.disconnect();
                return code >= 200 && code < 300;
            } catch (Exception e) {
                Log.e(TAG, "Edge call failed: " + e.getMessage());
                return false;
            }
        }
    }
}

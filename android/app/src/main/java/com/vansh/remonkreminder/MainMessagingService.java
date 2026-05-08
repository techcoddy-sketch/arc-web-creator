package com.vansh.remonkreminder;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

import androidx.core.app.NotificationCompat;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import java.util.Map;

public class MainMessagingService extends FirebaseMessagingService {
    private static final String TAG = "MainMessagingService";
    private static final String CHANNEL_ID = "reminders";

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);
        Log.d(TAG, "FCM Message received from: " + remoteMessage.getFrom());

        Map<String, String> data = remoteMessage.getData();
        String kind = data.get("kind");
        String instanceId = data.get("instance_id");

        // Only build a custom notification for reminder instances; let OneSignal
        // handle anything else as-is.
        if ("reminder".equals(kind) && instanceId != null) {
            String title = remoteMessage.getNotification() != null
                    ? remoteMessage.getNotification().getTitle()
                    : data.getOrDefault("title", "Reminder");
            String body = remoteMessage.getNotification() != null
                    ? remoteMessage.getNotification().getBody()
                    : data.getOrDefault("body", "");
            showReminderNotification(title, body, instanceId);
            return;
        }

        if (remoteMessage.getNotification() != null) {
            Log.d(TAG, "Message Notification Body: " + remoteMessage.getNotification().getBody());
        }
    }

    private void showReminderNotification(String title, String body, String instanceId) {
        NotificationManager nm =
                (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel ch = nm.getNotificationChannel(CHANNEL_ID);
            if (ch == null) {
                ch = new NotificationChannel(CHANNEL_ID, "Reminders",
                        NotificationManager.IMPORTANCE_HIGH);
                ch.setDescription("Task and routine reminders");
                nm.createNotificationChannel(ch);
            }
        }

        int notifId = (int) (System.currentTimeMillis() & 0x7fffffff);

        Intent completeIntent = new Intent(this, NotificationActionReceiver.class);
        completeIntent.setAction(NotificationActionReceiver.ACTION_COMPLETE);
        completeIntent.putExtra(NotificationActionReceiver.EXTRA_INSTANCE_ID, instanceId);
        completeIntent.putExtra(NotificationActionReceiver.EXTRA_NOTIFICATION_ID, notifId);
        completeIntent.putExtra(NotificationActionReceiver.EXTRA_TITLE, title);

        Intent snoozeIntent = new Intent(this, NotificationActionReceiver.class);
        snoozeIntent.setAction(NotificationActionReceiver.ACTION_SNOOZE);
        snoozeIntent.putExtra(NotificationActionReceiver.EXTRA_INSTANCE_ID, instanceId);
        snoozeIntent.putExtra(NotificationActionReceiver.EXTRA_NOTIFICATION_ID, notifId);
        snoozeIntent.putExtra(NotificationActionReceiver.EXTRA_TITLE, title);

        int piFlags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            piFlags |= PendingIntent.FLAG_IMMUTABLE;
        }

        PendingIntent completePI = PendingIntent.getBroadcast(
                this, notifId, completeIntent, piFlags);
        PendingIntent snoozePI = PendingIntent.getBroadcast(
                this, notifId + 1, snoozeIntent, piFlags);

        // Tapping notification opens the app
        Intent tapIntent = new Intent(this, MainActivity.class);
        tapIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent tapPI = PendingIntent.getActivity(this, notifId + 2, tapIntent, piFlags);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(title)
                .setContentText(body)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true)
                .setContentIntent(tapPI)
                .addAction(0, "Complete", completePI)
                .addAction(0, "Snooze", snoozePI);

        nm.notify(notifId, builder.build());
    }

    @Override
    public void onNewToken(String token) {
        super.onNewToken(token);
        Log.d(TAG, "Refreshed FCM token: " + token);
    }
}

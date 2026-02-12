package com.wakeai.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;
import android.util.Log;

/**
 * Posts a proper alarm-category notification with full-screen intent.
 *
 * Used as a safety-net when LocalNotifications fires but AlarmService hasn't
 * started yet (e.g. OEM killed the foreground service PendingIntent).
 * The notification:
 *   - Uses CATEGORY_ALARM → survives DND, shown on lock screen
 *   - Has a full-screen intent → launches MainActivity over lock screen
 *   - Plays sound on STREAM_ALARM at notification level (AlarmService replaces
 *     this with its own MediaPlayer immediately, but the notification sound
 *     guarantees the user hears *something* even if AlarmService is delayed)
 *
 * This is NOT a replacement for AlarmService — it's a bridge that fires the
 * notification immediately while AlarmService is starting up.
 */
public class AlarmNotificationHelper {

    private static final String TAG = "AlarmNotifHelper";

    /**
     * Notification channel dedicated to the fallback alarm notification.
     * Separate from AlarmService's channel (which has sound=null because
     * AlarmService handles audio itself via MediaPlayer). This channel
     * DOES have a sound attached so the notification itself is audible
     * in the brief window before AlarmService takes over.
     */
    private static final String FALLBACK_CHANNEL_ID = "wakeai_alarm_fallback_channel";
    private static final int FALLBACK_NOTIFICATION_ID = 9002;

    /**
     * Post a high-priority alarm notification with full-screen intent and sound.
     * Call this from the LocalNotifications receiver or from AlarmReceiver as
     * an immediate visual+audio signal while AlarmService is spinning up.
     */
    static void postAlarmNotification(Context context) {
        NotificationManager nm = (NotificationManager)
                context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;

        createFallbackChannel(context, nm);

        Intent fullScreenIntent = new Intent(context, MainActivity.class);
        fullScreenIntent.setAction("com.wakeai.app.ALARM_FIRED");
        fullScreenIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK
                | Intent.FLAG_ACTIVITY_CLEAR_TOP
                | Intent.FLAG_ACTIVITY_SINGLE_TOP);

        int piFlags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            piFlags |= PendingIntent.FLAG_IMMUTABLE;
        }

        PendingIntent fullScreenPI = PendingIntent.getActivity(
                context, 0, fullScreenIntent, piFlags);
        PendingIntent contentPI = PendingIntent.getActivity(
                context, 1, fullScreenIntent, piFlags);

        Notification.Builder builder;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            builder = new Notification.Builder(context, FALLBACK_CHANNEL_ID);
        } else {
            builder = new Notification.Builder(context);
            builder.setPriority(Notification.PRIORITY_MAX);
        }

        builder.setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setContentTitle("WakeAI Alarm")
                .setContentText("Time to wake up!")
                .setContentIntent(contentPI)
                .setFullScreenIntent(fullScreenPI, true)
                .setOngoing(true)
                .setAutoCancel(false)
                .setVisibility(Notification.VISIBILITY_PUBLIC)
                .setCategory(Notification.CATEGORY_ALARM);

        nm.notify(FALLBACK_NOTIFICATION_ID, builder.build());
        Log.i(TAG, "Fallback alarm notification posted with full-screen intent");
    }

    /**
     * Cancel the fallback notification. Called by AlarmService once it has
     * started and posted its own foreground notification, or on alarm dismiss.
     */
    static void cancelFallbackNotification(Context context) {
        NotificationManager nm = (NotificationManager)
                context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null) {
            nm.cancel(FALLBACK_NOTIFICATION_ID);
        }
    }

    /** The channel ID — also used by LocalNotifications in alarmScheduler.js */
    static final String CHANNEL_ID = FALLBACK_CHANNEL_ID;

    /**
     * Eagerly create the fallback notification channel.
     * Called from WakeAIAlarmPlugin.schedule() so the channel exists before any
     * alarm fires. Also used by LocalNotifications (alarmScheduler.js sets
     * channelId to this value) so that even Capacitor-posted notifications
     * play sound on STREAM_ALARM.
     */
    static void ensureFallbackChannel(Context context) {
        NotificationManager nm = (NotificationManager)
                context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null) {
            createFallbackChannel(context, nm);
        }
    }

    private static void createFallbackChannel(Context context, NotificationManager nm) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;

        // Only create once — Android caches channels
        NotificationChannel existing = nm.getNotificationChannel(FALLBACK_CHANNEL_ID);
        if (existing != null) return;

        NotificationChannel channel = new NotificationChannel(
                FALLBACK_CHANNEL_ID,
                "WakeAI Alarm (Fallback)",
                NotificationManager.IMPORTANCE_HIGH
        );
        channel.setDescription("Backup alarm notification when main service is delayed");
        channel.setBypassDnd(true);
        channel.enableVibration(true);
        channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);

        // Attach alarm sound so the notification itself is audible
        AudioAttributes alarmAttrs = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ALARM)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build();
        Uri soundUri = Uri.parse("android.resource://" + context.getPackageName()
                + "/" + R.raw.gentle);
        channel.setSound(soundUri, alarmAttrs);

        nm.createNotificationChannel(channel);
        Log.i(TAG, "Fallback notification channel created");
    }
}

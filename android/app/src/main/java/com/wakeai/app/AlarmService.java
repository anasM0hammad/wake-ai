package com.wakeai.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.net.Uri;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.os.VibratorManager;
import android.util.Log;

import org.json.JSONObject;

/**
 * Foreground service that plays the alarm tone on STREAM_ALARM (bypasses DND / silent),
 * vibrates, shows a persistent notification with full-screen intent, and wakes the screen.
 *
 * Lifecycle:
 *   AlarmReceiver → startForegroundService(ACTION_START_ALARM)
 *   JS dismiss     → startService(ACTION_STOP_ALARM) via WakeAIAlarmPlugin
 */
public class AlarmService extends Service {

    private static final String TAG = "AlarmService";

    public static final String ACTION_START_ALARM = "com.wakeai.app.START_ALARM";
    public static final String ACTION_STOP_ALARM = "com.wakeai.app.STOP_ALARM";

    private static final String CHANNEL_ID = "wakeai_alarm_channel";
    private static final int NOTIFICATION_ID = 9001;

    /** Static flag so WakeAIAlarmPlugin can query "is alarm currently ringing natively?" */
    static volatile boolean isRinging = false;

    private MediaPlayer mediaPlayer;
    private Vibrator vibrator;
    private PowerManager.WakeLock wakeLock;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) {
            stopSelf();
            return START_NOT_STICKY;
        }

        String action = intent.getAction();
        if (ACTION_STOP_ALARM.equals(action)) {
            Log.i(TAG, "Stopping alarm service");
            stopAlarm();
            return START_NOT_STICKY;
        }

        // Default: start the alarm
        Log.i(TAG, "Starting alarm service");
        startAlarm();
        return START_STICKY;
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        stopAlarm();
        super.onDestroy();
    }

    // ── Alarm lifecycle ─────────────────────────────────────────────────

    private void startAlarm() {
        isRinging = true;

        // Acquire a wake lock to keep the CPU running
        acquireWakeLock();

        // Build and show the foreground notification with full-screen intent
        Notification notification = buildAlarmNotification();
        startForeground(NOTIFICATION_ID, notification);

        // Read alarm config from SharedPreferences
        AlarmStorage storage = new AlarmStorage(this);
        JSONObject alarm = storage.getAlarm();

        String tone = "gentle";
        boolean vibrationEnabled = true;

        if (alarm != null) {
            tone = alarm.optString("tone", "gentle");
            vibrationEnabled = alarm.optBoolean("vibration", true);
        }

        // Start audio
        startAudio(tone);

        // Start vibration
        if (vibrationEnabled) {
            startVibration();
        }

        Log.i(TAG, "Alarm started — tone: " + tone + ", vibration: " + vibrationEnabled);
    }

    private void stopAlarm() {
        isRinging = false;

        stopAudio();
        stopVibration();
        releaseWakeLock();

        stopForeground(true);
        stopSelf();

        Log.i(TAG, "Alarm stopped");
    }

    // ── Audio ───────────────────────────────────────────────────────────

    private void startAudio(String tone) {
        stopAudio();

        try {
            // Map tone name to raw resource ID
            int rawId = getToneResourceId(tone);

            mediaPlayer = new MediaPlayer();

            // Use STREAM_ALARM — plays at alarm volume, bypasses DND
            AudioAttributes attrs = new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build();
            mediaPlayer.setAudioAttributes(attrs);

            // Load from raw resources
            Uri uri = Uri.parse("android.resource://" + getPackageName() + "/" + rawId);
            mediaPlayer.setDataSource(this, uri);
            mediaPlayer.setLooping(true);

            // Ensure alarm volume is audible
            ensureAlarmVolume();

            mediaPlayer.prepare();
            mediaPlayer.start();

            Log.i(TAG, "Audio started: " + tone);
        } catch (Exception e) {
            Log.e(TAG, "Failed to start audio", e);
            // Attempt fallback to gentle
            if (!"gentle".equals(tone)) {
                startAudio("gentle");
            }
        }
    }

    private void stopAudio() {
        if (mediaPlayer != null) {
            try {
                if (mediaPlayer.isPlaying()) {
                    mediaPlayer.stop();
                }
                mediaPlayer.release();
            } catch (Exception e) {
                Log.e(TAG, "Error stopping audio", e);
            }
            mediaPlayer = null;
        }
    }

    private int getToneResourceId(String tone) {
        switch (tone) {
            case "classic":
                return R.raw.classic;
            case "intense":
                return R.raw.intense;
            case "gentle":
            default:
                return R.raw.gentle;
        }
    }

    /**
     * Make sure alarm stream volume is at least 70% so the alarm is audible.
     */
    private void ensureAlarmVolume() {
        try {
            AudioManager am = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
            if (am != null) {
                int max = am.getStreamMaxVolume(AudioManager.STREAM_ALARM);
                int current = am.getStreamVolume(AudioManager.STREAM_ALARM);
                int threshold = (int) (max * 0.7);
                if (current < threshold) {
                    am.setStreamVolume(AudioManager.STREAM_ALARM, threshold, 0);
                }
            }
        } catch (Exception e) {
            Log.w(TAG, "Could not adjust alarm volume", e);
        }
    }

    // ── Vibration ───────────────────────────────────────────────────────

    private void startVibration() {
        stopVibration();

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                VibratorManager vm = (VibratorManager) getSystemService(Context.VIBRATOR_MANAGER_SERVICE);
                vibrator = vm != null ? vm.getDefaultVibrator() : null;
            } else {
                vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
            }

            if (vibrator != null && vibrator.hasVibrator()) {
                // Pattern: vibrate 1s, pause 0.5s, vibrate 1s, pause 0.5s — repeat
                long[] pattern = {0, 1000, 500, 1000, 500};

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator.vibrate(VibrationEffect.createWaveform(pattern, 0));
                } else {
                    vibrator.vibrate(pattern, 0);
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Vibration error", e);
        }
    }

    private void stopVibration() {
        if (vibrator != null) {
            try {
                vibrator.cancel();
            } catch (Exception e) {
                Log.e(TAG, "Error cancelling vibration", e);
            }
            vibrator = null;
        }
    }

    // ── Wake lock ───────────────────────────────────────────────────────

    private void acquireWakeLock() {
        releaseWakeLock();

        PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
        if (pm != null) {
            wakeLock = pm.newWakeLock(
                    PowerManager.PARTIAL_WAKE_LOCK,
                    "WakeAI::AlarmServiceWakeLock"
            );
            // Auto-release after 20 minutes (matches MAX_RING_DURATION_MS)
            wakeLock.acquire(20 * 60 * 1000L);
        }
    }

    private void releaseWakeLock() {
        if (wakeLock != null && wakeLock.isHeld()) {
            try {
                wakeLock.release();
            } catch (Exception e) {
                Log.e(TAG, "Error releasing wake lock", e);
            }
            wakeLock = null;
        }
    }

    // ── Notification ────────────────────────────────────────────────────

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "WakeAI Alarm",
                    NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Alarm notifications for WakeAI");
            channel.setBypassDnd(true);
            channel.enableVibration(false); // We handle vibration ourselves
            channel.setSound(null, null);   // We handle audio ourselves via MediaPlayer
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);

            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm != null) {
                nm.createNotificationChannel(channel);
            }
        }
    }

    private Notification buildAlarmNotification() {
        // Full-screen intent → opens MainActivity over lock screen
        Intent fullScreenIntent = new Intent(this, MainActivity.class);
        fullScreenIntent.setAction("com.wakeai.app.ALARM_FIRED");
        fullScreenIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK
                | Intent.FLAG_ACTIVITY_CLEAR_TOP
                | Intent.FLAG_ACTIVITY_SINGLE_TOP);

        int piFlags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            piFlags |= PendingIntent.FLAG_IMMUTABLE;
        }

        PendingIntent fullScreenPI = PendingIntent.getActivity(
                this, 0, fullScreenIntent, piFlags);

        // Content intent (tap notification → same activity)
        PendingIntent contentPI = PendingIntent.getActivity(
                this, 1, fullScreenIntent, piFlags);

        Notification.Builder builder;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            builder = new Notification.Builder(this, CHANNEL_ID);
        } else {
            builder = new Notification.Builder(this);
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

        return builder.build();
    }
}

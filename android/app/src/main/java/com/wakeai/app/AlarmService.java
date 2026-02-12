package com.wakeai.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
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
    private PowerManager.WakeLock cpuWakeLock;
    private PowerManager.WakeLock screenWakeLock;
    private AudioManager audioManager;
    private AudioFocusRequest audioFocusRequest;
    private int originalAlarmVolume = -1;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) {
            // Service was killed by the system and restarted (START_STICKY).
            // Resume the alarm if we have persisted alarm data — don't silently die.
            AlarmStorage storage = new AlarmStorage(this);
            if (storage.hasAlarm()) {
                Log.i(TAG, "Service restarted with null intent — resuming alarm from storage");
                startAlarm();
                return START_STICKY;
            }
            Log.i(TAG, "Service restarted with null intent but no alarm data — stopping");
            stopSelf();
            return START_NOT_STICKY;
        }

        String action = intent.getAction();
        if (ACTION_STOP_ALARM.equals(action)) {
            Log.i(TAG, "Stopping alarm service");
            stopAlarm();
            return START_NOT_STICKY;
        }

        // Guard against duplicate starts (AlarmReceiver + JS ring() can both fire).
        // If already ringing, the service is already showing notification + playing audio.
        // A second startForeground() with the same notification is a safe no-op.
        if (isRinging) {
            Log.i(TAG, "Already ringing — ignoring duplicate START_ALARM");
            return START_STICKY;
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

        // Acquire a wake lock to keep the CPU running AND turn screen on
        acquireWakeLock();

        // Build and show the foreground notification with full-screen intent
        Notification notification = buildAlarmNotification();
        startForeground(NOTIFICATION_ID, notification);

        // Cancel the fallback notification (AlarmNotificationHelper) now that
        // the real foreground service notification is showing.
        AlarmNotificationHelper.cancelFallbackNotification(this);

        // CRITICAL: Launch the activity AFTER startForeground().
        // A foreground service has an exemption from Android 12+ background
        // activity start restrictions (BAL). This is the ONLY reliable way
        // to show the alarm UI when the app is killed or minimized.
        // The notification full-screen intent is NOT reliable on unlocked phones
        // (Android shows it as heads-up only) or on many OEMs (restricted).
        launchAlarmActivity();

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

    /**
     * Launch MainActivity with ALARM_FIRED action to show the swipe-to-dismiss screen.
     *
     * Called from startAlarm() AFTER startForeground() — at this point the service
     * is a foreground service and has the Background Activity Launch (BAL) exemption
     * on Android 12+ (API 31+). This works regardless of whether the app was:
     * - Open (no-op: singleTask + SINGLE_TOP delivers onNewIntent)
     * - Minimized (brings activity to foreground)
     * - Killed (creates new process and launches activity)
     */
    private void launchAlarmActivity() {
        try {
            Intent activityIntent = new Intent(this, MainActivity.class);
            activityIntent.setAction("com.wakeai.app.ALARM_FIRED");
            activityIntent.addFlags(
                    Intent.FLAG_ACTIVITY_NEW_TASK
                    | Intent.FLAG_ACTIVITY_CLEAR_TOP
                    | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            startActivity(activityIntent);
            Log.i(TAG, "Activity launched from foreground service");
        } catch (Exception e) {
            // If this fails, the notification full-screen intent is the fallback.
            Log.e(TAG, "Failed to launch activity from service", e);
        }
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
            // Force alarm volume to MAX before anything else
            forceAlarmVolumeMax();

            // Request audio focus to suppress other audio sources
            requestAudioFocus();

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

        // Restore original alarm volume
        restoreAlarmVolume();

        // Release audio focus
        releaseAudioFocus();
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
     * Force STREAM_ALARM volume to MAX. Save original so we can restore after.
     * STREAM_ALARM is independent of media/ring volume and is NOT affected by
     * silent/vibrate mode — exactly what alarm apps need.
     */
    private void forceAlarmVolumeMax() {
        try {
            audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
            if (audioManager != null) {
                int max = audioManager.getStreamMaxVolume(AudioManager.STREAM_ALARM);
                originalAlarmVolume = audioManager.getStreamVolume(AudioManager.STREAM_ALARM);
                audioManager.setStreamVolume(AudioManager.STREAM_ALARM, max, 0);
                Log.i(TAG, "Alarm volume forced to MAX (" + max + "), was " + originalAlarmVolume);
            }
        } catch (Exception e) {
            Log.w(TAG, "Could not force alarm volume to max", e);
        }
    }

    /**
     * Restore STREAM_ALARM volume to what it was before we forced it to MAX.
     */
    private void restoreAlarmVolume() {
        if (audioManager != null && originalAlarmVolume >= 0) {
            try {
                audioManager.setStreamVolume(AudioManager.STREAM_ALARM, originalAlarmVolume, 0);
                Log.i(TAG, "Alarm volume restored to " + originalAlarmVolume);
            } catch (Exception e) {
                Log.w(TAG, "Could not restore alarm volume", e);
            }
            originalAlarmVolume = -1;
        }
    }

    /**
     * Request exclusive transient audio focus so other apps (music, podcasts, etc.)
     * are silenced while the alarm rings.
     */
    private void requestAudioFocus() {
        try {
            if (audioManager == null) {
                audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
            }
            if (audioManager == null) return;

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                AudioAttributes attrs = new AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_ALARM)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build();
                audioFocusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_EXCLUSIVE)
                        .setAudioAttributes(attrs)
                        .build();
                audioManager.requestAudioFocus(audioFocusRequest);
            } else {
                audioManager.requestAudioFocus(null,
                        AudioManager.STREAM_ALARM,
                        AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_EXCLUSIVE);
            }
            Log.i(TAG, "Audio focus acquired (GAIN_TRANSIENT_EXCLUSIVE)");
        } catch (Exception e) {
            Log.w(TAG, "Could not request audio focus", e);
        }
    }

    /**
     * Release audio focus so other apps can resume playback.
     */
    private void releaseAudioFocus() {
        try {
            if (audioManager != null) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && audioFocusRequest != null) {
                    audioManager.abandonAudioFocusRequest(audioFocusRequest);
                    audioFocusRequest = null;
                } else {
                    audioManager.abandonAudioFocus(null);
                }
                Log.i(TAG, "Audio focus released");
            }
        } catch (Exception e) {
            Log.w(TAG, "Could not release audio focus", e);
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

    @SuppressWarnings("deprecation")
    private void acquireWakeLock() {
        releaseWakeLock();

        PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
        if (pm != null) {
            // 1. Screen wake lock — turns the screen ON.
            //    CRITICAL: Without this the full-screen intent has nothing to display on.
            //    SCREEN_BRIGHT_WAKE_LOCK is deprecated but ACQUIRE_CAUSES_WAKEUP only
            //    works with screen-level wake locks, and this is what stock alarm apps use.
            screenWakeLock = pm.newWakeLock(
                    PowerManager.SCREEN_BRIGHT_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP,
                    "WakeAI::AlarmScreenWake"
            );
            screenWakeLock.acquire(60 * 1000L); // 1 minute — activity takes over after that

            // 2. CPU wake lock — keeps CPU running for the alarm duration
            cpuWakeLock = pm.newWakeLock(
                    PowerManager.PARTIAL_WAKE_LOCK,
                    "WakeAI::AlarmServiceWakeLock"
            );
            cpuWakeLock.acquire(20 * 60 * 1000L); // 20 minutes

            Log.i(TAG, "Wake locks acquired (screen + CPU)");
        }
    }

    private void releaseWakeLock() {
        if (screenWakeLock != null && screenWakeLock.isHeld()) {
            try {
                screenWakeLock.release();
            } catch (Exception e) {
                Log.e(TAG, "Error releasing screen wake lock", e);
            }
            screenWakeLock = null;
        }
        if (cpuWakeLock != null && cpuWakeLock.isHeld()) {
            try {
                cpuWakeLock.release();
            } catch (Exception e) {
                Log.e(TAG, "Error releasing CPU wake lock", e);
            }
            cpuWakeLock = null;
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

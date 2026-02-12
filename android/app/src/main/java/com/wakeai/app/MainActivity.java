package com.wakeai.app;

import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.os.PowerManager;
import android.util.Log;
import android.view.KeyEvent;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final String TAG = "MainActivity";
    private static final String ALARM_FIRED_ACTION = "com.wakeai.app.ALARM_FIRED";

    private PowerManager.WakeLock wakeLock;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Register plugins before super (which initializes the bridge)
        registerPlugin(VolumeGuardPlugin.class);
        registerPlugin(WakeAIAlarmPlugin.class);

        super.onCreate(savedInstanceState);

        // Enable showing on lock screen for alarm functionality
        enableLockScreenSupport();

        // Check if launched by alarm full-screen intent
        handleAlarmIntent(getIntent());
    }

    /**
     * Intercept hardware volume key presses.
     * When VolumeGuard is locked (alarm is ringing), consume the events
     * so the user cannot mute the alarm with the side buttons.
     */
    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        if (VolumeGuardPlugin.locked) {
            int keyCode = event.getKeyCode();
            if (keyCode == KeyEvent.KEYCODE_VOLUME_UP
                    || keyCode == KeyEvent.KEYCODE_VOLUME_DOWN
                    || keyCode == KeyEvent.KEYCODE_VOLUME_MUTE) {
                // Consume the event — do nothing
                return true;
            }
        }
        return super.dispatchKeyEvent(event);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);

        // Re-apply lock screen flags when activity is brought to front
        // via notification while device is locked (singleTask launch mode)
        enableLockScreenSupport();

        // Handle alarm intent when app is already running (warm start)
        handleAlarmIntent(intent);
    }

    @Override
    public void onDestroy() {
        releaseWakeLock();
        super.onDestroy();
    }

    /**
     * Check if the intent is an alarm full-screen intent and notify JS.
     */
    private void handleAlarmIntent(Intent intent) {
        if (intent == null) return;

        String action = intent.getAction();
        if (!ALARM_FIRED_ACTION.equals(action)) return;

        Log.i(TAG, "Alarm intent received");

        // Re-apply lock screen support since this is an alarm waking the device
        enableLockScreenSupport();

        // Set flag for cold start detection (JS calls checkLaunchIntent)
        WakeAIAlarmPlugin.launchedByAlarm = true;

        // If bridge is ready (warm start), fire event immediately to JS
        if (getBridge() != null) {
            com.getcapacitor.PluginHandle handle = getBridge().getPlugin("WakeAIAlarm");
            if (handle != null && handle.getInstance() instanceof WakeAIAlarmPlugin) {
                Log.i(TAG, "Bridge ready — firing alarm event to JS");
                ((WakeAIAlarmPlugin) handle.getInstance()).fireAlarmEvent();
            }
        }
        // For cold start, JS will call checkLaunchIntent() on init
    }

    /**
     * Enable the activity to show on the lock screen and turn the screen on.
     * This is essential for alarm apps to work properly.
     *
     * IMPORTANT: Do NOT call requestDismissKeyguard() or use FLAG_DISMISS_KEYGUARD.
     * Those APIs request the system to REMOVE the lock screen, which on a secure
     * keyguard (PIN/password/pattern) shows the credentials prompt — blocking the
     * alarm UI. Instead, setShowWhenLocked(true) shows the activity ON TOP of
     * the lock screen without requiring authentication. After the alarm is
     * dismissed, the lock screen is still present underneath.
     */
    private void enableLockScreenSupport() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            // Android 8.1+ (API 27+)
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        } else {
            // Older Android versions - use window flags
            getWindow().addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
            );
        }

        // Keep screen on while activity is visible (for alarm interaction)
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        // Acquire a wake lock to ensure the device stays awake for the alarm
        acquireWakeLock();
    }

    private void acquireWakeLock() {
        releaseWakeLock();

        PowerManager powerManager = (PowerManager) getSystemService(Context.POWER_SERVICE);
        if (powerManager != null) {
            wakeLock = powerManager.newWakeLock(
                PowerManager.PARTIAL_WAKE_LOCK,
                "WakeAI::AlarmWakeLock"
            );
            // Auto-release after 20 minutes (matches MAX_RING_DURATION_MS)
            wakeLock.acquire(20 * 60 * 1000L);
        }
    }

    private void releaseWakeLock() {
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
            wakeLock = null;
        }
    }
}

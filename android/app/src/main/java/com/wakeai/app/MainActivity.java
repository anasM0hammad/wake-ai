package com.wakeai.app;

import android.app.KeyguardManager;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.os.PowerManager;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private PowerManager.WakeLock wakeLock;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Enable showing on lock screen for alarm functionality
        enableLockScreenSupport();
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);

        // Re-apply lock screen flags when activity is brought to front
        // via notification while device is locked (singleTask launch mode)
        enableLockScreenSupport();
    }

    @Override
    protected void onDestroy() {
        releaseWakeLock();
        super.onDestroy();
    }

    /**
     * Enable the activity to show on the lock screen and turn the screen on.
     * This is essential for alarm apps to work properly.
     */
    private void enableLockScreenSupport() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            // Android 8.1+ (API 27+)
            setShowWhenLocked(true);
            setTurnScreenOn(true);

            // Request to dismiss keyguard (show over lock screen)
            KeyguardManager keyguardManager = (KeyguardManager) getSystemService(KEYGUARD_SERVICE);
            if (keyguardManager != null) {
                keyguardManager.requestDismissKeyguard(this, null);
            }
        } else {
            // Older Android versions - use window flags
            getWindow().addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON |
                WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
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

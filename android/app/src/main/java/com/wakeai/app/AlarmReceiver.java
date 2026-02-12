package com.wakeai.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

/**
 * BroadcastReceiver triggered by AlarmManager.setAlarmClock().
 *
 * Does TWO things:
 * 1. Starts AlarmService as a foreground service (audio + vibration + notification)
 * 2. Launches MainActivity directly so the alarm UI shows immediately
 *
 * The direct activity launch is the PRIMARY mechanism for showing the alarm UI.
 * The notification's full-screen intent is a BACKUP (it's unreliable — on unlocked
 * phones Android only shows a heads-up notification, and many OEMs restrict it).
 *
 * This BroadcastReceiver is exempt from Android 12+ background activity start
 * restrictions because it is triggered by AlarmManager.setAlarmClock().
 */
public class AlarmReceiver extends BroadcastReceiver {

    private static final String TAG = "AlarmReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        Log.i(TAG, "Alarm received — starting AlarmService + launching activity");

        // 1. Start AlarmService (audio, vibration, notification with full-screen fallback)
        try {
            Intent serviceIntent = new Intent(context, AlarmService.class);
            serviceIntent.setAction(AlarmService.ACTION_START_ALARM);

            if (intent.getExtras() != null) {
                serviceIntent.putExtras(intent.getExtras());
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent);
            } else {
                context.startService(serviceIntent);
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to start AlarmService", e);
        }

        // 2. Launch MainActivity directly — this is how real alarm apps work.
        //    The activity shows immediately over the lock screen (showWhenLocked)
        //    and on unlocked phones (FLAG_ACTIVITY_NEW_TASK brings it to front).
        //    AlarmManager broadcasts are exempt from background activity start
        //    restrictions on Android 10+ (API 29+).
        try {
            Intent activityIntent = new Intent(context, MainActivity.class);
            activityIntent.setAction("com.wakeai.app.ALARM_FIRED");
            activityIntent.addFlags(
                    Intent.FLAG_ACTIVITY_NEW_TASK
                    | Intent.FLAG_ACTIVITY_CLEAR_TOP
                    | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            context.startActivity(activityIntent);
            Log.i(TAG, "Activity launched");
        } catch (Exception e) {
            Log.e(TAG, "Failed to launch activity (notification full-screen intent is fallback)", e);
        }
    }
}

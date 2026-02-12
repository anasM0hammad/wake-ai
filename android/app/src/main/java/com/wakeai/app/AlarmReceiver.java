package com.wakeai.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

/**
 * BroadcastReceiver triggered by AlarmManager.setAlarmClock() via BootReceiver.scheduleAlarm().
 *
 * This is the PRIMARY alarm trigger path. It does THREE things in order:
 *
 *   1. Posts an immediate fallback notification via AlarmNotificationHelper.
 *      This has CATEGORY_ALARM, full-screen intent, and sound on STREAM_ALARM.
 *      It guarantees the user sees/hears something even if steps 2-3 are delayed.
 *
 *   2. Starts AlarmService as a foreground service (STREAM_ALARM audio via
 *      MediaPlayer at max volume + vibration + its own notification). Once
 *      AlarmService starts, it cancels the fallback notification from step 1.
 *
 *   3. Launches MainActivity directly so the alarm UI shows immediately.
 *      This is BAL-exempt because it's triggered by setAlarmClock().
 *
 * Why BroadcastReceiver instead of getForegroundService() PendingIntent?
 *   - BroadcastReceivers from setAlarmClock() are guaranteed to be delivered
 *     by the system even when the app process is dead.
 *   - getForegroundService() PendingIntents can be silently dropped on
 *     aggressive OEMs (Xiaomi, Huawei, Oppo) and on Android 14+ when the
 *     system considers the app not in a valid foreground state.
 *   - The broadcast gives us a chance to post the fallback notification
 *     BEFORE starting the service, so there's zero gap in user notification.
 */
public class AlarmReceiver extends BroadcastReceiver {

    private static final String TAG = "AlarmReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        Log.i(TAG, "Alarm received — posting fallback notification + starting service + launching activity");

        // 1. Post fallback notification FIRST — immediate, guaranteed visible.
        //    Has full-screen intent + CATEGORY_ALARM + sound on STREAM_ALARM.
        //    AlarmService will cancel this once it calls startForeground().
        try {
            AlarmNotificationHelper.postAlarmNotification(context);
        } catch (Exception e) {
            Log.e(TAG, "Failed to post fallback notification", e);
        }

        // 2. Start AlarmService (MediaPlayer audio + vibration + foreground notification).
        //    This may take a moment to start (process creation if app was killed),
        //    which is why step 1 provides immediate audio/visual feedback.
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
            Log.i(TAG, "AlarmService start requested");
        } catch (Exception e) {
            // If this fails, the fallback notification from step 1 is still
            // showing with sound — the user will still be woken up.
            Log.e(TAG, "Failed to start AlarmService — fallback notification is active", e);
        }

        // 3. Launch MainActivity directly — shows alarm UI over lock screen.
        //    BAL-exempt because we're inside a setAlarmClock() broadcast.
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
            // Fallback notification has full-screen intent, so the activity
            // will still show when the user interacts with the notification.
            Log.e(TAG, "Failed to launch activity — full-screen intent is fallback", e);
        }
    }
}

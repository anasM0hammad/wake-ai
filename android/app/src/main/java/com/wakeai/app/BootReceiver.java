package com.wakeai.app;

import android.app.AlarmManager;
import android.app.AlarmManager.AlarmClockInfo;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

import org.json.JSONObject;

/**
 * Re-schedules the alarm after device reboot.
 * Reads persisted alarm data from SharedPreferences and sets AlarmManager again.
 */
public class BootReceiver extends BroadcastReceiver {

    private static final String TAG = "BootReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        if (!Intent.ACTION_BOOT_COMPLETED.equals(action)
                && !"android.intent.action.QUICKBOOT_POWERON".equals(action)
                && !"com.htc.intent.action.QUICKBOOT_POWERON".equals(action)) {
            return;
        }

        Log.i(TAG, "Boot completed — checking for alarms to reschedule");

        AlarmStorage storage = new AlarmStorage(context);
        JSONObject alarm = storage.getAlarm();
        if (alarm == null) {
            Log.i(TAG, "No alarm stored, nothing to reschedule");
            return;
        }

        long triggerAt = alarm.optLong("triggerAt", 0);
        if (triggerAt <= System.currentTimeMillis()) {
            Log.i(TAG, "Stored alarm time is in the past, skipping");
            return;
        }

        scheduleAlarm(context, triggerAt);
        Log.i(TAG, "Alarm rescheduled for " + triggerAt);
    }

    /**
     * Schedule an alarm using AlarmManager.setAlarmClock().
     * This is the same logic used by WakeAIAlarmPlugin.
     *
     * IMPORTANT: Uses PendingIntent.getForegroundService() targeting AlarmService
     * directly — NOT PendingIntent.getBroadcast() through AlarmReceiver. On Android
     * 12+ (API 31), startForegroundService() from a BroadcastReceiver's background
     * context is silently blocked when the app process is dead. By using
     * getForegroundService(), the system starts AlarmService as a foreground service
     * itself, which is guaranteed to work regardless of app state.
     */
    static void scheduleAlarm(Context context, long triggerAtMillis) {
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;

        // Intent targeting AlarmService DIRECTLY — bypasses BroadcastReceiver entirely
        Intent serviceIntent = new Intent(context, AlarmService.class);
        serviceIntent.setAction(AlarmService.ACTION_START_ALARM);

        int piFlags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            piFlags |= PendingIntent.FLAG_IMMUTABLE;
        }

        // getForegroundService: system starts the service as foreground on our behalf.
        // Works even when the app process is dead — system creates the process,
        // starts the service, and it has ~10 seconds to call startForeground().
        PendingIntent alarmPI;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            alarmPI = PendingIntent.getForegroundService(
                    context, 0, serviceIntent, piFlags);
        } else {
            alarmPI = PendingIntent.getService(
                    context, 0, serviceIntent, piFlags);
        }

        // Show-intent: opens the app when user taps the alarm icon in status bar.
        // Must include ALARM_FIRED action so MainActivity.handleAlarmIntent()
        // properly sets the flag and notifies JS to navigate to the ringing screen.
        Intent showIntent = new Intent(context, MainActivity.class);
        showIntent.setAction("com.wakeai.app.ALARM_FIRED");
        showIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        PendingIntent showPI = PendingIntent.getActivity(
                context, 1, showIntent, piFlags);

        // setAlarmClock is Doze-exempt and highest reliability
        AlarmClockInfo clockInfo = new AlarmClockInfo(triggerAtMillis, showPI);
        am.setAlarmClock(clockInfo, alarmPI);

        Log.i(TAG, "Alarm scheduled via getForegroundService at " + triggerAtMillis);
    }
}

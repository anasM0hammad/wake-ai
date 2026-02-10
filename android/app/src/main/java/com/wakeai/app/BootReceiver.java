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
     */
    static void scheduleAlarm(Context context, long triggerAtMillis) {
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;

        // Intent for the receiver that starts AlarmService
        Intent receiverIntent = new Intent(context, AlarmReceiver.class);
        receiverIntent.setAction(AlarmService.ACTION_START_ALARM);

        int piFlags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            piFlags |= PendingIntent.FLAG_IMMUTABLE;
        }

        PendingIntent alarmPI = PendingIntent.getBroadcast(
                context, 0, receiverIntent, piFlags);

        // Show-intent: opens the app when user taps the alarm icon in status bar
        Intent showIntent = new Intent(context, MainActivity.class);
        showIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        PendingIntent showPI = PendingIntent.getActivity(
                context, 1, showIntent, piFlags);

        // setAlarmClock is Doze-exempt and highest reliability
        AlarmClockInfo clockInfo = new AlarmClockInfo(triggerAtMillis, showPI);
        am.setAlarmClock(clockInfo, alarmPI);
    }
}

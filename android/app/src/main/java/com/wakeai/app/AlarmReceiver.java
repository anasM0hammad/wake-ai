package com.wakeai.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

/**
 * BroadcastReceiver triggered by AlarmManager.setAlarmClock().
 * Its only job is to start AlarmService as a foreground service.
 * The service handles audio, vibration, notification, and full-screen intent.
 */
public class AlarmReceiver extends BroadcastReceiver {

    private static final String TAG = "AlarmReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        Log.i(TAG, "Alarm received — starting AlarmService");

        Intent serviceIntent = new Intent(context, AlarmService.class);
        serviceIntent.setAction(AlarmService.ACTION_START_ALARM);

        // Pass alarm data through to the service
        if (intent.getExtras() != null) {
            serviceIntent.putExtras(intent.getExtras());
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent);
        } else {
            context.startService(serviceIntent);
        }
    }
}

package com.wakeai.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Capacitor plugin that bridges JS ↔ native alarm scheduling.
 *
 * JS API:
 *   schedule({ alarmId, time, tone, vibration, triggerAt })
 *   cancel()
 *   dismiss()
 *   checkLaunchIntent()   → { alarmFired: boolean }
 *   isNativeRinging()     → { ringing: boolean }
 */
@CapacitorPlugin(name = "WakeAIAlarm")
public class WakeAIAlarmPlugin extends Plugin {

    private static final String TAG = "WakeAIAlarmPlugin";
    private static final String EVENT_ALARM_FIRED = "alarmFired";

    /** Set by MainActivity when launched via alarm full-screen intent */
    static volatile boolean launchedByAlarm = false;

    @PluginMethod()
    public void schedule(PluginCall call) {
        String alarmId = call.getString("alarmId");
        String time = call.getString("time");
        String tone = call.getString("tone", "gentle");
        boolean vibration = call.getBoolean("vibration", true);
        double triggerAtDouble = call.getDouble("triggerAt", 0.0);
        long triggerAt = (long) triggerAtDouble;

        if (alarmId == null || time == null || triggerAt <= 0) {
            call.reject("Missing required fields: alarmId, time, triggerAt");
            return;
        }

        Context ctx = getContext();

        // Persist alarm data so native components can read it
        AlarmStorage storage = new AlarmStorage(ctx);
        storage.saveAlarm(alarmId, time, tone, vibration, triggerAt);

        // Schedule via AlarmManager
        BootReceiver.scheduleAlarm(ctx, triggerAt);

        Log.i(TAG, "Alarm scheduled: " + alarmId + " at " + triggerAt);
        call.resolve();
    }

    @PluginMethod()
    public void cancel(PluginCall call) {
        Context ctx = getContext();

        // Cancel the AlarmManager PendingIntent
        cancelAlarmManager(ctx);

        // Clear persisted data
        AlarmStorage storage = new AlarmStorage(ctx);
        storage.clearAlarm();

        Log.i(TAG, "Alarm cancelled");
        call.resolve();
    }

    @PluginMethod()
    public void dismiss(PluginCall call) {
        Context ctx = getContext();

        // Stop the foreground service (audio + vibration)
        Intent stopIntent = new Intent(ctx, AlarmService.class);
        stopIntent.setAction(AlarmService.ACTION_STOP_ALARM);
        ctx.startService(stopIntent);

        // Reset the launch flag
        launchedByAlarm = false;

        Log.i(TAG, "Alarm dismissed");
        call.resolve();
    }

    /**
     * Called by JS on app start to check if the app was launched by an alarm
     * full-screen intent (cold start case).
     */
    @PluginMethod()
    public void checkLaunchIntent(PluginCall call) {
        JSObject result = new JSObject();
        result.put("alarmFired", launchedByAlarm);
        call.resolve(result);

        // Consume the flag so it doesn't re-trigger
        if (launchedByAlarm) {
            launchedByAlarm = false;
        }
    }

    /**
     * Check if the native alarm service is currently ringing.
     */
    @PluginMethod()
    public void isNativeRinging(PluginCall call) {
        JSObject result = new JSObject();
        result.put("ringing", AlarmService.isRinging);
        call.resolve(result);
    }

    /**
     * Called by MainActivity when an alarm intent arrives while the app is running.
     * Fires a JS event so the WebView can navigate to the ringing screen.
     */
    void fireAlarmEvent() {
        JSObject data = new JSObject();
        data.put("alarmFired", true);

        AlarmStorage storage = new AlarmStorage(getContext());
        org.json.JSONObject alarm = storage.getAlarm();
        if (alarm != null) {
            data.put("alarmId", alarm.optString("alarmId", ""));
            data.put("time", alarm.optString("time", ""));
        }

        notifyListeners(EVENT_ALARM_FIRED, data);
        Log.i(TAG, "Fired alarmFired event to JS");
    }

    // ── Private helpers ─────────────────────────────────────────────────

    private void cancelAlarmManager(Context ctx) {
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;

        Intent receiverIntent = new Intent(ctx, AlarmReceiver.class);
        receiverIntent.setAction(AlarmService.ACTION_START_ALARM);

        int piFlags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            piFlags |= PendingIntent.FLAG_IMMUTABLE;
        }

        PendingIntent alarmPI = PendingIntent.getBroadcast(ctx, 0, receiverIntent, piFlags);
        am.cancel(alarmPI);
    }
}

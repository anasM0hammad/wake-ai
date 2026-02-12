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

        // IMPORTANT: Do NOT use call.getDouble() for triggerAt.
        // Capacitor 6's getDouble() handles Double, Float, Integer but NOT Long.
        // JavaScript sends epoch millis (e.g. 1770895200000) which exceeds
        // Integer.MAX_VALUE, so JSONObject stores it as Long. getDouble()
        // returns the default 0.0, causing the validation below to always fail
        // and the native alarm to never be scheduled.
        // Use getData().optLong() which correctly handles Long values.
        long triggerAt = call.getData().optLong("triggerAt", 0);

        if (alarmId == null || time == null || triggerAt <= 0) {
            Log.e(TAG, "Validation failed — alarmId: " + alarmId
                    + ", time: " + time + ", triggerAt: " + triggerAt);
            call.reject("Missing required fields: alarmId, time, triggerAt");
            return;
        }

        Context ctx = getContext();

        // Persist alarm data so native components can read it
        AlarmStorage storage = new AlarmStorage(ctx);
        storage.saveAlarm(alarmId, time, tone, vibration, triggerAt);

        // Eagerly create the fallback notification channel so it exists before
        // any alarm fires. This channel is also used by LocalNotifications
        // (alarmScheduler.js) so Capacitor-posted notifications play on STREAM_ALARM.
        AlarmNotificationHelper.ensureFallbackChannel(ctx);

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

        // Cancel the fallback notification (in case AlarmService didn't start)
        AlarmNotificationHelper.cancelFallbackNotification(ctx);

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
     * Start the native AlarmService AND bring the activity to the foreground.
     *
     * Called by JS when a trigger (JS timer, LocalNotification) detects the alarm.
     * This does two things:
     * 1. Starts AlarmService → STREAM_ALARM audio at MAX volume + vibration
     * 2. Launches MainActivity with ALARM_FIRED → brings alarm UI to foreground
     *
     * When the app is already in the foreground, the activity launch is a no-op
     * (singleTask + SINGLE_TOP just delivers onNewIntent). When the app is
     * minimized, it brings the activity to the foreground so the user sees the
     * swipe-to-dismiss screen without manually opening the app.
     */
    @PluginMethod()
    public void ring(PluginCall call) {
        Context ctx = getContext();

        try {
            // 1. Start AlarmService (audio + vibration + notification)
            Intent serviceIntent = new Intent(ctx, AlarmService.class);
            serviceIntent.setAction(AlarmService.ACTION_START_ALARM);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                ctx.startForegroundService(serviceIntent);
            } else {
                ctx.startService(serviceIntent);
            }

            Log.i(TAG, "Native AlarmService started via ring()");

            // 2. Bring activity to foreground (essential when app is minimized).
            //    When the app is already visible, singleTask + SINGLE_TOP makes
            //    this a harmless onNewIntent delivery.
            try {
                Intent activityIntent = new Intent(ctx, MainActivity.class);
                activityIntent.setAction("com.wakeai.app.ALARM_FIRED");
                activityIntent.addFlags(
                        Intent.FLAG_ACTIVITY_NEW_TASK
                        | Intent.FLAG_ACTIVITY_CLEAR_TOP
                        | Intent.FLAG_ACTIVITY_SINGLE_TOP);
                ctx.startActivity(activityIntent);
                Log.i(TAG, "Activity brought to foreground via ring()");
            } catch (Exception e) {
                // May fail on some devices due to background activity restrictions.
                // Not fatal — the AlarmService notification is the fallback.
                Log.w(TAG, "Could not bring activity to foreground: " + e.getMessage());
            }

            call.resolve();
        } catch (Exception e) {
            Log.e(TAG, "Failed to start AlarmService via ring()", e);
            call.reject("Failed to start native alarm service: " + e.getMessage());
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

        int piFlags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            piFlags |= PendingIntent.FLAG_IMMUTABLE;
        }

        // Cancel CURRENT PendingIntent type (getBroadcast → AlarmReceiver)
        Intent receiverIntent = new Intent(ctx, AlarmReceiver.class);
        receiverIntent.setAction(AlarmService.ACTION_START_ALARM);
        PendingIntent broadcastPI = PendingIntent.getBroadcast(ctx, 0, receiverIntent, piFlags);
        am.cancel(broadcastPI);

        // Also cancel OLD PendingIntent type (getForegroundService → AlarmService)
        // in case an alarm was scheduled before this update
        Intent serviceIntent = new Intent(ctx, AlarmService.class);
        serviceIntent.setAction(AlarmService.ACTION_START_ALARM);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            PendingIntent servicePI = PendingIntent.getForegroundService(
                    ctx, 0, serviceIntent, piFlags);
            am.cancel(servicePI);
        } else {
            PendingIntent servicePI = PendingIntent.getService(
                    ctx, 0, serviceIntent, piFlags);
            am.cancel(servicePI);
        }

        // Also cancel the fallback notification if it's showing
        AlarmNotificationHelper.cancelFallbackNotification(ctx);
    }
}

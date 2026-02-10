package com.wakeai.app;

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONException;
import org.json.JSONObject;

/**
 * SharedPreferences helper for persisting alarm data natively.
 * The BroadcastReceiver and Foreground Service read from here
 * so they can fire the alarm even when the WebView is dead.
 */
public class AlarmStorage {

    private static final String PREFS_NAME = "wakeai_native_alarm";
    private static final String KEY_ALARM_JSON = "alarm_json";

    private final SharedPreferences prefs;

    public AlarmStorage(Context context) {
        prefs = context.getApplicationContext()
                .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }

    /**
     * Save alarm data that the native layer needs.
     *
     * @param alarmId    Unique alarm ID (UUID from JS)
     * @param time       Alarm time in "HH:mm" format
     * @param tone       Tone file name without extension (e.g. "gentle")
     * @param vibration  Whether vibration is enabled
     * @param triggerAt  Epoch millis when the alarm should fire
     */
    public void saveAlarm(String alarmId, String time, String tone,
                          boolean vibration, long triggerAt) {
        try {
            JSONObject json = new JSONObject();
            json.put("alarmId", alarmId);
            json.put("time", time);
            json.put("tone", tone);
            json.put("vibration", vibration);
            json.put("triggerAt", triggerAt);
            prefs.edit().putString(KEY_ALARM_JSON, json.toString()).apply();
        } catch (JSONException e) {
            // Should never happen with simple put calls
            e.printStackTrace();
        }
    }

    /**
     * Read the stored alarm.
     *
     * @return JSONObject with alarm fields, or null if none saved.
     */
    public JSONObject getAlarm() {
        String raw = prefs.getString(KEY_ALARM_JSON, null);
        if (raw == null) return null;
        try {
            return new JSONObject(raw);
        } catch (JSONException e) {
            return null;
        }
    }

    /**
     * Remove persisted alarm data (called on cancel / delete).
     */
    public void clearAlarm() {
        prefs.edit().remove(KEY_ALARM_JSON).apply();
    }

    /**
     * Quick check whether an alarm is stored.
     */
    public boolean hasAlarm() {
        return prefs.contains(KEY_ALARM_JSON);
    }
}

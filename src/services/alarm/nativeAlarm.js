import { registerPlugin } from '@capacitor/core';
import { Capacitor } from '@capacitor/core';

const WakeAIAlarm = registerPlugin('WakeAIAlarm');

/**
 * Whether the current platform supports the native alarm plugin.
 * Only Android has the native AlarmManager / Foreground Service implementation.
 */
export function isNativeAlarmAvailable() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

/**
 * Schedule an alarm via native AlarmManager.setAlarmClock().
 *
 * @param {Object} opts
 * @param {string} opts.alarmId    - Unique alarm ID
 * @param {string} opts.time       - Alarm time "HH:mm"
 * @param {string} opts.tone       - Tone name (e.g. "gentle")
 * @param {boolean} opts.vibration - Whether vibration is enabled
 * @param {number} opts.triggerAt  - Epoch millis when alarm should fire
 */
export async function scheduleNativeAlarm({ alarmId, time, tone, vibration, triggerAt }) {
  if (!isNativeAlarmAvailable()) return;
  await WakeAIAlarm.schedule({ alarmId, time, tone, vibration, triggerAt });
  console.log('[NativeAlarm] Scheduled:', alarmId, 'at', new Date(triggerAt).toLocaleString());
}

/**
 * Cancel the currently scheduled native alarm.
 */
export async function cancelNativeAlarm() {
  if (!isNativeAlarmAvailable()) return;
  await WakeAIAlarm.cancel();
  console.log('[NativeAlarm] Cancelled');
}

/**
 * Dismiss (stop) the currently ringing native alarm.
 * Stops audio, vibration, and the foreground service.
 */
export async function dismissNativeAlarm() {
  if (!isNativeAlarmAvailable()) return;
  await WakeAIAlarm.dismiss();
  console.log('[NativeAlarm] Dismissed');
}

/**
 * Check if the app was launched by an alarm full-screen intent (cold start).
 * Returns { alarmFired: boolean }.
 */
export async function checkLaunchIntent() {
  if (!isNativeAlarmAvailable()) return { alarmFired: false };
  const result = await WakeAIAlarm.checkLaunchIntent();
  return result;
}

/**
 * Check if the native alarm service is currently ringing.
 * Returns { ringing: boolean }.
 */
export async function isNativeRinging() {
  if (!isNativeAlarmAvailable()) return { ringing: false };
  const result = await WakeAIAlarm.isNativeRinging();
  return result;
}

/**
 * Add listener for when an alarm fires while the app is running (warm start).
 * @param {Function} callback - Called with { alarmFired, alarmId, time }
 * @returns {Function} Remove listener
 */
export function addAlarmFiredListener(callback) {
  if (!isNativeAlarmAvailable()) return () => {};
  const handle = WakeAIAlarm.addListener('alarmFired', callback);
  // Capacitor 6 returns a PluginListenerHandle with remove()
  return () => handle.then ? handle.then(h => h.remove()) : handle.remove();
}

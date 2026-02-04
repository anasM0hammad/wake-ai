/**
 * JavaScript-based alarm timer that checks every second if the current time
 * matches the alarm time. Works on both web browsers and Android.
 * This provides a guaranteed fallback when LocalNotifications don't work.
 */

let timerInterval = null;
let alarmCallback = null;
let isAlarmFiring = false;

const STORAGE_KEY = 'wakeai_alarm';

/**
 * Start monitoring for alarm time match
 * @param {Function} onAlarmFire - Callback when alarm should fire, receives alarm object
 */
export const startAlarmMonitor = (onAlarmFire) => {
  alarmCallback = onAlarmFire;
  stopAlarmMonitor();

  timerInterval = setInterval(() => {
    if (isAlarmFiring) return;

    const alarmRaw = localStorage.getItem(STORAGE_KEY);
    if (!alarmRaw) return;

    let alarm;
    try {
      alarm = JSON.parse(alarmRaw);
    } catch (e) {
      return;
    }

    if (!alarm || !alarm.enabled) return;

    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentSeconds = now.getSeconds();

    const parts = alarm.time.split(':');
    const alarmHours = parseInt(parts[0], 10);
    const alarmMinutes = parseInt(parts[1], 10);

    // Fire alarm if time matches (within first 3 seconds of the minute to avoid re-firing)
    if (currentHours === alarmHours && currentMinutes === alarmMinutes && currentSeconds <= 3) {
      console.log('[AlarmTimer] ALARM FIRED at', now.toLocaleTimeString());
      isAlarmFiring = true;
      if (alarmCallback) {
        alarmCallback(alarm);
      }
    }
  }, 1000);

  console.log('[AlarmTimer] Monitor started');
};

/**
 * Stop the alarm monitor interval
 */
export const stopAlarmMonitor = () => {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
};

/**
 * Reset the alarm firing flag so future alarms can fire
 * Call this when user dismisses the alarm and returns to home
 */
export const resetAlarmFiring = () => {
  isAlarmFiring = false;
  console.log('[AlarmTimer] Firing flag reset');
};

/**
 * Check if an alarm is currently firing
 * @returns {boolean}
 */
export const isCurrentlyFiring = () => {
  return isAlarmFiring;
};

/**
 * Get the time remaining until the next alarm in milliseconds
 * @returns {number|null} Milliseconds until alarm, or null if no alarm set
 */
export const getTimeUntilAlarm = () => {
  const alarmRaw = localStorage.getItem(STORAGE_KEY);
  if (!alarmRaw) return null;

  let alarm;
  try {
    alarm = JSON.parse(alarmRaw);
  } catch (e) {
    return null;
  }

  if (!alarm || !alarm.enabled) return null;

  const now = new Date();
  const parts = alarm.time.split(':');
  const alarmHours = parseInt(parts[0], 10);
  const alarmMinutes = parseInt(parts[1], 10);

  const alarmTime = new Date(now);
  alarmTime.setHours(alarmHours, alarmMinutes, 0, 0);

  // If alarm time has passed today, it's for tomorrow
  if (alarmTime <= now) {
    alarmTime.setDate(alarmTime.getDate() + 1);
  }

  return alarmTime.getTime() - now.getTime();
};

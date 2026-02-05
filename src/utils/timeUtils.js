import { PRELOAD_BEFORE_ALARM_MS, ALARM_TOLERANCE_SECONDS } from './constants';

/**
 * Format a Date object to HH:MM string (24-hour format)
 */
export function formatTime(date) {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return '00:00';
  }
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Parse HH:MM string to hours and minutes
 */
export function parseTime(timeString) {
  if (!timeString || typeof timeString !== 'string') {
    return { hours: 0, minutes: 0 };
  }

  const [hoursStr, minutesStr] = timeString.split(':');
  const hours = parseInt(hoursStr, 10) || 0;
  const minutes = parseInt(minutesStr, 10) || 0;

  return {
    hours: Math.max(0, Math.min(23, hours)),
    minutes: Math.max(0, Math.min(59, minutes))
  };
}

/**
 * Get today's date as YYYY-MM-DD string
 * @returns {string}
 */
export function getTodayDateString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/**
 * Get the next Date when alarm should fire
 * If the alarm already fired today (lastFiredDate === today), schedules for tomorrow.
 * Otherwise, schedules for today if time hasn't passed, or tomorrow if it has.
 * @param {string} time - Time in HH:MM format
 * @param {string|null} lastFiredDate - YYYY-MM-DD string of the last day the alarm fired
 * @returns {Date} Next alarm date
 */
export function getNextAlarmDate(time, lastFiredDate = null) {
  const { hours, minutes } = parseTime(time);
  const now = new Date();
  const todayStr = getTodayDateString();

  // Create a date for today with the alarm time
  const alarmToday = new Date(now);
  alarmToday.setHours(hours, minutes, 0, 0);

  // If the alarm already fired today, always schedule for tomorrow
  if (lastFiredDate === todayStr) {
    const tomorrow = new Date(alarmToday);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }

  // If alarm time has not passed today, schedule for today
  if (alarmToday > now) {
    return alarmToday;
  }

  // Otherwise schedule for tomorrow
  const tomorrow = new Date(alarmToday);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow;
}

/**
 * Get human-readable time until alarm
 */
export function getTimeUntilAlarm(alarmDate) {
  if (!(alarmDate instanceof Date) || isNaN(alarmDate.getTime())) {
    return 'Invalid date';
  }

  const now = new Date();
  const diffMs = alarmDate.getTime() - now.getTime();

  if (diffMs <= 0) {
    return 'Now';
  }

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const remainingMinutes = diffMinutes % 60;
  const diffDays = Math.floor(diffHours / 24);
  const remainingHours = diffHours % 24;

  const parts = [];

  if (diffDays > 0) {
    parts.push(`${diffDays} day${diffDays !== 1 ? 's' : ''}`);
  }
  if (remainingHours > 0) {
    parts.push(`${remainingHours} hour${remainingHours !== 1 ? 's' : ''}`);
  }
  if (remainingMinutes > 0 && diffDays === 0) {
    parts.push(`${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`);
  }

  if (parts.length === 0) {
    return 'Less than a minute';
  }

  return parts.join(' ');
}

/**
 * Check if questions should be preloaded (alarm within 30 minutes)
 */
export function shouldPreloadQuestions(alarmDate) {
  if (!(alarmDate instanceof Date) || isNaN(alarmDate.getTime())) {
    return false;
  }

  const now = new Date();
  const diffMs = alarmDate.getTime() - now.getTime();

  return diffMs > 0 && diffMs <= PRELOAD_BEFORE_ALARM_MS;
}

/**
 * Check if current time matches alarm time (within tolerance)
 */
export function isAlarmTime(alarmDate, toleranceSeconds = ALARM_TOLERANCE_SECONDS) {
  if (!(alarmDate instanceof Date) || isNaN(alarmDate.getTime())) {
    return false;
  }

  const now = new Date();
  const diffMs = Math.abs(alarmDate.getTime() - now.getTime());
  const toleranceMs = toleranceSeconds * 1000;

  return diffMs <= toleranceMs;
}

/**
 * Format time for display with AM/PM option
 */
export function formatTimeDisplay(time, use24Hour = true) {
  const { hours, minutes } = parseTime(time);
  const minutesStr = minutes.toString().padStart(2, '0');

  if (use24Hour) {
    return `${hours.toString().padStart(2, '0')}:${minutesStr}`;
  }

  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutesStr} ${period}`;
}

/**
 * Get milliseconds until a specific time
 */
export function getMsUntilTime(alarmDate) {
  if (!(alarmDate instanceof Date) || isNaN(alarmDate.getTime())) {
    return 0;
  }

  const now = new Date();
  return Math.max(0, alarmDate.getTime() - now.getTime());
}

export default {
  formatTime,
  parseTime,
  getTodayDateString,
  getNextAlarmDate,
  getTimeUntilAlarm,
  shouldPreloadQuestions,
  isAlarmTime,
  formatTimeDisplay,
  getMsUntilTime
};

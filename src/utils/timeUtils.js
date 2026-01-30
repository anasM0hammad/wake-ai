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
 * Get the next Date when alarm should fire
 * @param {string} time - Time in HH:MM format
 * @param {number[]} days - Array of days (0=Sunday, 1=Monday, etc.). Empty array means daily/one-time
 * @returns {Date} Next alarm date
 */
export function getNextAlarmDate(time, days = []) {
  const { hours, minutes } = parseTime(time);
  const now = new Date();
  const today = now.getDay();

  // Create a date for today with the alarm time
  const alarmToday = new Date(now);
  alarmToday.setHours(hours, minutes, 0, 0);

  // If no specific days, treat as one-time/daily alarm
  if (!days || days.length === 0) {
    // If alarm time has passed today, schedule for tomorrow
    if (alarmToday > now) {
      return alarmToday;
    }
    const tomorrow = new Date(alarmToday);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }

  // Find the next matching day
  for (let i = 0; i < 7; i++) {
    const checkDay = (today + i) % 7;
    if (days.includes(checkDay)) {
      const alarmDate = new Date(now);
      alarmDate.setDate(now.getDate() + i);
      alarmDate.setHours(hours, minutes, 0, 0);

      // If it's today but time has passed, continue to next occurrence
      if (alarmDate > now) {
        return alarmDate;
      }
    }
  }

  // Fallback: next week same day
  const nextWeek = new Date(alarmToday);
  nextWeek.setDate(nextWeek.getDate() + 7);
  return nextWeek;
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
  getNextAlarmDate,
  getTimeUntilAlarm,
  shouldPreloadQuestions,
  isAlarmTime,
  formatTimeDisplay,
  getMsUntilTime
};

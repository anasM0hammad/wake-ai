import { get, set, remove } from './storageService';

const ALARM_KEY = 'wakeai_alarm';

/**
 * Alarm structure:
 * {
 *   id: string,
 *   time: string (HH:MM 24-hour format),
 *   difficulty: string (EASY/MEDIUM/HARD),
 *   enabled: boolean,
 *   createdAt: number (timestamp)
 * }
 */

export function getAlarm() {
  return get(ALARM_KEY);
}

export function saveAlarm(alarm) {
  set(ALARM_KEY, alarm);
  return alarm;
}

export function deleteAlarm() {
  remove(ALARM_KEY);
}

export function isAlarmEnabled() {
  const alarm = getAlarm();
  return alarm?.enabled ?? false;
}

export function toggleAlarm() {
  const alarm = getAlarm();
  if (!alarm) {
    return false;
  }
  const newEnabled = !alarm.enabled;
  saveAlarm({ ...alarm, enabled: newEnabled });
  return newEnabled;
}

export default {
  getAlarm,
  saveAlarm,
  deleteAlarm,
  isAlarmEnabled,
  toggleAlarm
};

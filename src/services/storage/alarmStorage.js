import { get, set, remove } from './storageService';

const ALARM_KEY = 'wakeai_alarm';

/**
 * Alarm structure:
 * {
 *   id: string,
 *   time: string (HH:MM 24-hour format),
 *   difficulty: string (EASY/MEDIUM/HARD),
 *   enabled: boolean,
 *   createdAt: number (timestamp),
 *   lastFiredDate: string|null (YYYY-MM-DD, set when alarm fires to prevent same-day re-trigger)
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

export function updateAlarmField(field, value) {
  const alarm = getAlarm();
  if (!alarm) return null;
  const updated = { ...alarm, [field]: value };
  saveAlarm(updated);
  return updated;
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
  updateAlarmField,
  isAlarmEnabled,
  toggleAlarm
};

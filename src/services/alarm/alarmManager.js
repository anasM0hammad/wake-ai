import {
  getAlarm,
  saveAlarm,
  deleteAlarm as deleteStoredAlarm,
  updateAlarmField
} from '../storage/alarmStorage';
import {
  scheduleAlarm,
  cancelAlarm
} from './alarmScheduler';
import { getSettings } from '../storage/settingsStorage';
import { getTodayDateString } from '../../utils/timeUtils';

// Session state
let currentSession = null;
let activeAlarm = null;

// Alarm CRUD operations

export async function createAlarm(time, difficulty = null) {
  const settings = getSettings();
  const alarmDifficulty = difficulty || settings.difficulty;

  const alarm = {
    id: crypto.randomUUID(),
    time,
    difficulty: alarmDifficulty,
    enabled: true,
    createdAt: Date.now()
  };

  saveAlarm(alarm);
  await scheduleAlarm(alarm);

  return alarm;
}

export async function updateAlarm(id, updates) {
  const existingAlarm = getAlarm();

  if (!existingAlarm || existingAlarm.id !== id) {
    return null;
  }

  const updatedAlarm = {
    ...existingAlarm,
    ...updates,
    id // Ensure ID doesn't change
  };

  saveAlarm(updatedAlarm);

  // Reschedule if enabled
  if (updatedAlarm.enabled) {
    await scheduleAlarm(updatedAlarm);
  } else {
    await cancelAlarm(id);
  }

  return updatedAlarm;
}

export async function deleteAlarm(id) {
  const alarm = getAlarm();

  if (!alarm || alarm.id !== id) {
    return false;
  }

  await cancelAlarm(id);
  deleteStoredAlarm();

  return true;
}

export async function toggleAlarm(id, enabled) {
  const alarm = getAlarm();

  if (!alarm || alarm.id !== id) {
    return null;
  }

  const updatedAlarm = { ...alarm, enabled };
  saveAlarm(updatedAlarm);

  if (enabled) {
    await scheduleAlarm(updatedAlarm);
  } else {
    await cancelAlarm(id);
  }

  return updatedAlarm;
}

// Active alarm management

export function getActiveAlarm() {
  return activeAlarm;
}

export function setActiveAlarm(alarm) {
  activeAlarm = alarm;
}

export function clearActiveAlarm() {
  activeAlarm = null;
}

// Alarm session management

export function startAlarmSession(alarm) {
  // Mark the alarm as having fired today so it won't re-trigger
  updateAlarmField('lastFiredDate', getTodayDateString());

  currentSession = {
    alarmId: alarm.id,
    alarm,
    startedAt: Date.now(),
    status: 'ringing',
    questionsAnswered: 0,
    questionsCorrect: 0,
    wrongAnswers: 0
  };

  setActiveAlarm(alarm);

  return currentSession;
}

export function updateSessionProgress(correct) {
  if (!currentSession) {
    return null;
  }

  currentSession.questionsAnswered++;
  if (correct) {
    currentSession.questionsCorrect++;
  } else {
    currentSession.wrongAnswers++;
  }

  return { ...currentSession };
}

export function endAlarmSession(result) {
  if (!currentSession) {
    return null;
  }

  const sessionSummary = {
    ...currentSession,
    endedAt: Date.now(),
    result, // 'win' | 'kill' | 'fail' | 'timeout'
    duration: Date.now() - currentSession.startedAt
  };

  // Clear session
  currentSession = null;
  clearActiveAlarm();

  return sessionSummary;
}

export function getCurrentSession() {
  return currentSession ? { ...currentSession } : null;
}

export function isSessionActive() {
  return currentSession !== null && currentSession.status !== 'ended';
}

// Session status helpers

export function setSessionStatus(status) {
  if (currentSession) {
    currentSession.status = status;
  }
}

export function getSessionDuration() {
  if (!currentSession) {
    return 0;
  }
  return Date.now() - currentSession.startedAt;
}

/**
 * Reschedule the alarm for the next day.
 * Reads the current alarm from storage (which now has lastFiredDate set)
 * and re-schedules it. getNextAlarmDate will see lastFiredDate === today
 * and automatically return tomorrow.
 */
export async function rescheduleAlarmForNextDay() {
  const alarm = getAlarm();
  if (!alarm || !alarm.enabled) return null;

  const success = await scheduleAlarm(alarm);
  return success ? alarm : null;
}

export default {
  // CRUD
  createAlarm,
  updateAlarm,
  deleteAlarm,
  toggleAlarm,

  // Active alarm
  getActiveAlarm,
  setActiveAlarm,
  clearActiveAlarm,

  // Session
  startAlarmSession,
  updateSessionProgress,
  endAlarmSession,
  getCurrentSession,
  isSessionActive,
  setSessionStatus,
  getSessionDuration,
  rescheduleAlarmForNextDay
};

import {
  getAlarm,
  saveAlarm,
  deleteAlarm as deleteStoredAlarm
} from '../storage/alarmStorage';
import {
  scheduleAlarm,
  cancelAlarm,
  scheduleSnooze as scheduleSnoozeNotification,
  cancelAllSnoozes
} from './alarmScheduler';
import { getSettings } from '../storage/settingsStorage';
import { SNOOZE_DURATION_MINUTES } from '../../utils/constants';

// Session state
let currentSession = null;
let activeAlarm = null;

const MAX_SNOOZES = 3;

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

// Snooze management

export async function snoozeCurrentAlarm(minutes = SNOOZE_DURATION_MINUTES) {
  if (!currentSession) {
    return { success: false, error: 'No active alarm session' };
  }

  if (currentSession.snoozesRemaining <= 0) {
    return { success: false, error: 'No snoozes remaining' };
  }

  currentSession.snoozesRemaining--;
  currentSession.snoozeCount++;

  const result = await scheduleSnoozeNotification(
    currentSession.alarmId,
    minutes
  );

  if (result.success) {
    currentSession.status = 'snoozed';
    currentSession.lastSnoozeAt = Date.now();
  }

  return {
    ...result,
    snoozesRemaining: currentSession.snoozesRemaining
  };
}

export function getRemainingSnoozes() {
  return currentSession?.snoozesRemaining ?? 0;
}

export function resetSnoozeCount() {
  if (currentSession) {
    currentSession.snoozesRemaining = MAX_SNOOZES;
    currentSession.snoozeCount = 0;
  }
}

// Alarm session management

export function startAlarmSession(alarm) {
  // Cancel any pending snoozes from previous sessions
  cancelAllSnoozes();

  currentSession = {
    alarmId: alarm.id,
    alarm,
    startedAt: Date.now(),
    status: 'ringing',
    snoozesRemaining: MAX_SNOOZES,
    snoozeCount: 0,
    questionsAnswered: 0,
    questionsCorrect: 0,
    wrongAnswers: 0,
    lastSnoozeAt: null
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
  cancelAllSnoozes();

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

  // Snooze
  snoozeCurrentAlarm,
  getRemainingSnoozes,
  resetSnoozeCount,

  // Session
  startAlarmSession,
  updateSessionProgress,
  endAlarmSession,
  getCurrentSession,
  isSessionActive,
  setSessionStatus,
  getSessionDuration
};

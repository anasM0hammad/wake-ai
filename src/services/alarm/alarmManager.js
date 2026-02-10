import {
  getAlarm,
  saveAlarm,
  deleteAlarm as deleteStoredAlarm
} from '../storage/alarmStorage';
import {
  scheduleAlarm,
  cancelAlarm
} from './alarmScheduler';
import { getSettings } from '../storage/settingsStorage';
import {
  saveQuestionSet,
  getQuestionSet,
  deleteQuestionSet,
  hasValidQuestionSet,
  getRequiredQuestionCount
} from '../storage/questionStorage';
import { getQuestionsFromPool, getPoolCount } from '../llm/questionPool';
import { getTodayDateString } from '../../utils/timeUtils';

// Session state
let currentSession = null;
let activeAlarm = null;

/**
 * Map questions from pool to an alarm in questionStorage.
 * This is synchronous (pool is always pre-filled) and runs
 * inline with alarm create/update — NOT fire-and-forget.
 */
function prepareQuestionsForAlarm(alarm) {
  const settings = getSettings();
  const difficulty = alarm.difficulty || settings.difficulty || 'EASY';
  const categories = settings.selectedCategories || ['math'];
  const count = getRequiredQuestionCount(difficulty);

  // Check if we already have valid questions for this exact config
  if (hasValidQuestionSet(alarm.id, difficulty, categories)) {
    console.log('[AlarmManager] Existing question set is still valid, skipping');
    return;
  }

  // Delete old questions
  deleteQuestionSet();

  console.log('[AlarmManager] Getting', count, 'questions for', difficulty, 'from pool');
  const poolCount = getPoolCount();
  console.log('[AlarmManager] Pool has', poolCount, 'questions');

  // Get questions from pool (auto-supplements with fallback if needed)
  const questions = getQuestionsFromPool(count, categories);

  // Determine source based on pool count
  let source = 'pool';
  if (poolCount === 0) {
    source = 'fallback';
  } else if (poolCount < count) {
    source = 'mixed';
  }

  saveQuestionSet({
    alarmId: alarm.id,
    difficulty,
    categories,
    questions,
    generatedAt: Date.now(),
    source
  });

  console.log('[AlarmManager] Questions saved:', questions.length, 'source:', source);
}

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

  // Map questions from pool to this alarm (synchronous — pool is always pre-filled)
  prepareQuestionsForAlarm(alarm);

  return alarm;
}

export async function updateAlarm(id, updates) {
  const existingAlarm = getAlarm();

  if (!existingAlarm || existingAlarm.id !== id) {
    return null;
  }

  const previousDifficulty = existingAlarm.difficulty;

  // If the alarm time changed, clear lastFiredDate so the new time
  // can fire today instead of being forced to tomorrow
  const timeChanged = updates.time && updates.time !== existingAlarm.time;

  const updatedAlarm = {
    ...existingAlarm,
    ...updates,
    id, // Ensure ID doesn't change
    ...(timeChanged ? { lastFiredDate: null } : {})
  };

  saveAlarm(updatedAlarm);

  // Reschedule if enabled
  if (updatedAlarm.enabled) {
    await scheduleAlarm(updatedAlarm);
  } else {
    await cancelAlarm(id);
  }

  // Rebalance questions if difficulty or categories changed
  const settings = getSettings();
  const newDifficulty = updatedAlarm.difficulty;
  const newCategories = settings.selectedCategories || ['math'];
  const currentSet = getQuestionSet();
  const newCount = getRequiredQuestionCount(newDifficulty);

  const difficultyChanged = previousDifficulty !== newDifficulty;
  const categoriesChanged = currentSet &&
    JSON.stringify([...(currentSet.categories || [])].sort()) !==
    JSON.stringify([...newCategories].sort());

  if (difficultyChanged || categoriesChanged) {
    if (difficultyChanged) {
      console.log('[AlarmManager] Difficulty changed from', previousDifficulty, 'to', newDifficulty);
    }
    if (categoriesChanged) {
      console.log('[AlarmManager] Categories changed');
    }

    if (!difficultyChanged && !categoriesChanged &&
        currentSet && currentSet.questions && currentSet.questions.length >= newCount) {
      // We have enough questions and nothing changed — update metadata only
      saveQuestionSet({
        ...currentSet,
        difficulty: newDifficulty,
        alarmId: updatedAlarm.id,
        generatedAt: Date.now()
      });
      console.log('[AlarmManager] Reusing existing questions, updated metadata');
    } else {
      // Re-pull from pool with new config
      prepareQuestionsForAlarm(updatedAlarm);
    }
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

  // Also delete pre-generated questions
  deleteQuestionSet();
  console.log('[AlarmManager] Alarm and questions deleted');

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
  // Mark alarm as fired today so it won't re-trigger after dismiss
  const storedAlarm = getAlarm();
  if (storedAlarm && storedAlarm.id === alarm.id) {
    const updated = { ...storedAlarm, lastFiredDate: getTodayDateString() };
    saveAlarm(updated);
  }

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

// Export the question preparation function for use after alarm session ends
export { prepareQuestionsForAlarm };

/**
 * Reschedule the alarm for the next day after dismiss.
 * Reads the stored alarm (which has lastFiredDate = today),
 * so getNextAlarmDate will return tomorrow automatically.
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

  // Questions
  prepareQuestionsForAlarm,
  rescheduleAlarmForNextDay
};

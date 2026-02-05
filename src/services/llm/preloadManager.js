import { getAlarm } from '../storage/alarmStorage';
import { getSettings } from '../storage/settingsStorage';
import {
  cacheQuestions,
  getCachedQuestions,
  clearCache,
  hasSufficientQuestions
} from './questionCache';
import { getRandomFallbackQuestions } from './fallbackQuestions';
import { generateQuestionBatch } from './questionGenerator';
import { isModelReady } from './webllm';
import { getNextAlarmDate, getMsUntilTime } from '../../utils/timeUtils';
import { DIFFICULTY, PRELOAD_BEFORE_ALARM_MS, QUESTION_CACHE_SIZE } from '../../utils/constants';

const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
const BUFFER_QUESTIONS = 5; // Extra questions for wrong answers

let lastPreloadCheck = 0;
const MIN_CHECK_INTERVAL_MS = 60 * 1000; // Don't check more than once per minute

/**
 * Check if preloading is needed and perform it
 */
export async function checkAndPreloadQuestions() {
  const now = Date.now();

  // Throttle checks
  if (now - lastPreloadCheck < MIN_CHECK_INTERVAL_MS) {
    return { skipped: true, reason: 'throttled' };
  }
  lastPreloadCheck = now;

  const alarm = getAlarm();
  if (!alarm || !alarm.enabled) {
    return { skipped: true, reason: 'no_active_alarm' };
  }

  const alarmDate = getNextAlarmDate(alarm.time, alarm.lastFiredDate || null);
  const msUntilAlarm = getMsUntilTime(alarmDate);

  if (!isPreloadNeeded(msUntilAlarm)) {
    return { skipped: true, reason: 'alarm_not_soon' };
  }

  return await preloadForAlarm(alarm);
}

/**
 * Check if we should preload questions
 */
export function isPreloadNeeded(msUntilAlarm) {
  // Preload if alarm is within the preload window
  return msUntilAlarm > 0 && msUntilAlarm <= PRELOAD_BEFORE_ALARM_MS;
}

/**
 * Preload questions for a specific alarm
 */
export async function preloadForAlarm(alarm) {
  const settings = getSettings();
  const difficulty = alarm.difficulty || settings.difficulty || 'EASY';
  const categories = settings.selectedCategories || ['math'];
  const requiredQuestions = DIFFICULTY[difficulty]?.questions || 1;
  const neededCount = (requiredQuestions * 2) + BUFFER_QUESTIONS; // Double for safety + buffer

  // Check if we already have enough cached questions
  if (hasSufficientQuestions(neededCount)) {
    return { success: true, source: 'cache', count: getCachedQuestions().length };
  }

  // Clear old cache before adding new questions
  clearOldCache();

  let questions = [];
  let source = 'none';

  // Try to generate with LLM
  if (isModelReady()) {
    try {
      const generated = await generateQuestionBatch(categories, neededCount);
      if (generated && generated.length > 0) {
        questions = generated;
        source = 'llm';
      }
    } catch (error) {
      console.error('LLM generation failed during preload:', error);
    }
  }

  // Fallback to pre-written questions
  if (questions.length < neededCount) {
    const fallback = getRandomFallbackQuestions(categories, neededCount - questions.length);
    questions = [...questions, ...fallback];
    source = questions.length > 0 && source === 'llm' ? 'mixed' : 'fallback';
  }

  // Cache the questions
  if (questions.length > 0) {
    // Add timestamp for cache expiry
    const timestampedQuestions = questions.map(q => ({
      ...q,
      cachedAt: Date.now()
    }));
    cacheQuestions(timestampedQuestions);
  }

  return {
    success: questions.length >= requiredQuestions,
    source,
    count: questions.length,
    needed: neededCount
  };
}

/**
 * Get questions for an alarm session
 */
export function getQuestionsForSession(difficulty, categories) {
  const requiredQuestions = DIFFICULTY[difficulty]?.questions || 1;
  const neededCount = requiredQuestions + BUFFER_QUESTIONS;
  const categoriesList = Array.isArray(categories) ? categories : [categories];

  // Get cached questions
  let cached = getCachedQuestions();

  // Filter by categories if we have enough
  let questions = cached.filter(q => categoriesList.includes(q.category));

  // If not enough category-specific questions, use all cached
  if (questions.length < neededCount) {
    questions = cached;
  }

  // If still not enough, supplement with fallback
  if (questions.length < neededCount) {
    const fallback = getRandomFallbackQuestions(categoriesList, neededCount - questions.length);
    questions = [...questions, ...fallback];
  }

  // Validate questions
  const validQuestions = questions.filter(q =>
    q &&
    typeof q.question === 'string' &&
    Array.isArray(q.options) &&
    q.options.length === 4 &&
    typeof q.correctIndex === 'number' &&
    q.correctIndex >= 0 &&
    q.correctIndex <= 3
  );

  // Final fallback if validation removed too many
  if (validQuestions.length < neededCount) {
    const moreFallback = getRandomFallbackQuestions(categoriesList, neededCount - validQuestions.length);
    return [...validQuestions, ...moreFallback].slice(0, neededCount);
  }

  // Shuffle and return
  return validQuestions
    .sort(() => Math.random() - 0.5)
    .slice(0, neededCount);
}

/**
 * Clear cached questions older than 24 hours
 */
export function clearOldCache() {
  const cached = getCachedQuestions();
  const now = Date.now();

  const validQuestions = cached.filter(q => {
    if (!q.cachedAt) return true; // Keep questions without timestamp
    return now - q.cachedAt < CACHE_MAX_AGE_MS;
  });

  if (validQuestions.length < cached.length) {
    clearCache();
    if (validQuestions.length > 0) {
      cacheQuestions(validQuestions);
    }
  }
}

/**
 * Force preload regardless of timing (for manual trigger)
 */
export async function forcePreload() {
  const alarm = getAlarm();
  if (!alarm) {
    return { success: false, reason: 'no_alarm' };
  }

  lastPreloadCheck = 0; // Reset throttle
  return await preloadForAlarm(alarm);
}

/**
 * Get preload status for UI
 */
export function getPreloadStatus() {
  const cached = getCachedQuestions();
  const alarm = getAlarm();

  if (!alarm || !alarm.enabled) {
    return { status: 'no_alarm', count: 0 };
  }

  const settings = getSettings();
  const difficulty = alarm.difficulty || settings.difficulty || 'EASY';
  const requiredQuestions = DIFFICULTY[difficulty]?.questions || 1;
  const neededCount = (requiredQuestions * 2) + BUFFER_QUESTIONS;

  if (cached.length >= neededCount) {
    return { status: 'ready', count: cached.length };
  }

  if (cached.length > 0) {
    return { status: 'partial', count: cached.length, needed: neededCount };
  }

  return { status: 'empty', count: 0, needed: neededCount };
}

export default {
  checkAndPreloadQuestions,
  isPreloadNeeded,
  preloadForAlarm,
  getQuestionsForSession,
  clearOldCache,
  forcePreload,
  getPreloadStatus
};

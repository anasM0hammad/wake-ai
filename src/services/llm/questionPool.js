/**
 * Question Pool Service
 * Manages pre-generation of questions in phases
 * Phase 1: 5 questions (covers Easy)
 * Phase 2: 7 questions (covers Medium)
 * Phase 3: 9 questions (covers Hard)
 */

import { generateQuestionSet } from './questionService';
import { getRandomFallbackQuestions } from './fallbackQuestions';
import { initializeModel, isModelReady, unloadModel } from './webllm';
import { getSettings } from '../storage/settingsStorage';

const POOL_STORAGE_KEY = 'wakeai_question_pool';

// Phase targets
const PHASE_TARGETS = {
  1: 5,  // Easy
  2: 7,  // Medium
  3: 9   // Hard
};

let isGenerating = false;
let generationAborted = false;

/**
 * Get stored question pool
 */
export function getQuestionPool() {
  try {
    const raw = localStorage.getItem(POOL_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error('[QuestionPool] Failed to parse pool:', e);
    return null;
  }
}

/**
 * Save question pool
 */
function saveQuestionPool(pool) {
  try {
    localStorage.setItem(POOL_STORAGE_KEY, JSON.stringify(pool));
    return true;
  } catch (e) {
    console.error('[QuestionPool] Failed to save pool:', e);
    return false;
  }
}

/**
 * Clear question pool
 */
export function clearQuestionPool() {
  localStorage.removeItem(POOL_STORAGE_KEY);
}

/**
 * Get current pool count
 */
export function getPoolCount() {
  const pool = getQuestionPool();
  return pool?.questions?.length || 0;
}

/**
 * Check if pool has enough questions for difficulty
 */
export function hasEnoughQuestions(difficulty) {
  const required = {
    'EASY': 5,
    'MEDIUM': 7,
    'HARD': 9
  };
  const count = getPoolCount();
  return count >= (required[difficulty] || 5);
}

/**
 * Get questions from pool for alarm
 * @param {number} count - Number of questions needed
 * @param {string[]} categories - Preferred categories
 * @returns {Object[]} Questions array
 */
export function getQuestionsFromPool(count, categories) {
  const pool = getQuestionPool();

  if (!pool || !pool.questions || pool.questions.length === 0) {
    console.log('[QuestionPool] Pool empty, using fallback');
    return getRandomFallbackQuestions(categories, count);
  }

  let questions = [...pool.questions];

  // If we have enough, return what we need
  if (questions.length >= count) {
    console.log('[QuestionPool] Using', count, 'questions from pool of', questions.length);
    return questions.slice(0, count);
  }

  // Supplement with fallback
  const needed = count - questions.length;
  console.log('[QuestionPool] Pool has', questions.length, ', need', needed, 'more from fallback');
  const fallback = getRandomFallbackQuestions(categories, needed);
  return [...questions, ...fallback];
}

/**
 * Add questions to pool (for incremental generation)
 */
function addToPool(newQuestions, categories) {
  const pool = getQuestionPool() || { questions: [], categories: [], generatedAt: Date.now() };

  // Add new questions
  pool.questions = [...pool.questions, ...newQuestions];
  pool.categories = categories;
  pool.generatedAt = Date.now();

  saveQuestionPool(pool);
  console.log('[QuestionPool] Pool now has', pool.questions.length, 'questions');
}

/**
 * Generate questions in phases
 * Called after model is ready
 */
export async function generateQuestionsInPhases(categories) {
  if (isGenerating) {
    console.log('[QuestionPool] Generation already in progress');
    return;
  }

  isGenerating = true;
  generationAborted = false;

  const currentCount = getPoolCount();
  console.log('[QuestionPool] Starting phased generation. Current count:', currentCount);

  try {
    // Determine which phase to start from
    let phase = 1;
    if (currentCount >= 5) phase = 2;
    if (currentCount >= 7) phase = 3;
    if (currentCount >= 9) {
      console.log('[QuestionPool] Already have 9 questions, skipping generation');
      isGenerating = false;
      return;
    }

    // Generate for each remaining phase
    for (let p = phase; p <= 3; p++) {
      if (generationAborted) {
        console.log('[QuestionPool] Generation aborted');
        break;
      }

      const target = PHASE_TARGETS[p];
      const current = getPoolCount();
      const needed = target - current;

      if (needed <= 0) continue;

      console.log(`[QuestionPool] Phase ${p}: Generating ${needed} questions (target: ${target})`);

      // Generate questions one at a time with verification
      const newQuestions = await generateQuestionSet('EASY', categories, needed);

      if (newQuestions && newQuestions.length > 0) {
        // Filter out _source metadata
        const cleanQuestions = newQuestions.filter(q => typeof q === 'object' && q.question);
        addToPool(cleanQuestions, categories);
      }

      // Small delay between phases
      if (p < 3 && !generationAborted) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log('[QuestionPool] Phased generation complete. Total:', getPoolCount());

  } catch (error) {
    console.error('[QuestionPool] Generation error:', error);
  } finally {
    isGenerating = false;
    // Unload model to free memory
    unloadModel().catch(e => console.warn('[QuestionPool] Unload error:', e));
  }
}

/**
 * Abort ongoing generation
 */
export function abortGeneration() {
  generationAborted = true;
}

/**
 * Check if generation is in progress
 */
export function isGenerationInProgress() {
  return isGenerating;
}

/**
 * Start model loading and question generation
 * Called on app start
 */
export async function initializeQuestionPool() {
  console.log('[QuestionPool] Initializing...');

  const settings = getSettings();
  const categories = settings.selectedCategories || ['math'];

  // Check current pool status
  const currentCount = getPoolCount();
  console.log('[QuestionPool] Current pool count:', currentCount);

  // If we already have 9 questions, no need to generate
  if (currentCount >= 9) {
    console.log('[QuestionPool] Pool is full, no generation needed');
    return { status: 'ready', count: currentCount };
  }

  // Start model loading
  console.log('[QuestionPool] Loading model...');
  const modelReady = await initializeModel();

  if (!modelReady) {
    console.log('[QuestionPool] Model failed to load, will use fallback questions');
    return { status: 'fallback', count: currentCount };
  }

  // Generate questions in phases
  await generateQuestionsInPhases(categories);

  return { status: 'ready', count: getPoolCount() };
}

/**
 * Generate additional questions if difficulty increased
 * @param {number} additionalCount - How many more questions needed
 */
export async function generateAdditionalQuestions(additionalCount, categories) {
  if (additionalCount <= 0) return;

  console.log('[QuestionPool] Generating', additionalCount, 'additional questions');

  // Check if model is ready, if not try to load
  if (!isModelReady()) {
    const loaded = await initializeModel();
    if (!loaded) {
      console.log('[QuestionPool] Model not available, using fallback');
      const fallback = getRandomFallbackQuestions(categories, additionalCount);
      addToPool(fallback, categories);
      return;
    }
  }

  try {
    const newQuestions = await generateQuestionSet('EASY', categories, additionalCount);
    if (newQuestions && newQuestions.length > 0) {
      const cleanQuestions = newQuestions.filter(q => typeof q === 'object' && q.question);
      addToPool(cleanQuestions, categories);
    }
  } catch (error) {
    console.error('[QuestionPool] Additional generation failed:', error);
    const fallback = getRandomFallbackQuestions(categories, additionalCount);
    addToPool(fallback, categories);
  } finally {
    unloadModel().catch(e => console.warn('[QuestionPool] Unload error:', e));
  }
}

export default {
  getQuestionPool,
  clearQuestionPool,
  getPoolCount,
  hasEnoughQuestions,
  getQuestionsFromPool,
  initializeQuestionPool,
  generateQuestionsInPhases,
  generateAdditionalQuestions,
  abortGeneration,
  isGenerationInProgress
};

/**
 * Question Pool Service
 * Manages pre-generation of questions in phases.
 *
 * Pool is always populated — with LLM questions when the model is available,
 * or with fallback questions otherwise.  Generation is triggered reactively
 * via the onModelReady callback so it is fully decoupled from model loading.
 */

import { generateQuestionSet } from './questionService';
import { getRandomFallbackQuestions } from './fallbackQuestions';
import { initializeModel, isModelReady, onModelReady } from './webllm';
import { getSettings } from '../storage/settingsStorage';

const POOL_STORAGE_KEY = 'wakeai_question_pool';

// Phase targets — how many questions we want at each phase
const PHASE_TARGETS = {
  1: 5,  // covers Easy
  2: 7,  // covers Medium
  3: 9   // covers Hard
};

let isGenerating = false;
let generationAborted = false;

// ─── Pool CRUD ───────────────────────────────────────────────

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

function saveQuestionPool(pool) {
  try {
    localStorage.setItem(POOL_STORAGE_KEY, JSON.stringify(pool));
    return true;
  } catch (e) {
    console.error('[QuestionPool] Failed to save pool:', e);
    return false;
  }
}

export function clearQuestionPool() {
  localStorage.removeItem(POOL_STORAGE_KEY);
}

export function getPoolCount() {
  const pool = getQuestionPool();
  return pool?.questions?.length || 0;
}

export function hasEnoughQuestions(difficulty) {
  const required = { EASY: 5, MEDIUM: 7, HARD: 9 };
  return getPoolCount() >= (required[difficulty] || 5);
}

/**
 * Get questions from the pool for an alarm.
 * Auto-supplements with fallback if pool is insufficient.
 */
export function getQuestionsFromPool(count, categories) {
  const pool = getQuestionPool();

  if (!pool || !pool.questions || pool.questions.length === 0) {
    console.log('[QuestionPool] Pool empty, using fallback');
    return getRandomFallbackQuestions(categories, count);
  }

  let questions = [...pool.questions];

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

function addToPool(newQuestions, categories) {
  const pool = getQuestionPool() || { questions: [], categories: [], generatedAt: Date.now() };
  pool.questions = [...pool.questions, ...newQuestions];
  pool.categories = categories;
  pool.generatedAt = Date.now();
  saveQuestionPool(pool);
  console.log('[QuestionPool] Pool now has', pool.questions.length, 'questions');
}

// ─── LLM question generation (phased) ───────────────────────

/**
 * Generate questions in phases using the LLM.
 * Called after model is ready — does NOT unload the model.
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
    if (currentCount >= 9) {
      console.log('[QuestionPool] Already have 9 questions, skipping generation');
      return;
    }

    // Clear pool before LLM generation so we replace fallback with LLM questions
    clearQuestionPool();
    console.log('[QuestionPool] Cleared pool to replace with LLM questions');

    for (let p = 1; p <= 3; p++) {
      if (generationAborted) {
        console.log('[QuestionPool] Generation aborted');
        break;
      }

      const target = PHASE_TARGETS[p];
      const current = getPoolCount();
      const needed = target - current;

      if (needed <= 0) continue;

      console.log(`[QuestionPool] Phase ${p}: Generating ${needed} questions (target: ${target})`);

      const newQuestions = await generateQuestionSet('EASY', categories, needed);

      if (newQuestions && newQuestions.length > 0) {
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
    // NOTE: Model is intentionally NOT unloaded here.
    // Lifecycle is managed by App.jsx (foreground/background).
  }
}

export function abortGeneration() {
  generationAborted = true;
}

export function isGenerationInProgress() {
  return isGenerating;
}

// ─── Initialization ──────────────────────────────────────────

/**
 * Initialize the question pool.
 *
 * 1. Always pre-fill the pool with fallback questions if it's empty
 *    so that alarms are never left without questions.
 * 2. Start model loading (fire-and-forget).
 * 3. When the model becomes ready, replace/supplement pool with
 *    LLM-generated questions via onModelReady callback.
 */
export async function initializeQuestionPool() {
  console.log('[QuestionPool] Initializing...');

  const settings = getSettings();
  const categories = settings.selectedCategories || ['math'];
  const currentCount = getPoolCount();
  console.log('[QuestionPool] Current pool count:', currentCount);

  // Step 1: Ensure pool always has questions (fallback if needed)
  if (currentCount < 9) {
    const needed = 9 - currentCount;
    console.log('[QuestionPool] Pre-filling pool with', needed, 'fallback questions');
    const fallback = getRandomFallbackQuestions(categories, needed);
    addToPool(fallback, categories);
  }

  // Step 2: Register callback so LLM questions replace fallback when model is ready
  onModelReady(() => {
    console.log('[QuestionPool] Model ready — starting LLM question generation');
    generateQuestionsInPhases(categories).catch(err => {
      console.error('[QuestionPool] LLM generation after model ready failed:', err);
    });
  });

  // Step 3: Kick off model loading (deduplicates if already loading)
  console.log('[QuestionPool] Requesting model load...');
  initializeModel().then(success => {
    if (!success) {
      console.log('[QuestionPool] Model failed to load — pool already has fallback questions');
    }
  }).catch(err => {
    console.warn('[QuestionPool] Model init error:', err);
  });

  return { status: 'initializing', count: getPoolCount() };
}

/**
 * Generate additional questions if difficulty increased.
 */
export async function generateAdditionalQuestions(additionalCount, categories) {
  if (additionalCount <= 0) return;

  console.log('[QuestionPool] Generating', additionalCount, 'additional questions');

  // If model is ready, generate with LLM
  if (isModelReady()) {
    try {
      const newQuestions = await generateQuestionSet('EASY', categories, additionalCount);
      if (newQuestions && newQuestions.length > 0) {
        const cleanQuestions = newQuestions.filter(q => typeof q === 'object' && q.question);
        addToPool(cleanQuestions, categories);
        return;
      }
    } catch (error) {
      console.error('[QuestionPool] Additional generation failed:', error);
    }
  }

  // Fallback — always works
  console.log('[QuestionPool] Using fallback for additional questions');
  const fallback = getRandomFallbackQuestions(categories, additionalCount);
  addToPool(fallback, categories);
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

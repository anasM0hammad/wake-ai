/**
 * Question Storage Service
 * Manages pre-generated questions mapped to alarms in localStorage
 */

const STORAGE_KEY = 'wakeai_questions';

/**
 * Get the required number of questions based on difficulty
 * EASY: 1 correct needed + 5 wrong allowed + 2 buffer = 8
 * MEDIUM: 3 correct needed + 5 wrong allowed + 2 buffer = 10
 * HARD: 5 correct needed + 5 wrong allowed + 2 buffer = 12
 */
export function getRequiredQuestionCount(difficulty) {
  const counts = {
    'EASY': 8,
    'MEDIUM': 10,
    'HARD': 12
  };
  return counts[difficulty] || counts['EASY'];
}

/**
 * Save a question set to localStorage
 * @param {Object} data - Question set data
 * @param {string} data.alarmId - ID of the alarm these questions are for
 * @param {string} data.difficulty - Difficulty level
 * @param {string[]} data.categories - Question categories
 * @param {Object[]} data.questions - Array of question objects
 * @param {number} data.generatedAt - Timestamp when questions were generated
 * @param {string} data.source - 'llm' or 'fallback'
 */
export function saveQuestionSet(data) {
  try {
    const questionSet = {
      alarmId: data.alarmId,
      difficulty: data.difficulty,
      categories: data.categories,
      questions: data.questions,
      generatedAt: data.generatedAt || Date.now(),
      source: data.source || 'unknown'
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(questionSet));
    console.log('[QuestionStorage] Saved question set:', questionSet.questions.length, 'questions');
    return true;
  } catch (error) {
    console.error('[QuestionStorage] Failed to save question set:', error);
    return false;
  }
}

/**
 * Get the stored question set from localStorage
 * @returns {Object|null} The question set or null if not found/invalid
 */
export function getQuestionSet() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);

    // Basic validation
    if (!parsed || !Array.isArray(parsed.questions)) {
      console.warn('[QuestionStorage] Invalid question set structure');
      return null;
    }

    return parsed;
  } catch (error) {
    console.error('[QuestionStorage] Failed to parse question set:', error);
    return null;
  }
}

/**
 * Delete the stored question set
 */
export function deleteQuestionSet() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('[QuestionStorage] Deleted question set');
  } catch (error) {
    console.error('[QuestionStorage] Failed to delete question set:', error);
  }
}

/**
 * Check if we have a valid question set for the given alarm configuration
 * @param {string} alarmId - Alarm ID to check
 * @param {string} difficulty - Expected difficulty
 * @param {string[]} categories - Expected categories
 * @returns {boolean} True if valid question set exists for this config
 */
export function hasValidQuestionSet(alarmId, difficulty, categories) {
  const stored = getQuestionSet();
  if (!stored) return false;

  // Check alarm ID matches
  if (stored.alarmId !== alarmId) return false;

  // Check difficulty matches
  if (stored.difficulty !== difficulty) return false;

  // Check categories match (same items regardless of order)
  const storedCategories = [...(stored.categories || [])].sort();
  const expectedCategories = [...(categories || [])].sort();
  if (JSON.stringify(storedCategories) !== JSON.stringify(expectedCategories)) {
    return false;
  }

  // Check we have enough questions
  const requiredCount = getRequiredQuestionCount(difficulty);
  if (!stored.questions || stored.questions.length < requiredCount) {
    return false;
  }

  return true;
}

/**
 * Get the number of questions currently stored
 * @returns {number} Number of questions, or 0 if no set stored
 */
export function getStoredQuestionCount() {
  const stored = getQuestionSet();
  return stored?.questions?.length || 0;
}

export default {
  saveQuestionSet,
  getQuestionSet,
  deleteQuestionSet,
  hasValidQuestionSet,
  getRequiredQuestionCount,
  getStoredQuestionCount
};

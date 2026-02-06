import { get, set, remove } from '../storage/storageService';
import { QUESTION_CACHE_SIZE } from '../../utils/constants';

const CACHE_KEY = 'questionCache';

export function cacheQuestions(questions) {
  const existing = getCachedQuestions();
  const combined = [...existing, ...questions];

  // Enforce cache size limit - keep only the most recent questions
  // This prevents localStorage from filling up with old cached questions
  const limited = combined.length > QUESTION_CACHE_SIZE
    ? combined.slice(-QUESTION_CACHE_SIZE)
    : combined;

  set(CACHE_KEY, limited);
  return limited;
}

export function getCachedQuestions() {
  return get(CACHE_KEY) || [];
}

export function clearCache() {
  remove(CACHE_KEY);
}

export function hasSufficientQuestions(count) {
  const cached = getCachedQuestions();
  return cached.length >= count;
}

export function getAndRemoveQuestion(categories) {
  const cached = getCachedQuestions();

  if (cached.length === 0) {
    return null;
  }

  // Find a question matching one of the requested categories
  const matchIndex = cached.findIndex(q =>
    categories.includes(q.category)
  );

  if (matchIndex === -1) {
    // No matching category found, return first available question
    const [question, ...remaining] = cached;
    set(CACHE_KEY, remaining);
    return question;
  }

  // Remove and return the matching question
  const question = cached[matchIndex];
  const remaining = [
    ...cached.slice(0, matchIndex),
    ...cached.slice(matchIndex + 1)
  ];
  set(CACHE_KEY, remaining);
  return question;
}

export default {
  cacheQuestions,
  getCachedQuestions,
  clearCache,
  hasSufficientQuestions,
  getAndRemoveQuestion
};

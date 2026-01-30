import { get, set, remove } from '../storage/storageService';

const CACHE_KEY = 'questionCache';

export function cacheQuestions(questions) {
  const existing = getCachedQuestions();
  const combined = [...existing, ...questions];
  set(CACHE_KEY, combined);
  return combined;
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

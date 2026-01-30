export const DIFFICULTY = {
  EASY: { name: 'Easy', questions: 1 },
  MEDIUM: { name: 'Medium', questions: 3 },
  HARD: { name: 'Hard', questions: 5 }
};

export const MAX_WRONG_ANSWERS = 5;
export const MAX_RING_DURATION_MS = 20 * 60 * 1000; // 20 minutes

export const CATEGORIES = {
  MATH: { id: 'math', name: 'Math', description: 'Arithmetic and basic algebra' },
  PATTERNS: { id: 'patterns', name: 'Patterns', description: 'Number sequences' },
  GENERAL: { id: 'general', name: 'General Knowledge', description: 'Facts and trivia' },
  LOGIC: { id: 'logic', name: 'Logic', description: 'Simple reasoning problems' }
};

export const TONES = {
  GENTLE: { id: 'gentle', name: 'Gentle', file: 'gentle.mp3', premium: false },
  CLASSIC: { id: 'classic', name: 'Classic', file: 'classic.mp3', premium: true },
  INTENSE: { id: 'intense', name: 'Intense', file: 'intense.mp3', premium: true }
};

export const MODEL_CONFIG = {
  SMALL: { id: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC', ramThreshold: 0 },
  LARGE: { id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC', ramThreshold: 6000 }
};

export const PRELOAD_BEFORE_ALARM_MS = 30 * 60 * 1000; // 30 minutes
export const QUESTION_CACHE_SIZE = 10;

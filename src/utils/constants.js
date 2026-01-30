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

// Alarm timing constants
export const ALARM_TOLERANCE_SECONDS = 60;
export const QUESTION_PRELOAD_MINUTES = 30;
export const MAX_ALARM_RING_DURATION_MINUTES = 15;
export const SNOOZE_DURATION_MINUTES = 5;

// Ad timing constants
export const AD_INTERSTITIAL_DELAY_MS = 1000;

// Settings page constants with labels and descriptions
export const DIFFICULTY_MODES = {
  easy: { label: 'Easy', questions: 1, timePerQuestion: 60 },
  medium: { label: 'Medium', questions: 3, timePerQuestion: 45 },
  hard: { label: 'Hard', questions: 5, timePerQuestion: 30 }
};

export const QUESTION_CATEGORIES = {
  math: { label: 'Math', description: 'Arithmetic and basic algebra problems' },
  patterns: { label: 'Patterns', description: 'Number sequences and pattern recognition' },
  general: { label: 'General Knowledge', description: 'Facts, trivia, and common knowledge' },
  logic: { label: 'Logic', description: 'Simple reasoning and deduction puzzles' }
};

export const ALARM_TONES = {
  gentle: { label: 'Gentle Wake', file: 'gentle.mp3' },
  classic: { label: 'Classic Alarm', file: 'classic.mp3' },
  intense: { label: 'Intense', file: 'intense.mp3' },
  nature: { label: 'Nature Sounds', file: 'nature.mp3' }
};

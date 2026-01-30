import { get, set, remove } from './storageService';

const STATS_KEY = 'wakeai_stats';

const DEFAULT_STATS = {
  totalAlarms: 0,
  wins: 0,
  kills: 0,
  fails: 0,
  totalQuestionsAnswered: 0,
  totalQuestionsCorrect: 0
};

export function getStats() {
  const stored = get(STATS_KEY);
  return { ...DEFAULT_STATS, ...stored };
}

export function recordWin(questionsAnswered, questionsCorrect) {
  const stats = getStats();
  const updated = {
    ...stats,
    wins: stats.wins + 1,
    totalAlarms: stats.totalAlarms + 1,
    totalQuestionsAnswered: stats.totalQuestionsAnswered + questionsAnswered,
    totalQuestionsCorrect: stats.totalQuestionsCorrect + questionsCorrect
  };
  set(STATS_KEY, updated);
  return updated;
}

export function recordKill() {
  const stats = getStats();
  const updated = {
    ...stats,
    kills: stats.kills + 1,
    totalAlarms: stats.totalAlarms + 1
  };
  set(STATS_KEY, updated);
  return updated;
}

export function recordFail(questionsAnswered, questionsCorrect) {
  const stats = getStats();
  const updated = {
    ...stats,
    fails: stats.fails + 1,
    totalAlarms: stats.totalAlarms + 1,
    totalQuestionsAnswered: stats.totalQuestionsAnswered + questionsAnswered,
    totalQuestionsCorrect: stats.totalQuestionsCorrect + questionsCorrect
  };
  set(STATS_KEY, updated);
  return updated;
}

export function resetStats() {
  remove(STATS_KEY);
}

export function getWinRate() {
  const stats = getStats();
  if (stats.totalAlarms === 0) {
    return 0;
  }
  return (stats.wins / stats.totalAlarms) * 100;
}

export function getAccuracy() {
  const stats = getStats();
  if (stats.totalQuestionsAnswered === 0) {
    return 0;
  }
  return (stats.totalQuestionsCorrect / stats.totalQuestionsAnswered) * 100;
}

export default {
  getStats,
  recordWin,
  recordKill,
  recordFail,
  resetStats,
  getWinRate,
  getAccuracy
};

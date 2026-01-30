import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getStats,
  recordWin as recordStoredWin,
  recordKill as recordStoredKill,
  recordFail as recordStoredFail,
  resetStats as resetStoredStats
} from '../services/storage/statsStorage';

export function useStats() {
  const [stats, setStats] = useState(getStats);

  useEffect(() => {
    setStats(getStats());
  }, []);

  const recordWin = useCallback((questionsAnswered, questionsCorrect) => {
    const updated = recordStoredWin(questionsAnswered, questionsCorrect);
    setStats(updated);
    return updated;
  }, []);

  const recordKill = useCallback(() => {
    const updated = recordStoredKill();
    setStats(updated);
    return updated;
  }, []);

  const recordFail = useCallback((questionsAnswered, questionsCorrect) => {
    const updated = recordStoredFail(questionsAnswered, questionsCorrect);
    setStats(updated);
    return updated;
  }, []);

  const resetStats = useCallback(() => {
    resetStoredStats();
    setStats(getStats());
  }, []);

  const winRate = useMemo(() => {
    if (stats.totalAlarms === 0) {
      return 0;
    }
    return (stats.wins / stats.totalAlarms) * 100;
  }, [stats.wins, stats.totalAlarms]);

  const accuracy = useMemo(() => {
    if (stats.totalQuestionsAnswered === 0) {
      return 0;
    }
    return (stats.totalQuestionsCorrect / stats.totalQuestionsAnswered) * 100;
  }, [stats.totalQuestionsCorrect, stats.totalQuestionsAnswered]);

  return {
    stats,
    recordWin,
    recordKill,
    recordFail,
    resetStats,
    winRate,
    accuracy
  };
}

export default useStats;

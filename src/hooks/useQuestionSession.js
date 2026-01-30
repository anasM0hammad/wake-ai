import { useState, useCallback, useMemo } from 'react';
import { getQuestionsForSession } from '../services/llm/preloadManager';
import { getRandomFallbackQuestions } from '../services/llm/fallbackQuestions';
import { DIFFICULTY, MAX_WRONG_ANSWERS } from '../utils/constants';

const RESULTS = {
  PENDING: 'pending',
  WIN: 'win',
  FAIL: 'fail'
};

export function useQuestionSession() {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [result, setResult] = useState(RESULTS.PENDING);
  const [difficulty, setDifficulty] = useState('EASY');
  const [isInitialized, setIsInitialized] = useState(false);

  const requiredCorrect = useMemo(() => {
    return DIFFICULTY[difficulty]?.questions || 1;
  }, [difficulty]);

  const isComplete = useMemo(() => {
    return result !== RESULTS.PENDING;
  }, [result]);

  /**
   * Initialize a new question session
   */
  const initSession = useCallback((sessionDifficulty, categories = ['math']) => {
    const difficultyKey = sessionDifficulty?.toUpperCase() || 'EASY';
    setDifficulty(difficultyKey);

    // Get questions from preload cache or fallback
    let loadedQuestions;
    try {
      loadedQuestions = getQuestionsForSession(difficultyKey, categories);
    } catch (error) {
      console.error('Failed to get preloaded questions:', error);
      loadedQuestions = getRandomFallbackQuestions(categories, 10);
    }

    // Ensure we have enough questions
    if (!loadedQuestions || loadedQuestions.length === 0) {
      loadedQuestions = getRandomFallbackQuestions(categories, 10);
    }

    setQuestions(loadedQuestions);
    setCurrentIndex(0);
    setCorrectCount(0);
    setWrongCount(0);
    setResult(RESULTS.PENDING);
    setIsInitialized(true);

    return {
      questionCount: loadedQuestions.length,
      required: DIFFICULTY[difficultyKey]?.questions || 1
    };
  }, []);

  /**
   * Submit an answer for the current question
   */
  const answerQuestion = useCallback((selectedIndex) => {
    if (!isInitialized || isComplete) {
      return { isCorrect: false, result: result };
    }

    const currentQuestion = questions[currentIndex];
    if (!currentQuestion) {
      return { isCorrect: false, result: result };
    }

    const isCorrect = selectedIndex === currentQuestion.correctIndex;
    let newResult = RESULTS.PENDING;

    if (isCorrect) {
      const newCorrectCount = correctCount + 1;
      setCorrectCount(newCorrectCount);

      // Check for win
      if (newCorrectCount >= requiredCorrect) {
        newResult = RESULTS.WIN;
        setResult(newResult);
      } else {
        // Move to next question
        setCurrentIndex(prev => prev + 1);
      }
    } else {
      const newWrongCount = wrongCount + 1;
      setWrongCount(newWrongCount);

      // Check for fail
      if (newWrongCount >= MAX_WRONG_ANSWERS) {
        newResult = RESULTS.FAIL;
        setResult(newResult);
      } else {
        // Move to next question
        setCurrentIndex(prev => prev + 1);
      }
    }

    return {
      isCorrect,
      result: newResult,
      correctCount: isCorrect ? correctCount + 1 : correctCount,
      wrongCount: isCorrect ? wrongCount : wrongCount + 1
    };
  }, [isInitialized, isComplete, questions, currentIndex, correctCount, wrongCount, requiredCorrect, result]);

  /**
   * Get the current question
   */
  const getCurrentQuestion = useCallback(() => {
    if (!isInitialized || currentIndex >= questions.length) {
      return null;
    }
    return questions[currentIndex];
  }, [isInitialized, currentIndex, questions]);

  /**
   * Get current progress
   */
  const getProgress = useCallback(() => {
    return {
      correct: correctCount,
      required: requiredCorrect,
      wrong: wrongCount,
      maxWrong: MAX_WRONG_ANSWERS,
      currentQuestion: currentIndex + 1,
      totalQuestions: questions.length
    };
  }, [correctCount, requiredCorrect, wrongCount, currentIndex, questions.length]);

  /**
   * Reset the session
   */
  const resetSession = useCallback(() => {
    setQuestions([]);
    setCurrentIndex(0);
    setCorrectCount(0);
    setWrongCount(0);
    setResult(RESULTS.PENDING);
    setIsInitialized(false);
  }, []);

  /**
   * Get session summary (for after completion)
   */
  const getSessionSummary = useCallback(() => {
    return {
      difficulty,
      requiredCorrect,
      correctCount,
      wrongCount,
      totalAnswered: correctCount + wrongCount,
      result,
      accuracy: (correctCount + wrongCount) > 0
        ? Math.round((correctCount / (correctCount + wrongCount)) * 100)
        : 0
    };
  }, [difficulty, requiredCorrect, correctCount, wrongCount, result]);

  return {
    // State
    questions,
    currentIndex,
    correctCount,
    wrongCount,
    result,
    isComplete,
    isInitialized,
    requiredCorrect,

    // Functions
    initSession,
    answerQuestion,
    getCurrentQuestion,
    getProgress,
    resetSession,
    getSessionSummary,

    // Constants
    RESULTS
  };
}

export default useQuestionSession;

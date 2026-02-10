import { useState, useCallback, useMemo } from 'react';
import { getQuestionSet } from '../services/storage/questionStorage';
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

    // Get questions from per-alarm questionStorage (primary source)
    let loadedQuestions = [];
    try {
      const storedSet = getQuestionSet();
      if (storedSet && Array.isArray(storedSet.questions) && storedSet.questions.length > 0) {
        loadedQuestions = storedSet.questions;
        console.log('[QuestionSession] Loaded', loadedQuestions.length, 'questions from questionStorage, source:', storedSet.source);
      }
    } catch (error) {
      console.error('[QuestionSession] Failed to read questionStorage:', error);
    }

    // Validate loaded questions
    loadedQuestions = loadedQuestions.filter(q =>
      q &&
      typeof q.question === 'string' &&
      Array.isArray(q.options) &&
      q.options.length === 4 &&
      typeof q.correctIndex === 'number' &&
      q.correctIndex >= 0 &&
      q.correctIndex <= 3
    );

    // Supplement with fallback if not enough
    const requiredCount = (DIFFICULTY[difficultyKey]?.questions || 1) + 5; // required + buffer
    if (loadedQuestions.length < requiredCount) {
      const needed = requiredCount - loadedQuestions.length;
      console.log('[QuestionSession] Need', needed, 'more questions, supplementing with fallback');
      const fallback = getRandomFallbackQuestions(categories, needed);
      loadedQuestions = [...loadedQuestions, ...fallback];
    }

    // Final safety net
    if (loadedQuestions.length === 0) {
      loadedQuestions = getRandomFallbackQuestions(categories, 10);
    }

    // Shuffle to mix LLM and fallback questions
    loadedQuestions = loadedQuestions.sort(() => Math.random() - 0.5);

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

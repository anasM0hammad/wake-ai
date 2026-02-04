import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAlarm } from '../hooks/useAlarm';
import { useSettings } from '../hooks/useSettings';
import { useLLM } from '../hooks/useLLM';
import SwipeToStart from '../components/alarm/SwipeToStart';
import QuestionCard from '../components/alarm/QuestionCard';
import KillSwitchModal from '../components/alarm/KillSwitchModal';
import AlarmSuccess from '../components/alarm/AlarmSuccess';
import AlarmFailure from '../components/alarm/AlarmFailure';
import { getRandomFallbackQuestions } from '../services/llm/fallbackQuestions';
import { DIFFICULTY, MAX_WRONG_ANSWERS, MAX_RING_DURATION_MS } from '../utils/constants';
import { resetAlarmFiring } from '../services/alarm/alarmTimer';

const STATES = {
  RINGING: 'ringing',
  QUESTIONING: 'questioning',
  SUCCESS: 'success',
  FAILURE: 'failure'
};

export default function AlarmRingingPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    alarm,
    activeAlarm,
    startAlarm,
    dismiss,
    answerQuestion
  } = useAlarm();

  const { settings } = useSettings();
  const { generateQuestions, isReady: isLLMReady } = useLLM();

  // State
  const [state, setState] = useState(STATES.RINGING);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [showKillSwitch, setShowKillSwitch] = useState(false);
  const [failureReason, setFailureReason] = useState(null);
  const [sessionStats, setSessionStats] = useState(null);
  const [startTime] = useState(Date.now());

  const timeoutRef = useRef(null);
  const alarmDataRef = useRef(null);

  // Get alarm data from route state, sessionStorage, or current alarm
  const getAlarmData = () => {
    // First try route state
    if (location.state?.alarm) return location.state.alarm;

    // Then try sessionStorage (set by AlarmMonitor)
    const sessionAlarm = sessionStorage.getItem('wakeai_active_alarm');
    if (sessionAlarm) {
      try {
        return JSON.parse(sessionAlarm);
      } catch (e) {
        console.error('[AlarmRingingPage] Failed to parse session alarm:', e);
      }
    }

    // Finally fall back to hook data
    return alarm || activeAlarm;
  };

  const alarmData = getAlarmData();
  const difficulty = alarmData?.difficulty || settings.difficulty || 'EASY';
  const requiredCorrect = DIFFICULTY[difficulty]?.questions || 1;

  // Initialize alarm on mount
  useEffect(() => {
    if (alarmData && !alarmDataRef.current) {
      alarmDataRef.current = alarmData;
      startAlarm(alarmData);
    }
  }, [alarmData, startAlarm]);

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Set up timeout (20 minutes)
  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      handleTimeout();
    }, MAX_RING_DURATION_MS);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Load questions when transitioning to questioning state
  const loadQuestions = useCallback(async (count) => {
    console.log('[AlarmRinging] loadQuestions called, count:', count);
    const categories = settings.selectedCategories || ['math'];
    console.log('[AlarmRinging] Categories:', categories, 'LLM Ready:', isLLMReady);

    // Try to generate with LLM, fallback to pre-written
    let loadedQuestions;
    if (isLLMReady) {
      try {
        loadedQuestions = await generateQuestions(categories, count + 5); // Load extra for wrong answers
        console.log('[AlarmRinging] LLM generated questions:', loadedQuestions?.length || 0);
      } catch (error) {
        console.error('[AlarmRinging] LLM question generation failed:', error);
      }
    }

    if (!loadedQuestions || loadedQuestions.length === 0) {
      console.log('[AlarmRinging] Using fallback questions');
      loadedQuestions = getRandomFallbackQuestions(categories, count + 5);
    }

    console.log('[AlarmRinging] Final questions loaded:', loadedQuestions?.length || 0);
    setQuestions(loadedQuestions);
  }, [settings.selectedCategories, isLLMReady, generateQuestions]);

  // Handle swipe to dismiss
  const handleDismiss = useCallback(async () => {
    console.log('[AlarmRinging] handleDismiss called, loading questions...');
    try {
      await loadQuestions(requiredCorrect);
      console.log('[AlarmRinging] Questions loaded, transitioning to QUESTIONING state');
      setCurrentQuestionIndex(0);
      setCorrectCount(0);
      setWrongCount(0);
      setState(STATES.QUESTIONING);
    } catch (error) {
      console.error('[AlarmRinging] Error in handleDismiss:', error);
      // Still try to proceed with fallback questions
      const fallbackQuestions = getRandomFallbackQuestions(['math'], requiredCorrect + 5);
      setQuestions(fallbackQuestions);
      setCurrentQuestionIndex(0);
      setCorrectCount(0);
      setWrongCount(0);
      setState(STATES.QUESTIONING);
    }
  }, [loadQuestions, requiredCorrect]);

  // Handle answer
  const handleAnswer = useCallback((isCorrect) => {
    answerQuestion(isCorrect);

    if (isCorrect) {
      const newCorrectCount = correctCount + 1;
      setCorrectCount(newCorrectCount);

      // Check if we've reached the required correct answers
      if (newCorrectCount >= requiredCorrect) {
        handleSuccess();
      } else {
        // Move to next question
        setCurrentQuestionIndex(prev => prev + 1);
      }
    } else {
      const newWrongCount = wrongCount + 1;
      setWrongCount(newWrongCount);

      // Check max wrong answers
      if (newWrongCount >= MAX_WRONG_ANSWERS) {
        handleFailure('wrong_answers');
      } else {
        // Move to next question
        setCurrentQuestionIndex(prev => prev + 1);
      }
    }
  }, [correctCount, wrongCount, requiredCorrect, answerQuestion]);

  // Handle success
  const handleSuccess = useCallback(async () => {
    clearTimeout(timeoutRef.current);

    const stats = {
      questionsAnswered: correctCount + wrongCount + 1,
      questionsCorrect: correctCount + 1,
      duration: Date.now() - startTime
    };

    setSessionStats(stats);
    await dismiss('win');
    setState(STATES.SUCCESS);
  }, [correctCount, wrongCount, startTime, dismiss]);

  // Handle failure
  const handleFailure = useCallback(async (reason) => {
    clearTimeout(timeoutRef.current);

    const stats = {
      questionsAnswered: correctCount + wrongCount,
      questionsCorrect: correctCount,
      duration: Date.now() - startTime
    };

    setSessionStats(stats);
    setFailureReason(reason);
    await dismiss('fail');
    setState(STATES.FAILURE);
  }, [correctCount, wrongCount, startTime, dismiss]);

  // Handle timeout
  const handleTimeout = useCallback(() => {
    handleFailure('timeout');
  }, [handleFailure]);

  // Handle kill switch
  const handleKillSwitch = useCallback(async () => {
    clearTimeout(timeoutRef.current);
    await dismiss('kill');
    // Reset alarm firing flag so future alarms can fire
    resetAlarmFiring();
    // Clear session storage
    sessionStorage.removeItem('wakeai_active_alarm');
    navigate('/', { replace: true });
  }, [dismiss, navigate]);

  // Handle close (after success or failure)
  const handleClose = useCallback(() => {
    // Reset alarm firing flag so future alarms can fire
    resetAlarmFiring();
    // Clear session storage
    sessionStorage.removeItem('wakeai_active_alarm');
    navigate('/', { replace: true });
  }, [navigate]);

  // Get current question
  const currentQuestion = questions[currentQuestionIndex];

  // Render based on state
  switch (state) {
    case STATES.RINGING:
      return (
        <>
          <SwipeToStart
            currentTime={currentTime}
            onDismiss={handleDismiss}
            onKillSwitch={() => setShowKillSwitch(true)}
          />
          <KillSwitchModal
            isOpen={showKillSwitch}
            onClose={() => setShowKillSwitch(false)}
            onSuccess={handleKillSwitch}
          />
        </>
      );

    case STATES.QUESTIONING:
      return (
        <>
          <QuestionCard
            question={currentQuestion}
            progress={{
              correct: correctCount,
              required: requiredCorrect,
              wrong: wrongCount
            }}
            onAnswer={handleAnswer}
            onKillSwitch={() => setShowKillSwitch(true)}
          />
          <KillSwitchModal
            isOpen={showKillSwitch}
            onClose={() => setShowKillSwitch(false)}
            onSuccess={handleKillSwitch}
          />
        </>
      );

    case STATES.SUCCESS:
      return (
        <AlarmSuccess
          stats={sessionStats}
          onClose={handleClose}
          isPremium={settings.isPremium}
        />
      );

    case STATES.FAILURE:
      return (
        <AlarmFailure
          reason={failureReason}
          stats={sessionStats}
          onClose={handleClose}
        />
      );

    default:
      return null;
  }
}

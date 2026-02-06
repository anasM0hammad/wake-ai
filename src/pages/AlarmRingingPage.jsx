import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAlarm } from '../hooks/useAlarm';
import { useSettings } from '../hooks/useSettings';
import SwipeToStart from '../components/alarm/SwipeToStart';
import QuestionCard from '../components/alarm/QuestionCard';
import KillSwitchModal from '../components/alarm/KillSwitchModal';
import AlarmSuccess from '../components/alarm/AlarmSuccess';
import AlarmFailure from '../components/alarm/AlarmFailure';
import { getRandomFallbackQuestions } from '../services/llm/fallbackQuestions';
import { DIFFICULTY, MAX_WRONG_ANSWERS, MAX_RING_DURATION_MS } from '../utils/constants';
import { resetAlarmFiring } from '../services/alarm/alarmTimer';
import { getQuestionSet, deleteQuestionSet, getRequiredQuestionCount } from '../services/storage/questionStorage';
import { generateQuestionsForAlarm } from '../services/alarm/alarmManager';
import { getAlarm } from '../services/storage/alarmStorage';

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
  // Refs to track counts for timeout callback (avoids stale closure)
  const correctCountRef = useRef(0);
  const wrongCountRef = useRef(0);

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

  // Load pre-generated questions from storage (NO LLM calls during alarm!)
  const loadQuestions = useCallback(() => {
    console.log('[AlarmRinging] Loading pre-generated questions from storage...');

    // Try to get pre-generated questions from storage
    const questionSet = getQuestionSet();

    if (questionSet && questionSet.questions && questionSet.questions.length > 0) {
      console.log('[AlarmRinging] Using pre-generated questions:', questionSet.questions.length, 'source:', questionSet.source);
      setQuestions(questionSet.questions);
      return questionSet.questions;
    }

    // Fallback: use hardcoded questions (instant, no waiting)
    console.log('[AlarmRinging] No pre-generated questions found, using fallback');
    const categories = settings.selectedCategories || ['math'];
    const count = getRequiredQuestionCount(difficulty);
    const fallbackQuestions = getRandomFallbackQuestions(categories, count);
    setQuestions(fallbackQuestions);
    return fallbackQuestions;
  }, [settings.selectedCategories, difficulty]);

  // Handle swipe to dismiss - loads questions instantly (no waiting!)
  const handleDismiss = useCallback(() => {
    console.log('[AlarmRinging] handleDismiss called, loading pre-generated questions...');

    // Load questions instantly from storage (synchronous)
    loadQuestions();

    console.log('[AlarmRinging] Questions loaded, transitioning to QUESTIONING state');
    setCurrentQuestionIndex(0);
    setCorrectCount(0);
    setWrongCount(0);
    // Reset refs too
    correctCountRef.current = 0;
    wrongCountRef.current = 0;
    setState(STATES.QUESTIONING);
  }, [loadQuestions]);

  // Handle answer
  const handleAnswer = useCallback((isCorrect) => {
    answerQuestion(isCorrect);

    if (isCorrect) {
      const newCorrectCount = correctCount + 1;
      setCorrectCount(newCorrectCount);
      correctCountRef.current = newCorrectCount;

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
      wrongCountRef.current = newWrongCount;

      // Check max wrong answers
      if (newWrongCount >= MAX_WRONG_ANSWERS) {
        handleFailure('wrong_answers');
      } else {
        // Move to next question
        setCurrentQuestionIndex(prev => prev + 1);
      }
    }
  }, [correctCount, wrongCount, requiredCorrect, answerQuestion, handleSuccess, handleFailure]);

  // Handle success
  const handleSuccess = useCallback(async () => {
    clearTimeout(timeoutRef.current);

    // Use refs to get current values (avoids stale closure issues)
    const stats = {
      questionsAnswered: correctCountRef.current + wrongCountRef.current + 1,
      questionsCorrect: correctCountRef.current + 1,
      duration: Date.now() - startTime
    };

    setSessionStats(stats);
    await dismiss('win');
    setState(STATES.SUCCESS);
  }, [startTime, dismiss]);

  // Handle failure
  const handleFailure = useCallback(async (reason) => {
    clearTimeout(timeoutRef.current);

    // Use refs to get current values (avoids stale closure issues with timeout)
    const stats = {
      questionsAnswered: correctCountRef.current + wrongCountRef.current,
      questionsCorrect: correctCountRef.current,
      duration: Date.now() - startTime
    };

    setSessionStats(stats);
    setFailureReason(reason);
    // Pass actual reason to dismiss for proper stats tracking
    await dismiss(reason === 'timeout' ? 'timeout' : 'fail');
    setState(STATES.FAILURE);
  }, [startTime, dismiss]);

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

    // Delete used questions and regenerate fresh ones for next alarm (async, background)
    deleteQuestionSet();
    const currentAlarm = getAlarm();
    if (currentAlarm && currentAlarm.enabled) {
      console.log('[AlarmRinging] Regenerating questions after kill switch...');
      generateQuestionsForAlarm(currentAlarm).catch(e => {
        console.log('[AlarmRinging] Background question regeneration failed:', e);
      });
    }

    navigate('/', { replace: true });
  }, [dismiss, navigate]);

  // Handle close (after success or failure)
  const handleClose = useCallback(() => {
    // Reset alarm firing flag so future alarms can fire
    resetAlarmFiring();
    // Clear session storage
    sessionStorage.removeItem('wakeai_active_alarm');

    // Delete used questions and regenerate fresh ones for next alarm (async, background)
    deleteQuestionSet();
    const currentAlarm = getAlarm();
    if (currentAlarm && currentAlarm.enabled) {
      console.log('[AlarmRinging] Regenerating questions for next alarm...');
      generateQuestionsForAlarm(currentAlarm).catch(e => {
        console.log('[AlarmRinging] Background question regeneration failed:', e);
      });
    }

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

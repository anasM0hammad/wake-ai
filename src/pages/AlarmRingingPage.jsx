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
import { DIFFICULTY, MAX_WRONG_ANSWERS, MAX_ALARM_RING_DURATION_MINUTES } from '../utils/constants';

const STATES = {
  RINGING: 'ringing',
  QUESTIONING: 'questioning',
  SNOOZE_QUESTION: 'snooze_question',
  SUCCESS: 'success',
  FAILURE: 'failure',
  SNOOZED: 'snoozed'
};

export default function AlarmRingingPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    alarm,
    activeAlarm,
    startAlarm,
    snooze,
    dismiss,
    answerQuestion,
    snoozesRemaining
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

  // Get alarm data from route state or current alarm
  const alarmData = location.state?.alarm || alarm || activeAlarm;
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

  // Set up timeout (15 minutes)
  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      handleTimeout();
    }, MAX_ALARM_RING_DURATION_MINUTES * 60 * 1000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Load questions when transitioning to questioning state
  const loadQuestions = useCallback(async (count) => {
    const categories = settings.selectedCategories || ['math'];

    // Try to generate with LLM, fallback to pre-written
    let loadedQuestions;
    if (isLLMReady) {
      loadedQuestions = await generateQuestions(categories, count + 5); // Load extra for wrong answers
    }

    if (!loadedQuestions || loadedQuestions.length === 0) {
      loadedQuestions = getRandomFallbackQuestions(categories, count + 5);
    }

    setQuestions(loadedQuestions);
  }, [settings.selectedCategories, isLLMReady, generateQuestions]);

  // Handle swipe to dismiss
  const handleDismiss = useCallback(async () => {
    await loadQuestions(requiredCorrect);
    setCurrentQuestionIndex(0);
    setCorrectCount(0);
    setWrongCount(0);
    setState(STATES.QUESTIONING);
  }, [loadQuestions, requiredCorrect]);

  // Handle swipe to snooze
  const handleSnoozeSwipe = useCallback(async () => {
    await loadQuestions(1);
    setCurrentQuestionIndex(0);
    setCorrectCount(0);
    setWrongCount(0);
    setState(STATES.SNOOZE_QUESTION);
  }, [loadQuestions]);

  // Handle answer
  const handleAnswer = useCallback((isCorrect) => {
    answerQuestion(isCorrect);

    if (isCorrect) {
      const newCorrectCount = correctCount + 1;
      setCorrectCount(newCorrectCount);

      // Check if we've reached the required correct answers
      if (state === STATES.SNOOZE_QUESTION) {
        // Snooze mode - one correct answer triggers snooze
        handleSnoozeConfirm();
      } else if (newCorrectCount >= requiredCorrect) {
        // Regular mode - reached target
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
  }, [correctCount, wrongCount, requiredCorrect, state, answerQuestion]);

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

  // Handle snooze confirm
  const handleSnoozeConfirm = useCallback(async () => {
    clearTimeout(timeoutRef.current);
    await snooze();
    setState(STATES.SNOOZED);

    // Navigate back to home after brief delay
    setTimeout(() => {
      navigate('/', { replace: true });
    }, 1500);
  }, [snooze, navigate]);

  // Handle kill switch
  const handleKillSwitch = useCallback(async () => {
    clearTimeout(timeoutRef.current);
    await dismiss('kill');
    navigate('/', { replace: true });
  }, [dismiss, navigate]);

  // Handle close (after success or failure)
  const handleClose = useCallback(() => {
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
            snoozesRemaining={snoozesRemaining}
            onDismiss={handleDismiss}
            onSnooze={handleSnoozeSwipe}
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
    case STATES.SNOOZE_QUESTION:
      return (
        <>
          <QuestionCard
            question={currentQuestion}
            progress={{
              correct: correctCount,
              required: state === STATES.SNOOZE_QUESTION ? 1 : requiredCorrect,
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

    case STATES.SNOOZED:
      return (
        <div className="fixed inset-0 bg-gradient-to-b from-blue-900 to-indigo-900 flex flex-col items-center justify-center px-6">
          <div className="w-24 h-24 rounded-full bg-blue-500/20 flex items-center justify-center mb-6">
            <svg className="w-12 h-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Snoozed</h1>
          <p className="text-blue-200">See you in 5 minutes...</p>
        </div>
      );

    default:
      return null;
  }
}

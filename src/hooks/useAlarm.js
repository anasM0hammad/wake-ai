import { useState, useEffect, useCallback } from 'react';
import { getAlarm } from '../services/storage/alarmStorage';
import {
  createAlarm as createAlarmService,
  updateAlarm as updateAlarmService,
  deleteAlarm as deleteAlarmService,
  toggleAlarm as toggleAlarmService,
  snoozeCurrentAlarm,
  getRemainingSnoozes,
  startAlarmSession,
  endAlarmSession,
  updateSessionProgress,
  getCurrentSession,
  isSessionActive
} from '../services/alarm/alarmManager';
import {
  setupNotificationChannel,
  setupNotificationListeners,
  setOnAlarmTrigger,
  scheduleAlarm
} from '../services/alarm/alarmScheduler';
import {
  playAlarmWithVibration,
  stopAlarmWithVibration
} from '../services/alarm/audioPlayer';
import { recordWin, recordKill, recordFail } from '../services/storage/statsStorage';
import { getSettings } from '../services/storage/settingsStorage';

export function useAlarm() {
  const [alarm, setAlarm] = useState(null);
  const [activeAlarm, setActiveAlarmState] = useState(null);
  const [session, setSession] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize alarm system
  useEffect(() => {
    const init = async () => {
      await setupNotificationChannel();
      await setupNotificationListeners();
      setAlarm(getAlarm());
      setIsInitialized(true);
    };

    init();
  }, []);

  // Create a new alarm
  const createAlarm = useCallback(async (time, difficulty = null) => {
    const newAlarm = await createAlarmService(time, difficulty);
    setAlarm(newAlarm);
    return newAlarm;
  }, []);

  // Update existing alarm
  const updateAlarm = useCallback(async (id, updates) => {
    const updated = await updateAlarmService(id, updates);
    if (updated) {
      setAlarm(updated);
    }
    return updated;
  }, []);

  // Delete alarm
  const deleteAlarm = useCallback(async () => {
    const currentAlarm = getAlarm();
    if (currentAlarm) {
      await deleteAlarmService(currentAlarm.id);
      setAlarm(null);
    }
  }, []);

  // Toggle alarm enabled/disabled
  const toggleAlarm = useCallback(async () => {
    const currentAlarm = getAlarm();
    if (!currentAlarm) return null;

    const updated = await toggleAlarmService(currentAlarm.id, !currentAlarm.enabled);
    if (updated) {
      setAlarm(updated);
    }
    return updated?.enabled ?? false;
  }, []);

  // Start alarm (when it fires)
  const startAlarm = useCallback(async (alarmData) => {
    const alarmToUse = alarmData || getAlarm();
    if (!alarmToUse) return null;

    const settings = getSettings();
    const newSession = startAlarmSession(alarmToUse);
    setActiveAlarmState(alarmToUse);
    setSession(newSession);

    // Start audio and vibration
    try {
      await playAlarmWithVibration(settings.alarmTone);
    } catch (error) {
      console.error('Failed to play alarm:', error);
    }

    return newSession;
  }, []);

  // Snooze current alarm
  const snooze = useCallback(async () => {
    stopAlarmWithVibration();

    const result = await snoozeCurrentAlarm();
    if (result.success) {
      setSession(getCurrentSession());
      setActiveAlarmState(null);
    }

    return result;
  }, []);

  // Dismiss alarm with result
  const dismiss = useCallback(async (result = 'win') => {
    stopAlarmWithVibration();

    const sessionSummary = endAlarmSession(result);
    setSession(null);
    setActiveAlarmState(null);

    // Record stats
    if (sessionSummary) {
      const { questionsAnswered, questionsCorrect } = sessionSummary;

      switch (result) {
        case 'win':
          recordWin(questionsAnswered, questionsCorrect);
          break;
        case 'kill':
          recordKill();
          break;
        case 'fail':
        case 'timeout':
          recordFail(questionsAnswered, questionsCorrect);
          break;
      }
    }

    // Reschedule alarm if it's recurring
    const currentAlarm = getAlarm();
    if (currentAlarm?.enabled && currentAlarm?.days?.length > 0) {
      await scheduleAlarm(currentAlarm);
    }

    return sessionSummary;
  }, []);

  // Answer question during alarm
  const answerQuestion = useCallback((correct) => {
    const updated = updateSessionProgress(correct);
    setSession(updated);
    return updated;
  }, []);

  // Get remaining snoozes
  const snoozesRemaining = getRemainingSnoozes();

  // Check if alarm is currently ringing
  const isRinging = isSessionActive() && getCurrentSession()?.status === 'ringing';

  // Check if alarm is snoozed
  const isSnoozed = isSessionActive() && getCurrentSession()?.status === 'snoozed';

  // Set callback for when alarm triggers
  const onAlarmTrigger = useCallback((callback) => {
    setOnAlarmTrigger((alarmData) => {
      startAlarm(alarmData);
      callback?.(alarmData);
    });
  }, [startAlarm]);

  return {
    // Alarm data
    alarm,
    activeAlarm,
    session,
    isAlarmSet: alarm !== null,
    isInitialized,

    // Alarm CRUD
    createAlarm,
    updateAlarm,
    deleteAlarm,
    toggleAlarm,

    // Alarm control
    startAlarm,
    snooze,
    dismiss,
    answerQuestion,

    // State
    snoozesRemaining,
    isRinging,
    isSnoozed,

    // Events
    onAlarmTrigger
  };
}

export default useAlarm;

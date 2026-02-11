import { useState, useEffect, useCallback } from 'react';
import { getAlarm } from '../services/storage/alarmStorage';
import {
  createAlarm as createAlarmService,
  updateAlarm as updateAlarmService,
  deleteAlarm as deleteAlarmService,
  toggleAlarm as toggleAlarmService,
  startAlarmSession,
  endAlarmSession,
  updateSessionProgress,
  getCurrentSession,
  isSessionActive
} from '../services/alarm/alarmManager';
import {
  setupNotificationChannel,
  setupNotificationListeners,
  setOnAlarmTrigger
} from '../services/alarm/alarmScheduler';
import {
  playAlarm,
  playAlarmWithVibration,
  stopAlarmWithVibration
} from '../services/alarm/audioPlayer';
import { isNativeAlarmAvailable, startNativeRinging, isNativeRinging, dismissNativeAlarm } from '../services/alarm/nativeAlarm';
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

    // On Android: ALWAYS start the native AlarmService from JS.
    // This ensures STREAM_ALARM audio at MAX volume, full-screen intent over
    // lock screen, and vibration — regardless of which trigger path fired.
    // The native service may already be running (if AlarmManager fired it first);
    // startForegroundService with the same intent is a safe no-op in that case.
    //
    // JS audio (Howler.js / Web Audio on STREAM_MUSIC) is ONLY used on web
    // or as a last-resort fallback if native start fails.
    let nativeHandlingAudio = false;
    if (isNativeAlarmAvailable()) {
      try {
        // First check if native is already ringing (AlarmManager path fired first)
        const ringingResult = await isNativeRinging();
        if (ringingResult.ringing) {
          nativeHandlingAudio = true;
        } else {
          // Native not ringing yet — start it directly from JS
          await startNativeRinging();
          nativeHandlingAudio = true;
        }
      } catch (err) {
        console.error('Failed to start native ringing:', err);
        // Fall through to JS audio as backup
      }
    }

    if (!nativeHandlingAudio) {
      try {
        if (settings.vibrationEnabled) {
          await playAlarmWithVibration(settings.alarmTone);
        } else {
          await playAlarm(settings.alarmTone);
        }
      } catch (error) {
        console.error('Failed to play alarm:', error);
      }
    }

    return newSession;
  }, []);

  // Dismiss alarm with result
  const dismiss = useCallback(async (result = 'win') => {
    // Stop native alarm service (audio + vibration) on Android
    if (isNativeAlarmAvailable()) {
      await dismissNativeAlarm().catch(err =>
        console.warn('Native dismiss failed:', err)
      );
    }
    // Stop JS audio + vibration (no-op if not playing)
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

    // Disable alarm after it has fired so user must manually re-enable it.
    try {
      const currentAlarm = getAlarm();
      if (currentAlarm && currentAlarm.enabled) {
        await toggleAlarmService(currentAlarm.id, false);
        setAlarm(getAlarm());
      }
    } catch (error) {
      console.error('Failed to disable alarm after firing:', error);
    }

    return sessionSummary;
  }, []);

  // Answer question during alarm
  const answerQuestion = useCallback((correct) => {
    const updated = updateSessionProgress(correct);
    setSession(updated);
    return updated;
  }, []);

  // Check if alarm is currently ringing
  const isRinging = isSessionActive() && getCurrentSession()?.status === 'ringing';

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
    dismiss,
    answerQuestion,

    // State
    isRinging,

    // Events
    onAlarmTrigger
  };
}

export default useAlarm;

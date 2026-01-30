import { useState, useEffect, useCallback } from 'react';
import {
  getAlarm,
  saveAlarm as saveStoredAlarm,
  deleteAlarm as deleteStoredAlarm,
  toggleAlarm as toggleStoredAlarm
} from '../services/storage/alarmStorage';

export function useAlarm() {
  const [alarm, setAlarm] = useState(null);

  useEffect(() => {
    setAlarm(getAlarm());
  }, []);

  const saveAlarm = useCallback((time, difficulty) => {
    const existingAlarm = getAlarm();
    const alarmData = {
      id: existingAlarm?.id || crypto.randomUUID(),
      time,
      difficulty,
      enabled: true,
      createdAt: existingAlarm?.createdAt || Date.now()
    };
    saveStoredAlarm(alarmData);
    setAlarm(alarmData);
    return alarmData;
  }, []);

  const deleteAlarm = useCallback(() => {
    deleteStoredAlarm();
    setAlarm(null);
  }, []);

  const toggleAlarm = useCallback(() => {
    const newEnabled = toggleStoredAlarm();
    setAlarm(getAlarm());
    return newEnabled;
  }, []);

  const isAlarmSet = alarm !== null;

  return {
    alarm,
    saveAlarm,
    deleteAlarm,
    toggleAlarm,
    isAlarmSet
  };
}

export default useAlarm;

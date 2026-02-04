import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { startAlarmMonitor, stopAlarmMonitor } from '../services/alarm/alarmTimer';

/**
 * Invisible component that monitors for alarm time and navigates to ringing page.
 * Must be rendered inside the Router to use useNavigate.
 */
const AlarmMonitor = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAlarmFire = (alarm) => {
      console.log('[AlarmMonitor] ALARM FIRED - navigating to ringing page');

      // Store alarm in sessionStorage for the ringing page to read
      sessionStorage.setItem('wakeai_active_alarm', JSON.stringify(alarm));

      // Navigate to alarm ringing page
      navigate('/alarm-ringing', { replace: true });
    };

    startAlarmMonitor(handleAlarmFire);

    return () => {
      stopAlarmMonitor();
    };
  }, [navigate]);

  // This component renders nothing - it just monitors
  return null;
};

export default AlarmMonitor;

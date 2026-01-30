import { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Home, Onboarding, AlarmRingingPage, Settings, Dashboard } from './pages';
import { isOnboardingComplete } from './services/storage/settingsStorage';
import { getSettings } from './services/storage/settingsStorage';
import { initializeModel } from './services/llm/webllm';
import { initializeBackgroundService, cleanupBackgroundService } from './services/alarm/backgroundService';
import { checkAndPreloadQuestions } from './services/llm/preloadManager';
import { setupNotificationChannel, setOnAlarmTrigger } from './services/alarm/alarmScheduler';

// Inner component that has access to navigation
function AppContent() {
  const navigate = useNavigate();
  const initRef = useRef(false);

  useEffect(() => {
    // Prevent double initialization in strict mode
    if (initRef.current) return;
    initRef.current = true;

    initializeApp();

    return () => {
      cleanupBackgroundService();
    };
  }, []);

  const initializeApp = async () => {
    console.log('Initializing WakeAI app...');

    // Set up notification channel for alarms
    await setupNotificationChannel();

    // Set up notification listeners
    setupNotificationListeners();

    // Set up app lifecycle listeners
    setupAppLifecycleListeners();

    // Initialize background service (includes preload checking)
    await initializeBackgroundService();

    // Initialize LLM if model was previously downloaded
    const settings = getSettings();
    if (settings.modelDownloaded) {
      console.log('Model was downloaded, initializing...');
      initializeModel('small').catch(err => {
        console.warn('Failed to initialize model:', err);
      });
    }

    // Initial preload check
    await checkAndPreloadQuestions();

    console.log('WakeAI app initialized');
  };

  const setupNotificationListeners = () => {
    // Handle notification received while app is open
    LocalNotifications.addListener('localNotificationReceived', (notification) => {
      console.log('Notification received:', notification);

      const extra = notification.extra;
      if (extra?.type === 'alarm' || extra?.type === 'snooze') {
        handleAlarmTrigger(extra);
      }
    });

    // Handle notification tap (app opened from notification)
    LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
      console.log('Notification action performed:', action);

      const extra = action.notification.extra;
      if (extra?.type === 'alarm' || extra?.type === 'snooze') {
        handleAlarmTrigger(extra);
      }
    });

    // Set up callback for alarm trigger from scheduler
    setOnAlarmTrigger((alarmData) => {
      handleAlarmTrigger(alarmData);
    });
  };

  const handleAlarmTrigger = (alarmData) => {
    console.log('Alarm triggered:', alarmData);

    // Navigate to alarm ringing page
    navigate('/alarm-ringing', {
      replace: true,
      state: { alarm: alarmData }
    });
  };

  const setupAppLifecycleListeners = () => {
    // Handle app state changes (foreground/background)
    CapacitorApp.addListener('appStateChange', async ({ isActive }) => {
      if (isActive) {
        console.log('App came to foreground');

        // Check onboarding status
        if (!isOnboardingComplete()) {
          navigate('/onboarding', { replace: true });
          return;
        }

        // Preload check on resume
        await checkAndPreloadQuestions();
      }
    });

    // Handle back button (Android)
    CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        // Don't exit from alarm ringing page
        if (window.location.pathname === '/alarm-ringing') {
          return;
        }
        CapacitorApp.exitApp();
      }
    });

    // Handle app URL open (deep links)
    CapacitorApp.addListener('appUrlOpen', async (event) => {
      console.log('App opened via URL:', event.url);

      // Handle deep link routing
      const url = new URL(event.url);
      if (url.pathname === '/alarm') {
        navigate('/alarm-ringing', { replace: true });
      }
    });
  };

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/alarm-ringing" element={<AlarmRingingPage />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;

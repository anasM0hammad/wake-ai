/*
 * WakeAI - AI-Powered Alarm App
 *
 * TESTING CHECKLIST:
 *
 * [ ] Onboarding Flow
 *     [ ] Welcome screen displays correctly
 *     [ ] Notification permission request works
 *     [ ] Battery optimization instructions show for device manufacturer
 *     [ ] Kill switch code can be set (4 digits)
 *     [ ] Model auto-downloads based on device capabilities
 *     [ ] Onboarding only shows once (persisted)
 *
 * [ ] Home Screen
 *     [ ] Empty state shows when no alarm set
 *     [ ] Add alarm button opens form
 *     [ ] Time picker scrolls and selects correctly
 *     [ ] Single alarm only (no add button when alarm exists)
 *     [ ] Alarm can be toggled on/off
 *     [ ] Delete alarm button works
 *     [ ] Next alarm time displays correctly
 *
 * [ ] Alarm Ringing
 *     [ ] Alarm fires at scheduled time
 *     [ ] Audio plays and loops
 *     [ ] Vibration works (if enabled)
 *     [ ] Swipe right to dismiss works
 *     [ ] Questions display correctly
 *     [ ] Answer validation works (correct/incorrect feedback)
 *     [ ] Kill switch modal opens and validates code
 *     [ ] Success screen shows on completion
 *     [ ] Failure screen shows on 5 wrong answers
 *     [ ] Failure screen shows on 20 min timeout
 *     [ ] Stats are recorded after alarm ends
 *     [ ] Ad placeholder shows for free users on success
 *
 * [ ] Settings
 *     [ ] Difficulty modes can be changed (Easy free, Medium/Hard premium)
 *     [ ] Question categories toggle (free: 1 only, premium: multiple)
 *     [ ] Alarm tone selection (free: gentle only, others premium)
 *     [ ] Kill code can be changed
 *     [ ] Vibration can be toggled
 *     [ ] Reset settings works
 *
 * [ ] Dashboard (Premium Only)
 *     [ ] Non-premium users see upgrade prompt (stats still recorded)
 *     [ ] Premium users see full stats
 *     [ ] Success rate displays correctly
 *     [ ] Streaks are tracked properly
 *
 * [ ] LLM / Questions
 *     [ ] Model auto-selects based on RAM (>=6GB: large, <6GB: small)
 *     [ ] Questions generate from LLM
 *     [ ] Fallback questions work when LLM unavailable
 *     [ ] Question preloading works 30 min before alarm
 *     [ ] Cached questions are used when available
 *
 * [ ] Error Handling
 *     [ ] App error boundary catches crashes
 *     [ ] Alarm error boundary prevents stuck state
 *     [ ] Network errors handled gracefully
 *
 * [ ] Android Specific
 *     [ ] Notification channel created
 *     [ ] Alarm notifications fire in background
 *     [ ] Back button behavior correct
 *     [ ] Safe area insets work on notched devices
 *     [ ] Dark mode respects system preference
 */

import { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';
import { Home, Onboarding, AlarmRingingPage, Settings, Dashboard } from './pages';
import { ErrorBoundary, AlarmErrorBoundary } from './components/common';
import AlarmMonitor from './components/AlarmMonitor';
import { isOnboardingComplete } from './services/storage/settingsStorage';
import { getSettings } from './services/storage/settingsStorage';
import { initializeModel } from './services/llm/webllm';
import { initializeBackgroundService, cleanupBackgroundService } from './services/alarm/backgroundService';
import { checkAndPreloadQuestions } from './services/llm/preloadManager';
import { setupNotificationChannel, setOnAlarmTrigger, removeNotificationListeners } from './services/alarm/alarmScheduler';

// Inner component that has access to navigation
function AppContent() {
  const navigate = useNavigate();
  const initRef = useRef(false);

  useEffect(() => {
    // Prevent double initialization in strict mode
    if (initRef.current) return;
    initRef.current = true;

    // eslint-disable-next-line react-hooks/immutability
    initializeApp();

    return () => {
      cleanupBackgroundService();
      removeNotificationListeners();
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
      initializeModel().catch(err => {
        console.warn('Failed to initialize model:', err);
      });
    }

    // Initial preload check
    await checkAndPreloadQuestions();

    console.log('WakeAI app initialized');
  };

  const setupNotificationListeners = () => {
    // Set up callback for alarm trigger from scheduler.
    // Notification listeners are registered once in alarmScheduler.js
    // (via setupNotificationListeners) — do NOT add duplicate listeners here.
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
    <>
      {/* JavaScript-based alarm timer that works on web and Android */}
      <AlarmMonitor />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route
        path="/alarm-ringing"
        element={
          <AlarmErrorBoundary
            onDismiss={() => navigate('/', { replace: true })}
            onCriticalError={(error) => {
              console.error('Critical alarm error:', error);
              // Auto-navigate home on critical error
              setTimeout(() => navigate('/', { replace: true }), 3000);
            }}
          >
            <AlarmRingingPage />
          </AlarmErrorBoundary>
        }
      />
      <Route path="/settings" element={<Settings />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary
      message="Something went wrong with the app. Please try again."
      onError={(error, errorInfo) => {
        console.error('App crashed:', error, errorInfo);
      }}
    >
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;

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
 *     [ ] Interstitial ad shows after alarm success
 *
 * [ ] Settings
 *     [ ] All difficulty modes freely selectable
 *     [ ] Question categories toggle (multiple allowed)
 *     [ ] All alarm tones freely selectable
 *     [ ] Kill code can be changed
 *     [ ] Vibration can be toggled
 *     [ ] Reset settings works
 *     [ ] Banner ad displays at bottom
 *
 * [ ] Dashboard
 *     [ ] Rewarded video gate shows before stats
 *     [ ] After watching ad, full stats display
 *     [ ] Success rate displays correctly
 *     [ ] Streaks are tracked properly
 *     [ ] Banner ad displays at bottom
 *
 * [ ] Ads
 *     [ ] AdMob initializes on app start
 *     [ ] Banner ads show on Home, Settings, Dashboard
 *     [ ] Interstitial ad fires after alarm success
 *     [ ] Rewarded video gates Dashboard stats
 *     [ ] Ads degrade gracefully on web (no crashes)
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
import { initializeBackgroundService, cleanupBackgroundService } from './services/alarm/backgroundService';
import { setupNotificationChannel, setOnAlarmTrigger, removeNotificationListeners } from './services/alarm/alarmScheduler';
import { initializeQuestionPool } from './services/llm/questionPool';
import { initializeModel, unloadModel } from './services/llm/webllm';
import { initializeAds } from './services/ad';
import { checkLaunchIntent, addAlarmFiredListener } from './services/alarm/nativeAlarm';

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
      // NOTE: Do NOT unload model here. React StrictMode runs cleanup on
      // simulated unmount, which would kill the model mid-load. The initRef
      // guard then prevents re-initialization on remount.
      // Model lifecycle is managed solely by the foreground/background listener.
    };
  }, []);

  const initializeApp = async () => {
    console.log('Initializing WakeAI app...');

    // ── CRITICAL: Alarm detection FIRST ──────────────────────────────
    // These must run before anything else so the user sees the ringing
    // screen immediately on cold/warm start, not the home page.

    // 1. Register native alarm listener (warm-start events from MainActivity)
    setupNativeAlarmListener();

    // 2. Check if launched by alarm full-screen intent (cold start).
    //    MUST be awaited — without await, the home page renders first and
    //    the navigation to /alarm-ringing happens too late or not at all.
    await checkNativeAlarmLaunch();

    // 3. Set up LocalNotification trigger callback
    setupNotificationListeners();

    // ── Remaining init (non-alarm-critical) ──────────────────────────

    // Start model loading — fire-and-forget so it runs in parallel
    console.log('Starting model load...');
    initializeModel().catch(err => {
      console.warn('Model load failed:', err);
    });

    // Initialize AdMob SDK
    await initializeAds();

    // Set up notification channel for alarms
    await setupNotificationChannel();

    // Set up app lifecycle listeners
    setupAppLifecycleListeners();

    // Initialize background service (includes preload checking)
    await initializeBackgroundService();

    // Initialize question pool (loads model and generates questions in phases)
    console.log('Starting question pool initialization...');
    initializeQuestionPool().catch(err => {
      console.warn('Failed to initialize question pool:', err);
    });

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

  /**
   * Listen for native alarm events (warm start — app already in memory).
   * When AlarmReceiver or ring() launches the activity, onNewIntent fires,
   * and MainActivity fires this JS event via the plugin.
   *
   * Guard against duplicate navigation: AlarmMonitor (JS timer) may have
   * already navigated to /alarm-ringing before this event arrives.
   */
  const setupNativeAlarmListener = () => {
    addAlarmFiredListener((data) => {
      console.log('[App] Native alarm fired event:', data);
      if (window.location.pathname !== '/alarm-ringing') {
        navigate('/alarm-ringing', { replace: true });
      }
    });
  };

  /**
   * Check if the app was cold-started by an alarm full-screen intent.
   * On cold start the bridge isn't ready when the intent arrives, so
   * MainActivity sets a flag that we poll here.
   */
  const checkNativeAlarmLaunch = async () => {
    try {
      const { alarmFired } = await checkLaunchIntent();
      if (alarmFired) {
        console.log('[App] App was launched by alarm — navigating to ringing');
        navigate('/alarm-ringing', { replace: true });
      }
    } catch (err) {
      console.warn('[App] checkLaunchIntent failed (expected on web):', err);
    }
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

        // Reload model when app comes to foreground
        initializeModel().catch(err => {
          console.warn('Model reload on foreground failed:', err);
        });
      } else {
        console.log('App went to background — unloading model to free memory');
        unloadModel().catch(err => {
          console.warn('Model unload on background failed:', err);
        });
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

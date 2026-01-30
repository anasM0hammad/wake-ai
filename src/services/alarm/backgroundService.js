/**
 * Background Service for WakeAI
 *
 * Note on Android Background Execution:
 * - Android severely limits background execution to preserve battery
 * - Background tasks may be delayed, batched, or skipped entirely
 * - Apps targeting Android 12+ face additional restrictions
 *
 * Our approach:
 * - Question preloading is a best-effort enhancement, not critical path
 * - The 30-minute preload window is intentionally generous
 * - Fallback questions ensure alarms ALWAYS work, even without preload
 * - Primary preloading happens when app is in foreground
 *
 * For production, consider:
 * - Using WorkManager for more reliable background tasks
 * - Implementing a Foreground Service for alarm reliability
 * - Native Android alarm scheduling via AlarmManager
 */

import { App } from '@capacitor/app';
import { checkAndPreloadQuestions } from '../llm/preloadManager';

let foregroundCheckInterval = null;
const FOREGROUND_CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Initialize background services and listeners
 */
export async function initializeBackgroundService() {
  // Set up app state listeners
  setupAppStateListeners();

  // Start foreground checking
  startForegroundChecks();

  // Initial check
  await checkAndPreloadQuestions();

  return true;
}

/**
 * Set up listeners for app lifecycle events
 */
function setupAppStateListeners() {
  // Listen for app state changes
  App.addListener('appStateChange', async ({ isActive }) => {
    if (isActive) {
      // App came to foreground
      console.log('App resumed - checking preload');
      await onAppResume();
    } else {
      // App went to background
      console.log('App backgrounded');
      onAppBackground();
    }
  });

  // Listen for app resume from URL (deep links, notifications)
  App.addListener('appUrlOpen', async (event) => {
    console.log('App opened via URL:', event.url);
    await onAppResume();
  });
}

/**
 * Called when app comes to foreground
 */
async function onAppResume() {
  // Resume foreground checks
  startForegroundChecks();

  // Immediate preload check
  try {
    const result = await checkAndPreloadQuestions();
    console.log('Resume preload check:', result);
  } catch (error) {
    console.error('Resume preload check failed:', error);
  }
}

/**
 * Called when app goes to background
 */
function onAppBackground() {
  // Stop foreground checks to save battery
  stopForegroundChecks();
}

/**
 * Start periodic foreground checks
 */
export function startForegroundChecks() {
  if (foregroundCheckInterval) {
    return; // Already running
  }

  foregroundCheckInterval = setInterval(async () => {
    try {
      const result = await checkAndPreloadQuestions();
      if (!result.skipped) {
        console.log('Periodic preload check:', result);
      }
    } catch (error) {
      console.error('Periodic preload check failed:', error);
    }
  }, FOREGROUND_CHECK_INTERVAL_MS);

  console.log('Started foreground preload checks');
}

/**
 * Stop periodic foreground checks
 */
export function stopForegroundChecks() {
  if (foregroundCheckInterval) {
    clearInterval(foregroundCheckInterval);
    foregroundCheckInterval = null;
    console.log('Stopped foreground preload checks');
  }
}

/**
 * Check if background service is active
 */
export function isBackgroundServiceActive() {
  return foregroundCheckInterval !== null;
}

/**
 * Register for background execution (best-effort)
 *
 * Note: This requires native plugin support and may not work on all devices.
 * The @capacitor/background-runner plugin requires Capacitor 5+ and has
 * significant limitations on Android.
 *
 * For reliable alarm functionality:
 * 1. Use native AlarmManager (requires native code)
 * 2. Use Foreground Service (requires native code)
 * 3. Rely on local notifications (current approach)
 */
export async function registerBackgroundTask() {
  // Background execution in web/hybrid apps is fundamentally limited
  // The local notification system handles alarm scheduling
  // Preloading is opportunistic and enhances UX but isn't required

  console.log('Background task registration: Using foreground-only preloading');
  console.log('Alarms use local notifications which work independently');

  return {
    registered: false,
    reason: 'Using local notifications for alarms, foreground-only preloading',
    fallbackAvailable: true
  };
}

/**
 * Cleanup function for unmounting
 */
export function cleanupBackgroundService() {
  stopForegroundChecks();
  App.removeAllListeners();
}

export default {
  initializeBackgroundService,
  startForegroundChecks,
  stopForegroundChecks,
  isBackgroundServiceActive,
  registerBackgroundTask,
  cleanupBackgroundService
};

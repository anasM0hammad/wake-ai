/**
 * Background Service for WakeAI
 *
 * Note on Android Background Execution:
 * - Android severely limits background execution to preserve battery
 * - Background tasks may be delayed, batched, or skipped entirely
 * - Apps targeting Android 12+ face additional restrictions
 *
 * Our approach:
 * - Questions are mapped to alarms at creation time (synchronous from pool)
 * - The question pool is pre-filled on app start (fallback + LLM when ready)
 * - Model lifecycle (load/unload) is managed by App.jsx on foreground/background
 * - Fallback questions ensure alarms ALWAYS work, even without LLM
 *
 * For production, consider:
 * - Using WorkManager for more reliable background tasks
 * - Implementing a Foreground Service for alarm reliability
 * - Native Android alarm scheduling via AlarmManager
 */

import { App } from '@capacitor/app';

// Track listener handles for proper cleanup (avoid removing unrelated listeners)
let appStateChangeListener = null;
let appUrlOpenListener = null;

/**
 * Initialize background services and listeners
 */
export async function initializeBackgroundService() {
  // Set up app state listeners
  await setupAppStateListeners();

  console.log('[BackgroundService] Initialized');
  return true;
}

/**
 * Set up listeners for app lifecycle events
 */
async function setupAppStateListeners() {
  // Listen for app state changes
  appStateChangeListener = await App.addListener('appStateChange', async ({ isActive }) => {
    if (isActive) {
      console.log('[BackgroundService] App resumed');
    } else {
      console.log('[BackgroundService] App backgrounded');
    }
  });

  // Listen for app resume from URL (deep links, notifications)
  appUrlOpenListener = await App.addListener('appUrlOpen', async (event) => {
    console.log('[BackgroundService] App opened via URL:', event.url);
  });
}

/**
 * Register for background execution (best-effort)
 */
export async function registerBackgroundTask() {
  console.log('Background task registration: Using foreground-only approach');
  console.log('Alarms use local notifications which work independently');

  return {
    registered: false,
    reason: 'Using local notifications for alarms, foreground-only model loading',
    fallbackAvailable: true
  };
}

/**
 * Cleanup function for unmounting
 * Only removes listeners registered by this service (not ALL app listeners)
 */
export async function cleanupBackgroundService() {
  if (appStateChangeListener) {
    await appStateChangeListener.remove();
    appStateChangeListener = null;
  }
  if (appUrlOpenListener) {
    await appUrlOpenListener.remove();
    appUrlOpenListener = null;
  }
}

export default {
  initializeBackgroundService,
  registerBackgroundTask,
  cleanupBackgroundService
};

import { LocalNotifications } from '@capacitor/local-notifications';
import { Device } from '@capacitor/device';

// Notification Permissions

export async function checkNotificationPermission() {
  try {
    const result = await LocalNotifications.checkPermissions();
    return result.display; // 'granted' | 'denied' | 'prompt'
  } catch (error) {
    console.error('Failed to check notification permission:', error);
    return 'prompt';
  }
}

export async function requestNotificationPermission() {
  try {
    const result = await LocalNotifications.requestPermissions();
    return result.display;
  } catch (error) {
    console.error('Failed to request notification permission:', error);
    return 'denied';
  }
}

export async function hasRequiredPermissions() {
  const notificationPerm = await checkNotificationPermission();
  return notificationPerm === 'granted';
}

// Battery Optimization
// Note: Full implementation requires native Android code
// These functions provide the interface and fallback behavior

export async function isBatteryOptimizationEnabled() {
  try {
    const info = await Device.getInfo();

    if (info.platform !== 'android') {
      // Battery optimization is Android-specific
      return false;
    }

    // In a full implementation, this would call native Android code:
    // PowerManager.isIgnoringBatteryOptimizations()
    // For now, return a safe default that prompts the user
    return true;
  } catch (error) {
    console.error('Failed to check battery optimization:', error);
    return true; // Assume enabled, prompting user to check
  }
}

export async function requestDisableBatteryOptimization() {
  try {
    const info = await Device.getInfo();

    if (info.platform !== 'android') {
      return { success: true, message: 'Not required on this platform' };
    }

    // In a full implementation, this would open:
    // Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS)
    // For now, return instructions for manual setup
    return {
      success: false,
      message: 'Please manually disable battery optimization in settings',
      requiresManualAction: true
    };
  } catch (error) {
    console.error('Failed to request battery optimization disable:', error);
    return { success: false, message: error.message };
  }
}

export function getBatteryOptimizationInstructions(manufacturer) {
  const normalizedManufacturer = (manufacturer || '').toLowerCase();

  const instructions = {
    samsung: {
      title: 'Samsung Battery Optimization',
      steps: [
        'Open Settings',
        'Go to "Apps" or "Applications"',
        'Find and tap "WakeAI"',
        'Tap "Battery"',
        'Select "Unrestricted" or disable "Put app to sleep"',
        'Also check: Settings > Battery > Background usage limits'
      ]
    },
    xiaomi: {
      title: 'Xiaomi/MIUI Battery Optimization',
      steps: [
        'Open Settings',
        'Go to "Apps" > "Manage apps"',
        'Find and tap "WakeAI"',
        'Tap "Battery saver"',
        'Select "No restrictions"',
        'Also enable "Autostart" in the same menu'
      ]
    },
    huawei: {
      title: 'Huawei/EMUI Battery Optimization',
      steps: [
        'Open Settings',
        'Go to "Battery" > "App launch"',
        'Find "WakeAI" and disable automatic management',
        'Enable all toggles: Auto-launch, Secondary launch, Run in background',
        'Also check: Settings > Apps > Apps > WakeAI > Battery > Unmonitored'
      ]
    },
    oneplus: {
      title: 'OnePlus Battery Optimization',
      steps: [
        'Open Settings',
        'Go to "Battery" > "Battery optimization"',
        'Tap the menu (three dots) and select "All apps"',
        'Find "WakeAI" and select "Don\'t optimize"',
        'Also check: Settings > Apps > WakeAI > Battery > Background restrictions'
      ]
    },
    oppo: {
      title: 'OPPO/ColorOS Battery Optimization',
      steps: [
        'Open Settings',
        'Go to "Battery" > "More battery settings"',
        'Tap "Optimize battery use"',
        'Find "WakeAI" and disable optimization',
        'Also enable "Allow auto-start" and "Allow background activity"'
      ]
    },
    vivo: {
      title: 'Vivo Battery Optimization',
      steps: [
        'Open Settings',
        'Go to "Battery" > "High background power consumption"',
        'Enable WakeAI in the list',
        'Also check: Settings > Apps > WakeAI > Autostart'
      ]
    },
    generic: {
      title: 'Battery Optimization',
      steps: [
        'Open your device Settings',
        'Look for "Battery" or "Power" settings',
        'Find "Battery optimization" or "App battery management"',
        'Locate "WakeAI" in the app list',
        'Disable optimization or select "Don\'t optimize"',
        'This ensures alarms ring reliably'
      ]
    }
  };

  // Match manufacturer
  for (const [key, value] of Object.entries(instructions)) {
    if (key !== 'generic' && normalizedManufacturer.includes(key)) {
      return value;
    }
  }

  return instructions.generic;
}

export async function getManufacturer() {
  try {
    const info = await Device.getInfo();
    return info.manufacturer || 'generic';
  } catch {
    return 'generic';
  }
}

export default {
  checkNotificationPermission,
  requestNotificationPermission,
  hasRequiredPermissions,
  isBatteryOptimizationEnabled,
  requestDisableBatteryOptimization,
  getBatteryOptimizationInstructions,
  getManufacturer
};

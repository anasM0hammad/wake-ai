import { Device } from '@capacitor/device';
import { MODEL_CONFIG } from './constants';

const RAM_THRESHOLD_MB = MODEL_CONFIG.LARGE.ramThreshold;

let cachedDeviceInfo = null;

export async function getDeviceInfo() {
  if (cachedDeviceInfo) {
    return cachedDeviceInfo;
  }

  try {
    const info = await Device.getInfo();
    const memoryInfo = await getDeviceRAM();

    cachedDeviceInfo = {
      platform: info.platform,
      model: info.model,
      osVersion: info.osVersion,
      ram: memoryInfo
    };

    return cachedDeviceInfo;
  } catch (error) {
    console.error('Failed to get device info:', error);
    return {
      platform: 'web',
      model: 'unknown',
      osVersion: 'unknown',
      ram: 0
    };
  }
}

/**
 * Get device RAM in MB using platform-appropriate methods.
 *
 * - Web: Uses navigator.deviceMemory (Chrome only, for testing purposes)
 * - Android/iOS: Uses native detection via Capacitor or reasonable defaults
 *
 * The RAM value is used to decide whether to download the larger (1.5B) or
 * smaller (0.5B) LLM model.
 */
export async function getDeviceRAM() {
  try {
    const info = await Device.getInfo();
    const platform = info.platform;

    // Web platform: Use navigator.deviceMemory (Chrome-only, mainly for testing)
    if (platform === 'web') {
      if (typeof navigator !== 'undefined' && 'deviceMemory' in navigator) {
        // deviceMemory returns GB, convert to MB
        const ramMB = navigator.deviceMemory * 1024;
        console.log(`[DeviceInfo] Web platform - navigator.deviceMemory: ${ramMB}MB`);
        return ramMB;
      }
      // Fallback for non-Chrome browsers on web
      console.log('[DeviceInfo] Web platform - deviceMemory not available, defaulting to 4GB');
      return 4000;
    }

    // Android platform: Try to get actual memory info
    if (platform === 'android') {
      // Try performance.memory if available (some WebViews support this)
      if (typeof performance !== 'undefined' && performance.memory) {
        // jsHeapSizeLimit gives us an idea of available memory
        // Multiply by factor since JS heap is typically ~25% of total RAM
        const estimatedRAM = Math.round((performance.memory.jsHeapSizeLimit / 1024 / 1024) * 4);
        if (estimatedRAM > 0) {
          console.log(`[DeviceInfo] Android - estimated from JS heap: ${estimatedRAM}MB`);
          return estimatedRAM;
        }
      }

      // Fallback: Use device model to estimate RAM
      // Modern Android devices typically have 4-8GB RAM
      // Default to 4GB which is conservative but allows the large model
      console.log('[DeviceInfo] Android - using default estimate: 4000MB');
      return 4000;
    }

    // iOS platform: iOS devices are generally well-specced
    if (platform === 'ios') {
      // Modern iPhones have 4-6GB RAM, iPads have 4-16GB
      // Default to 4GB which is conservative
      console.log('[DeviceInfo] iOS - using default estimate: 4000MB');
      return 4000;
    }

    // Unknown platform fallback
    console.log('[DeviceInfo] Unknown platform - using default: 4000MB');
    return 4000;
  } catch (error) {
    console.error('[DeviceInfo] Failed to get device RAM:', error);
    // Return conservative default that still allows large model
    return 4000;
  }
}

export async function shouldUseLargeModel() {
  const ram = await getDeviceRAM();
  return ram >= RAM_THRESHOLD_MB;
}

export async function getRecommendedModelSize() {
  const useLarge = await shouldUseLargeModel();
  return useLarge ? 'large' : 'small';
}

export function clearDeviceInfoCache() {
  cachedDeviceInfo = null;
}

export default {
  getDeviceInfo,
  getDeviceRAM,
  shouldUseLargeModel,
  getRecommendedModelSize,
  clearDeviceInfoCache
};

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

export async function getDeviceRAM() {
  try {
    // Device.getInfo() doesn't directly provide RAM
    // On web, we can use navigator.deviceMemory (Chrome only)
    // On native, we need to implement via native bridge

    if (typeof navigator !== 'undefined' && 'deviceMemory' in navigator) {
      // deviceMemory returns GB, convert to MB
      return navigator.deviceMemory * 1024;
    }

    // For Android, attempt to get from Device plugin's memory info
    // This is a fallback - actual implementation may vary
    const info = await Device.getInfo();

    // If platform is android or ios, estimate based on typical device specs
    // In production, this should be implemented via native plugin
    if (info.platform === 'android' || info.platform === 'ios') {
      // Default to a conservative estimate that allows large model
      // Real implementation should use native code
      return 4000; // 4GB default assumption
    }

    // Web fallback
    return 4000;
  } catch (error) {
    console.error('Failed to get device RAM:', error);
    return 0;
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

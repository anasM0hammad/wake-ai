import { registerPlugin } from '@capacitor/core';

const VolumeGuard = registerPlugin('VolumeGuard');

/**
 * Lock volume buttons so they cannot change the alarm volume.
 * Call when the alarm starts ringing.
 */
export async function lockVolume() {
  try {
    await VolumeGuard.lock();
    console.log('[VolumeGuard] Volume buttons locked');
  } catch (e) {
    console.warn('[VolumeGuard] lock failed (expected on web):', e.message);
  }
}

/**
 * Unlock volume buttons, restoring normal behaviour.
 * Call when the alarm is dismissed / stopped.
 */
export async function unlockVolume() {
  try {
    await VolumeGuard.unlock();
    console.log('[VolumeGuard] Volume buttons unlocked');
  } catch (e) {
    console.warn('[VolumeGuard] unlock failed (expected on web):', e.message);
  }
}

import { Howl } from 'howler';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

const TONE_PATH = '/assets/tones';

const TONE_FILES = {
  gentle: `${TONE_PATH}/gentle.mp3`,
  moderate: `${TONE_PATH}/moderate.mp3`,
  aggressive: `${TONE_PATH}/aggressive.mp3`,
  // Aliases from TONES constant
  classic: `${TONE_PATH}/moderate.mp3`,
  intense: `${TONE_PATH}/aggressive.mp3`
};

const DEFAULT_VIBRATION_PATTERN = [500, 200, 500, 200, 500];
const ALARM_VIBRATION_PATTERN = [1000, 500, 1000, 500, 1000, 500];

let currentSound = null;
let vibrationInterval = null;
let loadedTones = {};
let webAudioOscillator = null;
let webAudioContext = null;
let webAudioGain = null;

/**
 * Generate a beep tone using Web Audio API as fallback when audio files are missing
 * @returns {Object} Object with play/stop methods mimicking Howl interface
 */
function createWebAudioBeep() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;

    webAudioContext = new AudioContext();
    webAudioOscillator = webAudioContext.createOscillator();
    webAudioGain = webAudioContext.createGain();

    webAudioOscillator.connect(webAudioGain);
    webAudioGain.connect(webAudioContext.destination);

    // Configure oscillator for alarm sound
    webAudioOscillator.frequency.value = 800;
    webAudioOscillator.type = 'sine';
    webAudioGain.gain.value = 0.5;

    // Create pulsing effect
    let isPlaying = false;
    let pulseInterval = null;

    const startPulse = () => {
      pulseInterval = setInterval(() => {
        if (webAudioGain && webAudioContext) {
          // Pulse between 0.1 and 0.5 for alarm effect
          const currentTime = webAudioContext.currentTime;
          webAudioGain.gain.setValueAtTime(0.5, currentTime);
          webAudioGain.gain.linearRampToValueAtTime(0.1, currentTime + 0.3);
          webAudioGain.gain.linearRampToValueAtTime(0.5, currentTime + 0.6);
        }
      }, 600);
    };

    return {
      play: () => {
        if (!isPlaying) {
          try {
            webAudioOscillator.start();
            isPlaying = true;
            startPulse();
          } catch (e) {
            // Already started, ignore
          }
        }
        return 1;
      },
      stop: () => {
        if (pulseInterval) {
          clearInterval(pulseInterval);
          pulseInterval = null;
        }
        if (webAudioOscillator) {
          try {
            webAudioOscillator.stop();
          } catch (e) {
            // Already stopped, ignore
          }
        }
      },
      unload: () => {
        if (pulseInterval) {
          clearInterval(pulseInterval);
          pulseInterval = null;
        }
        if (webAudioContext) {
          try {
            webAudioContext.close();
          } catch (e) {
            // Already closed, ignore
          }
        }
        webAudioOscillator = null;
        webAudioContext = null;
        webAudioGain = null;
      },
      volume: (v) => {
        if (webAudioGain && v !== undefined) {
          webAudioGain.gain.value = v * 0.5;
        }
        return webAudioGain ? webAudioGain.gain.value : 0.5;
      },
      playing: () => isPlaying,
      fade: () => {} // No-op for fallback
    };
  } catch (error) {
    console.error('[AudioPlayer] Failed to create Web Audio fallback:', error);
    return null;
  }
}

export async function loadTone(toneName) {
  const toneFile = TONE_FILES[toneName] || TONE_FILES.gentle;

  if (loadedTones[toneName]) {
    return loadedTones[toneName];
  }

  return new Promise((resolve, reject) => {
    const sound = new Howl({
      src: [toneFile],
      preload: true,
      onload: () => {
        loadedTones[toneName] = sound;
        resolve(sound);
      },
      onloaderror: (id, error) => {
        console.error(`Failed to load tone ${toneName}:`, error);
        reject(error);
      }
    });
  });
}

export async function playAlarm(toneName = 'gentle', loop = true) {
  // Stop any currently playing alarm
  stopAlarm();

  const toneFile = TONE_FILES[toneName] || TONE_FILES.gentle;

  return new Promise((resolve, reject) => {
    currentSound = new Howl({
      src: [toneFile],
      loop,
      volume: 1.0,
      onplay: () => {
        console.log('[AudioPlayer] Alarm playing:', toneFile);
        resolve(currentSound);
      },
      onplayerror: (id, error) => {
        console.error('[AudioPlayer] Failed to play alarm:', error);
        // Try to recover by unlocking audio context
        currentSound.once('unlock', () => {
          currentSound.play();
        });
        // If still failing, use Web Audio fallback
        setTimeout(() => {
          if (!currentSound.playing()) {
            console.log('[AudioPlayer] Using Web Audio fallback');
            currentSound = createWebAudioBeep();
            if (currentSound) {
              currentSound.play();
              resolve(currentSound);
            } else {
              reject(error);
            }
          }
        }, 500);
      },
      onloaderror: (id, error) => {
        console.error('[AudioPlayer] Failed to load alarm sound, using Web Audio fallback');
        // Use Web Audio API fallback when audio file doesn't exist
        currentSound = createWebAudioBeep();
        if (currentSound) {
          currentSound.play();
          resolve(currentSound);
        } else {
          reject(error);
        }
      }
    });

    currentSound.play();
  });
}

export function stopAlarm() {
  if (currentSound) {
    currentSound.stop();
    currentSound.unload();
    currentSound = null;
  }
  stopVibration();
}

export function setVolume(level) {
  const normalizedLevel = Math.max(0, Math.min(1, level));

  if (currentSound) {
    currentSound.volume(normalizedLevel);
  }

  // Also set global volume
  Howler.volume(normalizedLevel);
}

export function getVolume() {
  if (currentSound) {
    return currentSound.volume();
  }
  return Howler.volume();
}

export function fadeIn(duration = 5000, targetVolume = 1.0) {
  if (currentSound) {
    currentSound.volume(0);
    currentSound.fade(0, targetVolume, duration);
  }
}

export function fadeOut(duration = 2000) {
  if (currentSound) {
    const currentVolume = currentSound.volume();
    currentSound.fade(currentVolume, 0, duration);
    setTimeout(() => {
      stopAlarm();
    }, duration);
  }
}

export async function vibrate(pattern = DEFAULT_VIBRATION_PATTERN) {
  try {
    // Capacitor Haptics for native
    await Haptics.vibrate({ duration: pattern[0] || 500 });
  } catch (error) {
    // Fallback to web vibration API
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }
}

export function startContinuousVibration(pattern = ALARM_VIBRATION_PATTERN) {
  stopVibration();

  const totalDuration = pattern.reduce((sum, val) => sum + val, 0);

  // Immediately vibrate
  vibrate(pattern);

  // Set up interval to repeat
  vibrationInterval = setInterval(() => {
    vibrate(pattern);
  }, totalDuration);
}

export function stopVibration() {
  if (vibrationInterval) {
    clearInterval(vibrationInterval);
    vibrationInterval = null;
  }

  // Stop any ongoing vibration
  if ('vibrate' in navigator) {
    navigator.vibrate(0);
  }
}

export async function playAlarmWithVibration(toneName = 'gentle') {
  try {
    // Start both audio and vibration
    const [sound] = await Promise.all([
      playAlarm(toneName, true),
      startContinuousVibration(ALARM_VIBRATION_PATTERN)
    ]);

    return sound;
  } catch (error) {
    console.error('Failed to play alarm with vibration:', error);
    // At least try vibration if audio fails
    startContinuousVibration(ALARM_VIBRATION_PATTERN);
    throw error;
  }
}

export function stopAlarmWithVibration() {
  stopAlarm();
  stopVibration();
}

export function isPlaying() {
  return currentSound !== null && currentSound.playing();
}

export async function playFeedbackSound(type = 'success') {
  const sounds = {
    success: '/assets/sounds/success.mp3',
    error: '/assets/sounds/error.mp3',
    tap: '/assets/sounds/tap.mp3'
  };

  const soundFile = sounds[type] || sounds.tap;

  const feedback = new Howl({
    src: [soundFile],
    volume: 0.5
  });

  feedback.play();
}

export async function playHapticFeedback(style = 'medium') {
  try {
    const styles = {
      light: ImpactStyle.Light,
      medium: ImpactStyle.Medium,
      heavy: ImpactStyle.Heavy
    };

    await Haptics.impact({ style: styles[style] || styles.medium });
  } catch (error) {
    // Fallback to short vibration
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  }
}

export function preloadAllTones() {
  const toneNames = Object.keys(TONE_FILES);
  return Promise.all(toneNames.map(loadTone));
}

export function unloadAllTones() {
  Object.values(loadedTones).forEach(sound => {
    if (sound) {
      sound.unload();
    }
  });
  loadedTones = {};
}

export default {
  loadTone,
  playAlarm,
  stopAlarm,
  setVolume,
  getVolume,
  fadeIn,
  fadeOut,
  vibrate,
  startContinuousVibration,
  stopVibration,
  playAlarmWithVibration,
  stopAlarmWithVibration,
  isPlaying,
  playFeedbackSound,
  playHapticFeedback,
  preloadAllTones,
  unloadAllTones
};

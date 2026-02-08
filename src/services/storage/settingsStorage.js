import { get, set } from './storageService';

const SETTINGS_KEY = 'wakeai_settings';

const DEFAULT_SETTINGS = {
  difficulty: 'EASY',
  selectedCategories: ['math'],
  alarmTone: 'gentle',
  killCode: null,
  onboardingComplete: false,
  modelDownloaded: false
};

export function getSettings() {
  const stored = get(SETTINGS_KEY);
  return { ...DEFAULT_SETTINGS, ...stored };
}

export function updateSettings(partial) {
  const current = getSettings();
  const updated = { ...current, ...partial };
  set(SETTINGS_KEY, updated);
  return updated;
}

export function isOnboardingComplete() {
  return getSettings().onboardingComplete;
}

export function setOnboardingComplete() {
  updateSettings({ onboardingComplete: true });
}

export function getKillCode() {
  return getSettings().killCode;
}

export function setKillCode(code) {
  if (typeof code === 'string' && /^\d{4}$/.test(code)) {
    updateSettings({ killCode: code });
  }
}

export function validateKillCode(input) {
  const storedCode = getKillCode();
  if (!storedCode) {
    return false;
  }
  return input === storedCode;
}

export default {
  getSettings,
  updateSettings,
  isOnboardingComplete,
  setOnboardingComplete,
  getKillCode,
  setKillCode,
  validateKillCode
};

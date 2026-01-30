import { useState, useEffect, useCallback } from 'react';
import {
  getSettings,
  updateSettings as updateStoredSettings
} from '../services/storage/settingsStorage';

export function useSettings() {
  const [settings, setSettings] = useState(getSettings);

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  const updateSettings = useCallback((partial) => {
    const updated = updateStoredSettings(partial);
    setSettings(updated);
    return updated;
  }, []);

  const isOnboardingComplete = settings.onboardingComplete;
  const isPremium = settings.isPremium;

  return {
    settings,
    updateSettings,
    isOnboardingComplete,
    isPremium
  };
}

export default useSettings;

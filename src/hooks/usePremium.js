import { useState, useCallback } from 'react';
import { useSettings } from './useSettings';

export function usePremium() {
  const { settings, updateSettings } = useSettings();
  const [showUpsell, setShowUpsell] = useState(false);
  const [upsellFeature, setUpsellFeature] = useState(null);

  const isPremium = settings.isPremium;

  const triggerUpsell = useCallback((feature = null) => {
    setUpsellFeature(feature);
    setShowUpsell(true);
  }, []);

  const dismissUpsell = useCallback(() => {
    setShowUpsell(false);
    setUpsellFeature(null);
  }, []);

  // For testing/development - remove in production
  const togglePremium = useCallback(() => {
    updateSettings({ isPremium: !isPremium });
  }, [isPremium, updateSettings]);

  const checkFeatureAccess = useCallback((feature) => {
    const premiumFeatures = [
      'medium_difficulty',
      'hard_difficulty',
      'multiple_alarms',
      'premium_tones',
      'all_categories',
      'no_ads',
      'dashboard'
    ];

    if (isPremium) {
      return true;
    }

    return !premiumFeatures.includes(feature);
  }, [isPremium]);

  const requirePremium = useCallback((feature, callback) => {
    if (checkFeatureAccess(feature)) {
      callback?.();
      return true;
    }
    triggerUpsell(feature);
    return false;
  }, [checkFeatureAccess, triggerUpsell]);

  return {
    isPremium,
    showUpsell,
    upsellFeature,
    triggerUpsell,
    dismissUpsell,
    togglePremium,
    checkFeatureAccess,
    requirePremium
  };
}

export default usePremium;

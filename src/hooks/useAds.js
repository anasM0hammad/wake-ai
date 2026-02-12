import { useEffect, useState, useCallback, useRef } from 'react';
import {
  showBanner,
  hideBanner,
  prepareInterstitial,
  showInterstitial as showInterstitialAd,
  prepareRewarded,
  showRewarded as showRewardedAd,
  addRewardedListener,
} from '../services/ad';

/**
 * Shows a banner ad on mount, hides it on unmount.
 *
 * Uses hideBanner (not removeBanner) on cleanup to avoid a native race
 * condition: removeBanner destroys the AdView on the UI thread, but if
 * the next page's showBanner fires before the destroy completes,
 * BannerExecutor tries to reload a null AdView and crashes with an NPE.
 * hideBanner just toggles visibility, keeping the AdView intact.
 */
export function useBannerAd() {
  useEffect(() => {
    showBanner();
    return () => {
      hideBanner();
    };
  }, []);
}

/**
 * Prepares an interstitial ad on mount.
 * Returns { showInterstitial, isReady }.
 */
export function useInterstitialAd() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    prepareInterstitial().then(() => setIsReady(true));
  }, []);

  const show = useCallback(async () => {
    if (!isReady) return;
    await showInterstitialAd();
    setIsReady(false);
    // Re-prepare for next use
    prepareInterstitial().then(() => setIsReady(true));
  }, [isReady]);

  return { showInterstitial: show, isInterstitialReady: isReady };
}

/**
 * Prepares a rewarded ad on mount.
 * Returns { showRewardedAd, isReady, rewarded }.
 * `rewarded` flips to true once the user earns the reward.
 */
export function useRewardedAd() {
  const [isReady, setIsReady] = useState(false);
  const [rewarded, setRewarded] = useState(false);
  const cleanupRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const setup = async () => {
      // Listen for the reward event
      const removeListener = await addRewardedListener(() => {
        if (!cancelled) setRewarded(true);
      });
      cleanupRef.current = removeListener;

      await prepareRewarded();
      if (!cancelled) setIsReady(true);
    };

    setup();

    return () => {
      cancelled = true;
      cleanupRef.current?.();
    };
  }, []);

  const show = useCallback(async () => {
    if (!isReady) return false;
    const result = await showRewardedAd();
    setIsReady(false);
    // Re-prepare for next use
    prepareRewarded().then(() => setIsReady(true));
    return result;
  }, [isReady]);

  return { showRewardedAd: show, isRewardedReady: isReady, rewarded };
}

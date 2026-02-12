import {
  AdMob,
  BannerAdSize,
  BannerAdPosition,
  BannerAdPluginEvents,
  RewardAdPluginEvents,
  AdmobConsentStatus,
} from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';
import { AD_CONFIG } from '../../config/adConfig';

let initialized = false;
let bannerCreated = false;

/**
 * Initialize AdMob SDK. Call once at app startup.
 */
export async function initializeAds() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await AdMob.initialize({
      initializeForTesting: AD_CONFIG.IS_TESTING,
    });
    initialized = true;
    console.log('[AdService] AdMob initialized');

    // Non-blocking consent flow
    AdMob.requestConsentInfo().then((info) => {
      console.log('[AdService] Consent:', info.status);
      if (info.isConsentFormAvailable && info.status === AdmobConsentStatus.REQUIRED) {
        AdMob.showConsentForm();
      }
    }).catch(() => {});
  } catch (e) {
    console.warn('[AdService] init failed:', e);
  }
}

/**
 * Show a banner ad at the bottom of the screen.
 * If a banner was previously created and hidden, resume it instead
 * of creating a new one (avoids duplicate AdView / NPE crashes).
 */
export async function showBanner() {
  if (!Capacitor.isNativePlatform()) return;

  // Wait briefly for init if not ready yet
  if (!initialized) {
    await new Promise((r) => setTimeout(r, 2000));
    if (!initialized) return;
  }

  // If banner already exists, just resume visibility
  if (bannerCreated) {
    try {
      await AdMob.resumeBanner();
    } catch {
      // resumeBanner may not exist in older plugin versions; fall through
      // to create a new banner
      bannerCreated = false;
    }
    if (bannerCreated) return;
  }

  try {
    await AdMob.showBanner({
      adId: AD_CONFIG.BANNER_ID,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
    });
    bannerCreated = true;
  } catch (e) {
    console.warn('[AdService] showBanner error:', e);
  }
}

export async function hideBanner() {
  if (!Capacitor.isNativePlatform()) return;
  try { await AdMob.hideBanner(); } catch {}
}

export async function removeBanner() {
  if (!Capacitor.isNativePlatform()) return;
  try { await AdMob.removeBanner(); } catch {}
}

export async function prepareInterstitial() {
  if (!Capacitor.isNativePlatform() || !initialized) return;
  try {
    await AdMob.prepareInterstitial({ adId: AD_CONFIG.INTERSTITIAL_ID });
  } catch (e) {
    console.warn('[AdService] prepareInterstitial error:', e);
  }
}

export async function showInterstitial() {
  if (!Capacitor.isNativePlatform()) return;
  try { await AdMob.showInterstitial(); } catch (e) {
    console.warn('[AdService] showInterstitial error:', e);
  }
}

export async function prepareRewarded() {
  if (!Capacitor.isNativePlatform() || !initialized) return;
  try {
    await AdMob.prepareRewardVideoAd({ adId: AD_CONFIG.REWARDED_ID });
  } catch (e) {
    console.warn('[AdService] prepareRewarded error:', e);
  }
}

export async function showRewarded() {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    await AdMob.showRewardVideoAd();
    return true;
  } catch (e) {
    console.warn('[AdService] showRewarded error:', e);
    return false;
  }
}

export async function addRewardedListener(callback) {
  if (!Capacitor.isNativePlatform()) return () => {};
  try {
    const listener = await AdMob.addListener(
      RewardAdPluginEvents.Rewarded,
      (reward) => callback(reward),
    );
    return () => listener.remove();
  } catch {
    return () => {};
  }
}

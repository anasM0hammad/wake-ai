import { AD_CONFIG } from '../../config/adConfig';

let admobModule = null;
let admobExports = null;

/**
 * Lazily load the AdMob plugin. Returns null when running in a browser
 * (where Capacitor native plugins are unavailable).
 */
async function getAdMob() {
  if (admobModule) return admobModule;
  try {
    const mod = await import('@capacitor-community/admob');
    admobModule = mod.AdMob;
    admobExports = mod;
    return admobModule;
  } catch {
    return null;
  }
}

/**
 * Initialize AdMob SDK and handle UMP consent flow.
 * Call once at app startup before showing any ads.
 */
export async function initializeAds() {
  try {
    const AdMob = await getAdMob();
    if (!AdMob) return;

    await AdMob.initialize({
      initializeForTesting: AD_CONFIG.IS_TESTING,
    });
    console.log('[AdService] AdMob initialized');

    // UMP consent flow — required by Google Mobile Ads SDK before serving ads
    try {
      const consentInfo = await AdMob.requestConsentInfo();
      console.log('[AdService] Consent status:', consentInfo.status);

      if (
        consentInfo.isConsentFormAvailable &&
        consentInfo.status === admobExports.AdmobConsentStatus.REQUIRED
      ) {
        const result = await AdMob.showConsentForm();
        console.log('[AdService] Consent form result:', result.status);
      }
    } catch (consentErr) {
      console.warn('[AdService] Consent flow failed:', consentErr.message);
    }
  } catch (e) {
    console.warn('[AdService] AdMob init failed (expected on web):', e.message);
  }
}

/**
 * Show a banner ad at the bottom of the screen.
 */
export async function showBanner() {
  try {
    const AdMob = await getAdMob();
    if (!AdMob) return;

    const { BannerAdSize, BannerAdPosition, BannerAdPluginEvents } =
      await import('@capacitor-community/admob');

    AdMob.addListener(BannerAdPluginEvents.Loaded, () => {
      console.log('[AdService] Banner ad loaded');
    });
    AdMob.addListener(BannerAdPluginEvents.FailedToLoad, (error) => {
      console.error('[AdService] Banner ad failed to load:', error.message, error.code);
    });

    await AdMob.showBanner({
      adId: AD_CONFIG.BANNER_ID,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      isTesting: AD_CONFIG.IS_TESTING,
      margin: 0,
    });
    console.log('[AdService] Banner requested');
  } catch (e) {
    console.warn('[AdService] Banner failed:', e.message);
  }
}

/**
 * Hide the currently visible banner ad.
 */
export async function hideBanner() {
  try {
    const AdMob = await getAdMob();
    if (!AdMob) return;
    await AdMob.hideBanner();
  } catch (e) {
    console.warn('[AdService] Hide banner failed:', e.message);
  }
}

/**
 * Remove the banner ad completely (frees resources).
 */
export async function removeBanner() {
  try {
    const AdMob = await getAdMob();
    if (!AdMob) return;
    await AdMob.removeBanner();
  } catch (e) {
    console.warn('[AdService] Remove banner failed:', e.message);
  }
}

/**
 * Prepare an interstitial ad (pre-load for instant display).
 */
export async function prepareInterstitial() {
  try {
    const AdMob = await getAdMob();
    if (!AdMob) return;

    await AdMob.prepareInterstitial({
      adId: AD_CONFIG.INTERSTITIAL_ID,
      isTesting: AD_CONFIG.IS_TESTING,
    });
    console.log('[AdService] Interstitial prepared');
  } catch (e) {
    console.warn('[AdService] Interstitial prep failed:', e.message);
  }
}

/**
 * Show the pre-loaded interstitial ad.
 */
export async function showInterstitial() {
  try {
    const AdMob = await getAdMob();
    if (!AdMob) return;
    await AdMob.showInterstitial();
    console.log('[AdService] Interstitial shown');
  } catch (e) {
    console.warn('[AdService] Interstitial show failed:', e.message);
  }
}

/**
 * Prepare a rewarded video ad (pre-load for instant display).
 */
export async function prepareRewarded() {
  try {
    const AdMob = await getAdMob();
    if (!AdMob) return;

    await AdMob.prepareRewardVideoAd({
      adId: AD_CONFIG.REWARDED_ID,
      isTesting: AD_CONFIG.IS_TESTING,
    });
    console.log('[AdService] Rewarded ad prepared');
  } catch (e) {
    console.warn('[AdService] Rewarded prep failed:', e.message);
  }
}

/**
 * Show the pre-loaded rewarded video ad.
 * Returns true if the reward was earned, false otherwise.
 */
export async function showRewarded() {
  try {
    const AdMob = await getAdMob();
    if (!AdMob) return false;

    const result = await AdMob.showRewardVideoAd();
    console.log('[AdService] Rewarded ad shown, result:', result);
    return true;
  } catch (e) {
    console.warn('[AdService] Rewarded show failed:', e.message);
    return false;
  }
}

/**
 * Listen for rewarded ad events.
 * Returns a cleanup function to remove the listener.
 */
export async function addRewardedListener(callback) {
  try {
    const AdMob = await getAdMob();
    if (!AdMob) return () => {};

    const { RewardAdPluginEvents } = await import('@capacitor-community/admob');

    const listener = await AdMob.addListener(
      RewardAdPluginEvents.Rewarded,
      (reward) => {
        console.log('[AdService] Reward earned:', reward);
        callback(reward);
      }
    );

    return () => listener.remove();
  } catch (e) {
    console.warn('[AdService] Reward listener failed:', e.message);
    return () => {};
  }
}

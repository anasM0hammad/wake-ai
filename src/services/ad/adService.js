import { AD_CONFIG } from '../../config/adConfig';

let admobModule = null;
let admobExports = null;

// Initialization gate — resolved immediately after AdMob.initialize()
// so that ad operations don't fire before the native SDK + BannerExecutor
// are ready. This MUST NOT wait on the consent flow because
// requestConsentInfo() makes a network call to Google's UMP servers that
// can hang or take 30+ seconds — blocking the gate on it would starve
// every ad operation.
let _initResolve;
const _initReady = new Promise((resolve) => {
  _initResolve = resolve;
});

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
 * Wait for SDK initialization before performing any ad operation.
 * Returns the AdMob plugin instance, or null on web.
 */
async function getReadyAdMob() {
  await _initReady;
  return getAdMob();
}

/**
 * Run UMP consent flow in background (non-blocking).
 * Not required for test ads but needed for real ads in production.
 */
async function runConsentFlow(AdMob) {
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
  } catch (e) {
    console.warn('[AdService] Consent flow failed (non-blocking):', e.message);
  }
}

/**
 * Initialize AdMob SDK. Call once at app startup.
 *
 * Flow:
 *   1. Check native platform (bail on web)
 *   2. AdMob.initialize()  — inits SDK + BannerExecutor view hierarchy
 *   3. Open the init gate   — ad operations can now proceed
 *   4. Consent flow          — fire-and-forget, does NOT block ads
 */
export async function initializeAds() {
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) {
      console.log('[AdService] Web platform — ads disabled');
      _initResolve();
      return;
    }

    const AdMob = await getAdMob();
    if (!AdMob) {
      console.warn('[AdService] AdMob plugin not available');
      _initResolve();
      return;
    }

    await AdMob.initialize({
      initializeForTesting: AD_CONFIG.IS_TESTING,
    });
    console.log('[AdService] AdMob SDK initialized');

    // Open the gate — SDK and BannerExecutor are ready, ads can load.
    _initResolve();

    // Consent runs in background — must not block ad operations.
    runConsentFlow(AdMob);
  } catch (e) {
    console.warn('[AdService] AdMob init failed:', e.message);
    _initResolve();
  }
}

/**
 * Show a banner ad at the bottom of the screen.
 *
 * Note: isTesting is intentionally omitted. We pass Google's official test
 * ad unit IDs directly — the SDK always returns test creatives for those IDs
 * regardless of the isTesting flag. Omitting the flag also avoids the
 * AdViewIdHelper code path that overrides adId when the device is not in
 * the testingDevices list.
 */
export async function showBanner() {
  try {
    const AdMob = await getReadyAdMob();
    if (!AdMob) return;

    const { BannerAdSize, BannerAdPosition, BannerAdPluginEvents } =
      await import('@capacitor-community/admob');

    AdMob.addListener(BannerAdPluginEvents.Loaded, () => {
      console.log('[AdService] Banner ad loaded');
    });
    AdMob.addListener(BannerAdPluginEvents.FailedToLoad, (error) => {
      console.error('[AdService] Banner FailedToLoad:', error.message, error.code);
    });

    await AdMob.showBanner({
      adId: AD_CONFIG.BANNER_ID,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
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
    const AdMob = await getReadyAdMob();
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
    const AdMob = await getReadyAdMob();
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
    const AdMob = await getReadyAdMob();
    if (!AdMob) return;

    await AdMob.prepareInterstitial({
      adId: AD_CONFIG.INTERSTITIAL_ID,
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
    const AdMob = await getReadyAdMob();
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
    const AdMob = await getReadyAdMob();
    if (!AdMob) return;

    await AdMob.prepareRewardVideoAd({
      adId: AD_CONFIG.REWARDED_ID,
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
    const AdMob = await getReadyAdMob();
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
    const AdMob = await getReadyAdMob();
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

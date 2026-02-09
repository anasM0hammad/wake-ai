/**
 * AdMob Configuration
 *
 * In development, Google's official test IDs are used automatically.
 * For production, set VITE_ADMOB_* variables in .env.production.local:
 *
 *   VITE_ADMOB_APP_ID=ca-app-pub-XXXXX~YYYYY
 *   VITE_ADMOB_BANNER_ID=ca-app-pub-XXXXX/YYYYY
 *   VITE_ADMOB_INTERSTITIAL_ID=ca-app-pub-XXXXX/YYYYY
 *   VITE_ADMOB_REWARDED_ID=ca-app-pub-XXXXX/YYYYY
 *
 * Also update APPLICATION_ID in android/app/src/main/AndroidManifest.xml
 * to match VITE_ADMOB_APP_ID for production builds.
 */

const isDev = import.meta.env.DEV;

// Google AdMob official test IDs (safe for development)
const TEST_APP_ID = 'ca-app-pub-3940256099942544~3347511713';
const TEST_BANNER_ID = 'ca-app-pub-3940256099942544/6300978111';
const TEST_INTERSTITIAL_ID = 'ca-app-pub-3940256099942544/1033173712';
const TEST_REWARDED_ID = 'ca-app-pub-3940256099942544/5224354917';

export const AD_CONFIG = {
  APP_ID: import.meta.env.VITE_ADMOB_APP_ID || TEST_APP_ID,
  BANNER_ID: import.meta.env.VITE_ADMOB_BANNER_ID || TEST_BANNER_ID,
  INTERSTITIAL_ID: import.meta.env.VITE_ADMOB_INTERSTITIAL_ID || TEST_INTERSTITIAL_ID,
  REWARDED_ID: import.meta.env.VITE_ADMOB_REWARDED_ID || TEST_REWARDED_ID,
  IS_TESTING: isDev,
};

/**
 * AdMob Configuration
 *
 * Replace these TEST IDs with your real AdMob IDs from https://admob.google.com
 * Test IDs are safe to use during development — they show test ads only.
 *
 * To get your real IDs:
 * 1. Create an AdMob account at https://admob.google.com
 * 2. Register your app (com.wakeai.app)
 * 3. Create ad units: Banner, Interstitial, and Rewarded
 * 4. Replace the IDs below with your real ones
 * 5. Also update APPLICATION_ID in android/app/src/main/AndroidManifest.xml
 */

// Google AdMob Test IDs (safe for development)
export const AD_CONFIG = {
  // App-level test ID (also set in AndroidManifest.xml)
  APP_ID: 'ca-app-pub-3940256099942544~3347511713',

  // Ad unit IDs — replace with your real IDs for production
  BANNER_ID: 'ca-app-pub-3940256099942544/6300978111',
  INTERSTITIAL_ID: 'ca-app-pub-3940256099942544/1033173712',
  REWARDED_ID: 'ca-app-pub-3940256099942544/5224354917',

  // Set to false in production
  IS_TESTING: true,
};

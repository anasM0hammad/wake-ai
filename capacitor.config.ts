import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.wakeai.app',
  appName: 'WakeAI',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#488AFF',
      sound: 'gentle.mp3'
    },
    AdMob: {
      // Uses test ads by default; set to false for production
      testingDevices: [],
      initializeForTesting: true
    }
  }
};

export default config;

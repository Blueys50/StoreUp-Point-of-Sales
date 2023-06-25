import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.app.storeup',
  appName: 'StoreUp',
  webDir: 'www',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    GoogleAuth: {
      scopes: [
        'profile',
        'email',
        'https://www.googleapis.com/auth/drive.file',
      ],
      serverClientId:
        '299210290013-p9paduura7s8d2f6mo3scada5j5litbh.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
    'cordova-plugin-bt-printer': {},
  },
};

export default config;

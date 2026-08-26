import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.foshol.app',
  appName: 'Foshol',
  webDir: 'out',
  // server: {
  //   url: 'http://10.0.2.2:3000',
  //   cleartext: true
  // }
  plugins: {
    StatusBar: {
      overlaysWebView: false,
      style: 'DARK',
      backgroundColor: '#047857'
    }
  }
};

export default config;

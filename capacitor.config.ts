import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.mlwhittle.fuelflow',
    appName: 'FuelFlow',
    webDir: 'dist',
    server: {
        androidScheme: 'https'
    },
    plugins: {
        SplashScreen: {
            launchShowDuration: 2000,
            launchAutoHide: true,
            backgroundColor: '#0f172a',
            androidSplashResourceName: 'splash',
            showSpinner: false,
            splashFullScreen: true,
            splashImmersive: true
        },
        StatusBar: {
            style: 'DARK',
            backgroundColor: '#0f172a'
        }
    }
};

export default config;

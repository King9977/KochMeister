import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'Kochmeister',
  webDir: 'www',
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_launcher",
      iconColor: "#488AFF"
    }
  },
  server: {
    androidScheme: 'http',
    cleartext: true,
    allowNavigation: [
      '*',
      'lrpiervrpmugozkrztmh.supabase.co',
      'https://*.supabase.co'
    ]
  }
};

export default config;
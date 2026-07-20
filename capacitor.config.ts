import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.ella.app",
  appName: "Ella",
  webDir: "out",
  server: {
    androidScheme: "https",
    hostname: "ella-mobile.app",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0, 
      backgroundColor: "#ffffff",
      showSpinner: true,
      androidSpinnerStyle: "large",
      spinnerColor: "#000000", 
    },
  },
};

export default config;

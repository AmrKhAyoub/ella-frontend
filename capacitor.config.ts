import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.ella.app",
  appName: "Ella",
  webDir: "out",
  server: {
    androidScheme: "https",
    hostname: "ella-mobile.app",
  }
};

export default config;

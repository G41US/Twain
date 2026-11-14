// Signs release builds with the upload key when ANDROID_KEYSTORE_PATH etc. are set (CI or local);
// otherwise release falls back to the debug key, as Expo's template does.
const { withAppBuildGradle } = require("expo/config-plugins");

const SIGNING = `
        release {
            if (System.getenv("ANDROID_KEYSTORE_PATH")) {
                storeFile file(System.getenv("ANDROID_KEYSTORE_PATH"))
                storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
                keyAlias System.getenv("ANDROID_KEY_ALIAS")
                keyPassword System.getenv("ANDROID_KEY_PASSWORD")
            }
        }`;

module.exports = (config) =>
  withAppBuildGradle(config, (cfg) => {
    let g = cfg.modResults.contents;
    if (!g.includes('System.getenv("ANDROID_KEYSTORE_PATH")')) {
      // add a release signing config next to the template's debug one...
      g = g.replace(/signingConfigs\s*\{/, (m) => m + SIGNING);
      // ...and use it for release builds when a key is provided.
      g = g.replace(
        /(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)signingConfig signingConfigs\.debug/,
        '$1signingConfig System.getenv("ANDROID_KEYSTORE_PATH") ? signingConfigs.release : signingConfigs.debug',
      );
    }
    cfg.modResults.contents = g;
    return cfg;
  });

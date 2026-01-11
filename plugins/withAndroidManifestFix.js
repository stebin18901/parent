const { withAndroidManifest } = require("@expo/config-plugins");

module.exports = function withAndroidManifestFix(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    if (!manifest.$) {
      manifest.$ = {};
    }

    // Required for tools:replace to work
    manifest.$["xmlns:tools"] = "http://schemas.android.com/tools";

    const application = manifest.application?.[0];

    if (application) {
      application.$ = application.$ || {};

      // IMPORTANT: tools:replace MUST have a value
      application.$["tools:replace"] = "android:appComponentFactory";

      // This is the correct value for Expo + RN New Architecture
      application.$["android:appComponentFactory"] =
        "androidx.core.app.CoreComponentFactory";
    }

    return config;
  });
};

const { withAppBuildGradle } = require("@expo/config-plugins");

module.exports = function withAndroidXOnly(config) {
  return withAppBuildGradle(config, (config) => {
    if (!config.modResults.contents.includes("configurations.all")) {
      config.modResults.contents += `

configurations.all {
    exclude group: "com.android.support"
}
`;
    }
    return config;
  });
};

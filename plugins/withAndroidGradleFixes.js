const { withGradleProperties } = require('expo/config-plugins');

/**
 * Android の Gradle プロパティの手当て。android/ は prebuild で作り直されるのでここで入れる。
 *
 * 1. RNGMA_ANDROID_BACKEND=classic
 *    react-native-google-mobile-ads 17.1〜17.2 は、Expo の config plugin で設定すると
 *    「Cannot get property 'googleMobileAdsJson'」でビルドが落ちる。
 *    https://github.com/invertase/react-native-google-mobile-ads/issues/903
 *    build.gradle は `project.findProperty("RNGMA_ANDROID_BACKEND") ?: …` の順に読むので、
 *    先に与えれば問題の行に到達しない。ライブラリ側で直ったら消してよい。
 *
 * 2. org.gradle.jvmargs
 *    既定（Metaspace 512MB）だとリリースビルドの lintVitalAnalyzeRelease が Metaspace 不足で落ちた。
 */
const PROPS = {
  RNGMA_ANDROID_BACKEND: 'classic',
  'org.gradle.jvmargs': '-Xmx4096m -XX:MaxMetaspaceSize=1024m',
};

module.exports = function withAndroidGradleFixes(config) {
  return withGradleProperties(config, (c) => {
    c.modResults = c.modResults.filter((p) => !(p.type === 'property' && p.key in PROPS));
    for (const [key, value] of Object.entries(PROPS)) c.modResults.push({ type: 'property', key, value });
    return c;
  });
};

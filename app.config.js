/**
 * app.json を土台に、ビルドごとの差分だけ足す。
 *
 * - google-services.json（Firebase の設定）は公開リポジトリに置かない。
 *   EAS では環境変数 GOOGLE_SERVICES_JSON（ファイル型）から、手元ではリポジトリ直下のファイル（.gitignore 済み）から読む。
 * - APP_VARIANT=development のときは「開発版」として別アプリにする。
 *   Play から入れた版は Google の鍵で署名されていて手元・EAS のビルドでは上書きできないので、
 *   実機では公開版を残したまま並べて試す。
 */
module.exports = ({ config }) => {
  const android = {
    ...config.android,
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',
  };
  if (process.env.APP_VARIANT !== 'development') return { ...config, android };
  return {
    ...config,
    name: '曇天気の娘（開発版）',
    android: { ...android, package: `${config.android.package}.dev` },
    ios: { ...config.ios, bundleIdentifier: `${config.ios.bundleIdentifier}.dev` },
  };
};

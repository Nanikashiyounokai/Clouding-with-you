/**
 * iOS のホーム画面ウィジェット（次に曇りそうな時刻）。
 * iOS ではアプリが開かれないと予報を取り直せないので、ウィジェット自身も MET Norway から予報を取り、
 * 曇りの通知を予約し直す（2026-10-19 平山「iOS は一度開かれなくなったら二回目はない」）。
 * @type {import('@bacons/apple-targets/app.plugin').ConfigFunction}
 */
module.exports = (config) => ({
  type: 'widget',
  name: 'NextCloudWidget',
  displayName: '曇天気の娘',
  bundleIdentifier: '.widget',
  deploymentTarget: '17.0',
  frameworks: ['SwiftUI', 'WidgetKit', 'UserNotifications'],
  colors: { skyTop: '#3F8ACC', skyBottom: '#99CFFF' },
  images: { cloud: '../../assets/images/cloud_button.png' },
  entitlements: {
    'com.apple.security.application-groups': config.ios.entitlements['com.apple.security.application-groups'],
  },
});

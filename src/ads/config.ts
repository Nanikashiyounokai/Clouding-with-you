import { Platform } from 'react-native';
import { TestIds } from 'react-native-google-mobile-ads';

/**
 * 広告ユニット ID。AdMob アカウントはほかの SKart アプリと同じ pub-2149…（2026-11-06 作成）。
 * 旧版（Android）の pub-2529… はどのアカウントのものか分からないので使わない。
 * null にするとリリースビルドでは広告を出さない。
 */
type Units = { banner: string | null };

const production: Record<'ios' | 'android', Units> = {
  android: { banner: 'ca-app-pub-2149317250626507/3373445748' },
  ios: { banner: 'ca-app-pub-2149317250626507/2145133714' },
};

export const adUnits: Units = __DEV__ ? { banner: TestIds.ADAPTIVE_BANNER } : production[Platform.OS === 'ios' ? 'ios' : 'android'];

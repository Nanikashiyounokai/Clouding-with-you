import { Platform } from 'react-native';
import { TestIds } from 'react-native-google-mobile-ads';

/**
 * 広告ユニット ID。
 *
 * 旧版（Android）は AdMob アカウント pub-2529… のアプリ ID だけ残して、広告は全部コメントアウトしていた（収益ゼロ）。
 * バナーのユニットはまだ作っていない。AdMob で作ったら production に入れる。
 * null のあいだ、リリースビルドでは広告を出さない（テスト広告を本番に出さないため）。
 */
type Units = { banner: string | null };

const production: Record<'ios' | 'android', Units> = {
  android: { banner: null },
  ios: { banner: null },
};

export const adUnits: Units = __DEV__ ? { banner: TestIds.ADAPTIVE_BANNER } : production[Platform.OS === 'ios' ? 'ios' : 'android'];

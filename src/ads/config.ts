import { Platform } from 'react-native';
import { TestIds } from 'react-native-google-mobile-ads';

/**
 * 広告ユニット ID。
 *
 * 旧版（Android）は AdMob アカウント pub-2529… のアプリ ID だけ残して、広告は全部コメントアウトしていた（収益ゼロ）。
 * アプリ起動広告のユニットはまだ作っていない。AdMob で作ったら production に入れる。
 * null のあいだ、リリースビルドでは広告を出さない（テスト広告を本番に出さないため）。
 */
type Units = { appOpen: string | null };

const production: Record<'ios' | 'android', Units> = {
  android: { appOpen: null },
  ios: { appOpen: null },
};

export const adUnits: Units = __DEV__ ? { appOpen: TestIds.APP_OPEN } : production[Platform.OS === 'ios' ? 'ios' : 'android'];

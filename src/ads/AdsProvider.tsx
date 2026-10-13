import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import { useEffect, type ReactNode } from 'react';
import { Platform } from 'react-native';
import mobileAds, { AdEventType, AdsConsent, AppOpenAd, MaxAdContentRating } from 'react-native-google-mobile-ads';

import { adUnits } from './config';
import { appOpenPolicy, shouldShowAppOpen } from './policy';

const KEY_FIRST_LAUNCH = 'ads.firstLaunchAt';
const KEY_HISTORY = 'ads.appOpenShownAt';

/**
 * 広告は「アプリ起動広告」だけ（2026-10-13 報告会で「通知するだけ」の案 A に決定）。
 *
 * - 通知から開いたときは出さない（通知を開くと広告が出ると、通知を開かなくなる）
 * - インストールから 3 日間は出さない、1 日 2 回まで、前回から 4 時間あける
 * - 同意（UMP）→ ATT → SDK 初期化 の順。偏りルーレットと同じ
 */
export function AdsProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const now = Date.now();
        const first = Number((await AsyncStorage.getItem(KEY_FIRST_LAUNCH)) ?? 0);
        if (!first) await AsyncStorage.setItem(KEY_FIRST_LAUNCH, String(now));
        if (!adUnits.appOpen) return;

        try {
          const info = await AdsConsent.gatherConsent();
          if (!info.canRequestAds) return;
        } catch (e) {
          // AdMob 側に同意メッセージが未設定だと失敗する。前回までの同意状況で判断して続ける
          console.warn('consent failed', e);
          const info = await AdsConsent.getConsentInfo().catch(() => null);
          if (info && info.status === 'REQUIRED' && !info.canRequestAds) return;
        }
        if (Platform.OS === 'ios') await requestTrackingPermissionsAsync();
        await mobileAds().setRequestConfiguration({ maxAdContentRating: MaxAdContentRating.PG });
        await mobileAds().initialize();

        const fromNotification = await Notifications.getLastNotificationResponseAsync().catch(() => null);
        if (fromNotification) return;

        const history = JSON.parse((await AsyncStorage.getItem(KEY_HISTORY)) ?? '[]') as number[];
        if (!shouldShowAppOpen(now, first || now, history)) return;

        const ad = AppOpenAd.createForAdRequest(adUnits.appOpen);
        const timer = setTimeout(() => (cancelled = true), appOpenPolicy.loadTimeoutMs);
        ad.addAdEventListener(AdEventType.LOADED, async () => {
          clearTimeout(timer);
          // 読み込みが遅れたら出さない（操作し始めてから全画面広告が割り込むのを避ける）
          if (cancelled) return;
          await AsyncStorage.setItem(KEY_HISTORY, JSON.stringify([...history, Date.now()].slice(-10)));
          ad.show().catch(() => {});
        });
        ad.addAdEventListener(AdEventType.ERROR, () => clearTimeout(timer));
        ad.load();
      } catch (e) {
        console.warn('ads init failed', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return <>{children}</>;
}

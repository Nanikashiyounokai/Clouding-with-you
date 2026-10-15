import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import mobileAds, { AdsConsent, BannerAd, BannerAdSize, MaxAdContentRating } from 'react-native-google-mobile-ads';

import { adUnits } from './config';

const AdsReady = createContext(false);

/**
 * 広告は画面下のバナーだけ（2026-10-15 実機テストで、起動時の全画面広告から変更）。
 * 出すのはタイトルと登録地点の画面。地図で地点を選ぶ画面とシェアカードには出さない。
 * 同意（UMP）→ ATT → SDK 初期化 の順。偏りルーレットと同じ
 */
export function AdsProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!adUnits.banner) return;
    (async () => {
      try {
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
        setReady(true);
      } catch (e) {
        console.warn('ads init failed', e);
      }
    })();
  }, []);

  return <AdsReady.Provider value={ready}>{children}</AdsReady.Provider>;
}

/** 画面下のバナー。読み込めないときは場所を取らない */
export function AdBanner() {
  const ready = useContext(AdsReady);
  const [failed, setFailed] = useState(false);
  if (!ready || !adUnits.banner || failed) return null;
  return (
    <View style={styles.wrap}>
      <BannerAd unitId={adUnits.banner} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} onAdFailedToLoad={() => setFailed(true)} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
});

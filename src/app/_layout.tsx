import { ShipporiMincho_400Regular, ShipporiMincho_700Bold, useFonts } from '@expo-google-fonts/shippori-mincho';
import { useAudioPlayer } from 'expo-audio';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AdsProvider } from '../ads/AdsProvider';
import { Consent } from '../components/Consent';
import { DialogProvider } from '../components/Dialog';
import { setupNotifications } from '../push';
import { recordFirstLaunch } from '../review';
import { StoreProvider, useStore } from '../store';
import { colors, fonts } from '../theme';

// 明朝の書体を読み込むまでスプラッシュを出しておく（読み込み前に描くと一瞬ゴシックになる）
SplashScreen.preventAutoHideAsync().catch(() => {});

/**
 * BGM（平山の自作曲）。旧版はタイトル画面の onCreate で鳴らし、
 * ホームボタンで戻るたびに二重再生していた／バックグラウンドでも鳴り続けていた。
 * ここで 1 本だけ持ち、アプリが裏に回ったら止める。
 */
function useBgm() {
  const player = useAudioPlayer(require('../../assets/sounds/bgm.m4a'));
  useEffect(() => {
    // expo-audio はプロパティへの代入で設定する API（SDK 57）。React の値ではないので immutability の対象外
    /* eslint-disable react-hooks/immutability */
    player.loop = true;
    player.volume = 0.6;
    /* eslint-enable react-hooks/immutability */
    player.play();
    const sub = AppState.addEventListener('change', (s) => (s === 'active' ? player.play() : player.pause()));
    return () => sub.remove();
  }, [player]);
}

/** 初回の説明に同意するまでは、ほかの画面を出さない */
function ConsentGate({ children }: { children: ReactNode }) {
  const { loaded, consented, acceptConsent } = useStore();
  if (!loaded) return null;
  if (!consented) return <Consent onAccept={acceptConsent} />;
  return <>{children}</>;
}

export default function RootLayout() {
  useEffect(() => {
    setupNotifications().catch((e) => console.warn('notification setup failed', e));
    recordFirstLaunch().catch(() => {});
  }, []);
  useBgm();
  const [fontsLoaded, fontError] = useFonts({
    [fonts.regular]: ShipporiMincho_400Regular,
    [fonts.bold]: ShipporiMincho_700Bold,
  });
  const ready = fontsLoaded || !!fontError;
  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);
  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <StoreProvider>
        <AdsProvider>
          <DialogProvider>
          <StatusBar style="light" />
          <ConsentGate>
          <Stack screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: colors.skyTop } }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="new-point" />
            <Stack.Screen name="points" />
            <Stack.Screen name="about" />
            <Stack.Screen name="cloudy" options={{ presentation: 'modal' }} />
          </Stack>
          </ConsentGate>
          </DialogProvider>
        </AdsProvider>
      </StoreProvider>
    </SafeAreaProvider>
  );
}

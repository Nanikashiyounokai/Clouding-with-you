import { useAudioPlayer } from 'expo-audio';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AdsProvider } from '../ads/AdsProvider';
import { setupNotifications } from '../push';
import { StoreProvider } from '../store';
import { colors } from '../theme';

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

export default function RootLayout() {
  useEffect(() => {
    setupNotifications().catch((e) => console.warn('notification setup failed', e));
  }, []);
  useBgm();

  return (
    <SafeAreaProvider>
      <StoreProvider>
        <AdsProvider>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: colors.skyTop } }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="new-point" />
            <Stack.Screen name="points" />
            <Stack.Screen name="about" />
            <Stack.Screen name="cloudy" options={{ presentation: 'modal' }} />
          </Stack>
        </AdsProvider>
      </StoreProvider>
    </SafeAreaProvider>
  );
}

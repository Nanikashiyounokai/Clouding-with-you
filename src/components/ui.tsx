import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Image, Pressable, StyleSheet, Text, View, type ImageSourcePropType, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../theme';

/** 旧版の空のグラデーション。端末の端まで描き、中身はステータスバーとナビゲーションバーを避ける */
export function Sky({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient colors={[colors.skyTop, colors.skyBottom]} style={styles.fill}>
      <View style={[styles.fill, { paddingTop: insets.top, paddingBottom: insets.bottom }, style]}>{children}</View>
    </LinearGradient>
  );
}

/** 雲の画像ボタン（文字は画像に入っている）。比率は元画像 1627×582 */
export function CloudButton({
  source,
  label,
  onPress,
  align,
}: {
  source: ImageSourcePropType;
  label: string;
  onPress: () => void;
  align: 'left' | 'right';
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.cloud, { alignSelf: align === 'left' ? 'flex-start' : 'flex-end', opacity: pressed ? 0.7 : 1 }]}
    >
      <Image source={source} style={styles.cloudImage} resizeMode="contain" />
    </Pressable>
  );
}

/** 旧版の家のボタン。タイトルへ戻る */
export function HomeButton() {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="タイトルに戻る"
      onPress={() => router.dismissTo('/')}
      hitSlop={8}
      style={({ pressed }) => [styles.home, pressed && { opacity: 0.6 }]}
    >
      <Image source={require('../../assets/images/home_btn.png')} style={styles.homeImage} resizeMode="contain" />
    </Pressable>
  );
}

export function Title({ children }: { children: string }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function PrimaryButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.primary, (pressed || disabled) && { opacity: 0.6 }]}
    >
      <Text style={styles.primaryText}>{label}</Text>
    </Pressable>
  );
}

export function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.secondary, pressed && { opacity: 0.6 }]}>
      <Text style={styles.secondaryText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  cloud: { width: '78%', maxWidth: 360, aspectRatio: 1627 / 582 },
  cloudImage: { width: '100%', height: '100%' },
  home: { width: 52, height: 44 },
  homeImage: { width: '100%', height: '100%' },
  title: { color: colors.text, fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginVertical: 12 },
  primary: { backgroundColor: colors.card, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  primaryText: { color: colors.ink, fontSize: 16, fontWeight: 'bold' },
  secondary: { borderColor: colors.text, borderWidth: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  secondaryText: { color: colors.text, fontSize: 15, fontWeight: 'bold' },
});

import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Image, Pressable, StyleSheet, Text, View, type StyleProp, type TextProps, type TextStyle, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts } from '../theme';

/** 空のグラデーション。端末の端まで描き、中身はステータスバーとナビゲーションバーを避ける */
export function Sky({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient colors={[colors.skyTop, colors.skyBottom]} style={styles.fill}>
      <View style={[styles.fill, { paddingTop: insets.top, paddingBottom: insets.bottom }, style]}>{children}</View>
    </LinearGradient>
  );
}

/** 明朝の文字。既定は白 */
export function T({ bold, style, ...rest }: TextProps & { bold?: boolean; style?: StyleProp<TextStyle> }) {
  return <Text {...rest} style={[styles.text, { fontFamily: bold ? fonts.bold : fonts.regular }, style]} />;
}

/** 画面上部の見出し。戻る操作は画面の下の「タイトルへ戻る」と端末の戻る操作に任せる */
export function Header({ title }: { title: string }) {
  return (
    <View style={styles.header}>
      <T bold style={styles.headerTitle} numberOfLines={1}>
        {title}
      </T>
      <View style={styles.headerRule} />
    </View>
  );
}

/**
 * タイトルへ戻る。画面の下に控えめな文字で置く。
 * 旧版は右上に家の画像、その後は左上に丸いボタンを置いたが、どちらも見出しの邪魔になった（2026-10-15）。
 */
export function BackToTitle() {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => (router.canDismiss() ? router.dismissTo('/') : router.replace('/'))}
      hitSlop={12}
      style={({ pressed }) => [styles.back, pressed && styles.pressed]}
    >
      <Ionicons name="chevron-back" size={14} color={colors.whiteSoft} />
      <T style={styles.backText}>タイトルへ戻る</T>
    </Pressable>
  );
}

/** 雲のボタン。端が空に溶けるよう透過した雲の上に、明朝で文字を置く */
export function CloudButton({ label, onPress, align }: { label: string; onPress: () => void; align: 'left' | 'right' }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.cloud, { alignSelf: align === 'left' ? 'flex-start' : 'flex-end' }, pressed && styles.pressed]}
    >
      <Image source={require('../../assets/images/cloud_button.png')} style={styles.cloudImage} resizeMode="contain" />
      <T bold style={styles.cloudLabel}>
        {label}
      </T>
    </Pressable>
  );
}

export function PrimaryButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.primary, (pressed || disabled) && styles.pressed]}
    >
      <T bold style={styles.primaryText}>
        {label}
      </T>
    </Pressable>
  );
}

export function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}>
      <T bold style={styles.secondaryText}>
        {label}
      </T>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  text: { color: colors.white, fontSize: 15, lineHeight: 24 },
  pressed: { opacity: 0.6 },
  header: { alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 },
  headerTitle: { textAlign: 'center', fontSize: 22, lineHeight: 32, letterSpacing: 2 },
  headerRule: { width: 36, height: 1, backgroundColor: colors.whiteSoft, marginTop: 8 },
  back: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 16 },
  backText: { color: colors.whiteSoft, fontSize: 14, lineHeight: 22, letterSpacing: 1 },
  cloud: { width: '82%', maxWidth: 380, aspectRatio: 1627 / 582, alignItems: 'center', justifyContent: 'center' },
  cloudImage: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  cloudLabel: { color: colors.cloudInk, fontSize: 20, lineHeight: 30, paddingHorizontal: 4 },
  primary: { backgroundColor: colors.white, borderRadius: 28, paddingVertical: 14, paddingHorizontal: 24, alignItems: 'center' },
  primaryText: { color: colors.blueDeep, fontSize: 16, lineHeight: 24 },
  secondary: { borderColor: colors.whiteSoft, borderWidth: 1, borderRadius: 28, paddingVertical: 12, paddingHorizontal: 24, alignItems: 'center' },
  secondaryText: { color: colors.white, fontSize: 15, lineHeight: 23 },
});

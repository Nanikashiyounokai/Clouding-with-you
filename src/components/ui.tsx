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

/**
 * 画面上部。左にタイトルへ戻るボタン、中央に画面名。
 * 旧版は右上に家の画像を置いていたが、見出しと重なるうえ押しにくかった。
 */
export function Header({ title }: { title: string }) {
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="タイトルに戻る"
        onPress={() => (router.canDismiss() ? router.dismissTo('/') : router.replace('/'))}
        hitSlop={8}
        style={({ pressed }) => [styles.homeButton, pressed && styles.pressed]}
      >
        <Ionicons name="home-outline" size={20} color={colors.white} />
      </Pressable>
      <T bold style={styles.headerTitle} numberOfLines={1}>
        {title}
      </T>
      <View style={styles.homeButton} />
    </View>
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
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, gap: 12 },
  homeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 22, lineHeight: 32 },
  cloud: { width: '82%', maxWidth: 380, aspectRatio: 1627 / 582, alignItems: 'center', justifyContent: 'center' },
  cloudImage: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  cloudLabel: { color: colors.cloudInk, fontSize: 20, lineHeight: 30, paddingHorizontal: 4 },
  primary: { backgroundColor: colors.white, borderRadius: 28, paddingVertical: 14, paddingHorizontal: 24, alignItems: 'center' },
  primaryText: { color: colors.blueDeep, fontSize: 16, lineHeight: 24 },
  secondary: { borderColor: colors.whiteSoft, borderWidth: 1, borderRadius: 28, paddingVertical: 12, paddingHorizontal: 24, alignItems: 'center' },
  secondaryText: { color: colors.white, fontSize: 15, lineHeight: 23 },
});

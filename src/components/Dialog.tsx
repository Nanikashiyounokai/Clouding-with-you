import { LinearGradient } from 'expo-linear-gradient';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Image, Modal, Pressable, StyleSheet, View } from 'react-native';

import { colors } from '../theme';
import { T } from './ui';

export type DialogButton = {
  label: string;
  /** primary: 青で塗る／secondary: 枠だけ／danger: 赤い文字 */
  kind?: 'primary' | 'secondary' | 'danger';
  onPress?: () => void;
};

export type DialogOptions = { title: string; message?: string; buttons?: DialogButton[] };

type Ctx = { show: (o: DialogOptions) => void };
const DialogContext = createContext<Ctx | null>(null);

/**
 * アプリの世界観に合わせたダイアログ（OS 標準の Alert の代わり）。
 * 白い雲のカードに明朝の文字、ボタンは空の青。
 */
export function DialogProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<DialogOptions[]>([]);
  const current = queue[0];

  const show = useCallback((o: DialogOptions) => setQueue((q) => [...q, o]), []);
  const close = useCallback((b?: DialogButton) => {
    setQueue((q) => q.slice(1));
    // 閉じてから次の処理（画面遷移など）を走らせる
    if (b?.onPress) setTimeout(b.onPress, 0);
  }, []);

  const value = useMemo(() => ({ show }), [show]);
  const buttons = current?.buttons?.length ? current.buttons : [{ label: 'OK', kind: 'primary' as const }];

  return (
    <DialogContext.Provider value={value}>
      {children}
      <Modal visible={!!current} transparent animationType="fade" onRequestClose={() => close()} statusBarTranslucent>
        <Pressable style={styles.scrim} onPress={() => close()} accessibilityLabel="閉じる">
          <Pressable style={styles.card} onPress={() => {}} accessibilityRole="alert">
            {/* 上端に小さな空と雲。白いカードとつなげて「雲の便り」に見せる */}
            <LinearGradient colors={[colors.skyTop, colors.skyBottom]} style={styles.sky}>
              <Image source={require('../../assets/images/cloud_button.png')} style={styles.cloud} resizeMode="contain" />
            </LinearGradient>
            {current && (
              <>
                <T bold style={styles.title}>
                  {current.title}
                </T>
                {!!current.message && <T style={styles.message}>{current.message}</T>}
              </>
            )}
            <View style={styles.buttons}>
              {buttons.map((b) => (
                <Pressable
                  key={b.label}
                  accessibilityRole="button"
                  onPress={() => close(b)}
                  style={({ pressed }) => [styles.button, b.kind === 'primary' ? styles.primary : styles.secondary, pressed && { opacity: 0.6 }]}
                >
                  <T bold style={[styles.buttonText, b.kind === 'primary' && { color: colors.white }, b.kind === 'danger' && { color: colors.danger }]}>
                    {b.label}
                  </T>
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </DialogContext.Provider>
  );
}

export function useDialog(): Ctx {
  const v = useContext(DialogContext);
  if (!v) throw new Error('DialogProvider がない');
  return v;
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: colors.scrim, alignItems: 'center', justifyContent: 'center', padding: 28 },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.white,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 20,
    alignItems: 'center',
    overflow: 'hidden',
  },
  sky: { alignSelf: 'stretch', marginHorizontal: -24, height: 64, alignItems: 'center', justifyContent: 'flex-end', marginBottom: 16 },
  cloud: { width: 170, height: 61, marginBottom: -14 },
  title: { color: colors.blueDeep, fontSize: 19, lineHeight: 28, textAlign: 'center' },
  message: { color: colors.ink, fontSize: 15, lineHeight: 25, textAlign: 'center', marginTop: 8 },
  buttons: { alignSelf: 'stretch', gap: 10, marginTop: 20 },
  button: { borderRadius: 24, paddingVertical: 12, alignItems: 'center' },
  primary: { backgroundColor: colors.blue },
  secondary: { borderWidth: 1, borderColor: colors.line },
  buttonText: { color: colors.blueDeep, fontSize: 15, lineHeight: 23 },
});

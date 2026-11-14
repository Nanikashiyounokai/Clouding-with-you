import * as Sharing from 'expo-sharing';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

import { useDialog } from '../components/Dialog';
import { PrimaryButton, SecondaryButton, Sky, T } from '../components/ui';
import { maybeAskReview } from '../review';
import { colors } from '../theme';

/**
 * 「今から曇るよ」シェアカード。曇り通知をタップすると開く。
 * 2026-10-13 報告会で、案 A（通知するだけ）にもこれだけは入れると決定。
 * 通知から 1 タップで画像を共有して終わる。広告は出さない。
 */
export default function Cloudy() {
  const { name } = useLocalSearchParams<{ name?: string }>();
  const place = (name ?? '').trim() || 'ここ';
  const card = useRef<View>(null);
  const [busy, setBusy] = useState(false);
  const dialog = useDialog();
  const when = formatTime(new Date());

  async function share() {
    setBusy(true);
    try {
      const uri = await captureRef(card, { format: 'png', quality: 1, result: 'tmpfile' });
      if (!(await Sharing.isAvailableAsync())) {
        dialog.show({ title: '共有できません', message: 'この端末では\n共有機能が使えません。' });
        return;
      }
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: '曇天気の娘' });
      // 共有し終えたところが、アプリが一番役に立った瞬間
      maybeAskReview();
    } catch (e) {
      console.warn('share failed', e);
    } finally {
      setBusy(false);
    }
  }

  function close() {
    if (router.canGoBack()) router.back();
    else router.replace('/');
    maybeAskReview();
  }

  return (
    <Sky style={styles.body}>
      <View ref={card} collapsable={false} style={styles.cardShadow}>
        <LinearGradient colors={['#6F8BA6', '#C7D6E4']} style={styles.card}>
          <T style={styles.time}>{when}</T>
          <T bold style={styles.place}>
            {place}の上空
          </T>
          <T bold style={styles.line}>
            ねぇ、今から曇るよ
          </T>
          <View style={styles.brand}>
            <Image source={require('../../assets/images/title_white2.png')} style={styles.brandTitle} resizeMode="contain" accessibilityLabel="曇天気の娘" />
          </View>
        </LinearGradient>
      </View>

      <View style={styles.actions}>
        <PrimaryButton label={busy ? '準備しています…' : '画像でシェアする'} onPress={share} disabled={busy} />
        <SecondaryButton label="閉じる" onPress={close} />
      </View>
    </Sky>
  );
}

function formatTime(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getMonth() + 1}月${d.getDate()}日 ${p(d.getHours())}:${p(d.getMinutes())}`;
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 24, justifyContent: 'center', gap: 28 },
  cardShadow: { borderRadius: 16, overflow: 'hidden', alignSelf: 'center', width: '100%', maxWidth: 380 },
  card: { aspectRatio: 1, padding: 24, justifyContent: 'center', alignItems: 'center' },
  time: { color: colors.whiteSoft, fontSize: 14, lineHeight: 20, position: 'absolute', top: 20, left: 24 },
  place: { fontSize: 22, lineHeight: 32 },
  line: { fontSize: 28, lineHeight: 40, marginTop: 12, textAlign: 'center' },
  brand: { position: 'absolute', bottom: 16, right: 20 },
  brandTitle: { width: 120, height: 46 },
  actions: { gap: 10, width: '100%', maxWidth: 380, alignSelf: 'center' },
});

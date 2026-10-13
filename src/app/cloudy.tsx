import * as Sharing from 'expo-sharing';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Image, StyleSheet, Text, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

import { PrimaryButton, SecondaryButton, Sky } from '../components/ui';
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
  const when = formatTime(new Date());

  async function share() {
    setBusy(true);
    try {
      const uri = await captureRef(card, { format: 'png', quality: 1, result: 'tmpfile' });
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('共有できません', 'この端末では共有機能が使えません');
        return;
      }
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: '曇天気の娘' });
    } catch (e) {
      console.warn('share failed', e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sky style={styles.body}>
      <View ref={card} collapsable={false} style={styles.cardShadow}>
        <LinearGradient colors={['#7F93A6', '#C9D3DC']} style={styles.card}>
          <Text style={styles.time}>{when}</Text>
          <Text style={styles.place}>{place}の上空</Text>
          <Text style={styles.line}>ねぇ、今から曇るよ</Text>
          <View style={styles.brand}>
            <Image source={require('../../assets/images/title_white2.png')} style={styles.brandTitle} resizeMode="contain" accessibilityLabel="曇天気の娘" />
          </View>
        </LinearGradient>
      </View>

      <View style={styles.actions}>
        <PrimaryButton label={busy ? '準備しています…' : '画像でシェアする'} onPress={share} disabled={busy} />
        <SecondaryButton label="閉じる" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
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
  time: { color: colors.textSoft, fontSize: 14, position: 'absolute', top: 20, left: 24 },
  place: { color: colors.text, fontSize: 22, fontWeight: 'bold' },
  line: { color: colors.text, fontSize: 30, fontWeight: 'bold', marginTop: 12, textAlign: 'center' },
  brand: { position: 'absolute', bottom: 16, right: 20 },
  brandTitle: { width: 120, height: 46 },
  actions: { gap: 10, width: '100%', maxWidth: 380, alignSelf: 'center' },
});

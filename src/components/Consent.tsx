import * as WebBrowser from 'expo-web-browser';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { colors } from '../theme';
import { PrimaryButton, Sky, T } from './ui';

const METNO_PRIVACY_URL = 'https://www.met.no/en/About-us/privacy';

/**
 * 初回の説明。登録した場所の位置をスマホから MET Norway に送ることに同意してもらう。
 * 同意するまで予報は取らない（2026-10-19 平山「勝手にスマホが MET Norway にアクセスすることになる」）。
 */
export function Consent({ onAccept }: { onAccept: () => void }) {
  return (
    <Sky>
      <ScrollView contentContainerStyle={styles.body}>
        <Image source={require('../../assets/images/title_white2.png')} style={styles.title} resizeMode="contain" accessibilityLabel="曇天気の娘" />
        <View style={styles.card}>
          <T bold style={styles.h}>
            天気予報の取得について
          </T>
          <T style={styles.p}>
            {'曇りをお知らせするために、登録した場所のおおよその位置（約1km単位）を、ノルウェー気象局（MET Norway）の天気サービスに送って予報を受け取ります。'}
          </T>
          <T style={styles.p}>
            {'送るのは登録した場所の位置だけで、あなたの現在地や名前は送りません。SKart がこの情報を受け取ったり、保存したりすることはありません。'}
          </T>
          <Pressable onPress={() => WebBrowser.openBrowserAsync(METNO_PRIVACY_URL).catch(() => {})} accessibilityRole="link" hitSlop={8}>
            <T style={styles.link}>MET Norway のプライバシーポリシー</T>
          </Pressable>
        </View>
        <View style={styles.actions}>
          <PrimaryButton label="同意して始める" onPress={onAccept} />
        </View>
      </ScrollView>
    </Sky>
  );
}

const styles = StyleSheet.create({
  body: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 32, alignItems: 'center' },
  title: { width: '70%', maxWidth: 300, aspectRatio: 320 / 123 },
  card: { alignSelf: 'stretch', backgroundColor: colors.card, borderRadius: 20, padding: 22, marginTop: 24, gap: 12 },
  h: { color: colors.blueDeep, fontSize: 18, lineHeight: 28, textAlign: 'center' },
  p: { color: colors.ink, fontSize: 14, lineHeight: 24 },
  link: { color: colors.blueDeep, fontSize: 13, lineHeight: 21, textDecorationLine: 'underline', textAlign: 'center' },
  actions: { alignSelf: 'stretch', marginTop: 24 },
});

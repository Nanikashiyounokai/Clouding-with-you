import * as WebBrowser from 'expo-web-browser';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { BackToTitle, Header, PrimaryButton, Sky, T } from '../components/ui';
import { openStorePage } from '../review';
import { colors } from '../theme';

const SKART_URL = 'https://skart-inc.jimdofree.com/';
/** 天気データの出典。CC BY 4.0 で、アプリ内に表示する決まり */
const METNO_LICENSE_URL = 'https://api.met.no/doc/License';

const STEPS = [
  '新規地点登録の画面で、\n地点を選んで登録します。',
  '登録地点の画面で、\n祈願する地点の変更や削除ができます。',
  '祈願中の地点が曇りそうなとき、\nお知らせします。',
];

/**
 * このアプリについて。旧版の「使い方」をそのまま載せる。
 * 旧版の strings.xml にあった『天気の子』の人物名と場面を書いた本文（tv4）は、
 * 2022 年以降どの画面にも出ておらず、新版にも持ち込まない（2026-10-07 決定）。
 */
export default function About() {
  return (
    <Sky>
      <Header title="このアプリについて" />
      <ScrollView contentContainerStyle={styles.body}>
        <Image source={require('../../assets/images/title_white2.png')} style={styles.title} resizeMode="contain" accessibilityLabel="曇天気の娘" />
        <T bold style={styles.quote}>
          「ねぇ、今から曇るよ」
        </T>
        <T style={styles.lead}>{'このアプリは、登録した地点が\n曇りそうなとき“だけ”お知らせします。'}</T>

        <View style={styles.card}>
          <T bold style={styles.h}>
            使い方
          </T>
          {STEPS.map((s, i) => (
            <View key={i} style={styles.step}>
              <View style={styles.num}>
                <T bold style={styles.numText}>
                  {i + 1}
                </T>
              </View>
              <T style={styles.stepText}>{s}</T>
            </View>
          ))}
        </View>

        <View style={styles.rate}>
          <T style={styles.rateLead}>{'気に入っていただけたら、\n評価をいただけるとうれしいです。'}</T>
          <PrimaryButton label="このアプリを評価する" onPress={() => openStorePage().catch(() => {})} />
        </View>

        <Pressable onPress={() => WebBrowser.openBrowserAsync(METNO_LICENSE_URL).catch(() => {})} accessibilityRole="link" style={styles.credit}>
          <T style={styles.creditText}>{'天気データ：ノルウェー気象局（MET Norway）\nCC BY 4.0'}</T>
        </Pressable>

        <Pressable onPress={() => WebBrowser.openBrowserAsync(SKART_URL).catch(() => {})} accessibilityRole="link" style={styles.logoWrap}>
          <T style={styles.made}>made by</T>
          <Image source={require('../../assets/images/logo.png')} style={styles.logo} resizeMode="contain" accessibilityLabel="SKart" />
        </Pressable>
        <BackToTitle />
      </ScrollView>
    </Sky>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingBottom: 32, alignItems: 'center' },
  title: { width: '70%', maxWidth: 300, aspectRatio: 320 / 123 },
  quote: { fontSize: 19, lineHeight: 30 },
  lead: { fontSize: 15, lineHeight: 26, textAlign: 'center', marginTop: 12 },
  card: { alignSelf: 'stretch', backgroundColor: colors.card, borderRadius: 20, padding: 20, marginTop: 28, gap: 14 },
  h: { color: colors.blueDeep, fontSize: 17, lineHeight: 26, textAlign: 'center' },
  step: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  num: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  numText: { fontSize: 14, lineHeight: 20 },
  stepText: { flex: 1, color: colors.ink, fontSize: 14, lineHeight: 23 },
  rate: { alignSelf: 'stretch', marginTop: 28, gap: 12 },
  rateLead: { fontSize: 14, lineHeight: 23, textAlign: 'center' },
  credit: { marginTop: 32 },
  creditText: { fontSize: 12, lineHeight: 20, textAlign: 'center', color: colors.whiteSoft },
  logoWrap: { alignItems: 'center', marginTop: 24, marginBottom: 16 },
  made: { color: colors.ink, fontSize: 11, lineHeight: 16 },
  logo: { width: 120, height: 38 },
});

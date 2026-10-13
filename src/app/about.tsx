import * as WebBrowser from 'expo-web-browser';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { HomeButton, Sky, Title } from '../components/ui';
import { colors } from '../theme';

const SKART_URL = 'https://skart-inc.jimdofree.com/';

/**
 * このアプリについて。旧版の「使い方」をそのまま載せる。
 * 旧版の strings.xml にあった『天気の子』の人物名と場面を書いた本文（tv4）は、
 * 2022 年以降どの画面にも出ておらず、新版にも持ち込まない（2026-10-07 決定）。
 */
export default function About() {
  return (
    <Sky>
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.header}>
          <Title>曇天気の娘</Title>
          <View style={styles.homeSlot}>
            <HomeButton />
          </View>
        </View>
        <Text style={styles.quote}>「ねぇ、今から曇るよ」</Text>
        <Text style={styles.lead}>
          このアプリは登録地点が{'\n'}曇りそうなとき ”だけ” 通知します。
        </Text>

        <Text style={styles.h}>使い方</Text>
        <Step n="1" text={'新規地点登録画面から\n地点を選んで登録してください'} />
        <Step n="2" text={'登録地点の画面で\n観測する地点（祈願中）の変更・削除ができます'} />
        <Step n="3" text={'祈願中の地点が曇りそうなとき、通知します'} />

        <Pressable onPress={() => WebBrowser.openBrowserAsync(SKART_URL).catch(() => {})} accessibilityRole="link" style={styles.logoWrap}>
          <Text style={styles.made}>made by</Text>
          <Image source={require('../../assets/images/logo.png')} style={styles.logo} resizeMode="contain" accessibilityLabel="SKart" />
        </Pressable>
      </ScrollView>
    </Sky>
  );
}

function Step({ n, text }: { n: string; text: string }) {
  return (
    <View style={styles.step}>
      <Text style={styles.n}>{n}</Text>
      <Text style={styles.stepText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 16, paddingBottom: 32, alignItems: 'center', gap: 8 },
  header: { alignSelf: 'stretch', justifyContent: 'center' },
  homeSlot: { position: 'absolute', right: 0 },
  quote: { color: colors.text, fontSize: 18, fontWeight: 'bold', marginTop: 8 },
  lead: { color: colors.text, fontSize: 15, textAlign: 'center', lineHeight: 24, marginTop: 8 },
  h: { color: colors.text, fontSize: 18, fontWeight: 'bold', marginTop: 24 },
  step: { alignItems: 'center', marginTop: 12 },
  n: { color: colors.text, fontWeight: 'bold', fontSize: 16 },
  stepText: { color: colors.text, textAlign: 'center', lineHeight: 22 },
  logoWrap: { alignItems: 'center', marginTop: 40 },
  made: { color: colors.inkSoft, fontSize: 11 },
  logo: { width: 120, height: 38 },
});

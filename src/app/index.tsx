import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CloudButton, Sky } from '../components/ui';
import { useStore } from '../store';
import { colors } from '../theme';

/**
 * 曇り通知をタップしたらシェアカードを開く。
 * ルートの画面が出てから動かすため、_layout ではなくここに置く
 */
function useNotificationRouting() {
  const last = Notifications.useLastNotificationResponse();
  useEffect(() => {
    if (!last || last.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
    const data = last.notification.request.content.data as { url?: unknown; name?: unknown };
    if (data?.url === '/cloudy') {
      router.push({ pathname: '/cloudy', params: { name: typeof data.name === 'string' ? data.name : '' } });
    }
  }, [last]);
}

export default function Home() {
  useNotificationRouting();
  const { active, loaded } = useStore();
  return (
    <Sky>
      <ScrollView contentContainerStyle={styles.body}>
        <Image source={require('../../assets/images/title_white2.png')} style={styles.title} resizeMode="contain" accessibilityLabel="曇天気の娘" />
        <Image source={require('../../assets/images/subtitle_white.png')} style={styles.subtitle} resizeMode="contain" accessibilityLabel="今から曇るよ" />
        {/* 旧版は常時通知に「○○で祈願中」を出していた。常駐をやめたのでここに出す */}
        <Text style={styles.status}>{loaded ? (active ? `${active.name}で祈願中` : '地点を登録して祈願してください') : ' '}</Text>
        <View style={styles.buttons}>
          <CloudButton source={require('../../assets/images/real_cloud_long_newcity.png')} label="新規地点登録" align="left" onPress={() => router.push('/new-point')} />
          <CloudButton source={require('../../assets/images/real_cloud_long_reg.png')} label="登録地点" align="right" onPress={() => router.push('/points')} />
          <CloudButton source={require('../../assets/images/real_cloud_long_detail.png')} label="このアプリについて" align="left" onPress={() => router.push('/about')} />
        </View>
      </ScrollView>
    </Sky>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 16, paddingBottom: 32, alignItems: 'center' },
  title: { width: '90%', maxWidth: 380, aspectRatio: 320 / 123, marginTop: 8 },
  subtitle: { width: '70%', maxWidth: 300, aspectRatio: 320 / 123, marginTop: -24 },
  status: { color: colors.textSoft, fontSize: 14, marginTop: 4, marginBottom: 8 },
  buttons: { width: '100%', gap: 12, marginTop: 8 },
});

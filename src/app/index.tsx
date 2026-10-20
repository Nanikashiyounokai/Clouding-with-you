import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';

import { AdBanner } from '../ads/AdsProvider';
import { useDialog } from '../components/Dialog';
import { CloudButton, Sky } from '../components/ui';
import { offerWidget } from '../widget/guide';

/** 声かけ通知から開いたときのウィジェットの案内は 1 回だけ */
const KEY_WIDGET_HINT = 'widgetHint.v1';

/**
 * 曇り通知をタップしたらシェアカードを開く。
 * ルートの画面が出てから動かすため、_layout ではなくここに置く
 */
function useNotificationRouting() {
  const last = Notifications.useLastNotificationResponse();
  const dialog = useDialog();
  useEffect(() => {
    if (!last || last.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
    const data = last.notification.request.content.data as { url?: unknown; name?: unknown };
    if (data?.url === '/cloudy') {
      router.push({ pathname: '/cloudy', params: { name: typeof data.name === 'string' ? data.name : '' } });
      return;
    }
    // 予報の取り直しが止まっていた人。開かなくても更新されるウィジェットを一度だけ勧める
    if (data?.url === '/') {
      AsyncStorage.getItem(KEY_WIDGET_HINT)
        .then((shown) => {
          if (shown) return;
          AsyncStorage.setItem(KEY_WIDGET_HINT, '1').catch(() => {});
          dialog.show({
            title: 'また曇りをお知らせします',
            message: 'ホーム画面に置いておくと、\n開かなくても予報が更新されます。',
            buttons: [
              { label: '置き方を見る', kind: 'primary', onPress: () => offerWidget(dialog.show) },
              { label: '閉じる', kind: 'secondary' },
            ],
          });
        })
        .catch(() => {});
    }
  }, [last, dialog]);
}

export default function Home() {
  useNotificationRouting();
  return (
    <Sky>
      <ScrollView contentContainerStyle={styles.body}>
        <Image source={require('../../assets/images/title_white2.png')} style={styles.title} resizeMode="contain" accessibilityLabel="曇天気の娘" />
        <Image source={require('../../assets/images/subtitle_white.png')} style={styles.subtitle} resizeMode="contain" accessibilityLabel="今から曇るよ" />
        <View style={styles.buttons}>
          <CloudButton label="新規地点登録" align="left" onPress={() => router.push('/new-point')} />
          <CloudButton label="登録地点" align="right" onPress={() => router.push('/points')} />
          <CloudButton label="このアプリについて" align="left" onPress={() => router.push('/about')} />
        </View>
      </ScrollView>
      <AdBanner />
    </Sky>
  );
}

const styles = StyleSheet.create({
  body: { flexGrow: 1, paddingHorizontal: 8, paddingBottom: 32, alignItems: 'center' },
  title: { width: '90%', maxWidth: 380, aspectRatio: 320 / 123, marginTop: 16 },
  subtitle: { width: '70%', maxWidth: 300, aspectRatio: 320 / 123, marginTop: -28 },
  buttons: { width: '100%', marginTop: 8, gap: 4 },
});

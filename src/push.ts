import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/** 曇り通知のチャネル。旧版のサーバー方式から同じ ID を使っている */
export const CLOUD_CHANNEL = 'clouding';

/**
 * 旧版のチャネル。常駐サービスの「○○で祈願中」（1111）と曇り通知（channel_id）。
 * 新版では常駐しないので、設定画面に古いチャネルが残らないよう消す。
 */
const LEGACY_CHANNELS = ['1111', 'channel_id'];

export async function setupNotifications(): Promise<void> {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CLOUD_CHANNEL, {
    name: '曇りのお知らせ',
    description: '祈願中の地点が曇りそうなときにお知らせします',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'notification_sound.wav',
  });
  for (const id of LEGACY_CHANNELS) await Notifications.deleteNotificationChannelAsync(id).catch(() => {});
}

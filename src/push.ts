import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { apiBaseUrl, easProjectId } from './config';
import type { Point } from './domain/points';

/** サーバーが送る曇り通知のチャネル（server/src/index.ts の channelId と同じ） */
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

export type PushResult = { token: string } | { error: 'denied' | 'simulator' | 'no-project' | 'failed' };

/** 通知の許可をとってプッシュトークンを得る。許可ダイアログは祈願中の地点ができたときに初めて出す */
export async function getPushToken(): Promise<PushResult> {
  if (!Device.isDevice) return { error: 'simulator' };
  const current = await Notifications.getPermissionsAsync();
  let granted = current.granted;
  if (!granted && current.canAskAgain) {
    granted = (await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowSound: true } })).granted;
  }
  if (!granted) return { error: 'denied' };
  if (!easProjectId) return { error: 'no-project' };
  try {
    const t = await Notifications.getExpoPushTokenAsync({ projectId: easProjectId });
    return { token: t.data };
  } catch (e) {
    console.warn('push token failed', e);
    return { error: 'failed' };
  }
}

/** サーバーに祈願中の地点を伝える。point が null なら見張りをやめる */
export async function syncSubscription(token: string, point: Point | null): Promise<boolean> {
  if (!apiBaseUrl) return false;
  try {
    const res = await fetch(`${apiBaseUrl}/v1/subscription`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token, point: point ? { name: point.name, lat: point.lat, lon: point.lon } : null }),
    });
    return res.ok;
  } catch (e) {
    console.warn('sync failed', e);
    return false;
  }
}

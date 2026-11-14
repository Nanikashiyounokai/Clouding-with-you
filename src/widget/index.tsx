import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { requestPinWidget, requestWidgetUpdate, type WidgetTaskHandler } from 'react-native-android-widget';

import { refreshClouds } from '../clouds';
import type { CloudAlert } from '../domain/cloudPlan';
import { activePoint, type Point } from '../domain/points';
import { KEYS } from '../storageKeys';
import { NextCloudWidget, WIDGET_NAME, type WidgetData } from './NextCloudWidget';

/** iOS のウィジェット（targets/widget）と共有する場所。app.json の entitlements と同じ */
const APP_GROUP = 'group.com.skart.cloudingwithyou';

async function readWidgetData(): Promise<WidgetData> {
  try {
    if (!(await AsyncStorage.getItem(KEYS.consent))) return { kind: 'start' };
    const point = activePoint(JSON.parse((await AsyncStorage.getItem(KEYS.points)) ?? '[]') as Point[]);
    if (!point) return { kind: 'no-point' };
    const state = JSON.parse((await AsyncStorage.getItem(KEYS.cloudState)) ?? '{}') as { plan?: CloudAlert[] };
    const upcoming = (state.plan ?? []).map((a) => a.onsetAt).filter((t) => t > Date.now());
    return { kind: 'point', name: point.name, lat: point.lat, lon: point.lon, nextOnset: upcoming.length ? Math.min(...upcoming) : null };
  } catch {
    return { kind: 'start' };
  }
}

/** 予報を取り直したあとに呼ぶ。ウィジェットが置かれていなければ何もしない */
export async function updateWidget(): Promise<void> {
  const data = await readWidgetData();
  if (Platform.OS === 'ios') {
    // iOS のウィジェットは SwiftUI。地点と次に曇る時刻を共有の場所に書き、描き直してもらう
    const { ExtensionStorage } = await import('@bacons/apple-targets');
    new ExtensionStorage(APP_GROUP).set('widget', JSON.stringify(data));
    ExtensionStorage.reloadWidget();
    return;
  }
  if (Platform.OS !== 'android') return;
  await requestWidgetUpdate({ widgetName: WIDGET_NAME, renderWidget: () => <NextCloudWidget data={data} /> }).catch(() => {});
}

/** ホーム画面に置く確認を出す（Android）。対応していないホームアプリなら false */
export async function pinWidget(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  return requestPinWidget({ widgetName: WIDGET_NAME }).catch(() => false);
}

/**
 * ウィジェットが置かれた・定期更新（30 分おき）のとき。
 * 予報も取り直すので、Android ではこれも裏での取り直しの経路になる。
 */
export const widgetTaskHandler: WidgetTaskHandler = async ({ widgetAction, renderWidget }) => {
  if (widgetAction === 'WIDGET_DELETED' || widgetAction === 'WIDGET_CLICK') return;
  renderWidget(<NextCloudWidget data={await readWidgetData()} />);
  if (widgetAction === 'WIDGET_RESIZED') return;
  await refreshClouds({ askPermission: false }).catch(() => null);
  renderWidget(<NextCloudWidget data={await readWidgetData()} />);
};

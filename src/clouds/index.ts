import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

import { nextOnset, planAlerts, type CloudAlert } from '../domain/cloudPlan';
import { activePoint, type Point } from '../domain/points';
import { CLOUD_CHANNEL } from '../push';
import { KEYS } from '../storageKeys';
import { coarse, fetchForecast, type Forecast } from '../weather/metno';

/**
 * 予報を取り直して、曇りの通知をスマホの中に予約し直す。
 *
 * 呼ばれるのは、アプリを開いたとき・祈願中の地点を変えたとき・裏で OS が動かしたとき（background.ts）。
 * サーバーは持たない（2026-10-19）。SKart に地点が届くことはない。
 */

/** 取り直しが止まった人にだけ届く声かけ。予報を取れるたびに、この時間だけ先へずらす */
const STALE_AFTER_MS = 48 * 60 * 60 * 1000;
const KEEP_DELIVERED_MS = 7 * 24 * 60 * 60 * 1000;
const STALE_ID = 'stale';
const CLOUD_PREFIX = 'cloud-';

type CloudState = { pointKey: string | null; plan: CloudAlert[]; delivered: CloudAlert[]; lastFetchedAt: number | null };
const EMPTY: CloudState = { pointKey: null, plan: [], delivered: [], lastFetchedAt: null };

export type CloudStatus = 'ok' | 'offline' | 'denied' | 'none' | 'no-consent';
export type RefreshResult = { status: CloudStatus; nextOnset: number | null };

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

async function ensurePermission(ask: boolean): Promise<boolean> {
  const p = await Notifications.getPermissionsAsync();
  if (p.granted) return true;
  if (!ask || !p.canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowSound: true } })).granted;
}

async function cancelOurs(): Promise<void> {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    all
      .filter((n) => n.identifier === STALE_ID || n.identifier.startsWith(CLOUD_PREFIX))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
}

function at(when: number, now: number): Notifications.NotificationTriggerInput {
  // ほぼ今なら、すぐ出す
  if (when - now < 10_000) return { channelId: CLOUD_CHANNEL };
  return { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when, channelId: CLOUD_CHANNEL };
}

async function schedule(point: Point, plan: CloudAlert[], staleAt: number | null, now: number): Promise<void> {
  await cancelOurs();
  for (const a of plan) {
    await Notifications.scheduleNotificationAsync({
      identifier: `${CLOUD_PREFIX}${a.onsetAt}`,
      content: {
        title: `${point.name}の上空`,
        body: 'ねぇ、今から曇るよ',
        sound: 'notification_sound.wav',
        data: { url: '/cloudy', name: point.name },
      },
      trigger: at(a.fireAt, now),
    });
  }
  if (staleAt && staleAt > now) {
    await Notifications.scheduleNotificationAsync({
      identifier: STALE_ID,
      content: { title: 'しばらく空を見上げていません', body: '開くと、また曇りをお知らせします。', data: { url: '/' } },
      trigger: at(staleAt, now),
    });
  }
}

async function run(askPermission: boolean): Promise<RefreshResult> {
  if (!(await AsyncStorage.getItem(KEYS.consent))) return { status: 'no-consent', nextOnset: null };
  const point = activePoint(await readJson<Point[]>(KEYS.points, []));
  const prev = await readJson<CloudState>(KEYS.cloudState, EMPTY);
  const now = Date.now();
  const pointKey = point ? `${point.lat},${point.lon}` : null;

  // 予約していたうち、時刻を過ぎたものは鳴ったとみなす。地点が変わったら記録は持ち越さない
  const delivered =
    prev.pointKey === pointKey
      ? [...prev.delivered, ...prev.plan.filter((a) => a.fireAt <= now)].filter((a) => a.fireAt > now - KEEP_DELIVERED_MS)
      : [];
  const save = (s: Partial<CloudState>) =>
    AsyncStorage.setItem(KEYS.cloudState, JSON.stringify({ ...prev, pointKey, delivered, ...s })).catch(() => {});

  if (!point) {
    await cancelOurs();
    await save({ plan: [] });
    return { status: 'none', nextOnset: null };
  }
  if (!(await ensurePermission(askPermission))) {
    await cancelOurs();
    await save({ plan: [] });
    return { status: 'denied', nextOnset: null };
  }

  const cached = await readJson<Forecast | null>(KEYS.forecast, null);
  let forecast: Forecast | null = null;
  let status: CloudStatus = 'ok';
  try {
    forecast = await fetchForecast(point.lat, point.lon, now, cached);
    if (forecast !== cached) await AsyncStorage.setItem(KEYS.forecast, JSON.stringify(forecast));
  } catch (e) {
    console.warn('forecast failed', e);
    status = 'offline';
    // 取れなければ、同じ地点の前回の予報で予約し直す
    const samePlace = cached && cached.lat === coarse(point.lat) && cached.lon === coarse(point.lon);
    forecast = samePlace && cached.fetchedAt > now - STALE_AFTER_MS ? cached : null;
  }

  const plan = forecast ? planAlerts(forecast.hours, now, delivered) : [];
  const lastFetchedAt = status === 'ok' && forecast ? forecast.fetchedAt : prev.lastFetchedAt;
  await schedule(point, plan, lastFetchedAt ? lastFetchedAt + STALE_AFTER_MS : null, now);
  await save({ plan, lastFetchedAt });
  console.info(`clouds: ${status} plan=${plan.length}`);
  return { status, nextOnset: nextOnset(plan) };
}

let running: Promise<RefreshResult> | null = null;

/** 同時に二重で走らないようにする（画面と裏の取り直しが重なることがある） */
export function refreshClouds({ askPermission }: { askPermission: boolean }): Promise<RefreshResult> {
  running ??= run(askPermission).finally(() => {
    running = null;
  });
  return running;
}

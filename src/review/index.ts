import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';
import { Linking } from 'react-native';

import { shouldAskReview } from './policy';

const KEY_FIRST_LAUNCH = 'app.firstLaunchAt';
const KEY_HISTORY = 'review.askedAt';

/** 初回起動の時刻を残す。レビュー依頼の猶予に使う */
export async function recordFirstLaunch(): Promise<void> {
  if (!(await AsyncStorage.getItem(KEY_FIRST_LAUNCH))) await AsyncStorage.setItem(KEY_FIRST_LAUNCH, String(Date.now()));
}

/** 条件を満たすときだけ、OS のレビュー画面を出す。出すかどうかは最終的に OS が決める */
export async function maybeAskReview(): Promise<void> {
  try {
    const now = Date.now();
    const first = Number((await AsyncStorage.getItem(KEY_FIRST_LAUNCH)) ?? now);
    const history = JSON.parse((await AsyncStorage.getItem(KEY_HISTORY)) ?? '[]') as number[];
    if (!shouldAskReview(now, first, history)) return;
    if (!(await StoreReview.isAvailableAsync())) return;
    await AsyncStorage.setItem(KEY_HISTORY, JSON.stringify([...history, now]));
    await StoreReview.requestReview();
  } catch (e) {
    console.warn('review request failed', e);
  }
}

/** 「このアプリを評価する」。ストアのページを開く。ページが無ければ OS のレビュー画面 */
export async function openStorePage(): Promise<void> {
  const url = StoreReview.storeUrl();
  if (url && (await Linking.openURL(url).then(() => true, () => false))) return;
  if (await StoreReview.isAvailableAsync()) await StoreReview.requestReview();
}

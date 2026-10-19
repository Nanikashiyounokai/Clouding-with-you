import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { refreshClouds } from './index';

/**
 * 裏での取り直し。Android は 15 分以上の間隔で、iOS は OS が決めた頻度で動く。
 * アプリを開かなくても予報を取り直し、通知を予約し直す。
 * defineTask はアプリの起動時に必ず読まれる必要があるので、index.js から読み込む。
 */
export const CLOUD_TASK = 'clouding-refresh';

TaskManager.defineTask(CLOUD_TASK, async () => {
  try {
    await refreshClouds({ askPermission: false });
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (e) {
    console.warn('background refresh failed', e);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

export async function registerCloudTask(): Promise<void> {
  if (await TaskManager.isTaskRegisteredAsync(CLOUD_TASK)) return;
  // 分単位。MET Norway の規約（スマホからは 10 分に 1 回まで）より十分ゆるい
  await BackgroundTask.registerTaskAsync(CLOUD_TASK, { minimumInterval: 30 });
}

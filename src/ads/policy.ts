/** アプリ起動広告の頻度制限（React Native に依存しないのでテストできる） */
export const appOpenPolicy = {
  /** インストールから最初の 3 日間は出さない */
  graceAfterInstallMs: 3 * 24 * 60 * 60 * 1000,
  /** 24 時間で 2 回まで */
  maxPer24h: 2,
  /** 前回から 4 時間あける */
  minIntervalMs: 4 * 60 * 60 * 1000,
  /** 起動からこの時間で読み込めなければ出さない */
  loadTimeoutMs: 4000,
};

/** 頻度制限。テストのため export */
export function shouldShowAppOpen(now: number, firstLaunchAt: number, history: number[], p = appOpenPolicy): boolean {
  if (now - firstLaunchAt < p.graceAfterInstallMs) return false;
  const last = history.length ? Math.max(...history) : 0;
  if (now - last < p.minIntervalMs) return false;
  const dayAgo = now - 24 * 60 * 60 * 1000;
  return history.filter((t) => t > dayAgo).length < p.maxPer24h;
}

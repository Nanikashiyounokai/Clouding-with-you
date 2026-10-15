/**
 * レビュー依頼を出してよいか（React Native に依存しないのでテストできる）。
 *
 * 出すのは「曇りのお知らせが届いて、シェアカードを見終えたとき」だけ。
 * アプリが役に立った直後なので、良い評価をもらいやすい。
 */
export const reviewPolicy = {
  /** インストールから 3 日は出さない */
  graceAfterInstallMs: 3 * 24 * 60 * 60 * 1000,
  /** 前回から 120 日あける */
  minIntervalMs: 120 * 24 * 60 * 60 * 1000,
  /** 生涯 3 回まで（iOS も 1 年に 3 回までしか出さない） */
  maxTotal: 3,
};

export function shouldAskReview(now: number, firstLaunchAt: number, history: number[], p = reviewPolicy): boolean {
  if (now - firstLaunchAt < p.graceAfterInstallMs) return false;
  if (history.length >= p.maxTotal) return false;
  if (!history.length) return true;
  return now - Math.max(...history) >= p.minIntervalMs;
}

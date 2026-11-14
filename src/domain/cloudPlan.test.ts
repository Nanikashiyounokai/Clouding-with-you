import { findOnsets, nextOnset, planAlerts, type HourCloud } from './cloudPlan';

const H = 60 * 60 * 1000;
const t0 = Date.UTC(2026, 9, 19, 0, 0, 0);
const series = (...clouds: number[]): HourCloud[] => clouds.map((c, i) => ({ t: t0 + i * H, clouds: c }));
const day = () => 'd'; // 日付の境目はこのテストでは考えない

test('晴れから曇りに変わる時刻を見つける', () => {
  expect(findOnsets(series(10, 20, 80, 90, 10, 75))).toEqual([t0 + 2 * H, t0 + 5 * H]);
});

test('最初から曇っていたら、一度晴れるまで数えない', () => {
  expect(findOnsets(series(80, 90, 50, 80))).toEqual([]);
  expect(findOnsets(series(80, 20, 80))).toEqual([t0 + 2 * H]);
});

test('中くらいの雲量をはさんでも、晴れのあとなら曇りに数える', () => {
  expect(findOnsets(series(20, 50, 75))).toEqual([t0 + 2 * H]);
});

test('曇る 1 時間前に鳴らす', () => {
  expect(planAlerts(series(10, 10, 10, 80), t0, [], undefined, day)).toEqual([{ fireAt: t0 + 2 * H, onsetAt: t0 + 3 * H }]);
});

test('鳴らす時刻を過ぎていても、まだ曇っていなければすぐ鳴らす', () => {
  const now = t0 + 2.5 * H;
  expect(planAlerts(series(10, 10, 10, 80), now, [], undefined, day)).toEqual([{ fireAt: now, onsetAt: t0 + 3 * H }]);
});

test('もう鳴らした曇りは、予報が少しずれても二度鳴らさない', () => {
  const delivered = [{ fireAt: t0 + 1 * H, onsetAt: t0 + 2 * H }];
  expect(planAlerts(series(10, 10, 10, 80), t0 + 1.5 * H, delivered, undefined, day)).toEqual([]);
});

test('一度鳴ったら 3 時間あける', () => {
  // 2 時と 4 時に曇る → 4 時の分は 1 時の通知から 3 時間たたないので鳴らさない
  const plan = planAlerts(series(10, 10, 80, 10, 80, 10, 10, 80), t0, [], undefined, day);
  expect(plan.map((a) => a.onsetAt)).toEqual([t0 + 2 * H, t0 + 7 * H]);
});

test('1 日 3 回まで', () => {
  const c: number[] = [];
  for (let i = 0; i < 6; i++) c.push(10, 10, 10, 80);
  expect(planAlerts(series(...c), t0, [], undefined, day)).toHaveLength(3);
});

test('48 時間より先は予約しない', () => {
  const c = Array(50).fill(10);
  c[49] = 80;
  expect(planAlerts(series(...c), t0, [], undefined, day)).toEqual([]);
});

test('次に曇りそうな時刻', () => {
  expect(nextOnset([])).toBeNull();
  expect(nextOnset([{ fireAt: 5, onsetAt: 9 }, { fireAt: 1, onsetAt: 3 }])).toBe(3);
});

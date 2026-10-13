import { appOpenPolicy as p, shouldShowAppOpen } from './policy';

const H = 60 * 60 * 1000;
const install = 0;
const day4 = 4 * 24 * H;

it('インストールから 3 日間は出さない', () => {
  expect(shouldShowAppOpen(2 * 24 * H, install, [])).toBe(false);
  expect(shouldShowAppOpen(day4, install, [])).toBe(true);
});
it('前回から 4 時間あけ、24 時間で 2 回まで', () => {
  expect(shouldShowAppOpen(day4, install, [day4 - 3 * H])).toBe(false);
  expect(shouldShowAppOpen(day4, install, [day4 - 5 * H])).toBe(true);
  expect(shouldShowAppOpen(day4, install, [day4 - 10 * H, day4 - 5 * H])).toBe(false);
  expect(shouldShowAppOpen(day4, install, [day4 - 30 * H, day4 - 5 * H])).toBe(true);
  expect(p.maxPer24h).toBe(2);
});

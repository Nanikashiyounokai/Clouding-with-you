import { shouldAskReview } from './policy';

const D = 24 * 60 * 60 * 1000;

test('インストールから 3 日は出さない', () => {
  expect(shouldAskReview(2 * D, 0, [])).toBe(false);
  expect(shouldAskReview(3 * D, 0, [])).toBe(true);
});

test('前回から 120 日あける', () => {
  expect(shouldAskReview(100 * D, 0, [10 * D])).toBe(false);
  expect(shouldAskReview(130 * D, 0, [10 * D])).toBe(true);
});

test('3 回出したらもう出さない', () => {
  expect(shouldAskReview(1000 * D, 0, [10 * D, 200 * D, 400 * D])).toBe(false);
});

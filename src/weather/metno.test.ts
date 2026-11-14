import { coarse, parseClouds } from './metno';

test('位置は小数 2 桁（約 1km）に丸めて送る', () => {
  expect(coarse(35.68123)).toBe(35.68);
  expect(coarse(139.7671)).toBe(139.77);
  expect(coarse(-0.125)).toBe(-0.12);
});

test('応答から雲量だけ取り出す', () => {
  const json = {
    properties: {
      timeseries: [
        { time: '2026-10-19T00:00:00Z', data: { instant: { details: { cloud_area_fraction: 12.5, air_temperature: 15 } } } },
        { time: '2026-10-19T01:00:00Z', data: { instant: { details: {} } } },
        { time: 'broken', data: { instant: { details: { cloud_area_fraction: 50 } } } },
        { time: '2026-10-19T02:00:00Z', data: { instant: { details: { cloud_area_fraction: 80 } } } },
      ],
    },
  };
  expect(parseClouds(json)).toEqual([
    { t: Date.UTC(2026, 9, 19, 0), clouds: 12.5 },
    { t: Date.UTC(2026, 9, 19, 2), clouds: 80 },
  ]);
});

test('形がおかしい応答は空にする', () => {
  expect(parseClouds(null)).toEqual([]);
  expect(parseClouds({ properties: {} })).toEqual([]);
});

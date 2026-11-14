import { toPoints } from './legacy';

// ts-jest が import より前に巻き上げる
jest.mock('expo-file-system', () => ({}));
jest.mock('react-native', () => ({ Platform: { OS: 'android' } }));

describe('旧データの読み替え', () => {
  it('id 順に並べ、祈願中は "True" を引き継ぐ', () => {
    const pts = toPoints([
      { id: 2, point_name: '大阪', active: 'False', lat: 34.6937, lon: 135.5023 },
      { id: 1, point_name: '東京', active: 'True', lat: 35.68095, lon: 139.76731 },
    ]);
    expect(pts.map((p) => p.name)).toEqual(['東京', '大阪']);
    expect(pts.map((p) => p.active)).toEqual([true, false]);
    expect(pts[0].lat).toBe(35.681);
  });

  it('壊れた行は飛ばし、祈願中が複数あれば最初の 1 つだけ', () => {
    const pts = toPoints([
      { id: 1, point_name: '', active: 'True', lat: 35, lon: 139 },
      { id: 2, point_name: 'A', active: 'True', lat: 35, lon: 139 },
      { id: 3, point_name: 'B', active: 'True', lat: 34, lon: 135 },
      { id: 4, point_name: 'C', active: 'False', lat: 'x', lon: 135 },
    ]);
    expect(pts.map((p) => [p.name, p.active])).toEqual([
      ['A', true],
      ['B', false],
    ]);
  });
});

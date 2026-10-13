import { activePoint, addPoint, MAX_POINTS, removePoint, round4, toggleActive, validate, type Point } from './points';

describe('validate', () => {
  it('数値でない緯度経度をはじく（旧版はここで落ちていた）', () => {
    expect(validate({ name: '東京', lat: '1.2.3', lon: '139' }, 0)).toBe('lat');
    expect(validate({ name: '東京', lat: '35', lon: '139.7.' }, 0)).toBe('lon');
    expect(validate({ name: '東京', lat: 'あ', lon: '139' }, 0)).toBe('lat');
  });
  it('空欄と範囲外', () => {
    expect(validate({ name: ' ', lat: '35', lon: '139' }, 0)).toBe('name');
    expect(validate({ name: '東京', lat: '', lon: '139' }, 0)).toBe('lat');
    expect(validate({ name: '東京', lat: '90', lon: '139' }, 0)).toBe('lat');
    expect(validate({ name: '東京', lat: '35', lon: '-180' }, 0)).toBe('lon');
  });
  it('上限', () => {
    expect(validate({ name: '東京', lat: '35', lon: '139' }, MAX_POINTS)).toBe('full');
  });
  it('正しい入力', () => {
    expect(validate({ name: '東京', lat: '35.6809', lon: '139.7673' }, 3)).toBeNull();
    expect(validate({ name: '東京', lat: 35.6, lon: 139.7 }, 3)).toBeNull();
  });
});

describe('地点の操作', () => {
  const base: Point[] = addPoint(addPoint([], { name: 'A', lat: 35.123456, lon: 139.98765 }, 'a'), { name: 'B', lat: 34, lon: 135 }, 'b');

  it('1 件目だけ自動で祈願中になり、緯度経度は 4 桁で丸める', () => {
    expect(base.map((p) => p.active)).toEqual([true, false]);
    expect(base[0].lat).toBe(35.1235);
    expect(base[0].lon).toBe(139.9877);
    expect(round4(-0.00005)).toBe(-0);
  });

  it('祈願中は 1 地点だけ。もう一度押すと解除', () => {
    const switched = toggleActive(base, 'b');
    expect(activePoint(switched)?.id).toBe('b');
    expect(switched.filter((p) => p.active)).toHaveLength(1);
    expect(activePoint(toggleActive(switched, 'b'))).toBeNull();
  });

  it('削除', () => {
    expect(removePoint(base, 'a').map((p) => p.id)).toEqual(['b']);
  });
});

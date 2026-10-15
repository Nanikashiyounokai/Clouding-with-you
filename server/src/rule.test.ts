import { afterNotify, areaKey, canNotify, judge, localClock, nextAreaState, type Weather } from './rule';

const T0 = 1_791_900_000; // 秒

function weather(now: number, next: number[], offsetMin = 20): Weather {
  // current.dt は正時から offsetMin 分すぎ。hourly[0] はその正時、以降 1 時間ごと
  const hourStart = T0 - offsetMin * 60;
  return {
    timezone_offset: 9 * 3600,
    current: { dt: T0, clouds: now },
    hourly: [{ dt: hourStart, clouds: now }, ...next.map((c, i) => ({ dt: hourStart + (i + 1) * 3600, clouds: c }))],
  };
}

describe('judge', () => {
  it('60 分以内に 30 ポイント以上増えて 70% 以上になれば曇る', () => {
    expect(judge(weather(20, [80])).cloudy).toBe(true);
    expect(judge(weather(40, [70])).cloudy).toBe(true);
  });
  it('増え方が足りない・行き先が薄い・すでに曇っている', () => {
    expect(judge(weather(50, [75])).cloudy).toBe(false);
    expect(judge(weather(10, [60])).cloudy).toBe(false);
    expect(judge(weather(100, [100])).cloudy).toBe(false);
  });
  it('60 分より先の変化は見ない', () => {
    // 正時まで 40 分。次の正時の次（100 分後）にだけ曇る
    expect(judge(weather(10, [20, 90])).cloudy).toBe(false);
  });
});

describe('通知の上限', () => {
  const tz = 9 * 3600;
  // 2026-10-14 12:00 JST
  const noon = Date.UTC(2026, 9, 14, 3, 0, 0);

  it('夜間（22〜7 時）は鳴らさない', () => {
    const empty = { lastNotifiedAt: null, dayKey: null, dayCount: 0 };
    expect(canNotify(empty, Date.UTC(2026, 9, 14, 13, 30), tz)).toBe(false); // 22:30 JST
    expect(canNotify(empty, Date.UTC(2026, 9, 13, 21, 59), tz)).toBe(false); // 06:59 JST
    expect(canNotify(empty, Date.UTC(2026, 9, 13, 22, 0), tz)).toBe(true); // 07:00 JST
  });

  it('3 時間は鳴らさず、1 日 3 回まで', () => {
    let s = afterNotify({ lastNotifiedAt: null, dayKey: null, dayCount: 0 }, noon - 8 * 3600_000, tz); // 04:00 JST（同じ日）
    expect(canNotify(s, noon - 5 * 3600_000, tz)).toBe(true); // 07:00 JST、3 時間後
    s = afterNotify(s, noon - 5 * 3600_000, tz);
    expect(canNotify(s, noon - 3 * 3600_000, tz)).toBe(false); // 2 時間後
    s = afterNotify(s, noon, tz);
    expect(s.dayCount).toBe(3);
    expect(canNotify(s, noon + 4 * 3600_000, tz)).toBe(false); // 4 回目
  });

  it('日付が変わると回数は戻る', () => {
    const s = { lastNotifiedAt: noon, dayKey: localClock(noon, tz).dayKey, dayCount: 3 };
    expect(canNotify(s, noon + 24 * 3600_000, tz)).toBe(true);
  });
});

it('近い地点は同じ問い合わせにまとめる', () => {
  expect(areaKey(35.6809, 139.7673)).toBe(areaKey(35.7012, 139.7712));
  expect(areaKey(35.6809, 139.7673)).not.toBe(areaKey(34.6937, 135.5023));
});

describe('最後に曇った時刻', () => {
  it('曇っていない → 曇り に変わった時刻だけ残す', () => {
    let s = nextAreaState({ lastClouds: null, lastCloudyAt: null }, 30, 1);
    expect(s.lastCloudyAt).toBeNull();
    s = nextAreaState(s, 80, 2);
    expect(s.lastCloudyAt).toBe(2);
    s = nextAreaState(s, 90, 3); // 曇りが続いている
    expect(s.lastCloudyAt).toBe(2);
    s = nextAreaState(s, 20, 4);
    expect(s.lastCloudyAt).toBe(2);
    s = nextAreaState(s, 75, 5);
    expect(s.lastCloudyAt).toBe(5);
  });
  it('初めて見たときにすでに曇っていれば、その時刻を残す', () => {
    expect(nextAreaState({ lastClouds: null, lastCloudyAt: null }, 85, 9).lastCloudyAt).toBe(9);
  });
});

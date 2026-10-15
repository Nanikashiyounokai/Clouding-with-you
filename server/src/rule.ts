/**
 * 曇り判定と通知の上限。数字はここだけで決める。
 *
 * 2026-10-13 時点では報告会で数字を決めていないので、提案時の推奨案を置いている。
 * 実際に鳴った回数と、そのあと本当に曇ったかを見て調整する。
 *
 * 旧版（Android 1.6.x）の判定:
 *   曇り率 =（次の正時の雲量 − いまの雲量）÷ 残り分数 ≥ 0.3
 *   → すでに曇っていると鳴らない／正時までの残り時間で感度が変わる／条件を満たす間 10 分ごとに鳴る
 */
export const CLOUD_RULE = {
  /** いまから何分先までを見るか */
  windowMinutes: 60,
  /** 雲量（%）がこれだけ増えること */
  minIncrease: 30,
  /** 増えた先の雲量（%）がこれ以上であること */
  minFutureClouds: 70,
};

export const NOTIFY_LIMITS = {
  /** 1 日（その地点の現地時間）に鳴らす最大回数 */
  maxPerDay: 3,
  /** 一度鳴ったら、この時間は鳴らさない */
  cooldownMs: 3 * 60 * 60 * 1000,
  /** 夜間は鳴らさない（現地時間。22 時〜翌 7 時） */
  quietStartHour: 22,
  quietEndHour: 7,
};

/** OpenWeather One Call 3.0 の必要な部分だけ */
export type Weather = {
  timezone_offset: number;
  current: { dt: number; clouds: number };
  hourly: { dt: number; clouds: number }[];
};

export type Judgement = { cloudy: false } | { cloudy: true; now: number; future: number; at: number };

/** これから曇るか */
export function judge(w: Weather, rule = CLOUD_RULE): Judgement {
  const now = w.current.clouds;
  const until = w.current.dt + rule.windowMinutes * 60;
  const ahead = w.hourly.filter((h) => h.dt > w.current.dt && h.dt <= until);
  if (ahead.length === 0) return { cloudy: false };
  const peak = ahead.reduce((a, b) => (b.clouds > a.clouds ? b : a));
  if (peak.clouds >= rule.minFutureClouds && peak.clouds - now >= rule.minIncrease) {
    return { cloudy: true, now, future: peak.clouds, at: peak.dt };
  }
  return { cloudy: false };
}

export type NotifyState = { lastNotifiedAt: number | null; dayKey: string | null; dayCount: number };

/** その地点の現地時間での日付と時 */
export function localClock(nowMs: number, tzOffsetSec: number): { dayKey: string; hour: number } {
  const d = new Date(nowMs + tzOffsetSec * 1000);
  return { dayKey: d.toISOString().slice(0, 10), hour: d.getUTCHours() };
}

/** 上限の範囲内なら鳴らしてよい */
export function canNotify(s: NotifyState, nowMs: number, tzOffsetSec: number, limits = NOTIFY_LIMITS): boolean {
  const { dayKey, hour } = localClock(nowMs, tzOffsetSec);
  const quiet =
    limits.quietStartHour > limits.quietEndHour
      ? hour >= limits.quietStartHour || hour < limits.quietEndHour
      : hour >= limits.quietStartHour && hour < limits.quietEndHour;
  if (quiet) return false;
  if (s.lastNotifiedAt !== null && nowMs - s.lastNotifiedAt < limits.cooldownMs) return false;
  const countToday = s.dayKey === dayKey ? s.dayCount : 0;
  return countToday < limits.maxPerDay;
}

/** 鳴らしたあとの状態 */
export function afterNotify(s: NotifyState, nowMs: number, tzOffsetSec: number): NotifyState {
  const { dayKey } = localClock(nowMs, tzOffsetSec);
  return { lastNotifiedAt: nowMs, dayKey, dayCount: (s.dayKey === dayKey ? s.dayCount : 0) + 1 };
}

/** 「曇っている」とみなす雲量（%）。曇り判定の行き先と同じ基準 */
export const CLOUDY_AT = CLOUD_RULE.minFutureClouds;

export type AreaState = { lastClouds: number | null; lastCloudyAt: number | null };

/** 地域の曇りの記録を更新する。曇っていない → 曇り に変わった時刻を残す */
export function nextAreaState(prev: AreaState, clouds: number, nowMs: number): AreaState {
  const wasCloudy = prev.lastClouds !== null && prev.lastClouds >= CLOUDY_AT;
  const isCloudy = clouds >= CLOUDY_AT;
  return { lastClouds: clouds, lastCloudyAt: isCloudy && !wasCloudy ? nowMs : prev.lastCloudyAt };
}

/**
 * 天気を問い合わせる単位。近い地点はまとめて 1 回にする（0.1 度 ≒ 11 km 四方）。
 * 呼び出し回数がユーザー数ではなく地域数に比例する。
 */
export function areaKey(lat: number, lon: number): string {
  return `${(Math.round(lat * 10) / 10).toFixed(1)},${(Math.round(lon * 10) / 10).toFixed(1)}`;
}

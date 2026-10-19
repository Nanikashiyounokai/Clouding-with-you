/**
 * 曇りの予告をいつ鳴らすか（React Native に依存しないのでテストできる）。
 *
 * 2026-10-19 にサーバー方式をやめ、各スマホが自分で予報を取って通知を予約する形にした。
 * 予報（1 時間ごとの雲量）から「晴れ → 曇り」に変わる時刻を探し、その少し前に鳴らす。
 * 的中よりも「曇るよと知らせること」を優先する（2026-10-18 平山）。昼も夜も同じ判定。
 */
export const CLOUD_RULE = {
  /** この雲量（%）以下を「晴れ」とみなす */
  clearMax: 30,
  /** この雲量（%）以上を「曇り」とみなす */
  cloudyMin: 70,
  /** 曇る時刻のどれだけ前に鳴らすか */
  leadMs: 60 * 60 * 1000,
  /** 予約するのはこの先どこまでか */
  horizonMs: 48 * 60 * 60 * 1000,
  /** 1 日（端末の現地時間）に鳴らす最大回数 */
  maxPerDay: 3,
  /** 一度鳴ったら、この時間は鳴らさない */
  cooldownMs: 3 * 60 * 60 * 1000,
  /** 同じ曇りとみなす幅。予報を取り直して曇る時刻が少しずれても二重に鳴らさない */
  sameEventMs: 2 * 60 * 60 * 1000,
};

/** 予報の 1 時間分。t はミリ秒 */
export type HourCloud = { t: number; clouds: number };

/** 鳴らす予定（または鳴らした記録）。fireAt に鳴らし、onsetAt に曇る見込み */
export type CloudAlert = { fireAt: number; onsetAt: number };

/** 「晴れ → 曇り」に変わる時刻の一覧。最初から晴れでなければ、一度晴れるまで数えない */
export function findOnsets(hours: HourCloud[], rule = CLOUD_RULE): number[] {
  const sorted = [...hours].sort((a, b) => a.t - b.t);
  const onsets: number[] = [];
  let clear = false;
  for (const h of sorted) {
    if (h.clouds <= rule.clearMax) clear = true;
    else if (h.clouds >= rule.cloudyMin && clear) {
      onsets.push(h.t);
      clear = false;
    }
  }
  return onsets;
}

function localDayKey(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/**
 * これから鳴らす予定を決める。
 * delivered はもう鳴らした分（同じ曇りで二度鳴らさない・回数と間隔の上限に数える）。
 */
export function planAlerts(
  hours: HourCloud[],
  now: number,
  delivered: CloudAlert[],
  rule = CLOUD_RULE,
  dayKey: (ms: number) => string = localDayKey,
): CloudAlert[] {
  const done = [...delivered].sort((a, b) => a.fireAt - b.fireAt);
  const plan: CloudAlert[] = [];
  for (const onsetAt of findOnsets(hours, rule)) {
    if (onsetAt <= now || onsetAt > now + rule.horizonMs) continue;
    if (done.some((d) => Math.abs(d.onsetAt - onsetAt) <= rule.sameEventMs)) continue;
    // 鳴らす時刻がもう過ぎていても、まだ曇っていなければすぐ鳴らす
    const fireAt = Math.max(onsetAt - rule.leadMs, now);
    const all = [...done, ...plan];
    const last = all.length ? Math.max(...all.map((a) => a.fireAt)) : -Infinity;
    if (fireAt - last < rule.cooldownMs) continue;
    if (all.filter((a) => dayKey(a.fireAt) === dayKey(fireAt)).length >= rule.maxPerDay) continue;
    plan.push({ fireAt, onsetAt });
  }
  return plan;
}

/** 次に曇りそうな時刻（予約した中で一番早いもの）。無ければ null */
export function nextOnset(plan: CloudAlert[]): number | null {
  return plan.length ? Math.min(...plan.map((a) => a.onsetAt)) : null;
}

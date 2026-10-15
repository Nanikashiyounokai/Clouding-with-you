import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { apiBaseUrl } from './config';
import type { Point } from './domain/points';

export type CloudRecord = { known: false } | { known: true; cloudyNow: boolean; lastCloudyAt: number | null };

/**
 * 登録地点ごとの「最後に曇った時刻」。サーバーが 10 分おきに天気を見ている地域だけ記録がある。
 * 画面を開くたびに取り直す。位置情報なので URL ではなく本文で送る。
 */
export function useLastCloudy(points: Point[]): Record<string, CloudRecord> {
  const [records, setRecords] = useState<Record<string, CloudRecord>>({});
  const key = points.map((p) => `${p.id}:${p.lat},${p.lon}`).join('|');

  useFocusEffect(
    useCallback(() => {
      if (!apiBaseUrl || points.length === 0) return;
      let cancelled = false;
      (async () => {
        try {
          const res = await fetch(`${apiBaseUrl}/v1/areas`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ points: points.map((p) => ({ lat: p.lat, lon: p.lon })) }),
          });
          if (!res.ok) return;
          const body = (await res.json()) as { areas?: CloudRecord[] };
          if (cancelled || !Array.isArray(body.areas)) return;
          const next: Record<string, CloudRecord> = {};
          points.forEach((p, i) => (next[p.id] = body.areas?.[i] ?? { known: false }));
          setRecords(next);
        } catch {
          // 通信できないときは何も出さない
        }
      })();
      return () => {
        cancelled = true;
      };
      // points は key で代表させる
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key]),
  );
  return records;
}

/** 「最後に曇った」の表示文 */
export function describeCloud(r: CloudRecord | undefined, now = new Date()): string {
  if (!r || !r.known) return 'まだ曇りの記録がありません';
  if (r.cloudyNow) return 'いま曇っています';
  if (r.lastCloudyAt === null) return 'まだ曇りの記録がありません';
  return `最後に曇ったのは ${formatWhen(new Date(r.lastCloudyAt), now)}`;
}

function formatWhen(d: Date, now: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  const time = `${p(d.getHours())}:${p(d.getMinutes())}`;
  const day = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((day(now) - day(d)) / 86_400_000);
  if (diff === 0) return `今日 ${time}`;
  if (diff === 1) return `昨日 ${time}`;
  return `${d.getMonth() + 1}月${d.getDate()}日 ${time}`;
}

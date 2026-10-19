import type { HourCloud } from '../domain/cloudPlan';

/**
 * ノルウェー気象局（MET Norway）の Locationforecast。
 *
 * 無料・API キーなし・世界中・商用可（データは CC BY 4.0、アプリ内に出典を出す）。
 * 規約（https://api.met.no/doc/TermsOfService）で決まっていること:
 * - 連絡先の分かる User-Agent を付ける
 * - 緯度経度は小数 4 桁まで（このアプリは位置を細かく送らないよう 2 桁＝約 1km に丸める）
 * - Expires まで取り直さず、取り直すときは If-Modified-Since を付ける
 * - スマホから直接取るなら 10 分に 1 回まで
 */
export const METNO_URL = 'https://api.met.no/weatherapi/locationforecast/2.0/compact';
export const METNO_USER_AGENT = 'clouding-with-you/2.0 (https://skart-inc.jimdofree.com/)';
export const METNO_MIN_INTERVAL_MS = 10 * 60 * 1000;

/** 送る位置の細かさ。登録地点そのものではなく約 1km 四方の代表点を送る */
export function coarse(v: number): number {
  return Math.round(v * 100) / 100;
}

type Compact = {
  properties?: { timeseries?: { time?: string; data?: { instant?: { details?: { cloud_area_fraction?: number } } } }[] };
};

/** 応答から 1 時間ごとの雲量だけ取り出す（6 時間おきになる先の分も含む） */
export function parseClouds(json: unknown): HourCloud[] {
  const ts = (json as Compact)?.properties?.timeseries;
  if (!Array.isArray(ts)) return [];
  const out: HourCloud[] = [];
  for (const s of ts) {
    const t = Date.parse(s?.time ?? '');
    const c = s?.data?.instant?.details?.cloud_area_fraction;
    if (Number.isFinite(t) && typeof c === 'number') out.push({ t, clouds: c });
  }
  return out;
}

export type Forecast = { lat: number; lon: number; hours: HourCloud[]; expires: number; lastModified: string | null; fetchedAt: number };

/**
 * 予報を取る。cached がまだ有効ならそのまま返す。
 * 失敗したら例外（呼ぶ側で前回の予報を使い続ける）。
 */
export async function fetchForecast(lat: number, lon: number, now: number, cached: Forecast | null): Promise<Forecast> {
  const la = coarse(lat);
  const lo = coarse(lon);
  const same = cached && cached.lat === la && cached.lon === lo;
  if (same && (now < cached.expires || now - cached.fetchedAt < METNO_MIN_INTERVAL_MS)) return cached;

  const headers: Record<string, string> = { 'User-Agent': METNO_USER_AGENT, Accept: 'application/json' };
  if (same && cached.lastModified) headers['If-Modified-Since'] = cached.lastModified;
  const res = await fetch(`${METNO_URL}?lat=${la}&lon=${lo}`, { headers });
  const expiresHeader = Date.parse(res.headers.get('expires') ?? '');
  // Expires が無いときは 30 分後まで使う
  const expires = Number.isFinite(expiresHeader) ? expiresHeader : now + 30 * 60 * 1000;
  if (res.status === 304 && same) return { ...cached, expires, fetchedAt: now };
  if (!res.ok) throw new Error(`metno ${res.status}`);
  const hours = parseClouds(await res.json());
  if (!hours.length) throw new Error('metno empty');
  return { lat: la, lon: lo, hours, expires, lastModified: res.headers.get('last-modified'), fetchedAt: now };
}

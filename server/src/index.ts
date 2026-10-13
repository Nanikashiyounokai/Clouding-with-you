/**
 * 曇天気の娘 — 曇り通知サーバー（Cloudflare Workers）
 *
 * 旧版は端末の常駐サービスが 10 分おきに天気を取っていたが、Android 15 以降は
 * 24 時間で計 6 時間までしか動けず、iOS ではそもそも常駐できない。見張りをここに移した。
 *
 * - PUT /v1/subscription   端末が「祈願中の地点」を登録・解除する
 * - cron（10 分おき）       祈願中の地点をまとめて判定し、曇りそうなら Expo Push で送る
 *
 * 秘密情報は wrangler secret で入れる（コードに書かない）:
 *   OPENWEATHER_API_KEY   One Call 3.0 のキー
 *   EXPO_ACCESS_TOKEN     （任意）Expo のプッシュ送信を保護する場合
 */
import { afterNotify, areaKey, canNotify, judge, type NotifyState, type Weather } from './rule';

export interface Env {
  DB: D1Database;
  OPENWEATHER_API_KEY: string;
  EXPO_ACCESS_TOKEN?: string;
}

type Row = {
  token: string;
  name: string;
  lat: number;
  lon: number;
  last_notified_at: number | null;
  day_key: string | null;
  day_count: number;
};

const TOKEN_RE = /^(ExponentPushToken|ExpoPushToken)\[[A-Za-z0-9_-]{10,}\]$/;

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname === '/v1/subscription' && req.method === 'PUT') return putSubscription(req, env);
    if (url.pathname === '/health') return new Response('ok');
    return new Response('not found', { status: 404 });
  },

  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(runCheck(env, Date.now()));
  },
};

async function putSubscription(req: Request, env: Env): Promise<Response> {
  if (Number(req.headers.get('content-length') ?? 0) > 2048) return json({ error: 'too_large' }, 413);
  let body: { token?: unknown; point?: { name?: unknown; lat?: unknown; lon?: unknown } | null };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'bad_json' }, 400);
  }
  const token = typeof body.token === 'string' ? body.token : '';
  if (!TOKEN_RE.test(token)) return json({ error: 'bad_token' }, 400);

  // 祈願を解除した
  if (body.point === null || body.point === undefined) {
    await env.DB.prepare('DELETE FROM subscriptions WHERE token = ?').bind(token).run();
    return json({ ok: true });
  }

  const name = String(body.point.name ?? '').trim().slice(0, 50);
  const lat = Number(body.point.lat);
  const lon = Number(body.point.lon);
  if (!name || !(lat > -90 && lat < 90) || !(lon > -180 && lon < 180)) return json({ error: 'bad_point' }, 400);

  // 地点を付け替えても、その日の回数と直近の通知時刻は引き継ぐ（付け替えで上限を抜けられないように）
  await env.DB.prepare(
    `INSERT INTO subscriptions (token, name, lat, lon, updated_at, day_count)
     VALUES (?1, ?2, ?3, ?4, ?5, 0)
     ON CONFLICT(token) DO UPDATE SET name = ?2, lat = ?3, lon = ?4, updated_at = ?5`,
  )
    .bind(token, name, lat, lon, Date.now())
    .run();
  return json({ ok: true });
}

export async function runCheck(env: Env, nowMs: number): Promise<void> {
  const { results } = await env.DB.prepare('SELECT * FROM subscriptions').all<Row>();
  if (!results?.length) return;

  const byArea = new Map<string, Row[]>();
  for (const r of results) {
    const k = areaKey(r.lat, r.lon);
    byArea.set(k, [...(byArea.get(k) ?? []), r]);
  }

  const messages: { row: Row; state: NotifyState; tz: number }[] = [];
  for (const rows of byArea.values()) {
    const w = await fetchWeather(env, rows[0].lat, rows[0].lon);
    if (!w) continue;
    if (!judge(w).cloudy) continue;
    for (const row of rows) {
      const state: NotifyState = { lastNotifiedAt: row.last_notified_at, dayKey: row.day_key, dayCount: row.day_count };
      if (canNotify(state, nowMs, w.timezone_offset)) messages.push({ row, state, tz: w.timezone_offset });
    }
  }
  if (!messages.length) return;

  // Expo Push は 1 リクエスト 100 件まで
  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100);
    const tickets = await sendPush(
      env,
      chunk.map(({ row }) => ({
        to: row.token,
        title: `${row.name}の上空`,
        body: 'ねぇ、今から曇るよ',
        sound: 'notification_sound.wav',
        channelId: 'clouding',
        priority: 'high',
        data: { url: '/cloudy', name: row.name },
      })),
    );
    const stmts: D1PreparedStatement[] = [];
    chunk.forEach(({ row, state, tz }, j) => {
      const t = tickets?.[j];
      if (t?.status === 'error' && t.details?.error === 'DeviceNotRegistered') {
        stmts.push(env.DB.prepare('DELETE FROM subscriptions WHERE token = ?').bind(row.token));
        return;
      }
      if (t?.status !== 'ok') return;
      const next = afterNotify(state, nowMs, tz);
      stmts.push(
        env.DB.prepare('UPDATE subscriptions SET last_notified_at = ?, day_key = ?, day_count = ? WHERE token = ?').bind(
          next.lastNotifiedAt,
          next.dayKey,
          next.dayCount,
          row.token,
        ),
      );
    });
    if (stmts.length) await env.DB.batch(stmts);
  }
}

async function fetchWeather(env: Env, lat: number, lon: number): Promise<Weather | null> {
  const u = new URL('https://api.openweathermap.org/data/3.0/onecall');
  u.searchParams.set('lat', String(lat));
  u.searchParams.set('lon', String(lon));
  u.searchParams.set('exclude', 'minutely,daily,alerts');
  u.searchParams.set('appid', env.OPENWEATHER_API_KEY);
  try {
    const res = await fetch(u);
    if (!res.ok) {
      console.warn('weather', res.status, await res.text());
      return null;
    }
    const w = (await res.json()) as Weather;
    if (!w?.current || !Array.isArray(w.hourly)) return null;
    return w;
  } catch (e) {
    console.warn('weather failed', e);
    return null;
  }
}

type Ticket = { status: 'ok' | 'error'; details?: { error?: string } };

async function sendPush(env: Env, messages: object[]): Promise<Ticket[] | null> {
  const headers: Record<string, string> = { 'content-type': 'application/json', accept: 'application/json' };
  if (env.EXPO_ACCESS_TOKEN) headers.authorization = `Bearer ${env.EXPO_ACCESS_TOKEN}`;
  try {
    const res = await fetch('https://exp.host/--/api/v2/push/send', { method: 'POST', headers, body: JSON.stringify(messages) });
    const body = (await res.json()) as { data?: Ticket[] };
    return body.data ?? null;
  } catch (e) {
    console.warn('push failed', e);
    return null;
  }
}

function json(v: unknown, status = 200): Response {
  return new Response(JSON.stringify(v), { status, headers: { 'content-type': 'application/json' } });
}

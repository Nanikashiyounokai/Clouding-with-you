import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

import { MAX_POINTS, newId, round4, type Point } from '../domain/points';

/**
 * 旧版（Android 1.6.x・Realm Java）の登録地点を 1 回だけ取り込む。
 *
 * 同じ applicationId（com.skart.clouding_with_you）で上書きアップデートするので、
 * 旧版の Realm ファイル files/default.realm はアプリのデータ領域にそのまま残っている。
 *
 * | クラス | 列 |
 * | --- | --- |
 * | Point | id(Long), point_name, active("True"/"False"), lat(Double), lon(Double) |
 *
 * - iOS 版は存在しなかったので Android だけ。
 * - 旧ファイルは file format v10 系。realm-js 20 は開くときに v24 へ書き換えるので、
 *   原本ではなくキャッシュにコピーしてから開く（原本は残す）。偏りルーレットと同じ手順。
 * - realm は「読むためだけ」に入れている。取り込みが済めば二度と開かない。
 */
export async function importLegacyPoints(): Promise<Point[]> {
  if (Platform.OS !== 'android') return [];

  const original = new File(Paths.document, 'default.realm');
  if (!original.exists) return [];

  // 新規インストール直後はキャッシュディレクトリがまだ無く、copy が黙って失敗する（偏りルーレットで発生）。
  // 失敗したまま開くと空のファイルを新しく作って「旧データ 0 件」で取り込み済みになるので、投げて次回やり直す
  const dir = new Directory(Paths.cache, 'legacy-realm');
  dir.create({ intermediates: true, idempotent: true });
  const copy = new File(dir, `default-${Date.now()}.realm`);
  // SDK 57 では copy は非同期。await しないとリリースビルドで間に合わない
  await original.copy(copy);
  if (!copy.exists || copy.size !== original.size) throw new Error('旧 Realm ファイルをコピーできなかった');

  const Realm = (await import('realm')).default;
  const realm = await Realm.open({ path: copy.uri.replace(/^file:\/\//, '') });
  try {
    if (!realm.schema.some((s: { name: string }) => s.name === 'Point')) return [];
    const rows: LegacyRow[] = [];
    for (const o of realm.objects('Point')) rows.push(o as unknown as LegacyRow);
    return toPoints(rows);
  } finally {
    realm.close();
    try {
      copy.delete();
    } catch {
      // 消せなくても OS がキャッシュを掃除する
    }
  }
}

export type LegacyRow = {
  id?: unknown;
  point_name?: unknown;
  active?: unknown;
  lat?: unknown;
  lon?: unknown;
};

/** 旧データの行を地点に読み替える。テストのため export */
export function toPoints(rows: LegacyRow[]): Point[] {
  const sorted = [...rows].sort((a, b) => Number(a.id ?? 0) - Number(b.id ?? 0));
  const out: Point[] = [];
  for (const r of sorted) {
    const name = String(r.point_name ?? '').trim();
    const lat = Number(r.lat);
    const lon = Number(r.lon);
    if (!name || !Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    if (lat <= -90 || lat >= 90 || lon <= -180 || lon >= 180) continue;
    out.push({ id: newId(), name, lat: round4(lat), lon: round4(lon), active: r.active === 'True' });
    if (out.length >= MAX_POINTS) break;
  }
  // 旧版のバグで祈願中が複数残っている可能性がある。最初の 1 つだけ残す
  let seen = false;
  for (const p of out) {
    if (p.active && seen) p.active = false;
    if (p.active) seen = true;
  }
  return out;
}

/**
 * 観測地点。旧版（Android 1.6.x）の Realm の Point と同じ中身。
 *
 * 旧版の仕様をそのまま引き継ぐ:
 * - 登録できるのは最大 10 地点
 * - 「祈願中」（＝曇りを見張る地点）は 1 地点だけ
 * - 1 件目は自動で祈願中にする
 * - 緯度経度は小数第 4 位で丸める
 */
export type Point = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  active: boolean;
};

export const MAX_POINTS = 10;

export type PointInput = { name: string; lat: number; lon: number };

export type ValidationError = 'name' | 'lat' | 'lon' | 'full';

export function round4(v: number): number {
  return Math.round(v * 10000) / 10000;
}

/** 入力の検査。旧版は数値でない文字で落ちていた（toDouble の NumberFormatException） */
export function validate(input: { name: string; lat: string | number; lon: string | number }, count: number): ValidationError | null {
  if (count >= MAX_POINTS) return 'full';
  if (!input.name.trim()) return 'name';
  const lat = typeof input.lat === 'number' ? input.lat : Number(String(input.lat).trim());
  if (String(input.lat).trim() === '' || !Number.isFinite(lat) || lat <= -90 || lat >= 90) return 'lat';
  const lon = typeof input.lon === 'number' ? input.lon : Number(String(input.lon).trim());
  if (String(input.lon).trim() === '' || !Number.isFinite(lon) || lon <= -180 || lon >= 180) return 'lon';
  return null;
}

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function addPoint(points: Point[], input: PointInput, id: string = newId()): Point[] {
  const point: Point = {
    id,
    name: input.name.trim(),
    lat: round4(input.lat),
    lon: round4(input.lon),
    active: points.length === 0,
  };
  return [...points, point];
}

export function removePoint(points: Point[], id: string): Point[] {
  return points.filter((p) => p.id !== id);
}

/** 祈願中を切り替える。祈願中をもう一度押すと解除（旧版と同じ） */
export function toggleActive(points: Point[], id: string): Point[] {
  const target = points.find((p) => p.id === id);
  if (!target) return points;
  if (target.active) return points.map((p) => (p.id === id ? { ...p, active: false } : p));
  return points.map((p) => ({ ...p, active: p.id === id }));
}

export function activePoint(points: Point[]): Point | null {
  return points.find((p) => p.active) ?? null;
}

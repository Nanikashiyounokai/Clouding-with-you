import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { activePoint, addPoint, removePoint, toggleActive, type Point, type PointInput } from './domain/points';
import { importLegacyPoints } from './migration/legacy';
import { getPushToken, syncSubscription, type PushResult } from './push';

const KEY_POINTS = 'points.v1';
const KEY_LEGACY_DONE = 'legacyImported.v1';

/** idle: まだ確認していない／ok: 届く／offline: サーバーに伝えられなかった／それ以外は getPushToken の失敗理由 */
export type NotifyStatus = 'idle' | 'ok' | 'offline' | Extract<PushResult, { error: string }>['error'];

type Store = {
  loaded: boolean;
  points: Point[];
  active: Point | null;
  /** 通知が届く状態か。登録地点画面で案内を出すのに使う */
  notify: NotifyStatus;
  add: (input: PointInput) => void;
  remove: (id: string) => void;
  toggle: (id: string) => void;
};

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [points, setPoints] = useState<Point[]>([]);
  const [notify, setNotify] = useState<NotifyStatus>('idle');
  const token = useRef<string | null>(null);

  // 起動時：保存済みの地点を読み、初回だけ旧版のデータを取り込む
  useEffect(() => {
    (async () => {
      let saved: Point[] = [];
      try {
        const raw = await AsyncStorage.getItem(KEY_POINTS);
        if (raw) saved = JSON.parse(raw) as Point[];
      } catch (e) {
        console.warn('load failed', e);
      }
      try {
        if (!(await AsyncStorage.getItem(KEY_LEGACY_DONE))) {
          const legacy = await importLegacyPoints();
          if (legacy.length && saved.length === 0) {
            saved = legacy;
            await AsyncStorage.setItem(KEY_POINTS, JSON.stringify(saved));
          }
          await AsyncStorage.setItem(KEY_LEGACY_DONE, '1');
        }
      } catch (e) {
        // 取り込みに失敗しても次回の起動でやり直す
        console.warn('legacy import failed', e);
      }
      setPoints(saved);
      setLoaded(true);
    })();
  }, []);

  const active = useMemo(() => activePoint(points), [points]);

  // 祈願中の地点が変わったらサーバーに伝える（起動時も 1 回送り直す）
  const syncKey = active ? `${active.name}|${active.lat}|${active.lon}` : '';
  useEffect(() => {
    if (!loaded) return;
    let cancelled = false;
    (async () => {
      if (!active && !token.current) return; // 祈願中が無く、まだ一度もトークンを取っていない
      if (!token.current) {
        const r = await getPushToken();
        if ('error' in r) {
          if (!cancelled) setNotify(r.error);
          return;
        }
        token.current = r.token;
      }
      const ok = await syncSubscription(token.current, active);
      if (!cancelled) setNotify(ok ? 'ok' : 'offline');
    })();
    return () => {
      cancelled = true;
    };
    // active は syncKey で代表させる
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, syncKey]);

  const save = useCallback((next: Point[]) => {
    setPoints(next);
    AsyncStorage.setItem(KEY_POINTS, JSON.stringify(next)).catch((e) => console.warn('save failed', e));
  }, []);

  const value = useMemo<Store>(
    () => ({
      loaded,
      points,
      active,
      notify,
      add: (input) => save(addPoint(points, input)),
      remove: (id) => save(removePoint(points, id)),
      toggle: (id) => save(toggleActive(points, id)),
    }),
    [loaded, points, active, notify, save],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const v = useContext(Ctx);
  if (!v) throw new Error('StoreProvider がない');
  return v;
}

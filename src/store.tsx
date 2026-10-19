import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { registerCloudTask } from './clouds/background';
import { refreshClouds, type CloudStatus } from './clouds';
import { activePoint, addPoint, removePoint, toggleActive, type Point, type PointInput } from './domain/points';
import { importLegacyPoints } from './migration/legacy';
import { KEYS } from './storageKeys';

/** idle: まだ確認していない／ok: 予報が取れて予約できた／offline: 予報が取れなかった／denied: 通知が許可されていない */
export type NotifyStatus = 'idle' | Exclude<CloudStatus, 'none' | 'no-consent'>;

type Store = {
  loaded: boolean;
  points: Point[];
  active: Point | null;
  /** 初回の説明（登録した場所を MET Norway に送る）に同意したか */
  consented: boolean;
  acceptConsent: () => void;
  /** 通知が届く状態か。登録地点画面で案内を出すのに使う */
  notify: NotifyStatus;
  /** 祈願中の地点で次に曇りそうな時刻（ミリ秒）。無ければ null */
  nextCloud: number | null;
  add: (input: PointInput) => void;
  remove: (id: string) => void;
  toggle: (id: string) => void;
};

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [points, setPoints] = useState<Point[]>([]);
  const [consented, setConsented] = useState(false);
  const [notify, setNotify] = useState<NotifyStatus>('idle');
  const [nextCloud, setNextCloud] = useState<number | null>(null);
  // 取り直しは保存済みの地点を読むので、保存が終わるのを待ってから動かす
  const saving = useRef<Promise<unknown>>(Promise.resolve());

  // 起動時：保存済みの地点を読み、初回だけ旧版のデータを取り込む
  useEffect(() => {
    (async () => {
      let saved: Point[] = [];
      try {
        const raw = await AsyncStorage.getItem(KEYS.points);
        if (raw) saved = JSON.parse(raw) as Point[];
      } catch (e) {
        console.warn('load failed', e);
      }
      try {
        if (!(await AsyncStorage.getItem(KEYS.legacyImported))) {
          const legacy = await importLegacyPoints();
          if (legacy.length && saved.length === 0) {
            saved = legacy;
            await AsyncStorage.setItem(KEYS.points, JSON.stringify(saved));
          }
          await AsyncStorage.setItem(KEYS.legacyImported, '1');
        }
      } catch (e) {
        // 取り込みに失敗しても次回の起動でやり直す
        console.warn('legacy import failed', e);
      }
      setConsented(!!(await AsyncStorage.getItem(KEYS.consent).catch(() => null)));
      setPoints(saved);
      setLoaded(true);
    })();
  }, []);

  const active = useMemo(() => activePoint(points), [points]);

  // 祈願中の地点が変わったら、予報を取り直して通知を予約し直す（起動時も 1 回）
  const refresh = useCallback(async (askPermission: boolean) => {
    await saving.current;
    const r = await refreshClouds({ askPermission });
    if (r.status === 'no-consent') return;
    setNotify(r.status === 'none' ? 'idle' : r.status);
    setNextCloud(r.nextOnset);
  }, []);

  const syncKey = active ? `${active.name}|${active.lat}|${active.lon}` : '';
  useEffect(() => {
    if (!loaded || !consented) return;
    // refresh は await のあとで state を変えるので、描画中に連鎖はしない
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh(true).catch((e) => console.warn('refresh failed', e));
    // active は syncKey で代表させる
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, consented, syncKey]);

  // アプリに戻ってきたときも取り直す（10 分以内なら前回の予報を使う）
  useEffect(() => {
    if (!consented) return;
    registerCloudTask().catch((e) => console.warn('task register failed', e));
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') refresh(false).catch(() => {});
    });
    return () => sub.remove();
  }, [consented, refresh]);

  const acceptConsent = useCallback(() => {
    setConsented(true);
    AsyncStorage.setItem(KEYS.consent, new Date().toISOString()).catch((e) => console.warn('consent save failed', e));
  }, []);

  const save = useCallback((next: Point[]) => {
    setPoints(next);
    saving.current = AsyncStorage.setItem(KEYS.points, JSON.stringify(next)).catch((e) => console.warn('save failed', e));
  }, []);

  const value = useMemo<Store>(
    () => ({
      loaded,
      points,
      active,
      consented,
      acceptConsent,
      notify,
      nextCloud,
      add: (input) => save(addPoint(points, input)),
      remove: (id) => save(removePoint(points, id)),
      toggle: (id) => save(toggleActive(points, id)),
    }),
    [loaded, points, active, consented, acceptConsent, notify, nextCloud, save],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const v = useContext(Ctx);
  if (!v) throw new Error('StoreProvider がない');
  return v;
}

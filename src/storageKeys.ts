/** AsyncStorage のキー。画面（store）と裏の取り直し（clouds/background）の両方から読むのでここにまとめる */
export const KEYS = {
  points: 'points.v1',
  legacyImported: 'legacyImported.v1',
  /** 初回の説明（登録した場所を MET Norway に送る）に同意した日時 */
  consent: 'consent.metno.v1',
  forecast: 'clouds.forecast.v1',
  cloudState: 'clouds.state.v1',
} as const;

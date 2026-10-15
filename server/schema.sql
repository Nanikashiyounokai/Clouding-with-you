-- 祈願中の地点（1 端末 1 行）。端末のプッシュトークンが主キー
CREATE TABLE IF NOT EXISTS subscriptions (
  token            TEXT PRIMARY KEY,
  name             TEXT    NOT NULL,
  lat              REAL    NOT NULL,
  lon              REAL    NOT NULL,
  updated_at       INTEGER NOT NULL,
  last_notified_at INTEGER,
  day_key          TEXT,
  day_count        INTEGER NOT NULL DEFAULT 0
);

-- 地域（0.1 度四方）ごとの曇りの記録。定期処理で天気を取った地域だけ記録される
-- last_cloudy_at: 最後に「曇っていない → 曇り」に変わった時刻（ミリ秒）
CREATE TABLE IF NOT EXISTS areas (
  area_key       TEXT PRIMARY KEY,
  last_clouds    INTEGER,
  last_cloudy_at INTEGER,
  updated_at     INTEGER NOT NULL
);

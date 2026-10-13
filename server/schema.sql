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

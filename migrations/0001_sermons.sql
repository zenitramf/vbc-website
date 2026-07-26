CREATE TABLE sermons (
  youtube_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  speaker TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  published_at TEXT NOT NULL,
  youtube_url TEXT NOT NULL,
  synced_at TEXT NOT NULL
);

CREATE INDEX sermons_published_at_idx ON sermons (published_at DESC);

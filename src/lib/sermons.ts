export interface Sermon {
  publishedAt: string;
  speaker: string;
  thumbnailUrl: string;
  title: string;
  youtubeId: string;
  youtubeUrl: string;
}

interface SermonRow {
  published_at: string;
  speaker: string;
  thumbnail_url: string;
  title: string;
  youtube_id: string;
  youtube_url: string;
}

interface SermonsEnv {
  fvbc_sermons: D1Database;
}

const toSermon = (row: SermonRow): Sermon => ({
  publishedAt: row.published_at,
  speaker: row.speaker,
  thumbnailUrl: row.thumbnail_url,
  title: row.title,
  youtubeId: row.youtube_id,
  youtubeUrl: row.youtube_url,
});

export const getSermons = async (
  environment: SermonsEnv
): Promise<Sermon[]> => {
  const result = await environment.fvbc_sermons
    .prepare(
      `SELECT youtube_id, title, speaker, thumbnail_url, published_at, youtube_url
       FROM sermons
       ORDER BY published_at DESC`
    )
    .all<SermonRow>();

  return (result.results ?? []).map(toSermon);
};

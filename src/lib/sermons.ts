export const formatSermonDate = (publishedAt: string): string =>
  new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeZone: "America/Los_Angeles",
  }).format(new Date(publishedAt));

/** YouTube description marker used to identify the featured Sunday morning service. */
export const PRIMARY_SERMON_DESCRIPTION_MARKER = "Sunday Morning Service";

export interface Sermon {
  publishedAt: string;
  speaker: string;
  thumbnailUrl: string;
  title: string;
  youtubeId: string;
  youtubeUrl: string;
}

interface SermonRow {
  description: string;
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

const isPrimarySermon = (description: string): boolean =>
  description.includes(PRIMARY_SERMON_DESCRIPTION_MARKER);

export interface SermonsPageData {
  archive: Sermon[];
  featured: Sermon | undefined;
}

/**
 * Loads sermons newest-first and picks the featured (primary) video as the
 * latest entry whose YouTube description contains "Sunday Morning Service".
 * Falls back to the overall latest sermon when none match.
 */
export const getSermonsPageData = async (
  environment: SermonsEnv
): Promise<SermonsPageData> => {
  const result = await environment.fvbc_sermons
    .prepare(
      `SELECT youtube_id, title, speaker, thumbnail_url, published_at, youtube_url, description
       FROM sermons
       ORDER BY published_at DESC`
    )
    .all<SermonRow>();

  const rows = result.results ?? [];

  if (rows.length === 0) {
    return { archive: [], featured: undefined };
  }

  const primaryIndex = rows.findIndex((row) =>
    isPrimarySermon(row.description)
  );
  const featuredIndex = primaryIndex === -1 ? 0 : primaryIndex;
  const featured = toSermon(rows[featuredIndex]);
  const archive = rows
    .filter((_, index) => index !== featuredIndex)
    .map(toSermon);

  return { archive, featured };
};

export const getSermons = async (
  environment: SermonsEnv
): Promise<Sermon[]> => {
  const result = await environment.fvbc_sermons
    .prepare(
      `SELECT youtube_id, title, speaker, thumbnail_url, published_at, youtube_url, description
       FROM sermons
       ORDER BY published_at DESC`
    )
    .all<SermonRow>();

  return (result.results ?? []).map(toSermon);
};

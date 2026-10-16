const CHANNEL_HANDLE = "fresnovictory";
const DEFAULT_SPEAKER = "Pastor Willis";
const PLAYLIST_PAGE_SIZE = 50;
const SHORTS_MAX_SECONDS = 60;
const VIDEO_DETAILS_BATCH_SIZE = 50;
const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

// Workers Free allows 50 external subrequests per invocation, so a sync must
// never re-fetch the channel's full upload history. Each run scans at most
// MAX_PLAYLIST_PAGES_PER_SYNC playlist pages for new uploads (stopping as
// soon as a page has nothing new) and refreshes one rotating batch of
// already-stored sermons, keeping a run to roughly a dozen fetches.
const MAX_PLAYLIST_PAGES_PER_SYNC = 8;
const REFRESH_SERMON_LIMIT = 50;
// Re-examine unknown uploads from slightly before the newest stored sermon
// so uploads published around the previous run are not missed.
const SYNC_OVERLAP_MS = 48 * 60 * 60 * 1000;

const ISO_DURATION_PATTERN = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/;

interface YouTubeSermonsEnv {
  YOUTUBE_API_KEY?: string;
  fvbc_sermons: D1Database;
}

interface ChannelListResponse {
  items?: {
    contentDetails?: {
      relatedPlaylists?: {
        uploads?: string;
      };
    };
  }[];
}

interface PlaylistItem {
  contentDetails?: {
    videoId?: string;
    videoPublishedAt?: string;
  };
}

interface PlaylistItemsResponse {
  items?: PlaylistItem[];
  nextPageToken?: string;
}

interface StoredSermonRow {
  published_at: string;
  synced_at: string;
  youtube_id: string;
}

interface VideoListResponse {
  items?: YouTubeVideo[];
}

interface YouTubeVideo {
  contentDetails?: {
    duration?: string;
  };
  id?: string;
  liveStreamingDetails?: Record<string, unknown>;
  snippet?: {
    description?: string;
    publishedAt?: string;
    thumbnails?: {
      high?: { url?: string };
      medium?: { url?: string };
      default?: { url?: string };
    };
    title?: string;
  };
}

export interface SyncedSermon {
  description: string;
  publishedAt: string;
  speaker: string;
  thumbnailUrl: string;
  title: string;
  youtubeId: string;
  youtubeUrl: string;
}

export interface SermonSyncResult {
  synced: number;
  skipped: number;
}

const getApiKey = (environment: YouTubeSermonsEnv): string => {
  const apiKey = environment.YOUTUBE_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("YOUTUBE_API_KEY is not configured.");
  }

  return apiKey;
};

const youtubeFetch = async <T>(
  path: string,
  apiKey: string,
  params: Record<string, string>
): Promise<T> => {
  const url = new URL(`${YOUTUBE_API_BASE}/${path}`);
  url.search = new URLSearchParams({ ...params, key: apiKey }).toString();

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `YouTube API ${path} failed with status ${response.status}.`
    );
  }

  return (await response.json()) as T;
};

const getUploadsPlaylistId = async (apiKey: string): Promise<string> => {
  const data = await youtubeFetch<ChannelListResponse>("channels", apiKey, {
    forHandle: CHANNEL_HANDLE,
    part: "contentDetails",
  });

  const uploadsPlaylistId =
    data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

  if (!uploadsPlaylistId) {
    throw new Error(
      `Could not resolve uploads playlist for @${CHANNEL_HANDLE}.`
    );
  }

  return uploadsPlaylistId;
};

const createPlaylistPageParams = (
  uploadsPlaylistId: string,
  pageToken?: string
): Record<string, string> => ({
  maxResults: String(PLAYLIST_PAGE_SIZE),
  part: "contentDetails",
  playlistId: uploadsPlaylistId,
  ...(pageToken ? { pageToken } : {}),
});

/**
 * Stored sermons ordered by least-recently-synced first, so the first
 * REFRESH_SERMON_LIMIT rows form a rotating metadata-refresh batch.
 */
const getStoredSermons = async (
  database: D1Database
): Promise<StoredSermonRow[]> => {
  const result = await database
    .prepare(
      `SELECT youtube_id, published_at, synced_at
       FROM sermons
       ORDER BY synced_at ASC`
    )
    .all<StoredSermonRow>();

  return result.results ?? [];
};

const getCandidateThresholdMs = (
  storedSermons: StoredSermonRow[]
): number | undefined => {
  let latestPublishedMs: number | undefined;

  for (const sermon of storedSermons) {
    const publishedMs = Date.parse(sermon.published_at);
    if (
      !Number.isNaN(publishedMs) &&
      (latestPublishedMs === undefined || publishedMs > latestPublishedMs)
    ) {
      latestPublishedMs = publishedMs;
    }
  }

  return latestPublishedMs === undefined
    ? undefined
    : latestPublishedMs - SYNC_OVERLAP_MS;
};

const collectCandidateVideoIds = (
  items: PlaylistItem[] | undefined,
  knownVideoIds: ReadonlySet<string>,
  thresholdMs: number | undefined
): string[] =>
  (items ?? []).flatMap((item) => {
    const videoId = item.contentDetails?.videoId;
    const videoPublishedAt = item.contentDetails?.videoPublishedAt;

    // Items without a publish date are deleted/private placeholders.
    if (!(videoId && videoPublishedAt) || knownVideoIds.has(videoId)) {
      return [];
    }

    if (
      thresholdMs !== undefined &&
      Date.parse(videoPublishedAt) < thresholdMs
    ) {
      return [];
    }

    return [videoId];
  });

/**
 * Scans the uploads playlist newest-first for videos not yet stored,
 * stopping at the first page with nothing new. The uploads playlist is in
 * reverse chronological order, so later pages can only be older. The page
 * cap bounds the fetch count when catching up after a long gap (or seeding
 * an empty database, which then backfills the newest uploads first).
 */
const getCandidateVideoIds = async (
  apiKey: string,
  uploadsPlaylistId: string,
  knownVideoIds: ReadonlySet<string>,
  thresholdMs: number | undefined
): Promise<string[]> => {
  const videoIds: string[] = [];
  let pageToken: string | undefined;

  for (let page = 0; page < MAX_PLAYLIST_PAGES_PER_SYNC; page += 1) {
    const data = await youtubeFetch<PlaylistItemsResponse>(
      "playlistItems",
      apiKey,
      createPlaylistPageParams(uploadsPlaylistId, pageToken)
    );
    const pageCandidates = collectCandidateVideoIds(
      data.items,
      knownVideoIds,
      thresholdMs
    );
    videoIds.push(...pageCandidates);
    pageToken = data.nextPageToken;

    if (pageCandidates.length === 0 || !pageToken) {
      break;
    }
  }

  return videoIds;
};

const chunk = <T>(values: T[], size: number): T[][] => {
  const chunks: T[][] = [];

  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }

  return chunks;
};

const parseDurationSeconds = (duration: string): number => {
  const match = ISO_DURATION_PATTERN.exec(duration);

  if (!match) {
    return 0;
  }

  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);

  return hours * 3600 + minutes * 60 + seconds;
};

const getThumbnailUrl = (video: YouTubeVideo): string | undefined => {
  const thumbnails = video.snippet?.thumbnails;

  return (
    thumbnails?.high?.url ?? thumbnails?.medium?.url ?? thumbnails?.default?.url
  );
};

const isShort = (video: YouTubeVideo): boolean => {
  const title = video.snippet?.title ?? "";
  const duration = video.contentDetails?.duration;

  if (title.toLowerCase().includes("#shorts")) {
    return true;
  }

  if (!duration) {
    return false;
  }

  const durationSeconds = parseDurationSeconds(duration);

  return durationSeconds > 0 && durationSeconds <= SHORTS_MAX_SECONDS;
};

const isLivestreamArchive = (video: YouTubeVideo): boolean =>
  video.liveStreamingDetails !== undefined;

const toSyncedSermon = (video: YouTubeVideo): SyncedSermon | undefined => {
  const youtubeId = video.id;
  const title = video.snippet?.title?.trim();
  const publishedAt = video.snippet?.publishedAt;
  const thumbnailUrl = getThumbnailUrl(video);

  if (!(youtubeId && title && publishedAt && thumbnailUrl)) {
    return undefined;
  }

  if (isLivestreamArchive(video) || isShort(video)) {
    return undefined;
  }

  return {
    description: video.snippet?.description ?? "",
    publishedAt,
    speaker: DEFAULT_SPEAKER,
    thumbnailUrl,
    title,
    youtubeId,
    youtubeUrl: `https://www.youtube.com/watch?v=${youtubeId}`,
  };
};

const getVideoDetails = async (
  apiKey: string,
  videoIds: string[]
): Promise<YouTubeVideo[]> => {
  const videos: YouTubeVideo[] = [];

  for (const ids of chunk(videoIds, VIDEO_DETAILS_BATCH_SIZE)) {
    const data = await youtubeFetch<VideoListResponse>("videos", apiKey, {
      id: ids.join(","),
      part: "snippet,contentDetails,liveStreamingDetails",
    });

    videos.push(...(data.items ?? []));
  }

  return videos;
};

const upsertSermons = async (
  database: D1Database,
  sermons: SyncedSermon[]
): Promise<void> => {
  const syncedAt = new Date().toISOString();
  const statement = database.prepare(
    `INSERT INTO sermons (
       youtube_id, title, speaker, thumbnail_url, published_at, youtube_url, description, synced_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(youtube_id) DO UPDATE SET
       title = excluded.title,
       speaker = excluded.speaker,
       thumbnail_url = excluded.thumbnail_url,
       published_at = excluded.published_at,
       youtube_url = excluded.youtube_url,
       description = excluded.description,
       synced_at = excluded.synced_at`
  );

  for (const batch of chunk(sermons, 40)) {
    await database.batch(
      batch.map((sermon) =>
        statement.bind(
          sermon.youtubeId,
          sermon.title,
          sermon.speaker,
          sermon.thumbnailUrl,
          sermon.publishedAt,
          sermon.youtubeUrl,
          sermon.description,
          syncedAt
        )
      )
    );
  }
};

const selectSermons = (
  videos: YouTubeVideo[]
): { sermons: SyncedSermon[]; skipped: number } => {
  const sermons = videos.flatMap((video) => {
    const sermon = toSyncedSermon(video);
    return sermon ? [sermon] : [];
  });

  return {
    sermons,
    skipped: videos.length - sermons.length,
  };
};

/** New-upload candidates plus the next rotating metadata-refresh batch. */
const getSyncVideoIds = async (
  apiKey: string,
  uploadsPlaylistId: string,
  storedSermons: StoredSermonRow[]
): Promise<string[]> => {
  const knownVideoIds = new Set(
    storedSermons.map((sermon) => sermon.youtube_id)
  );
  const candidateVideoIds = await getCandidateVideoIds(
    apiKey,
    uploadsPlaylistId,
    knownVideoIds,
    getCandidateThresholdMs(storedSermons)
  );
  const refreshVideoIds = storedSermons
    .slice(0, REFRESH_SERMON_LIMIT)
    .map((sermon) => sermon.youtube_id);

  return [...new Set([...candidateVideoIds, ...refreshVideoIds])];
};

/**
 * Incrementally syncs sermons within the Workers subrequest budget: only
 * uploads newer than the stored watermark are examined in detail, plus one
 * rotating batch of stored sermons whose metadata is refreshed. `synced`
 * counts sermons upserted this run and `skipped` counts examined videos
 * filtered out as shorts, livestream archives, or incomplete entries.
 */
export const syncYouTubeSermons = async (
  environment: YouTubeSermonsEnv
): Promise<SermonSyncResult> => {
  const apiKey = getApiKey(environment);
  const database = environment.fvbc_sermons;
  const uploadsPlaylistId = await getUploadsPlaylistId(apiKey);
  const storedSermons = await getStoredSermons(database);
  const videoIds = await getSyncVideoIds(
    apiKey,
    uploadsPlaylistId,
    storedSermons
  );
  const videos =
    videoIds.length === 0 ? [] : await getVideoDetails(apiKey, videoIds);
  const { sermons, skipped } = selectSermons(videos);

  await upsertSermons(database, sermons);

  return {
    skipped,
    synced: sermons.length,
  };
};

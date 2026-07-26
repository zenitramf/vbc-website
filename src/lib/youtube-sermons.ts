const CHANNEL_HANDLE = "fresnovictory";
const DEFAULT_SPEAKER = "Pastor Willis";
const PLAYLIST_PAGE_SIZE = 50;
const SHORTS_MAX_SECONDS = 60;
const VIDEO_DETAILS_BATCH_SIZE = 50;
const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

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

interface PlaylistItemsResponse {
  items?: {
    contentDetails?: {
      videoId?: string;
    };
  }[];
  nextPageToken?: string;
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

const collectPlaylistVideoIds = (
  items: PlaylistItemsResponse["items"]
): string[] =>
  (items ?? []).flatMap((item) => {
    const videoId = item.contentDetails?.videoId;
    return videoId ? [videoId] : [];
  });

const getUploadVideoIds = async (
  apiKey: string,
  uploadsPlaylistId: string
): Promise<string[]> => {
  const videoIds: string[] = [];
  let pageToken: string | undefined;

  do {
    const data = await youtubeFetch<PlaylistItemsResponse>(
      "playlistItems",
      apiKey,
      createPlaylistPageParams(uploadsPlaylistId, pageToken)
    );
    videoIds.push(...collectPlaylistVideoIds(data.items));
    pageToken = data.nextPageToken;
  } while (pageToken);

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
       youtube_id, title, speaker, thumbnail_url, published_at, youtube_url, synced_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(youtube_id) DO UPDATE SET
       title = excluded.title,
       speaker = excluded.speaker,
       thumbnail_url = excluded.thumbnail_url,
       published_at = excluded.published_at,
       youtube_url = excluded.youtube_url,
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

export const syncYouTubeSermons = async (
  environment: YouTubeSermonsEnv
): Promise<SermonSyncResult> => {
  const apiKey = getApiKey(environment);
  const uploadsPlaylistId = await getUploadsPlaylistId(apiKey);
  const videoIds = await getUploadVideoIds(apiKey, uploadsPlaylistId);
  const videos = await getVideoDetails(apiKey, videoIds);
  const { sermons, skipped } = selectSermons(videos);

  await upsertSermons(environment.fvbc_sermons, sermons);

  return {
    skipped,
    synced: sermons.length,
  };
};

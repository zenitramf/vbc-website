import assert from "node:assert/strict";
// oxlint-disable-next-line vitest/no-import-node-test -- this repo has no vitest; tests run on the built-in node:test runner via `pnpm test`.
import test from "node:test";

import { syncYouTubeSermons } from "./youtube-sermons.ts";

// Workers Free allows 50 external subrequests per invocation. The fetch stub
// below enforces that ceiling the same way the runtime does, so a sync that
// re-fetches the full upload history fails here exactly as it did in prod.
const SUBREQUEST_LIMIT = 50;
const PLAYLIST_SIZE = 1205;
const NEW_SERMON_IDS = [
  "new-sermon-1",
  "new-sermon-2",
  "new-sermon-3",
  "new-sermon-4",
  "new-sermon-5",
];

interface CatalogVideo {
  duration: string;
  id: string;
  isLivestream: boolean;
  publishedAt: string;
  title: string;
}

interface SermonRecord {
  description: string;
  published_at: string;
  speaker: string;
  synced_at: string;
  thumbnail_url: string;
  title: string;
  youtube_id: string;
  youtube_url: string;
}

interface FakeStatement {
  all: () => Promise<{ results: SermonRecord[] }>;
  bind: (...values: unknown[]) => FakeStatement;
  binds: unknown[];
  sql: string;
}

type SermonRows = Map<string, SermonRecord>;

const sermonVideo = (id: string, publishedAt: string): CatalogVideo => ({
  duration: "PT45M",
  id,
  isLivestream: false,
  publishedAt,
  title: `Sermon ${id}`,
});

const buildCatalog = (): CatalogVideo[] => {
  const newest: CatalogVideo[] = [
    sermonVideo("new-sermon-1", "2026-10-14T03:46:36Z"),
    sermonVideo("new-sermon-2", "2026-10-14T03:42:19Z"),
    sermonVideo("new-sermon-3", "2026-10-14T03:19:46Z"),
    sermonVideo("new-sermon-4", "2026-10-07T15:47:03Z"),
    sermonVideo("new-sermon-5", "2026-10-07T15:43:17Z"),
    {
      duration: "PT30S",
      id: "new-short",
      isLivestream: false,
      publishedAt: "2026-10-13T12:00:00Z",
      title: "Short clip #shorts",
    },
    {
      duration: "PT1H5M",
      id: "new-livestream",
      isLivestream: true,
      publishedAt: "2026-10-12T12:00:00Z",
      title: "Livestream archive",
    },
    sermonVideo("known-1", "2026-10-07T02:52:16Z"),
    sermonVideo("known-2", "2026-10-07T02:24:35Z"),
    sermonVideo("known-3", "2026-09-21T19:59:02Z"),
  ];
  const fillerCount = PLAYLIST_SIZE - newest.length;
  const filler: CatalogVideo[] = Array.from(
    { length: fillerCount },
    (_, index) => {
      const day = new Date(Date.UTC(2026, 9, 4) - index * 3_600_000);
      return sermonVideo(`filler-${index}`, day.toISOString());
    }
  );
  return [...newest, ...filler];
};

const knownSeedVideos = (catalog: CatalogVideo[]): CatalogVideo[] =>
  catalog.filter((video) => video.id.startsWith("known-"));

const caughtUpSeedVideos = (catalog: CatalogVideo[]): CatalogVideo[] =>
  catalog.filter(
    (video) =>
      video.id.startsWith("known-") || video.id.startsWith("new-sermon-")
  );

const toSermonRecord = (video: CatalogVideo): SermonRecord => ({
  description: "Sunday Morning Service",
  published_at: video.publishedAt,
  speaker: "Pastor Willis",
  synced_at: "2026-10-07T12:01:32.602Z",
  thumbnail_url: `https://img.example/${video.id}.jpg`,
  title: video.title,
  youtube_id: video.id,
  youtube_url: `https://www.youtube.com/watch?v=${video.id}`,
});

const sortedRows = (rows: SermonRows): SermonRecord[] =>
  [...rows.values()].toSorted((a, b) => a.synced_at.localeCompare(b.synced_at));

const createStatement = (
  rows: SermonRows,
  sql: string,
  binds: unknown[] = []
): FakeStatement => ({
  all: () => Promise.resolve({ results: sortedRows(rows) }),
  bind: (...values: unknown[]) => createStatement(rows, sql, values),
  binds,
  sql,
});

const parseInsert = (binds: unknown[]): SermonRecord => {
  const [
    youtubeId,
    title,
    speaker,
    thumbnailUrl,
    publishedAt,
    youtubeUrl,
    description,
    syncedAt,
  ] = binds as string[];
  return {
    description,
    published_at: publishedAt,
    speaker,
    synced_at: syncedAt,
    thumbnail_url: thumbnailUrl,
    title,
    youtube_id: youtubeId,
    youtube_url: youtubeUrl,
  };
};

const applyStatement = (rows: SermonRows, statement: FakeStatement): void => {
  if (!statement.sql.startsWith("INSERT")) {
    return;
  }
  const row = parseInsert(statement.binds);
  rows.set(row.youtube_id, row);
};

const createFakeDatabase = (
  seedVideos: CatalogVideo[]
): { database: D1Database; rows: SermonRows } => {
  const rows: SermonRows = new Map(
    seedVideos.map((video) => [video.id, toSermonRecord(video)])
  );
  const database = {
    batch: (statements: FakeStatement[]): Promise<void> => {
      for (const statement of statements) {
        applyStatement(rows, statement);
      }
      return Promise.resolve();
    },
    prepare: (sql: string): FakeStatement => createStatement(rows, sql),
  };
  return { database: database as unknown as D1Database, rows };
};

const jsonResponse = (data: unknown): Response =>
  ({
    json: () => Promise.resolve(data),
    ok: true,
    status: 200,
  }) as Response;

const playlistPayload = (url: URL, catalog: CatalogVideo[]): unknown => {
  const start = Number(url.searchParams.get("pageToken") ?? 0);
  const page = catalog.slice(start, start + 50);
  const next = start + 50;
  return {
    items: page.map((video) => ({
      contentDetails: {
        videoId: video.id,
        videoPublishedAt: video.publishedAt,
      },
    })),
    ...(next < catalog.length ? { nextPageToken: String(next) } : {}),
  };
};

const videoItem = (video: CatalogVideo): unknown => ({
  contentDetails: { duration: video.duration },
  id: video.id,
  ...(video.isLivestream
    ? { liveStreamingDetails: { actualStartTime: video.publishedAt } }
    : {}),
  snippet: {
    description: "Sunday Morning Service",
    publishedAt: video.publishedAt,
    thumbnails: { high: { url: `https://img.example/${video.id}.jpg` } },
    title: video.title,
  },
});

const videosPayload = (
  url: URL,
  byId: ReadonlyMap<string, CatalogVideo>
): unknown => {
  const ids = (url.searchParams.get("id") ?? "").split(",");
  return {
    items: ids.flatMap((id) => {
      const video = byId.get(id);
      return video ? [videoItem(video)] : [];
    }),
  };
};

const routeYouTubeRequest = (
  url: URL,
  catalog: CatalogVideo[],
  byId: ReadonlyMap<string, CatalogVideo>
): unknown => {
  if (url.pathname.endsWith("/channels")) {
    return {
      items: [{ contentDetails: { relatedPlaylists: { uploads: "UUtest" } } }],
    };
  }
  if (url.pathname.endsWith("/playlistItems")) {
    return playlistPayload(url, catalog);
  }
  if (url.pathname.endsWith("/videos")) {
    return videosPayload(url, byId);
  }
  throw new Error(`Unexpected fetch: ${url}`);
};

const installYouTubeStub = (catalog: CatalogVideo[]): { calls: number } => {
  const byId = new Map(catalog.map((video) => [video.id, video]));
  const state = { calls: 0 };
  globalThis.fetch = ((input: string | URL) => {
    state.calls += 1;
    if (state.calls > SUBREQUEST_LIMIT) {
      return Promise.reject(
        new Error("Too many subrequests by single Worker invocation.")
      );
    }
    const url = new URL(String(input));
    return Promise.resolve(
      jsonResponse(routeYouTubeRequest(url, catalog, byId))
    );
  }) as typeof fetch;
  return state;
};

const runSync = (database: D1Database) =>
  syncYouTubeSermons({ YOUTUBE_API_KEY: "test-key", fvbc_sermons: database });

const assertNewSermonsSynced = (rows: SermonRows): void => {
  for (const id of NEW_SERMON_IDS) {
    assert.ok(rows.has(id), `missing synced sermon ${id}`);
  }
};

test("syncs sermons newer than the stored watermark without refetching the full 1,205-video history", async () => {
  const catalog = buildCatalog();
  const fake = createFakeDatabase(knownSeedVideos(catalog));
  const fetchState = installYouTubeStub(catalog);
  const result = await runSync(fake.database);
  assert.ok(
    fetchState.calls <= SUBREQUEST_LIMIT,
    `expected <= ${SUBREQUEST_LIMIT} fetches, got ${fetchState.calls}`
  );
  assertNewSermonsSynced(fake.rows);
  assert.equal(fake.rows.has("new-short"), false);
  assert.equal(fake.rows.has("new-livestream"), false);
  assert.equal(fake.rows.size, 8);
  assert.ok(result.synced >= 5);
});

test("steady-state sync with nothing new stays within a small fetch budget", async () => {
  const catalog = buildCatalog();
  const fake = createFakeDatabase(caughtUpSeedVideos(catalog));
  const fetchState = installYouTubeStub(catalog);
  await runSync(fake.database);
  assert.ok(
    fetchState.calls <= 10,
    `expected <= 10 fetches in steady state, got ${fetchState.calls}`
  );
  assert.equal(fake.rows.size, 8);
});

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

import { syncYouTubeSermons } from "@/lib/youtube-sermons";

export const prerender = false;

const isAuthorized = (request: Request): boolean => {
  const authorization = request.headers.get("authorization");
  const apiKey = env.YOUTUBE_API_KEY;

  return Boolean(apiKey) && authorization === `Bearer ${apiKey}`;
};

export const GET: APIRoute = async ({ request }) => {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await syncYouTubeSermons(env);

    return Response.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown sync error.";

    return Response.json({ error: message }, { status: 500 });
  }
};

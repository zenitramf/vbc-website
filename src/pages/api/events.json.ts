import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

import { getUpcomingMinistryEvents } from "@/lib/google-calendar";

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const events = await getUpcomingMinistryEvents(env);

    return Response.json(
      { events },
      {
        headers: {
          "cache-control":
            "public, max-age=300, s-maxage=300, stale-while-revalidate=60",
        },
      }
    );
  } catch {
    return Response.json(
      { error: "Upcoming events are temporarily unavailable." },
      { status: 503 }
    );
  }
};

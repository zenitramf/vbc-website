import type { APIRoute } from "astro";

import {
  churchInfo,
  SERVICE_TIMEZONE,
  serviceTimesList,
  spanishServiceTimesList,
} from "@/lib/church-data";

export const prerender = false;

const corsHeaders = {
  "access-control-allow-headers": "Content-Type",
  "access-control-allow-methods": "GET, OPTIONS",
  "access-control-allow-origin": "*",
  "access-control-max-age": "86400",
} as const;

const cacheHeaders = {
  "cache-control":
    "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
} as const;

/** Public service schedule — no auth. CORS open for cross-origin consumers. */
export const GET: APIRoute = () =>
  Response.json(
    {
      church: {
        name: churchInfo.name,
        shortName: churchInfo.shortName,
        url: churchInfo.url,
      },
      /** English-site schedule (includes Sunday school). */
      services: serviceTimesList,
      /** Spanish-site / staging schedule (no Sunday school). */
      spanish: spanishServiceTimesList,
      timezone: SERVICE_TIMEZONE,
    },
    {
      headers: {
        ...corsHeaders,
        ...cacheHeaders,
      },
    }
  );

export const OPTIONS: APIRoute = () =>
  new Response(null, {
    headers: corsHeaders,
    status: 204,
  });

import cloudflare from "@astrojs/cloudflare";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import { loadEnv } from "vite";

import { TURNSTILE_SITE_KEY } from "./src/lib/turnstile.ts";

/**
 * Fails production builds that have no Turnstile site key. Without one the
 * contact and connection forms render no widget and reject every submission.
 * (A throw while prerendering would only truncate the page, not the build.)
 */
const requireTurnstileSiteKey = () => ({
  hooks: {
    "astro:config:setup": ({ command }) => {
      if (command !== "build") {
        return;
      }
      const { PUBLIC_TURNSTILE_SITE_KEY } = loadEnv(
        "production",
        process.cwd(),
        "PUBLIC_"
      );
      if (!(TURNSTILE_SITE_KEY || PUBLIC_TURNSTILE_SITE_KEY)) {
        throw new Error(
          "Missing Turnstile site key: set TURNSTILE_SITE_KEY in src/lib/turnstile.ts (Cloudflare dashboard → Turnstile) or the PUBLIC_TURNSTILE_SITE_KEY build variable."
        );
      }
    },
  },
  name: "require-turnstile-site-key",
});

const sitemapExcludedPaths = new Set([
  "/about",
  "/about/",
  "/connect",
  "/connect/",
  "/connect/thanks",
  "/connect/thanks/",
  "/contact",
  "/contact/",
  "/contact/thanks",
  "/contact/thanks/",
  "/give",
  "/give/",
  "/messages",
  "/messages/",
  "/salvation.html",
  "/salvation.html/",
  "/staff",
  "/staff/",
]);

// https://astro.build/config
export default defineConfig({
  adapter: cloudflare({
    imageService: "passthrough",
    platformProxy: {
      enabled: process.env.CF_PLATFORM_PROXY === "1",
    },
  }),

  image: {
    domains: ["images.fresnovictory.com"],
  },

  integrations: [
    requireTurnstileSiteKey(),
    react(),
    mdx(),
    sitemap({
      filter: (page) => !sitemapExcludedPaths.has(new URL(page).pathname),
    }),
  ],

  redirects: {
    "/about": "/about-vbc/",
    "/give": "https://tithe.ly/give_new/www/#/tithely/give-one-time/1285261",
    "/salvation.html": "/salvation/",
    "/staff": "/meet-the-staff/",
  },

  site: "https://fresnovictory.com",

  trailingSlash: "ignore",

  vite: {
    plugins: [tailwindcss()],
    server: {
      allowedHosts: ["fresnovictory.ngrok.app"],
    },
  },
});

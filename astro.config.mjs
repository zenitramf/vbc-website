import cloudflare from "@astrojs/cloudflare";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

const sitemapExcludedPaths = new Set([
  "/about",
  "/about/",
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

  site: "https://www.fresnovictory.com",

  trailingSlash: "ignore",

  vite: {
    plugins: [tailwindcss()],
    server: {
      allowedHosts: ["fresnovictory.ngrok.app"],
    },
  },
});

import cloudflare from "@astrojs/cloudflare";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

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

  integrations: [react(), mdx()],

  redirects: {
    "/about/": "/about-vbc/",
    "/give/": "https://tithe.ly/give_new/www/#/tithely/give-one-time/1285261",
    "/messages/": "/sermons/",
    "/staff/": "/meet-the-staff/",
  },

  trailingSlash: "always",

  vite: {
    plugins: [tailwindcss()],
    server: {
      allowedHosts: ["fresnovictory.ngrok.app"],
    },
  },
});

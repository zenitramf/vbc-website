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
      enabled: true,
    },
  }),

  image: {
    domains: ["images.fresnovictory.com"],
  },

  integrations: [react(), mdx()],

  output: "server",

  vite: {
    plugins: [tailwindcss()],
  },
});

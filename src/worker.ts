import { handle } from "@astrojs/cloudflare/handler";

import { syncYouTubeSermons } from "@/lib/youtube-sermons";

export default {
  fetch(request, env, ctx) {
    return handle(request, env, ctx);
  },
  async scheduled(_controller, env) {
    try {
      const result = await syncYouTubeSermons(env);
      console.info(
        `YouTube sermon sync complete: synced=${result.synced} skipped=${result.skipped}`
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown sync error.";
      console.error(`YouTube sermon sync failed: ${message}`);
      throw error;
    }
  },
} satisfies ExportedHandler<Env>;

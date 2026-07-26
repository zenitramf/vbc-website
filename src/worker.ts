import { handle } from "@astrojs/cloudflare/handler";

import { syncYouTubeSermons } from "@/lib/youtube-sermons";

export default {
  fetch(request, env, ctx) {
    return handle(request, env, ctx);
  },
  async scheduled(_controller, env) {
    const result = await syncYouTubeSermons(env);
    console.info(
      `YouTube sermon sync complete: synced=${result.synced} skipped=${result.skipped}`
    );
  },
} satisfies ExportedHandler<Env>;

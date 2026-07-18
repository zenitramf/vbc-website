import { Player } from "@remotion/player";

import {
  VIDEO_DURATION_IN_FRAMES,
  VIDEO_FPS,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
} from "@/remotion/constants";
import { PlanOfSalvation } from "@/remotion/plan-of-salvation";

export const SalvationVideoPlayer = () => (
  <div className="overflow-hidden rounded-2xl border border-border bg-[#0f2744] shadow-[0_24px_60px_rgba(15,39,68,0.22)]">
    <Player
      component={PlanOfSalvation}
      compositionHeight={VIDEO_HEIGHT}
      compositionWidth={VIDEO_WIDTH}
      controls
      durationInFrames={VIDEO_DURATION_IN_FRAMES}
      fps={VIDEO_FPS}
      loop
      style={{
        aspectRatio: `${VIDEO_WIDTH} / ${VIDEO_HEIGHT}`,
        width: "100%",
      }}
    />
  </div>
);

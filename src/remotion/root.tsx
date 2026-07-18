import { Composition } from "remotion";

import {
  VIDEO_DURATION_IN_FRAMES,
  VIDEO_FPS,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
  totalSceneFrames,
} from "@/remotion/constants";
import { PlanOfSalvation } from "@/remotion/plan-of-salvation";

if (totalSceneFrames !== VIDEO_DURATION_IN_FRAMES) {
  throw new Error(
    `Plan of Salvation scene length (${totalSceneFrames}) must equal video duration (${VIDEO_DURATION_IN_FRAMES}).`
  );
}

export const RemotionRoot = () => (
  <>
    <Composition
      id="PlanOfSalvation"
      component={PlanOfSalvation}
      durationInFrames={VIDEO_DURATION_IN_FRAMES}
      fps={VIDEO_FPS}
      height={VIDEO_HEIGHT}
      width={VIDEO_WIDTH}
    />
  </>
);

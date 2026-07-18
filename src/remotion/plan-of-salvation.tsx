import { AbsoluteFill, Sequence } from "remotion";

import { ClosingCta } from "@/remotion/components/closing-cta";
import { GospelScene } from "@/remotion/components/gospel-scene";
import { gospelScenes, sceneOffsets } from "@/remotion/constants";
import "@/remotion/fonts";

export const PlanOfSalvation = () => (
  <AbsoluteFill>
    {gospelScenes.map((scene, sceneIndex) => (
      <Sequence
        key={scene.id}
        durationInFrames={scene.durationInFrames}
        from={sceneOffsets[sceneIndex]}
      >
        {scene.kind === "cta" ? (
          <ClosingCta scene={scene} />
        ) : (
          <GospelScene scene={scene} />
        )}
      </Sequence>
    ))}
  </AbsoluteFill>
);

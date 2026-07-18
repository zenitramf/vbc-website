import { AbsoluteFill, Sequence } from "remotion";

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
        <GospelScene
          scene={scene}
          sceneIndex={sceneIndex}
          totalScenes={gospelScenes.length}
        />
      </Sequence>
    ))}
  </AbsoluteFill>
);

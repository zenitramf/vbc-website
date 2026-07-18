import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import { SceneBackdrop } from "@/remotion/components/scene-backdrop";
import type { GospelScene as GospelSceneData } from "@/remotion/constants";
import { colors } from "@/remotion/constants";
import { displayFont, sansFont } from "@/remotion/fonts";

interface GospelSceneProps {
  scene: GospelSceneData;
  sceneIndex: number;
  totalScenes: number;
}

const useSceneMotion = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({
    config: { damping: 200 },
    fps,
    frame,
  });

  return {
    accentWidth: interpolate(frame, [8, 28], [0, 96], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
    bodyOpacity: interpolate(frame, [10, 24], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
    bodyY: interpolate(frame, [10, 24], [18, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
    titleSpring,
    titleY: interpolate(titleSpring, [0, 1], [24, 0]),
    verseOpacity: interpolate(frame, [22, 38], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
    verseY: interpolate(frame, [22, 38], [16, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  };
};

export const GospelScene = ({
  scene,
  sceneIndex,
  totalScenes,
}: GospelSceneProps) => {
  const motion = useSceneMotion();
  const isClosing = scene.id === "close";
  const progress = (sceneIndex + 1) / totalScenes;

  return (
    <AbsoluteFill>
      <SceneBackdrop emphasize={isClosing || scene.id === "gift"} />

      <AbsoluteFill
        style={{
          color: colors.text,
          fontFamily: sansFont,
          justifyContent: "center",
          padding: "0 160px",
        }}
      >
        <div
          style={{
            opacity: motion.titleSpring,
            transform: `translateY(${motion.titleY}px)`,
          }}
        >
          <div
            style={{
              color: colors.accent,
              fontFamily: sansFont,
              fontSize: 28,
              fontWeight: 600,
              letterSpacing: "0.18em",
              marginBottom: 22,
              textTransform: "uppercase",
            }}
          >
            Plan of Salvation · {sceneIndex + 1}/{totalScenes}
          </div>

          <h1
            style={{
              fontFamily: displayFont,
              fontSize: 92,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
              margin: 0,
              maxWidth: 1200,
            }}
          >
            {scene.title}
          </h1>

          <div
            style={{
              background: colors.accent,
              borderRadius: 999,
              height: 4,
              marginTop: 28,
              width: motion.accentWidth,
            }}
          />
        </div>

        <p
          style={{
            color: colors.muted,
            fontSize: 36,
            fontWeight: 500,
            lineHeight: 1.4,
            margin: "34px 0 0",
            maxWidth: 1050,
            opacity: motion.bodyOpacity,
            transform: `translateY(${motion.bodyY}px)`,
          }}
        >
          {scene.body}
        </p>

        <blockquote
          style={{
            borderLeft: `4px solid ${colors.accent}`,
            margin: "48px 0 0",
            maxWidth: 1180,
            opacity: motion.verseOpacity,
            paddingLeft: 28,
            transform: `translateY(${motion.verseY}px)`,
          }}
        >
          <p
            style={{
              fontFamily: displayFont,
              fontSize: 34,
              fontStyle: "italic",
              fontWeight: 500,
              lineHeight: 1.45,
              margin: 0,
            }}
          >
            “{scene.verseQuote}”
          </p>
          <cite
            style={{
              color: isClosing ? colors.cta : colors.accent,
              display: "block",
              fontFamily: sansFont,
              fontSize: 26,
              fontStyle: "normal",
              fontWeight: 700,
              letterSpacing: "0.04em",
              marginTop: 18,
            }}
          >
            {scene.verseReference}
          </cite>
        </blockquote>
      </AbsoluteFill>

      <div
        style={{
          bottom: 56,
          left: 160,
          position: "absolute",
          right: 160,
        }}
      >
        <div
          style={{
            background: "rgba(247, 244, 239, 0.12)",
            borderRadius: 999,
            height: 6,
            overflow: "hidden",
            width: "100%",
          }}
        >
          <div
            style={{
              background: colors.accent,
              borderRadius: 999,
              height: "100%",
              width: `${progress * 100}%`,
            }}
          />
        </div>
        <div
          style={{
            color: colors.muted,
            fontFamily: sansFont,
            fontSize: 22,
            fontWeight: 500,
            marginTop: 14,
          }}
        >
          Fresno Victory Baptist Church
        </div>
      </div>
    </AbsoluteFill>
  );
};

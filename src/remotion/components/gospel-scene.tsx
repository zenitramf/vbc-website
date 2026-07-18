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

export const GospelScene = ({ scene }: GospelSceneProps) => {
  const motion = useSceneMotion();
  const hasVerse = Boolean(scene.verseQuote && scene.verseReference);

  return (
    <AbsoluteFill>
      <SceneBackdrop emphasize={scene.id === "gift"} />

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
          <h1
            style={{
              fontFamily: displayFont,
              fontSize: 88,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              lineHeight: 1.08,
              margin: 0,
              maxWidth: 1220,
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
            lineHeight: 1.45,
            margin: "34px 0 0",
            maxWidth: 1100,
            opacity: motion.bodyOpacity,
            transform: `translateY(${motion.bodyY}px)`,
          }}
        >
          {scene.body}
        </p>

        {hasVerse ? (
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
                color: colors.accent,
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
        ) : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

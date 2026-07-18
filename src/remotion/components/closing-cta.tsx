import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import { SceneBackdrop } from "@/remotion/components/scene-backdrop";
import type { GospelScene } from "@/remotion/constants";
import { colors } from "@/remotion/constants";
import { displayFont, sansFont } from "@/remotion/fonts";

interface ClosingCtaProps {
  scene: GospelScene;
}

export const ClosingCta = ({ scene }: ClosingCtaProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({
    config: { damping: 200 },
    fps,
    frame,
  });

  const bodyOpacity = interpolate(frame, [12, 28], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const bodyY = interpolate(frame, [12, 28], [18, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const actionOpacity = interpolate(frame, [28, 44], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const actionY = interpolate(frame, [28, 44], [16, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const verseOpacity = interpolate(frame, [48, 64], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <SceneBackdrop emphasize />

      <AbsoluteFill
        style={{
          alignItems: "center",
          color: colors.text,
          fontFamily: sansFont,
          justifyContent: "center",
          padding: "0 140px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            opacity: titleSpring,
            transform: `translateY(${interpolate(titleSpring, [0, 1], [24, 0])}px)`,
          }}
        >
          <h1
            style={{
              fontFamily: displayFont,
              fontSize: 86,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              lineHeight: 1.08,
              margin: 0,
              maxWidth: 1280,
            }}
          >
            {scene.title}
          </h1>
        </div>

        <p
          style={{
            color: colors.muted,
            fontSize: 34,
            fontWeight: 500,
            lineHeight: 1.45,
            margin: "30px 0 0",
            maxWidth: 980,
            opacity: bodyOpacity,
            transform: `translateY(${bodyY}px)`,
          }}
        >
          {scene.body}
        </p>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            marginTop: 44,
            opacity: actionOpacity,
            transform: `translateY(${actionY}px)`,
          }}
        >
          <p
            style={{
              color: colors.cta,
              fontFamily: displayFont,
              fontSize: 40,
              fontWeight: 700,
              letterSpacing: "-0.01em",
              margin: 0,
            }}
          >
            Call on Jesus Christ to save you.
          </p>
          <p
            style={{
              color: colors.muted,
              fontSize: 26,
              fontWeight: 500,
              margin: 0,
            }}
          >
            Or reach out — Fresno Victory would love to help.
          </p>
        </div>

        {scene.verseQuote && scene.verseReference ? (
          <p
            style={{
              color: colors.accent,
              fontFamily: displayFont,
              fontSize: 26,
              fontStyle: "italic",
              fontWeight: 500,
              margin: "48px 0 0",
              maxWidth: 980,
              opacity: verseOpacity,
            }}
          >
            “{scene.verseQuote}” — {scene.verseReference}
          </p>
        ) : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

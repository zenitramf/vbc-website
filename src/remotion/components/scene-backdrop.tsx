import type { CSSProperties } from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import { colors } from "@/remotion/constants";

interface SceneBackdropProps {
  emphasize?: boolean;
}

export const SceneBackdrop = ({ emphasize = false }: SceneBackdropProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const breathe = spring({
    config: { damping: 200, stiffness: 40 },
    fps,
    frame,
  });

  const glowScale = interpolate(breathe, [0, 1], [0.92, 1.08]);
  const glowOpacity = interpolate(
    frame,
    [0, 18, 90],
    [0.2, emphasize ? 0.55 : 0.38, emphasize ? 0.48 : 0.32],
    { extrapolateRight: "clamp" }
  );

  const washStyle: CSSProperties = {
    background: `radial-gradient(circle at 50% 42%, ${colors.wash} 0%, transparent 58%)`,
    height: 720,
    left: "50%",
    opacity: glowOpacity,
    position: "absolute",
    top: "38%",
    transform: `translate(-50%, -50%) scale(${glowScale})`,
    width: 980,
  };

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(160deg, ${colors.background} 0%, ${colors.backgroundDeep} 55%, #122c45 100%)`,
      }}
    >
      <div style={washStyle} />
      <AbsoluteFill
        style={{
          backgroundImage:
            "radial-gradient(rgba(247, 244, 239, 0.05) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          opacity: 0.35,
        }}
      />
    </AbsoluteFill>
  );
};

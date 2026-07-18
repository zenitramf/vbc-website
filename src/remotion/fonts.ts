import { loadFont as loadFraunces } from "@remotion/google-fonts/Fraunces";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";

const fraunces = loadFraunces("normal", {
  subsets: ["latin"],
  weights: ["500", "700"],
});

const manrope = loadManrope("normal", {
  subsets: ["latin"],
  weights: ["400", "500", "600", "700"],
});

export const displayFont = fraunces.fontFamily;
export const sansFont = manrope.fontFamily;

export const VIDEO_FPS = 30;
export const VIDEO_WIDTH = 1920;
export const VIDEO_HEIGHT = 1080;

/** Total runtime: 55 seconds (under 1 minute). */
export const VIDEO_DURATION_IN_FRAMES = VIDEO_FPS * 55;

export const colors = {
  accent: "#c9a227",
  background: "#0f2744",
  backgroundDeep: "#0a1b30",
  cta: "#2f9e5c",
  muted: "#a8b8c8",
  text: "#f7f4ef",
  wash: "rgba(201, 162, 39, 0.14)",
} as const;

export interface GospelScene {
  body: string;
  durationInFrames: number;
  id: string;
  kind: "story" | "cta";
  title: string;
  verseQuote?: string;
  verseReference?: string;
}

export const gospelScenes: GospelScene[] = [
  {
    body: "If you've ever wondered what happens after this life — God wants you to know, not guess.",
    durationInFrames: VIDEO_FPS * 6,
    id: "know",
    kind: "story",
    title: "You Can Know",
    verseQuote:
      "These things have I written unto you that believe on the name of the Son of God; that ye may know that ye have eternal life...",
    verseReference: "1 John 5:13",
  },
  {
    body: "Every one of us has sinned. Our sin separates us from a holy God.",
    durationInFrames: VIDEO_FPS * 8,
    id: "problem",
    kind: "story",
    title: "We've All Fallen Short",
    verseQuote: "For all have sinned, and come short of the glory of God.",
    verseReference: "Romans 3:23",
  },
  {
    body: "Sin isn't a small thing. Its wages are spiritual death and eternal separation from God.",
    durationInFrames: VIDEO_FPS * 7,
    id: "penalty",
    kind: "story",
    title: "Sin Separates Us",
    verseQuote:
      "For the wages of sin is death; but the gift of God is eternal life through Jesus Christ our Lord.",
    verseReference: "Romans 6:23",
  },
  {
    body: "Trying harder, being religious, or doing good things still cannot erase our sin.",
    durationInFrames: VIDEO_FPS * 7,
    id: "not-works",
    kind: "story",
    title: "We Can't Earn It",
    verseQuote:
      "For by grace are ye saved through faith; and that not of yourselves: it is the gift of God: Not of works, lest any man should boast.",
    verseReference: "Ephesians 2:8-9",
  },
  {
    body: "God loved us anyway. Jesus died for our sins and rose again, paying the debt we never could.",
    durationInFrames: VIDEO_FPS * 9,
    id: "gift",
    kind: "story",
    title: "But God Loved Us",
    verseQuote:
      "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.",
    verseReference: "John 3:16",
  },
  {
    body: "Salvation is a gift. Turn from trusting yourself, and place your faith in Jesus Christ alone.",
    durationInFrames: VIDEO_FPS * 8,
    id: "response",
    kind: "story",
    title: "Call on Jesus",
    verseQuote:
      "For whosoever shall call upon the name of the Lord shall be saved.",
    verseReference: "Romans 10:13",
  },
  {
    body: "If you're ready, call on Him now. If you have questions, we'd love to talk with you.",
    durationInFrames: VIDEO_FPS * 10,
    id: "close",
    kind: "cta",
    title: "Will You Trust Him Today?",
    verseQuote:
      "But God commendeth his love toward us, in that, while we were yet sinners, Christ died for us.",
    verseReference: "Romans 5:8",
  },
];

const sumSceneFrames = (): number => {
  let total = 0;
  for (const scene of gospelScenes) {
    total += scene.durationInFrames;
  }
  return total;
};

export const totalSceneFrames = sumSceneFrames();

const buildSceneOffsets = (): number[] => {
  const offsets: number[] = [];
  let current = 0;

  for (const scene of gospelScenes) {
    offsets.push(current);
    current += scene.durationInFrames;
  }

  return offsets;
};

export const sceneOffsets = buildSceneOffsets();

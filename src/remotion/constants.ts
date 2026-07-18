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
  title: string;
  verseQuote: string;
  verseReference: string;
}

export const gospelScenes: GospelScene[] = [
  {
    body: "God wants you to know the way of salvation — not guess.",
    durationInFrames: VIDEO_FPS * 6,
    id: "know",
    title: "You Can Know",
    verseQuote:
      "These things have I written unto you that believe on the name of the Son of God; that ye may know that ye have eternal life...",
    verseReference: "1 John 5:13",
  },
  {
    body: "Before we can be saved, we must admit we are lost in sin.",
    durationInFrames: VIDEO_FPS * 8,
    id: "problem",
    title: "The Problem",
    verseQuote: "For all have sinned, and come short of the glory of God.",
    verseReference: "Romans 3:23",
  },
  {
    body: "Sin brings spiritual death and eternal separation from God.",
    durationInFrames: VIDEO_FPS * 7,
    id: "penalty",
    title: "The Penalty",
    verseQuote:
      "For the wages of sin is death; but the gift of God is eternal life through Jesus Christ our Lord.",
    verseReference: "Romans 6:23",
  },
  {
    body: "Religion, effort, and good works cannot remove our sin.",
    durationInFrames: VIDEO_FPS * 8,
    id: "not-works",
    title: "Not by Works",
    verseQuote:
      "For by grace are ye saved through faith; and that not of yourselves: it is the gift of God: Not of works, lest any man should boast.",
    verseReference: "Ephesians 2:8-9",
  },
  {
    body: "Jesus died for our sins and rose again, paying the debt we could never pay.",
    durationInFrames: VIDEO_FPS * 10,
    id: "gift",
    title: "God's Gift",
    verseQuote:
      "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.",
    verseReference: "John 3:16",
  },
  {
    body: "Turn from trusting yourself and place your faith in Jesus Christ alone.",
    durationInFrames: VIDEO_FPS * 8,
    id: "response",
    title: "How to Be Saved",
    verseQuote:
      "For whosoever shall call upon the name of the Lord shall be saved.",
    verseReference: "Romans 10:13",
  },
  {
    body: "Call on Him today. If you have questions, we would love to help.",
    durationInFrames: VIDEO_FPS * 8,
    id: "close",
    title: "Trust Christ Alone",
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

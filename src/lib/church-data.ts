/**
 * Canonical service schedule — single source of truth for the site and the
 * public `/api/service-times.json` endpoint (consumed by other VBC properties).
 * Times are wall-clock in America/Los_Angeles (Fresno).
 */
export const SERVICE_TIMEZONE = "America/Los_Angeles" as const;

export type ServiceTime = {
  id: string;
  label: string;
  day: string;
  time: string;
  /** When true, live Spanish interpretation is available at this gathering. */
  translationAvailable?: boolean;
};

export const serviceTimes = {
  sundaySchool: {
    day: "Sunday",
    id: "sundaySchool",
    label: "Sunday School",
    time: "10am",
  },
  sundayMorning: {
    day: "Sunday",
    id: "sundayMorning",
    label: "Sunday Worship",
    time: "11am",
  },
  sundayNight: {
    day: "Sunday",
    id: "sundayNight",
    label: "Sunday Evening",
    time: "6pm",
  },
  bibleStudy: {
    day: "Thursday",
    id: "bibleStudy",
    label: "Bible Study",
    time: "7pm",
  },
} as const satisfies Record<string, ServiceTime>;

/** English-site ordered schedule (Sunday school through midweek). */
export const serviceTimesList: readonly ServiceTime[] = [
  serviceTimes.sundaySchool,
  serviceTimes.sundayMorning,
  serviceTimes.sundayNight,
  serviceTimes.bibleStudy,
];

/**
 * Spanish-site / staging schedule — no Sunday school; morning is earlier with
 * live translation; evening is a dedicated Spanish service.
 */
export const spanishServiceTimesList: readonly ServiceTime[] = [
  {
    day: "Sunday",
    id: "sundayMorning",
    label: "Sunday Worship",
    time: "10:30am",
    translationAvailable: true,
  },
  {
    day: "Sunday",
    id: "spanishService",
    label: "Spanish Service",
    time: "5pm",
  },
  {
    day: "Thursday",
    id: "bibleStudy",
    label: "Bible Study",
    time: serviceTimes.bibleStudy.time,
  },
];

export const churchInfo = {
  addressLine1: "1717 N Gateway Blvd Ste. #105",
  addressLine2: "Fresno, CA 93727",
  email: "contact@fresnovictory.com",
  facebook: "https://www.facebook.com/fresnovictory",
  logo: "/vbc_logo.svg",
  // Cross-platform Maps URL (short goo.gl links break on many mobile browsers)
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=Victory+Baptist+Church%2C+1717+N+Gateway+Blvd+Ste.+105%2C+Fresno%2C+CA+93727",
  name: "Victory Baptist Church",
  phone: "559-394-1989",
  /** E.164 form, used for `<a href="tel:">` and JSON-LD `telephone`. */
  phoneE164: "+15593941989",
  shortName: "VBC",
  /** Brand navy used in header / skip-link. Surface as `<meta name="theme-color">`. */
  themeColor: "#0f2744",
  /** Canonical public origin. Also drives `astro.config.mjs` `site`. */
  url: "https://fresnovictory.com",
  youtube: "https://www.youtube.com/@fresnovictory",
};

/** Default site-wide SEO values. Per-page overrides merge on top via `buildSEO()`. */
export const defaultSEO = {
  description:
    "Victory Baptist Church in Fresno, California — an independent Baptist church proclaiming the gospel of Jesus Christ through personal evangelism, sound Bible teaching, and Christ-centered worship. Sundays 11am & 6pm, Thursdays 7pm.",
  /** 1200×630 social share image, served from `public/`. */
  ogImage: "/og-default.jpg",
  ogImageAlt: "Fresno skyline and downtown mural",
};

export interface Ministry {
  id: string;
  name: string;
  summary: string;
  featured?: boolean;
}

/** Standing weekly personal evangelism — shown on `/events`. */
export const personalEvangelismTimes = {
  saturday: {
    day: "Saturday",
    id: "saturdayPersonalEvangelism",
    label: "Personal Evangelism",
    time: "10:30am",
  },
} as const satisfies Record<string, ServiceTime>;

export const personalEvangelismTimesList: readonly ServiceTime[] = [
  personalEvangelismTimes.saturday,
];

/** Ministries shown on the home page — personal evangelism / outreach first. */
export const ministries: Ministry[] = [
  {
    featured: true,
    id: "soul-winning",
    name: "Personal Evangelism",
    summary:
      "One of our greatest responsibilities is to reach others with the gospel of Jesus Christ. We engage in weekly door-to-door evangelism, community outreach events, missionary support, and training believers to share the gospel.",
  },
  {
    id: "children",
    name: "Children",
    summary:
      "Sound Bible teaching in a safe environment for infants through sixth grade on Sundays, plus a Thursday night children's program. All volunteers complete child safety training and background checks.",
  },
  {
    id: "teens",
    name: "Teens",
    summary:
      "A spiritually healthy place for teenagers to build friendships, ask hard questions, and grow through relevant Bible teaching, weekly classes, and monthly activities.",
  },
  {
    id: "young-adults",
    name: "Young Adults",
    summary:
      "Regular gatherings for high school graduates and college-age adults who want to strengthen their faith and build godly friendships in a pivotal season of life.",
  },
  {
    id: "men",
    name: "Men",
    summary:
      "Regular activities that encourage men to grow in personal devotion to God and spiritual leadership at home and in the church.",
  },
  {
    id: "ladies",
    name: "Ladies",
    summary:
      "Bible studies and fellowship that refresh and encourage women to grow in faith and friendship through teaching and prayer.",
  },
  {
    id: "seniors",
    name: "Seniors",
    summary:
      'Our "Prime Timers" group encourages one another with Bible study, and prayer for senior adults.',
  },
];

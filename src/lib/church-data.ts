export const serviceTimes = {
  bibleStudy: {
    day: "Thursday",
    time: "7pm",
  },
  sundayMorning: {
    day: "Sunday",
    time: "11am",
  },
  sundayNight: {
    day: "Sunday",
    time: "6pm",
  },
  sundaySchool: {
    day: "Sunday",
    time: "10am",
  },
};

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
    "Victory Baptist Church in Fresno, California — an independent Baptist church proclaiming the gospel of Jesus Christ through soul-winning, sound Bible teaching, and Christ-centered worship. Sundays 11am & 6pm, Thursdays 7pm.",
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

/** Ministries shown on the home page — soul-winning / outreach first. */
export const ministries: Ministry[] = [
  {
    featured: true,
    id: "soul-winning",
    name: "Soul-Winning",
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

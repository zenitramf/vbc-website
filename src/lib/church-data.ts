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
  mapsUrl: "https://maps.app.goo.gl/Ysiz9UYS1mijVrJH7",
  mapsUrlAlt: "https://goo.gl/maps/Tf3fDh44gbomRUrT9",
  name: "Victory Baptist Church",
  shortName: "VBC",
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

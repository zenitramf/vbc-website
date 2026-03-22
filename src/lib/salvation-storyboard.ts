export const salvationDecisionTypes = [
  "accepted_christ",
  "wants_to_talk",
] as const;

export type SalvationDecisionType = (typeof salvationDecisionTypes)[number];

export type SalvationStepId =
  | "can-i-know"
  | "the-problem"
  | "the-penalty"
  | "what-cannot-save"
  | "what-god-has-done"
  | "how-to-be-saved"
  | "a-prayer-you-may-pray"
  | "your-response";

export interface SalvationVerse {
  quote: string;
  reference: string;
}

export interface SalvationStoryStep {
  body: string;
  id: SalvationStepId;
  kind: "story" | "prayer" | "response";
  lead: string;
  title: string;
  verses: SalvationVerse[];
}

export interface SalvationSuccessContent {
  body: string;
  title: string;
}

export const salvationSteps: SalvationStoryStep[] = [
  {
    body: "Every person eventually asks what happens after death and whether they can know they will spend eternity with God. The Bible says we can know, because God wants us to know the way of salvation.",
    id: "can-i-know",
    kind: "story",
    lead: "God does not want us to live in uncertainty.",
    title: "Can I Know?",
    verses: [
      {
        quote:
          "These things have I written unto you that believe on the name of the Son of God; that ye may know that ye have eternal life...",
        reference: "1 John 5:13",
      },
    ],
  },
  {
    body: "Before someone can be saved, they must first admit they are lost in sin. Since Adam and Eve, sin has affected every person. Sin is anything contrary to God's holiness, and our sin separates us from Him.",
    id: "the-problem",
    kind: "story",
    lead: "Sin separates us from God.",
    title: "The Problem",
    verses: [
      {
        quote: "For all have sinned, and come short of the glory of God.",
        reference: "Romans 3:23",
      },
    ],
  },
  {
    body: "The penalty for sin is spiritual death and eternal separation from God. Sin is not small in God's sight, and its wages are far greater than we can overcome on our own.",
    id: "the-penalty",
    kind: "story",
    lead: "Sin brings death and separation.",
    title: "The Penalty",
    verses: [
      {
        quote:
          "For the wages of sin is death; but the gift of God is eternal life through Jesus Christ our Lord.",
        reference: "Romans 6:23",
      },
    ],
  },
  {
    body: "People often try to reach God through religion, effort, or morality. But none of those can remove sin. Salvation is not something we earn. It is a gift God gives.",
    id: "what-cannot-save",
    kind: "story",
    lead: "Good works and religion cannot save us.",
    title: "What Cannot Save",
    verses: [
      {
        quote:
          "There is a way which seemeth right unto a man, but the end thereof are the ways of death.",
        reference: "Proverbs 14:12",
      },
      {
        quote:
          "For by grace are ye saved through faith; and that not of yourselves: it is the gift of God: Not of works, lest any man should boast.",
        reference: "Ephesians 2:8-9",
      },
    ],
  },
  {
    body: "Though we were separated from God, He loved us. Jesus died on the cross for our sins and rose again three days later. Through His death and resurrection, He paid the debt we could never pay ourselves.",
    id: "what-god-has-done",
    kind: "story",
    lead: "Jesus Christ paid the price for our sin.",
    title: "What God Has Done",
    verses: [
      {
        quote:
          "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.",
        reference: "John 3:16",
      },
      {
        quote:
          "But God commendeth his love toward us, in that, while we were yet sinners, Christ died for us.",
        reference: "Romans 5:8",
      },
    ],
  },
  {
    body: "To be saved, we must stop trusting ourselves, our works, or our religion, and place our faith in Jesus Christ alone for forgiveness and eternal life. If you are ready to turn to Christ, you can call on Him in faith and ask Him to save you.",
    id: "how-to-be-saved",
    kind: "story",
    lead: "Trust Jesus Christ alone.",
    title: "How To Be Saved",
    verses: [
      {
        quote:
          "For whosoever shall call upon the name of the Lord shall be saved.",
        reference: "Romans 10:13",
      },
    ],
  },
  {
    body: "Dear God, I know that I am separated from you because of sin. I confess that in my sin, I cannot save myself. Right now, I turn to you alone to be my Saviour. I ask you to save me from the penalty of my sin, and I trust you to provide eternal life to me.",
    id: "a-prayer-you-may-pray",
    kind: "prayer",
    lead: "You may pray something like this.",
    title: "A Prayer You May Pray",
    verses: [
      {
        quote:
          "For whosoever shall call upon the name of the Lord shall be saved.",
        reference: "Romans 10:13",
      },
    ],
  },
  {
    body: "If you accepted Christ or would like to talk with someone about salvation or about having a relationship with God, we would love to help.",
    id: "your-response",
    kind: "response",
    lead: "Would you let us follow up with you?",
    title: "Your Response",
    verses: [],
  },
];

export const salvationSuccessContent: Record<
  SalvationDecisionType,
  SalvationSuccessContent
> = {
  accepted_christ: {
    body: "Someone from Fresno Victory will reach out to rejoice with you, encourage you in your next steps, and help provide follow-up materials.",
    title: "We're rejoicing with you.",
  },
  wants_to_talk: {
    body: "Someone from Fresno Victory will reach out soon, and you can also contact Pastor Ryan Willis directly using the information below.",
    title: "We'd be glad to talk with you.",
  },
};

export const totalSalvationSteps = salvationSteps.length;

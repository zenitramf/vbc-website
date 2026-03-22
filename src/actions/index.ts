import { z } from "astro/zod";
import { ActionError, defineAction } from "astro:actions";

import { salvationDecisionTypes } from "@/lib/salvation-storyboard";

const decisionTypeSchema = z.enum(salvationDecisionTypes);

const pastoralFollowUpInput = z
  .object({
    completedSteps: z.array(z.string()).min(1),
    decisionType: decisionTypeSchema,
    email: z.email().nullable(),
    expandedScriptures: z.array(z.string()),
    name: z
      .string()
      .trim()
      .min(1, "Please share your name so we know who to follow up with."),
    phone: z
      .string()
      .trim()
      .min(7, "Please share a valid phone number.")
      .nullable(),
    sessionId: z.string().min(1),
    source: z.string().min(1),
  })
  .refine((input) => Boolean(input.email || input.phone), {
    message:
      "Please share an email or phone number so we can follow up with you.",
    path: ["contact"],
  });

export const server = {
  pastoralFollowUp: defineAction({
    accept: "json",
    handler: (input) => {
      const parsedInput = pastoralFollowUpInput.safeParse(input);

      if (!parsedInput.success) {
        throw new ActionError({
          code: "BAD_REQUEST",
          message:
            parsedInput.error.issues[0]?.message ??
            "Invalid follow-up submission.",
        });
      }

      const payload = parsedInput.data;

      return {
        completedSteps: payload.completedSteps,
        decisionType: payload.decisionType,
        message:
          payload.decisionType === "accepted_christ"
            ? "Your decision has been recorded for pastoral follow-up."
            : "Your request for a conversation has been recorded.",
        source: payload.source,
        submissionId: crypto.randomUUID(),
        submittedAt: new Date().toISOString(),
        variant: payload.decisionType,
      };
    },
    input: pastoralFollowUpInput,
  }),
};

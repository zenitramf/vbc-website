import type {
  SalvationDecisionType,
  SalvationStepId,
} from "@/lib/salvation-storyboard";

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

interface SalvationAnalyticsBaseEvent {
  name:
    | "salvation_panel_viewed"
    | "salvation_next_clicked"
    | "salvation_back_clicked"
    | "salvation_form_started"
    | "salvation_response_selected"
    | "salvation_validation_failed"
    | "salvation_submit_attempted"
    | "salvation_submit_succeeded"
    | "salvation_submit_failed";
  sessionId: string;
  timestamp: string;
}

export type SalvationAnalyticsEvent = SalvationAnalyticsBaseEvent & {
  completedSteps?: SalvationStepId[];
  decisionType?: SalvationDecisionType;
  expandedScriptures?: string[];
  fields?: string[];
  source?: string;
  stepId?: SalvationStepId;
  stepIndex?: number;
  submissionId?: string;
};

export const trackSalvationEvent = (
  event: Omit<SalvationAnalyticsEvent, "timestamp">
): void => {
  if (typeof window === "undefined") {
    return;
  }

  const payload: SalvationAnalyticsEvent = {
    ...event,
    timestamp: new Date().toISOString(),
  };

  window.dataLayer?.push(payload);
  window.dispatchEvent(
    new CustomEvent<SalvationAnalyticsEvent>("salvation:analytics", {
      detail: payload,
    })
  );
};

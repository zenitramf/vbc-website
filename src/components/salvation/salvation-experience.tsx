/* oxlint-disable max-statements, no-negated-condition, no-use-before-define, prefer-destructuring */

import { actions } from "astro:actions";
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  Cross,
  HeartHandshake,
  MoveRight,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent, TouchEvent } from "react";

import { PastorContactCard } from "@/components/salvation/pastor-contact-card";
import { trackSalvationEvent } from "@/lib/salvation-analytics";
import {
  salvationSteps,
  salvationSuccessContent,
  totalSalvationSteps,
} from "@/lib/salvation-storyboard";
import type {
  SalvationDecisionType,
  SalvationStepId,
} from "@/lib/salvation-storyboard";

const TOUCH_THRESHOLD = 60;

interface SubmissionState {
  decisionType: SalvationDecisionType;
  submissionId: string;
}

interface ValidationState {
  contact?: string;
  form?: string;
  name?: string;
}

const decisionOptions: {
  description: string;
  label: string;
  value: SalvationDecisionType;
}[] = [
  {
    description:
      "Let us know so someone from Fresno Victory can follow up with encouragement and materials.",
    label: "I accepted Christ!",
    value: "accepted_christ",
  },
  {
    description:
      "Ask for a personal conversation about salvation or your relationship with God.",
    label: "I would like to talk to someone",
    value: "wants_to_talk",
  },
];

const createSessionId = (): string => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `salvation-${Date.now()}`;
};

const submitLabelByDecision: Record<SalvationDecisionType, string> = {
  accepted_christ: "Let us know about your decision",
  wants_to_talk: "Request a conversation",
};

const stepContainerClasses =
  "rounded-[2rem] border border-white/45 bg-white/88 p-6 shadow-[0_28px_90px_rgba(19,44,38,0.18)] backdrop-blur md:p-8";

const RotateIcon = () => <Cross className="size-4 rotate-45" />;

export const SalvationExperience = () => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [decisionType, setDecisionType] =
    useState<SalvationDecisionType>("accepted_christ");
  const [email, setEmail] = useState("");
  const [formStarted, setFormStarted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submissionState, setSubmissionState] =
    useState<SubmissionState | null>(null);
  const [validationState, setValidationState] = useState<ValidationState>({});
  const [visitedStepIds, setVisitedStepIds] = useState<SalvationStepId[]>([
    salvationSteps[0].id,
  ]);
  const sessionIdRef = useRef<string>(createSessionId());
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const trackedViewRef = useRef<string | null>(null);

  const currentStep = salvationSteps[currentStepIndex];
  const completedSteps = useMemo(
    () =>
      visitedStepIds.includes(currentStep.id)
        ? visitedStepIds
        : [...visitedStepIds, currentStep.id],
    [currentStep.id, visitedStepIds]
  );

  const progressWidth = `${((currentStepIndex + 1) / totalSalvationSteps) * 100}%`;
  const isResponseStep = currentStep.kind === "response";
  const submissionContent = submissionState
    ? salvationSuccessContent[submissionState.decisionType]
    : null;

  useEffect(() => {
    const stepId = currentStep.id;
    const trackingKey = `${stepId}:${currentStepIndex}`;

    if (trackedViewRef.current === trackingKey) {
      return;
    }

    trackedViewRef.current = trackingKey;
    const nextCompletedSteps = visitedStepIds.includes(stepId)
      ? visitedStepIds
      : [...visitedStepIds, stepId];

    setVisitedStepIds((previous) => {
      if (previous.includes(stepId)) {
        return previous;
      }

      return [...previous, stepId];
    });

    trackSalvationEvent({
      completedSteps: nextCompletedSteps,
      expandedScriptures: [],
      name: "salvation_panel_viewed",
      sessionId: sessionIdRef.current,
      source: window.location.pathname,
      stepId,
      stepIndex: currentStepIndex,
    });
  }, [currentStep.id, currentStepIndex, visitedStepIds]);

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const { target } = event;

    if (
      target instanceof HTMLElement &&
      ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
    ) {
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      handleNext();
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      handleBack();
    }
  };

  const handleBack = () => {
    if (submissionState) {
      return;
    }

    setCurrentStepIndex((previous) => {
      const nextIndex = Math.max(previous - 1, 0);

      if (nextIndex !== previous) {
        trackSalvationEvent({
          completedSteps,
          expandedScriptures: [],
          name: "salvation_back_clicked",
          sessionId: sessionIdRef.current,
          source: window.location.pathname,
          stepId: salvationSteps[previous].id,
          stepIndex: previous,
        });
      }

      return nextIndex;
    });
  };

  const handleNext = () => {
    if (submissionState || isResponseStep) {
      return;
    }

    setCurrentStepIndex((previous) => {
      const nextIndex = Math.min(previous + 1, totalSalvationSteps - 1);

      if (nextIndex !== previous) {
        trackSalvationEvent({
          completedSteps,
          expandedScriptures: [],
          name: "salvation_next_clicked",
          sessionId: sessionIdRef.current,
          source: window.location.pathname,
          stepId: salvationSteps[previous].id,
          stepIndex: previous,
        });
      }

      return nextIndex;
    });
  };

  const validateForm = (): ValidationState => {
    const nextValidationState: ValidationState = {};

    if (!name.trim()) {
      nextValidationState.name =
        "Please share your name so we know who to follow up with.";
    }

    if (!email.trim() && !phone.trim()) {
      nextValidationState.contact =
        "Please share an email or phone number so we can follow up with you.";
    }

    return nextValidationState;
  };

  const markFormStarted = () => {
    if (formStarted) {
      return;
    }

    setFormStarted(true);
    trackSalvationEvent({
      completedSteps,
      expandedScriptures: [],
      name: "salvation_form_started",
      sessionId: sessionIdRef.current,
      source: window.location.pathname,
      stepId: currentStep.id,
      stepIndex: currentStepIndex,
    });
  };

  const handleDecisionChange = (nextDecisionType: SalvationDecisionType) => {
    setDecisionType(nextDecisionType);
    setValidationState((previous) => ({ ...previous, form: undefined }));
    trackSalvationEvent({
      completedSteps,
      decisionType: nextDecisionType,
      expandedScriptures: [],
      name: "salvation_response_selected",
      sessionId: sessionIdRef.current,
      source: window.location.pathname,
      stepId: currentStep.id,
      stepIndex: currentStepIndex,
    });
  };

  const submitLabel = useMemo(
    () => submitLabelByDecision[decisionType],
    [decisionType]
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    markFormStarted();

    const nextValidationState = validateForm();
    setValidationState(nextValidationState);

    if (Object.keys(nextValidationState).length > 0) {
      trackSalvationEvent({
        completedSteps,
        decisionType,
        expandedScriptures: [],
        fields: Object.keys(nextValidationState),
        name: "salvation_validation_failed",
        sessionId: sessionIdRef.current,
        source: window.location.pathname,
        stepId: currentStep.id,
        stepIndex: currentStepIndex,
      });
      return;
    }

    setIsSubmitting(true);
    trackSalvationEvent({
      completedSteps,
      decisionType,
      expandedScriptures: [],
      name: "salvation_submit_attempted",
      sessionId: sessionIdRef.current,
      source: window.location.pathname,
      stepId: currentStep.id,
      stepIndex: currentStepIndex,
    });

    const { data, error } = await actions.pastoralFollowUp({
      completedSteps,
      decisionType,
      email: email.trim() || null,
      expandedScriptures: [],
      name: name.trim(),
      phone: phone.trim() || null,
      sessionId: sessionIdRef.current,
      source: window.location.pathname,
    });

    setIsSubmitting(false);

    if (error || !data) {
      const errorMessage =
        error?.message ??
        "We could not send your response just now. Please try again in a moment.";

      setValidationState((previous) => ({ ...previous, form: errorMessage }));
      trackSalvationEvent({
        completedSteps,
        decisionType,
        expandedScriptures: [],
        fields: ["form"],
        name: "salvation_submit_failed",
        sessionId: sessionIdRef.current,
        source: window.location.pathname,
        stepId: currentStep.id,
        stepIndex: currentStepIndex,
      });
      return;
    }

    setSubmissionState({
      decisionType: data.variant,
      submissionId: data.submissionId,
    });
    setValidationState({});
    trackSalvationEvent({
      completedSteps,
      decisionType,
      expandedScriptures: [],
      name: "salvation_submit_succeeded",
      sessionId: sessionIdRef.current,
      source: window.location.pathname,
      stepId: currentStep.id,
      stepIndex: currentStepIndex,
      submissionId: data.submissionId,
    });
  };

  const resetExperience = () => {
    setCurrentStepIndex(0);
    setDecisionType("accepted_christ");
    setEmail("");
    setFormStarted(false);
    setName("");
    setPhone("");
    setSubmissionState(null);
    setValidationState({});
    setVisitedStepIds([salvationSteps[0].id]);
    sessionIdRef.current = createSessionId();
    trackedViewRef.current = null;
  };

  const onTouchStart = (event: TouchEvent<HTMLElement>) => {
    touchStartXRef.current = event.touches[0]?.clientX ?? null;
    touchStartYRef.current = event.touches[0]?.clientY ?? null;
  };

  const onTouchEnd = (event: TouchEvent<HTMLElement>) => {
    const startX = touchStartXRef.current;
    const startY = touchStartYRef.current;
    const endTouch = event.changedTouches[0];

    touchStartXRef.current = null;
    touchStartYRef.current = null;

    if (!endTouch || startX === null || startY === null) {
      return;
    }

    const deltaX = endTouch.clientX - startX;
    const deltaY = endTouch.clientY - startY;

    if (
      Math.abs(deltaX) < TOUCH_THRESHOLD ||
      Math.abs(deltaX) < Math.abs(deltaY)
    ) {
      return;
    }

    if (deltaX < 0) {
      handleNext();
    } else {
      handleBack();
    }
  };

  return (
    <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.7),transparent_30%),linear-gradient(160deg,#f7f5ef_0%,#e7f0e9_48%,#d4e4de_100%)] text-[#17302b]">
      <div className="absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.75),transparent_70%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3 pb-6">
          <a
            className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/70 px-3 py-2 text-sm font-medium text-[#24453d] shadow-sm backdrop-blur transition hover:bg-white"
            href="/"
          >
            <ChevronLeft className="size-4" />
            <span>Fresno Victory</span>
          </a>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#55736b]">
              Salvation Storyboard
            </p>
            <p className="mt-1 text-sm text-[#4d655f]">
              A focused gospel presentation for every screen.
            </p>
          </div>
        </div>

        <div
          className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center"
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          {!submissionContent ? (
            <>
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#5d7c72]">
                  Step {currentStepIndex + 1} of {totalSalvationSteps}
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#17302b] sm:text-4xl md:text-5xl">
                  {currentStep.title}
                </h1>
              </div>

              <div
                aria-label="Salvation storyboard progress"
                aria-valuemax={totalSalvationSteps}
                aria-valuemin={1}
                aria-valuenow={currentStepIndex + 1}
                className="mb-8 h-2 rounded-full bg-white/55"
                role="progressbar"
              >
                <div
                  aria-hidden="true"
                  className="h-full rounded-full bg-[linear-gradient(90deg,#2d6a4f,#52b788)] transition-all duration-300"
                  style={{ width: progressWidth }}
                />
              </div>

              <div
                className={`${stepContainerClasses} min-h-[34rem] md:h-[42rem]`}
                onTouchEnd={onTouchEnd}
                onTouchStart={onTouchStart}
              >
                {isResponseStep ? (
                  <form
                    className="grid h-full grid-rows-[1fr_auto] gap-8"
                    onSubmit={handleSubmit}
                  >
                    <div className="flex min-h-0 flex-col justify-center space-y-5 overflow-y-auto pr-1">
                      <p className="text-lg leading-relaxed text-[#38524b]">
                        {currentStep.body}
                      </p>

                      <fieldset className="space-y-3">
                        <legend className="text-sm font-semibold uppercase tracking-[0.18em] text-[#58766d]">
                          Let us know how to follow up
                        </legend>
                        {decisionOptions.map((option) => {
                          const isSelected = decisionType === option.value;
                          return (
                            <label
                              className={`block cursor-pointer rounded-[1.5rem] border px-4 py-4 transition ${
                                isSelected
                                  ? "border-[#2d6a4f] bg-[#edf7f1] shadow-sm"
                                  : "border-[#d9e7e1] bg-white/75 hover:border-[#9bc3b2]"
                              }`}
                              key={option.value}
                            >
                              <input
                                checked={isSelected}
                                className="sr-only"
                                name="decisionType"
                                onChange={() =>
                                  handleDecisionChange(option.value)
                                }
                                type="radio"
                                value={option.value}
                              />
                              <span className="flex items-start gap-3">
                                <span
                                  className={`mt-1 flex size-5 items-center justify-center rounded-full border ${
                                    isSelected
                                      ? "border-[#2d6a4f] bg-[#2d6a4f]"
                                      : "border-[#87a79c]"
                                  }`}
                                >
                                  {isSelected ? (
                                    <CheckCircle2 className="size-4 text-white" />
                                  ) : null}
                                </span>
                                <span>
                                  <span className="block text-base font-semibold text-[#17302b]">
                                    {option.label}
                                  </span>
                                  <span className="mt-1 block text-sm leading-relaxed text-[#536963]">
                                    {option.description}
                                  </span>
                                </span>
                              </span>
                            </label>
                          );
                        })}
                      </fieldset>

                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="block text-sm font-medium text-[#24453d]">
                          <span className="mb-2 block">Name</span>
                          <input
                            aria-describedby={
                              validationState.name
                                ? "salvation-name-error"
                                : undefined
                            }
                            aria-invalid={Boolean(validationState.name)}
                            className="w-full rounded-2xl border border-[#c9d9d2] bg-white px-4 py-3 text-base text-[#17302b] shadow-sm transition focus:border-[#2d6a4f] focus:outline-none focus:ring-4 focus:ring-[#2d6a4f]/15"
                            name="name"
                            onChange={(event) => {
                              markFormStarted();
                              setName(event.target.value);
                              setValidationState((previous) => ({
                                ...previous,
                                name: undefined,
                              }));
                            }}
                            placeholder="Your name"
                            value={name}
                          />
                          {validationState.name ? (
                            <span
                              className="mt-2 block text-sm text-[#a22c29]"
                              id="salvation-name-error"
                              role="alert"
                            >
                              {validationState.name}
                            </span>
                          ) : null}
                        </label>
                        <label className="block text-sm font-medium text-[#24453d]">
                          <span className="mb-2 block">Email</span>
                          <input
                            aria-describedby={
                              validationState.contact
                                ? "salvation-contact-error"
                                : undefined
                            }
                            aria-invalid={Boolean(validationState.contact)}
                            className="w-full rounded-2xl border border-[#c9d9d2] bg-white px-4 py-3 text-base text-[#17302b] shadow-sm transition focus:border-[#2d6a4f] focus:outline-none focus:ring-4 focus:ring-[#2d6a4f]/15"
                            inputMode="email"
                            name="email"
                            onChange={(event) => {
                              markFormStarted();
                              setEmail(event.target.value);
                              setValidationState((previous) => ({
                                ...previous,
                                contact: undefined,
                              }));
                            }}
                            placeholder="you@example.com"
                            type="email"
                            value={email}
                          />
                        </label>
                      </div>

                      <label className="block max-w-md text-sm font-medium text-[#24453d]">
                        <span className="mb-2 block">Telephone number</span>
                        <input
                          aria-describedby={
                            validationState.contact
                              ? "salvation-contact-error"
                              : undefined
                          }
                          aria-invalid={Boolean(validationState.contact)}
                          className="w-full rounded-2xl border border-[#c9d9d2] bg-white px-4 py-3 text-base text-[#17302b] shadow-sm transition focus:border-[#2d6a4f] focus:outline-none focus:ring-4 focus:ring-[#2d6a4f]/15"
                          inputMode="tel"
                          name="phone"
                          onChange={(event) => {
                            markFormStarted();
                            setPhone(event.target.value);
                            setValidationState((previous) => ({
                              ...previous,
                              contact: undefined,
                            }));
                          }}
                          placeholder="Optional if you already shared an email"
                          type="tel"
                          value={phone}
                        />
                      </label>

                      {validationState.contact ? (
                        <p
                          aria-live="polite"
                          className="rounded-2xl border border-[#f0c5c3] bg-[#fff3f2] px-4 py-3 text-sm text-[#a22c29]"
                          id="salvation-contact-error"
                        >
                          {validationState.contact}
                        </p>
                      ) : null}
                      {validationState.form ? (
                        <p
                          aria-live="polite"
                          className="rounded-2xl border border-[#f0c5c3] bg-[#fff3f2] px-4 py-3 text-sm text-[#a22c29]"
                          role="alert"
                        >
                          {validationState.form}
                        </p>
                      ) : null}
                    </div>

                    <div className="grid gap-4 border-t border-[#d8e4de] pt-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                      <button
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-[#bfd5cc] px-5 py-3 text-sm font-semibold text-[#23413a] transition hover:border-[#8cb7a6] hover:bg-white"
                        onClick={handleBack}
                        type="button"
                      >
                        <ChevronLeft className="size-4" />
                        Back
                      </button>
                      <button
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#1b4332,#2d6a4f)] px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-65"
                        disabled={isSubmitting}
                        type="submit"
                      >
                        {isSubmitting ? "Sending..." : submitLabel}
                        <MoveRight className="size-4" />
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="grid h-full grid-rows-[1fr_auto] gap-8">
                    <div className="flex min-h-0 flex-col justify-center overflow-y-auto pr-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#5c7a71]">
                        {currentStep.lead}
                      </p>
                      <p className="mt-4 max-w-3xl text-lg leading-relaxed text-[#38524b] md:text-xl">
                        {currentStep.body}
                      </p>

                      <div className="mt-8 grid gap-4 md:grid-cols-2">
                        {currentStep.verses.map((verse) => (
                          <article
                            className="rounded-[1.75rem] border border-[#d7e5df] bg-[#f7fbf8] px-5 py-4 shadow-sm"
                            key={verse.reference}
                          >
                            <p className="text-sm leading-relaxed text-[#274740] md:text-base">
                              &ldquo;{verse.quote}&rdquo;
                            </p>
                            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.24em] text-[#5f7b72]">
                              {verse.reference}
                            </p>
                          </article>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-4 border-t border-[#d8e4de] pt-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                      <div className="inline-flex items-center gap-2 text-sm text-[#567068]">
                        <MoveRight className="size-4" />
                        <span>Swipe or use the buttons to keep moving.</span>
                      </div>
                      <div className="flex items-center justify-end gap-3">
                        <button
                          className="inline-flex items-center justify-center gap-2 rounded-full border border-[#bfd5cc] px-5 py-3 text-sm font-semibold text-[#23413a] transition hover:border-[#8cb7a6] hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={currentStepIndex === 0}
                          onClick={handleBack}
                          type="button"
                        >
                          <ChevronLeft className="size-4" />
                          Back
                        </button>
                        <button
                          className="inline-flex items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#1b4332,#2d6a4f)] px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:opacity-95"
                          onClick={handleNext}
                          type="button"
                        >
                          Next
                          <ArrowRight className="size-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className={`${stepContainerClasses} mx-auto w-full max-w-3xl`}>
              <div className="flex flex-wrap items-center gap-3 text-sm font-semibold uppercase tracking-[0.24em] text-[#5f7b72]">
                <HeartHandshake className="size-4" />
                <span>Pastoral follow-up</span>
              </div>
              <h2 className="mt-5 text-3xl font-semibold tracking-tight text-[#17302b] md:text-4xl">
                {submissionContent.title}
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-[#3e5850]">
                {submissionContent.body}
              </p>

              <div className="mt-8 grid gap-5">
                <div className="rounded-[1.75rem] border border-[#d7e5df] bg-[#f7fbf8] px-5 py-4 text-sm text-[#36524b]">
                  <p className="font-semibold text-[#17302b]">
                    What happens next
                  </p>
                  <p className="mt-2 leading-relaxed">
                    Your submission reference is{" "}
                    <span className="font-semibold">
                      {submissionState?.submissionId}
                    </span>
                    . This build uses a placeholder server action while webhook
                    delivery is being connected.
                  </p>
                </div>

                <PastorContactCard />

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <a
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-[#bfd5cc] px-5 py-3 text-sm font-semibold text-[#23413a] transition hover:border-[#8cb7a6] hover:bg-white"
                    href="/"
                  >
                    <ChevronLeft className="size-4" />
                    Visit Fresno Victory
                  </a>
                  <button
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#1b4332,#2d6a4f)] px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:opacity-95"
                    onClick={resetExperience}
                    type="button"
                  >
                    Read through it again
                    <RotateIcon />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalvationExperience;

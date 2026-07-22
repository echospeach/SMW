export type OnboardingStep = {
  key: "connect_account" | "generate_content" | "schedule_post";
  label: string;
  done: boolean;
};

export type OnboardingProgress = {
  steps: OnboardingStep[];
  allDone: boolean;
};

// Step completion is derived live from existing data (has a connection, has
// a post, has a scheduled post) rather than tracked separately, so it can
// never drift out of sync with what actually happened.
export function computeOnboardingProgress(signals: {
  hasConnection: boolean;
  hasGeneratedContent: boolean;
  hasScheduledPost: boolean;
}): OnboardingProgress {
  const steps: OnboardingStep[] = [
    { key: "connect_account", label: "Connect an account", done: signals.hasConnection },
    { key: "generate_content", label: "Generate your first post", done: signals.hasGeneratedContent },
    { key: "schedule_post", label: "Schedule it", done: signals.hasScheduledPost },
  ];
  return { steps, allDone: steps.every((s) => s.done) };
}

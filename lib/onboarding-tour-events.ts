export type OnboardingTourAction =
  | "account-created"
  | "transaction-created"
  | "transfer-created"
  | "budget-created"
  | "ai-generated";

export function notifyOnboardingTour(action: OnboardingTourAction) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent("pulse-tour-action", {
      detail: { action },
    }),
  );
}
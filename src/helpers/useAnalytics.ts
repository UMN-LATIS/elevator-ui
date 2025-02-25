import invariant from "tiny-invariant";

export function useAnalytics() {
  const { gtag } = window;
  invariant(
    gtag,
    "Google Analytics is not loaded. Make sure to load the script in the head of your document."
  );

  const trackEvent = (eventName: string, payload: Record<string, unknown>) => {
    console.log(`Tracking event: ${eventName}`);
    gtag("event", eventName, payload);
  };

  return { trackEvent };
}

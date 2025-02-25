export function useGoogleTagManager() {
  const sendEvent = (eventName: string, eventParams = {}) => {
    window.dataLayer?.push({
      event: eventName,
      ...eventParams,
    });
  };
  return { sendEvent };
}

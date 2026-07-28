export type ErrorNotification = "modal" | "toast" | "none";

/**
 * Decide how the global interceptor surfaces a failed request.
 *
 * Network failures (status 0) and 5xx block with the modal, since nothing
 * works and retrying will not help. 401 and 410 are silent because pages own
 * those flows: route meta gates sign-in and AssetViewPage renders the
 * deleted-asset notice. Everything else is scoped to one request and toasts.
 */
export function chooseErrorNotification(statusCode: number): ErrorNotification {
  if (statusCode === 401 || statusCode === 410) {
    return "none";
  }

  const isNetworkError = statusCode === 0;
  const isServerError = statusCode >= 500 && statusCode < 600;
  if (isNetworkError || isServerError) {
    return "modal";
  }

  return "toast";
}

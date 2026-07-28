import { ApiError } from "./ApiError";

const messagesByStatus: Record<number, string> = {
  0: "There was a problem connecting to the server. If the problem persists, please contact support.",
  400: "There was a problem with your request. Please check your input and try again.",
  401: "You do not have permission to access this.",
  403: "You do not have permission to access this.",
  404: "We couldn't find this. Please check your link and try again.",
  500: "There was a problem on our end. Please contact support if the problem persists.",
};

/**
 * Map an error to the friendly text shown in the error modal and toasts.
 *
 * Unmapped 4xx and 5xx statuses fall back to the 400 and 500 messages.
 * Anything that is not an ApiError falls back to its own message.
 */
export function getErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) {
    if (error instanceof Error && error.message) {
      return error.message;
    }
    return "An unknown error occurred.";
  }

  const status = error.statusCode;

  if (status in messagesByStatus) {
    return messagesByStatus[status];
  }

  if (status >= 400 && status < 500) {
    return messagesByStatus[400];
  }

  if (status >= 500 && status < 600) {
    return messagesByStatus[500];
  }

  return error.message;
}

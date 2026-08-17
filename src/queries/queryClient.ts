import { QueryClient } from "@tanstack/vue-query";
import { ApiError } from "@/api/ApiError";

const NON_RETRYABLE_STATUS_CODES = new Set([401, 403, 404, 410]);

export function createAppQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          if (
            error instanceof ApiError &&
            NON_RETRYABLE_STATUS_CODES.has(error.statusCode)
          ) {
            return false;
          }
          return failureCount < 3;
        },
      },
    },
  });
}

// The app's one QueryClient, exported as a module singleton so
// non-component code (store actions, event handlers) can read the
// cache imperatively where vue-query's inject-based composables
// are unavailable.
export const appQueryClient = createAppQueryClient();

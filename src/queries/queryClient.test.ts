import { describe, it, expect } from "vitest";
import { createAppQueryClient } from "./queryClient";
import { ApiError } from "@/api/ApiError";

describe("createAppQueryClient", () => {
  it("sets a 5-minute staleTime so repeat navigations skip redundant fetches", () => {
    const client = createAppQueryClient();
    const defaults = client.getDefaultOptions().queries;
    expect(defaults?.staleTime).toBe(5 * 60 * 1000);
  });

  it("sets a 10-minute gcTime", () => {
    const client = createAppQueryClient();
    const defaults = client.getDefaultOptions().queries;
    expect(defaults?.gcTime).toBe(10 * 60 * 1000);
  });

  it("disables refetchOnWindowFocus by default (per-query can still override)", () => {
    const client = createAppQueryClient();
    const defaults = client.getDefaultOptions().queries;
    expect(defaults?.refetchOnWindowFocus).toBe(false);
  });

  it("does not retry on auth/permission/not-found/gone errors", () => {
    const client = createAppQueryClient();
    const retry = client.getDefaultOptions().queries?.retry;
    expect(typeof retry).toBe("function");

    for (const code of [401, 403, 404, 410]) {
      const err = new ApiError("test error", code);
      const shouldRetry =
        typeof retry === "function" ? retry(0, err) : retry;
      expect(shouldRetry).toBe(false);
    }
  });

  it("retries up to 3 times for other errors", () => {
    const client = createAppQueryClient();
    const retry = client.getDefaultOptions().queries?.retry;
    if (typeof retry !== "function") throw new Error("expected retry fn");

    const err = new Error("transient network error");
    expect(retry(0, err)).toBe(true);
    expect(retry(2, err)).toBe(true);
    expect(retry(3, err)).toBe(false);
  });
});

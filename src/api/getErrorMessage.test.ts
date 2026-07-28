import { describe, it, expect } from "vitest";
import { getErrorMessage } from "./getErrorMessage";
import { ApiError } from "./ApiError";

describe("getErrorMessage", () => {
  it("maps known statuses to their friendly text", () => {
    expect(getErrorMessage(new ApiError("nope", 404))).toBe(
      "We couldn't find this. Please check your link and try again."
    );
    expect(getErrorMessage(new ApiError("nope", 0))).toBe(
      "There was a problem connecting to the server. If the problem persists, please contact support."
    );
    expect(getErrorMessage(new ApiError("nope", 403))).toBe(
      "You do not have permission to access this."
    );
  });

  it("falls back to the 400 message for unmapped 4xx statuses", () => {
    expect(getErrorMessage(new ApiError("nope", 418))).toBe(
      "There was a problem with your request. Please check your input and try again."
    );
  });

  it("falls back to the 500 message for unmapped 5xx statuses", () => {
    expect(getErrorMessage(new ApiError("nope", 503))).toBe(
      "There was a problem on our end. Please contact support if the problem persists."
    );
  });

  it("uses the error's own message for statuses outside the maps", () => {
    expect(getErrorMessage(new ApiError("weird status", 302))).toBe(
      "weird status"
    );
  });

  it("uses a plain Error's own message", () => {
    expect(getErrorMessage(new Error("route failed"))).toBe("route failed");
  });

  it("falls back to a generic message when there is no message to show", () => {
    expect(getErrorMessage(null)).toBe("An unknown error occurred.");
    expect(getErrorMessage(new Error(""))).toBe("An unknown error occurred.");
  });
});

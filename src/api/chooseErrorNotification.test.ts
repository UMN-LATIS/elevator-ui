import { describe, it, expect } from "vitest";
import { chooseErrorNotification } from "./chooseErrorNotification";

describe("chooseErrorNotification", () => {
  it("blocks with the modal on a network error", () => {
    expect(chooseErrorNotification(0)).toBe("modal");
  });

  it("blocks with the modal on server errors", () => {
    expect(chooseErrorNotification(500)).toBe("modal");
    expect(chooseErrorNotification(502)).toBe("modal");
    expect(chooseErrorNotification(599)).toBe("modal");
  });

  it("toasts on a 404", () => {
    expect(chooseErrorNotification(404)).toBe("toast");
  });

  it("toasts on a 403", () => {
    expect(chooseErrorNotification(403)).toBe("toast");
  });

  it("toasts on 400 and other 4xx statuses", () => {
    expect(chooseErrorNotification(400)).toBe("toast");
    expect(chooseErrorNotification(409)).toBe("toast");
    expect(chooseErrorNotification(422)).toBe("toast");
  });

  it("stays silent on a 401", () => {
    expect(chooseErrorNotification(401)).toBe("none");
  });

  it("stays silent on a 410", () => {
    expect(chooseErrorNotification(410)).toBe("none");
  });
});

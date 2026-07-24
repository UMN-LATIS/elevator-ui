import { describe, it, expect } from "vitest";
import { hasUploadContent } from "./hasWidgetContent";

describe("hasUploadContent", () => {
  // Reproduces #554. A CSV-imported file can carry fileDescription: null
  // instead of "", so the required-field check must key off the file itself,
  // not its description.
  it("counts an upload with a null fileDescription as content", () => {
    const contents = [
      {
        fileId: "5892726de758ae8a198b47be",
        fileType: "jpg",
        fileDescription: null,
        isPrimary: false,
      },
    ];

    expect(hasUploadContent(contents)).toBe(true);
  });

  it("does not count an upload with an empty fileId as content", () => {
    const contents = [
      {
        fileId: "",
        fileType: "",
        fileDescription: null,
        isPrimary: false,
      },
    ];

    expect(hasUploadContent(contents)).toBe(false);
  });
});

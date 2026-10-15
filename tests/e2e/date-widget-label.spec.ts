import { test, expect, type Locator, type Page } from "@playwright/test";
import { setupWorkerHTTPHeader, refreshDatabase } from "../setup";

const ASSET_ID = "labeled_date_asset_001";
const SHORT_LABEL = "Battle of Ohamakari (Waterberg)";
const LONG_LABEL =
  "Proclamation issued by the commander of the colonial forces ordering the expulsion of the Ovaherero people from the territory and refusing their surrender";

function dateEntry(page: Page, date: string) {
  return page.locator("li").filter({ hasText: date });
}

async function layoutOf(entry: Locator, text: string) {
  return entry.evaluate((element, text) => {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let node: Text | null = null;
    while (walker.nextNode()) {
      const candidate = walker.currentNode as Text;
      if (candidate.data.includes(text)) {
        node = candidate;
        break;
      }
    }
    const parent = node?.parentElement;
    if (!node || !parent) throw new Error(`no text node contains "${text}"`);

    const start = node.data.indexOf(text);
    const lines: { top: number; text: string }[] = [];
    for (let i = start; i < start + text.length; i++) {
      const range = document.createRange();
      range.setStart(node, i);
      range.setEnd(node, i + 1);
      const rect = range.getClientRects()[0];
      if (!rect) continue;
      const top = Math.round(rect.top);
      const current = lines.at(-1);
      if (current && Math.abs(current.top - top) < 2) {
        current.text += node.data[i];
      } else {
        lines.push({ top, text: node.data[i] });
      }
    }
    const whole = document.createRange();
    whole.setStart(node, start);
    whole.setEnd(node, start + text.length);
    const box = whole.getBoundingClientRect();
    return {
      lines: lines.map((line) => line.text.trim()),
      top: box.top,
      bottom: box.bottom,
      textTransform: getComputedStyle(parent).textTransform,
    };
  }, text);
}

test.describe("Date widget entry with a label", () => {
  test.beforeEach(async ({ page, request }) => {
    const workerId = test.info().workerIndex.toString();
    await setupWorkerHTTPHeader({ page, workerId });
    await refreshDatabase({ request, workerId });
    await page.goto(`/asset/viewAsset/${ASSET_ID}`);
  });

  test("shows the date above its label, in normal case", async ({ page }) => {
    const entry = dateEntry(page, "1904-08-11");
    await expect(entry).toBeVisible();

    const date = await layoutOf(entry, "1904-08-11");
    const label = await layoutOf(entry, SHORT_LABEL);
    expect(date.bottom).toBeLessThanOrEqual(label.top);
    expect(label.textTransform).toBe("none");
  });

  test("keeps the date on one line in the sidebar", async ({ page }) => {
    const entry = dateEntry(page, "1904-08-11");
    await expect(entry).toBeVisible();

    const date = await layoutOf(entry, "1904-08-11");
    expect(date.lines).toEqual(["1904-08-11"]);
  });

  test("wraps a long label between words and keeps its date on one line", async ({
    page,
  }) => {
    const entry = dateEntry(page, "1904-10-02");
    await expect(entry).toBeVisible();

    const date = await layoutOf(entry, "1904-10-02");
    expect(date.lines).toEqual(["1904-10-02"]);

    const label = await layoutOf(entry, LONG_LABEL);
    expect(label.lines.length).toBeGreaterThanOrEqual(3);
    expect(label.lines.join(" ")).toBe(LONG_LABEL);
  });

  test("shows only the date when the entry has no label", async ({ page }) => {
    await expect(dateEntry(page, "1907-03-31")).toHaveText("1907-03-31");
  });
});

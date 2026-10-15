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
    function findTextNodeContaining(root: Element, text: string) {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode as Text;
        if (node.data.includes(text)) return node;
      }
      throw new Error(`no text node contains "${text}"`);
    }

    function rangeOf(node: Text, start: number, end: number) {
      const range = document.createRange();
      range.setStart(node, start);
      range.setEnd(node, end);
      return range;
    }

    function visualLinesOf(node: Text, start: number, end: number) {
      const lines: { top: number; text: string }[] = [];
      for (let i = start; i < end; i++) {
        const charRect = rangeOf(node, i, i + 1).getClientRects()[0];
        if (!charRect) continue;
        const top = Math.round(charRect.top);
        const lastLine = lines.at(-1);
        const isOnLastLine =
          lastLine !== undefined && Math.abs(lastLine.top - top) < 2;
        if (isOnLastLine) {
          lastLine.text += node.data[i];
        } else {
          lines.push({ top, text: node.data[i] });
        }
      }
      return lines.map((line) => line.text.trim());
    }

    const node = findTextNodeContaining(element, text);
    const start = node.data.indexOf(text);
    const end = start + text.length;
    const bounds = rangeOf(node, start, end).getBoundingClientRect();
    return {
      lines: visualLinesOf(node, start, end),
      top: bounds.top,
      bottom: bounds.bottom,
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

    const dateLayout = await layoutOf(entry, "1904-08-11");
    const labelLayout = await layoutOf(entry, SHORT_LABEL);
    expect(dateLayout.bottom).toBeLessThanOrEqual(labelLayout.top);
    await expect(entry.getByText(SHORT_LABEL)).toHaveCSS(
      "text-transform",
      "none"
    );
  });

  test("keeps the date on one line in the sidebar", async ({ page }) => {
    const entry = dateEntry(page, "1904-08-11");
    await expect(entry).toBeVisible();

    const dateLayout = await layoutOf(entry, "1904-08-11");
    expect(dateLayout.lines).toEqual(["1904-08-11"]);
  });

  test("wraps a long label between words and keeps its date on one line", async ({
    page,
  }) => {
    const entry = dateEntry(page, "1904-10-02");
    await expect(entry).toBeVisible();

    const dateLayout = await layoutOf(entry, "1904-10-02");
    expect(dateLayout.lines).toEqual(["1904-10-02"]);

    const labelLayout = await layoutOf(entry, LONG_LABEL);
    expect(labelLayout.lines.length).toBeGreaterThanOrEqual(3);
    expect(labelLayout.lines.join(" ")).toBe(LONG_LABEL);
  });

  test("shows only the date when the entry has no label", async ({ page }) => {
    await expect(dateEntry(page, "1907-03-31")).toHaveText("1907-03-31");
  });
});

import { Hono } from "hono";
import { parseFormData, delay } from "../utils/index";
import type {
  SearchRequestOptions,
  SearchResultsResponse,
} from "../../src/types";
import type { MockServerContext } from "../types.js";

const app = new Hono<MockServerContext>();

const sortBySearchTerm = (searchTerm: string) => (a: string, b: string) => {
  // terms that start with search, come first
  const aStarts = a.toLowerCase().startsWith(searchTerm);
  const bStarts = b.toLowerCase().startsWith(searchTerm);
  if (aStarts && !bStarts) return -1;
  if (!aStarts && bStarts) return 1;

  // otherwise regular search order
  return a.localeCompare(b);
};

/**
 * Generate autocomplete suggestions based on field title and search term
 */
function generateAutocompletions(
  searchTerm: string | number,
  completions: string[]
): string[] {
  const lowercaseSearchTerm = searchTerm.toString().toLowerCase();
  if (!searchTerm || lowercaseSearchTerm.length < 1) {
    return [];
  }

  const suggestions = completions
    .filter((option) => {
      console.log(lowercaseSearchTerm, option);
      return option.toLowerCase().includes(lowercaseSearchTerm);
    })
    .sort(sortBySearchTerm(searchTerm.toString()));

  return suggestions.slice(0, 10);
}

function generateTextAutocompletions(searchTerm: string | number): string[] {
  const textCompletions = [
    "test 1",
    "test 2",
    "test 3",
    "another test 1",
    "another test 2",
    "another test 3",
  ];

  return generateAutocompletions(searchTerm, textCompletions);
}

/**
 * Generate tag suggestions
 */
function generateTagAutocompletions(searchTerm: string): string[] {
  const baseTags = [
    "research",
    "academic",
    "study",
    "university",
    "education",
    "science",
    "technology",
    "art",
    "history",
    "literature",
    "photography",
    "video",
    "audio",
    "document",
    "manuscript",
    "collection",
    "archive",
    "digital",
    "preservation",
    "metadata",
  ];

  return generateAutocompletions(searchTerm, baseTags);
}

// POST /search/searchResults
app.post("/searchResults", async (c) => {
  await delay(300);
  const db = c.get("db");

  const user = c.get("user");

  // check if authed
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.formData();
  const parsed = parseFormData(body);

  const storeOnly = parsed.storeOnly === "true";
  const searchQuery = parsed.searchQuery as SearchRequestOptions;

  console.log(`Search requested: ${searchQuery} (storeOnly: ${storeOnly})`);

  const resultsResponse = db.searches.create(searchQuery.searchText ?? "");

  // create a new search if `storeOnly`
  // and only return the searchId
  if (storeOnly) {
    return c.json({
      success: true,
      searchId: resultsResponse.searchId,
    });
  }

  // Otherwise, return the full search results
  return c.json<SearchResultsResponse>(resultsResponse);
});

// GET /search/searchResults/:searchId/:page/:loadAll
app.get("/searchResults/:searchId/:page/:loadAll", async (c) => {
  await delay(200);
  const db = c.get("db");
  const searchId = c.req.param("searchId");
  const results = db.searches.get(searchId);

  if (!results) {
    return c.json({ error: "Search not found" }, 404);
  }

  return c.json<SearchResultsResponse>(results);
});

// POST /search/getSuggestion
app.post("/getSuggestion", async (c) => {
  await delay(100);
  return c.json([]);
});

// POST /search/autocomplete
app.post("/autocomplete", async (c) => {
  await delay(150);
  const _db = c.get("db");
  const user = c.get("user");

  // check if authed
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.formData();
  const parsed = parseFormData(body);

  const templateId = parsed.templateId as string;
  const fieldTitle = parsed.fieldTitle as string;
  const searchTerm = parsed.searchTerm as string;

  console.log(
    `Autocomplete requested: templateId=${templateId}, fieldTitle=${fieldTitle}, searchTerm="${searchTerm}"`
  );

  // if field seems like a tag type, generate tag suggestions
  const isTagField = fieldTitle.startsWith("tag") || fieldTitle.startsWith("keywords");

  const suggestions = isTagField
    ? generateTagAutocompletions(searchTerm)
    : generateTextAutocompletions(searchTerm);

  return c.json(suggestions);
});

export default app;

import { Hono } from "hono";
import { parseFormData, delay } from "../utils/index";
import type {
  SearchRequestOptions,
  SearchResultsResponse,
} from "../../src/types";
import type { MockServerContext } from "../types.js";

const app = new Hono<MockServerContext>();

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

export default app;

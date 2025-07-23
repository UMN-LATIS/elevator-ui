import { Hono } from "hono";
import { parseFormData, delay } from "../utils/index";
import { db } from "../db/index.js";
import type {
  SearchRequestOptions,
  SearchResultsResponse,
} from "../../src/types";
import type { MockServerContext } from "../types.js";

const app = new Hono<MockServerContext>();

// POST /search/searchResults
app.post("/searchResults", async (c) => {
  await delay(300);

  // check if authed
  if (!c.get("isAuthenticated")) {
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
  const searchId = c.req.param("searchId");
  // const page = Number(c.req.param("page") || 0);
  // const loadAll = c.req.param("loadAll") === "true";

  const results = db.searches.get(searchId);

  if (!results) {
    return c.json({ error: "Search not found" }, 404);
  }

  return c.json<SearchResultsResponse>(results);
});

// POST /search/getSuggestion
app.post("/getSuggestion", async (c) => {
  await delay(100);
  // const formData = await c.req.formData();
  // const searchTerm = formData.get("searchTerm") as string;

  return c.json([]);
});

export default app;

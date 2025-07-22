import { Hono } from "hono";
import { parseFormData, delay } from "../utils/index";
import {
  standardSearchResults,
  emptySearchResults,
  digitalSearchResults,
  photoSearchResults,
  mockFieldInfo,
  mockSuggestions,
} from "../fixtures/search";
import type { SearchResultsResponse } from "../../src/types";

const app = new Hono();

// POST /search/searchResults
app.post("/searchResults", async (c) => {
  await delay(300);

  // check if authed
  if (!c.get("isAuthenticated")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.formData();
  const parsed = parseFormData(body);
  const searchQuery = parsed.searchQuery || {};

  const storeOnly = parsed.storeOnly === "true";

  // Generate unique search ID
  const searchId = `search_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}`;

  console.log(`Search request, query: ${searchQuery.searchText || "empty"}`);

  if (storeOnly) {
    // Return just searchId for storeOnly requests
    return c.json({ searchId });
  }

  // For "more like this" requests
  if (parsed.searchRelated === "true") {
    const assetId = searchQuery.searchText;
    const results = standardSearchResults.matches.filter(
      (match) => match.objectId !== assetId
    );

    return c.json({
      ...standardSearchResults,
      searchId,
      matches: results.slice(0, 3), // Limit "more like this" results
      totalResults: results.length,
      searchResults: results.slice(0, 3).map((match) => match.objectId),
    });
  }

  // Handle different search terms with appropriate responses
  // const searchText = searchQuery.searchText?.toLowerCase() || "";

  return c.json({
    ...standardSearchResults,
    searchId,
    searchResults: standardSearchResults.matches.map((match) => match.objectId),
    matches: standardSearchResults.matches,
    totalResults: standardSearchResults.matches.length,
    searchEntry: {
      searchText: searchQuery.searchText || "",
      searchDate: {
        date: new Date().toISOString(),
        timezone_type: 3,
        timezone: "UTC",
      },
    },
  } as SearchResultsResponse);
});

// GET /search/searchResults/:searchId/:page/:loadAll
app.get("/searchResults/:searchId/:page/:loadAll", async (c) => {
  await delay(200);
  const searchId = c.req.param("searchId");
  const page = Number(c.req.param("page") || 0);
  const loadAll = c.req.param("loadAll") === "true";

  // Simulate pagination
  const resultsPerPage = loadAll ? 1000 : 20;
  const startIndex = page * resultsPerPage;
  const endIndex = startIndex + resultsPerPage;

  const allMatches = standardSearchResults.matches;
  const pageMatches = allMatches.slice(startIndex, endIndex);

  return c.json({
    ...standardSearchResults,
    searchId,
    matches: pageMatches,
    currentPage: page,
    totalPages: Math.ceil(allMatches.length / resultsPerPage),
  });
});

// POST /search/getFieldInfo
app.post("/getFieldInfo", async (c) => {
  await delay(150);
  return c.json(mockFieldInfo);
});

// POST /search/getSuggestion
app.post("/getSuggestion", async (c) => {
  await delay(100);
  const formData = await c.req.formData();
  const searchTerm = formData.get("searchTerm") as string;

  // Simple suggestion logic
  const suggestions = Object.keys(mockSuggestions)
    .filter((term) => term.includes(searchTerm?.toLowerCase() || ""))
    .reduce((acc, term) => {
      acc[term] = term;
      return acc;
    }, {} as Record<string, string>);

  return c.json(suggestions);
});

export default app;

import { Hono } from "hono";
import { loadFixture, parseFormData, delay } from "../utils/index";

const app = new Hono();
const searchData = loadFixture("search.json");

// POST /search/searchResults
app.post("/searchResults", async (c) => {
  await delay(300);
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
    const results = searchData.searchResults.matches.filter(
      (match: any) => match.objectId !== assetId
    );

    return c.json({
      ...searchData.searchResults,
      searchId,
      matches: results.slice(0, 3), // Limit "more like this" results
      totalResults: results.length,
    });
  }

  // Regular search results
  return c.json({
    ...searchData.searchResults,
    searchId,
    searchText: searchQuery.searchText || "",
  });
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

  const allMatches = searchData.searchResults.matches;
  const pageMatches = allMatches.slice(startIndex, endIndex);

  return c.json({
    ...searchData.searchResults,
    searchId,
    matches: pageMatches,
    currentPage: page,
    totalPages: Math.ceil(allMatches.length / resultsPerPage),
  });
});

// POST /search/getFieldInfo
app.post("/getFieldInfo", async (c) => {
  await delay(150);
  return c.json(searchData.fieldInfo);
});

// POST /search/getSuggestion
app.post("/getSuggestion", async (c) => {
  await delay(100);
  const formData = await c.req.formData();
  const searchTerm = formData.get("searchTerm") as string;

  // Simple suggestion logic
  const suggestions = Object.keys(searchData.suggestions)
    .filter((term) => term.includes(searchTerm?.toLowerCase() || ""))
    .reduce((acc, term) => {
      acc[term] = term;
      return acc;
    }, {} as Record<string, string>);

  return c.json(suggestions);
});

export default app;

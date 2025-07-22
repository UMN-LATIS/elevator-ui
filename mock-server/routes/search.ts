import { Hono } from "hono";
import { parseFormData, delay } from "../utils/index";
import { 
  standardSearchResults, 
  emptySearchResults, 
  digitalSearchResults, 
  photoSearchResults,
  mockFieldInfo,
  mockSuggestions 
} from "../fixtures/search";

const app = new Hono();

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
    const results = standardSearchResults.matches.filter(
      match => match.objectId !== assetId
    );

    return c.json({
      ...standardSearchResults,
      searchId,
      matches: results.slice(0, 3), // Limit "more like this" results
      totalResults: results.length,
      searchResults: results.slice(0, 3).map(match => match.objectId),
    });
  }

  // Handle different search terms with appropriate responses
  const searchText = searchQuery.searchText?.toLowerCase() || "";
  
  // Return specific result sets based on search terms
  if (searchText === "nonexistentterm" || searchText === "xyz123") {
    return c.json({
      ...emptySearchResults,
      searchId,
      searchEntry: {
        ...emptySearchResults.searchEntry,
        searchText: searchQuery.searchText || "",
      },
    });
  }
  
  if (searchText === "digital") {
    return c.json({
      ...digitalSearchResults,
      searchId,
      searchEntry: {
        ...digitalSearchResults.searchEntry,
        searchText: searchQuery.searchText || "",
      },
    });
  }
  
  if (searchText === "photo" || searchText === "photograph") {
    return c.json({
      ...photoSearchResults,
      searchId,
      searchEntry: {
        ...photoSearchResults.searchEntry,
        searchText: searchQuery.searchText || "",
      },
    });
  }

  // For other search terms, filter the standard results
  let filteredResults = standardSearchResults;
  if (searchText && searchText !== "test") {
    const filteredMatches = standardSearchResults.matches.filter(match => {
      const titleText = match.title ? match.title.toString().toLowerCase() : '';
      return titleText.includes(searchText) ||
        match.template.name.toLowerCase().includes(searchText) ||
        match.collectionHierarchy.some(col => col.title.toLowerCase().includes(searchText));
    });
    
    filteredResults = {
      ...standardSearchResults,
      matches: filteredMatches,
      totalResults: filteredMatches.length,
      searchResults: filteredMatches.map(match => match.objectId),
    };
  }

  // Return results with search context
  return c.json({
    ...filteredResults,
    searchId,
    searchEntry: {
      ...filteredResults.searchEntry,
      searchText: searchQuery.searchText || "",
    },
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

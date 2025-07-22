import type { SearchResultsResponse, SearchResultMatch, TemplateEntry, RawAssetCollection, SearchEntry } from "../../src/types/index";

// Mock template data
export const mockTemplates = {
  someFields: { name: "Some Fields", id: 1 } as TemplateEntry,
  digitalTemplate: { name: "Digital Template", id: 2 } as TemplateEntry,
  imageTemplate: { name: "Image Template", id: 3 } as TemplateEntry,
  basicTemplate: { name: "Basic Template", id: 4 } as TemplateEntry,
};

// Mock collection data
export const mockCollections = {
  default: { id: 1, title: "Default Collection" } as RawAssetCollection,
  sample: { id: 2, title: "Sample Collection" } as RawAssetCollection,
  historic: { id: 3, title: "Historic Collection" } as RawAssetCollection,
};

// Mock search result matches
export const mockSearchMatches: SearchResultMatch[] = [
  {
    dates: [],
    title: "test document",
    objectId: "687138947074c3fd4e03493a",
    locations: [],
    lastModified: "2025-07-11 16:15:16",
    collectionHierarchy: [mockCollections.default],
    template: mockTemplates.someFields,
  },
  {
    dates: [],
    title: "Another test asset",
    objectId: "687138941c0efc795e0bcd28",
    locations: [],
    lastModified: "2025-07-11 16:15:16",
    collectionHierarchy: [mockCollections.default],
    template: mockTemplates.someFields,
  },
  {
    dates: [],
    title: "Sample digital archive",
    objectId: "687138947074c3fd4e03493b",
    locations: [],
    lastModified: "2025-07-10 14:30:22",
    collectionHierarchy: [mockCollections.sample],
    template: mockTemplates.digitalTemplate,
  },
  {
    dates: [],
    title: "Historic photograph",
    objectId: "687138947074c3fd4e03493c",
    locations: [],
    lastModified: "2025-07-09 12:45:33",
    collectionHierarchy: [mockCollections.historic],
    template: mockTemplates.imageTemplate,
  },
  {
    dates: [],
    title: "Empty search result",
    objectId: "687138947074c3fd4e03493d",
    locations: [],
    lastModified: "2025-07-08 10:20:15",
    collectionHierarchy: [mockCollections.default],
    template: mockTemplates.basicTemplate,
  },
];

// Standard search results with matches
export const standardSearchResults: SearchResultsResponse = {
  searchResults: [
    "687138947074c3fd4e03493a",
    "687138941c0efc795e0bcd28",
    "687138947074c3fd4e03493b",
    "687138947074c3fd4e03493c",
    "687138947074c3fd4e03493d",
  ],
  totalResults: 5,
  searchId: "d6e5e032-7738-4791-86e6-1144e20b5c85",
  sortableWidgets: {
    "0": "Best Match",
    "lastModified.desc": "Modified Date (newest to oldest)",
    "lastModified.asc": "Modified Date (oldest to newest)",
    "title.raw": "Default Title",
    "collection": "Collection",
    "template": "Template",
  },
  matches: mockSearchMatches,
  success: true,
  searchEntry: {
    searchText: "test",
    searchDate: new Date("2025-07-21 23:27:15.395049"),
    combineSpecificSearches: "OR",
  } as SearchEntry,
};

// Empty search results (no matches)
export const emptySearchResults: SearchResultsResponse = {
  searchResults: [],
  totalResults: 0,
  searchId: "empty-search-id",
  sortableWidgets: {
    "0": "Best Match",
    "lastModified.desc": "Modified Date (newest to oldest)",
    "lastModified.asc": "Modified Date (oldest to newest)",
    "title.raw": "Default Title",
    "collection": "Collection",
    "template": "Template",
  },
  matches: [],
  success: true,
  searchEntry: {
    searchText: "nonexistentterm",
    searchDate: new Date("2025-07-21 23:27:15.395049"),
    combineSpecificSearches: "OR",
  } as SearchEntry,
};

// Search results filtered by term
export const digitalSearchResults: SearchResultsResponse = {
  ...standardSearchResults,
  searchId: "digital-search-id",
  matches: mockSearchMatches.filter(match => {
    const titleText = match.title ? match.title.toString().toLowerCase() : '';
    return titleText.includes("digital") ||
      match.template.name.toLowerCase().includes("digital");
  }),
  searchEntry: {
    searchText: "digital",
    searchDate: new Date("2025-07-21 23:27:15.395049"),
    combineSpecificSearches: "OR",
  } as SearchEntry,
};

// Update totalResults for filtered results
digitalSearchResults.totalResults = digitalSearchResults.matches.length;
digitalSearchResults.searchResults = digitalSearchResults.matches.map(match => match.objectId);

// Photo/photograph search results
export const photoSearchResults: SearchResultsResponse = {
  ...standardSearchResults,
  searchId: "photo-search-id",
  matches: mockSearchMatches.filter(match => {
    const titleText = match.title ? match.title.toString().toLowerCase() : '';
    return titleText.includes("photo") ||
      match.template.name.toLowerCase().includes("image");
  }),
  searchEntry: {
    searchText: "photo",
    searchDate: new Date("2025-07-21 23:27:15.395049"),
    combineSpecificSearches: "OR",
  } as SearchEntry,
};

photoSearchResults.totalResults = photoSearchResults.matches.length;
photoSearchResults.searchResults = photoSearchResults.matches.map(match => match.objectId);

// Field info for advanced search
export const mockFieldInfo = {
  fieldValues: [
    { value: "option1", label: "Option 1", count: 5 },
    { value: "option2", label: "Option 2", count: 3 },
    { value: "option3", label: "Option 3", count: 1 },
  ],
};

// Search suggestions
export const mockSuggestions = {
  sample: "sample",
  test: "test",
  digital: "digital",
  document: "document",
  photo: "photo",
  archive: "archive",
  historic: "historic",
};

// Export consolidated search data for backwards compatibility
export const searchData = {
  searchResults: standardSearchResults,
  emptySearchResults,
  digitalSearchResults,
  photoSearchResults,
  fieldInfo: mockFieldInfo,
  suggestions: mockSuggestions,
};
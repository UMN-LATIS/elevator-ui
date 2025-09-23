import { describe, it, expect } from "vitest";
import { filterCollections } from "./collectionHelpers";
import type { AssetCollection } from "@/types";

describe("filterCollections", () => {

  it("returns empty array when input is empty", () => {
    // Base case: no collections to filter
    const result = filterCollections((col: AssetCollection) => col.canView, []);
    
    expect(result).toEqual([]);
  });

  it("includes collection when it passes the predicate", () => {
    // Collection that passes the canView predicate (canView: true)
    const collection: AssetCollection = {
      id: 1,
      title: "Test Collection",
      description: null,
      previewImageId: null,
      children: [],
      parentId: null,
      showInBrowse: true,
      canView: true, // This makes it pass the predicate
      canEdit: true,
    };
    
    const result = filterCollections((col: AssetCollection) => col.canView, [collection]);
    
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(collection);
  });

  it("excludes collection when it fails predicate and has no children", () => {
    // Collection that fails the canView predicate with no children to promote
    const collection: AssetCollection = {
      id: 1,
      title: "Hidden Collection",
      description: null,
      previewImageId: null,
      children: [], // No children available for promotion
      parentId: null,
      showInBrowse: true,
      canView: false, // This makes it fail the predicate
      canEdit: true,
    };
    
    const result = filterCollections((col: AssetCollection) => col.canView, [collection]);
    
    expect(result).toHaveLength(0);
  });

  it("includes parent with filtered children when parent passes predicate", () => {
    // Parent passes predicate, has mix of visible/hidden children
    // Should include parent with only the visible children
    const parent: AssetCollection = {
      id: 1,
      title: "Parent Collection",
      description: null,
      previewImageId: null,
      children: [
        {
          id: 2,
          title: "Visible Child",
          description: null,
          previewImageId: null,
          children: [],
          parentId: 1,
          showInBrowse: true,
          canView: true, // This child passes the predicate
          canEdit: true,
        },
        {
          id: 3,
          title: "Hidden Child",
          description: null,
          previewImageId: null,
          children: [],
          parentId: 1,
          showInBrowse: true,
          canView: false, // This child fails the predicate
          canEdit: true,
        },
      ],
      parentId: null,
      showInBrowse: true,
      canView: true, // Parent passes the predicate
      canEdit: true,
    };

    const result = filterCollections((col: AssetCollection) => col.canView, [parent]);
    
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
    expect(result[0].children).toHaveLength(1); // Only visible child included
    expect(result[0].children![0].id).toBe(2);
  });

  it("promotes children when parent fails predicate but children pass", () => {
    // Parent fails predicate but has children that pass
    // Children should be promoted to replace the parent
    const parent: AssetCollection = {
      id: 1,
      title: "Hidden Parent",
      description: null,
      previewImageId: null,
      children: [
        {
          id: 2,
          title: "Visible Child 1",
          description: null,
          previewImageId: null,
          children: [],
          parentId: 1,
          showInBrowse: true,
          canView: true, // This child passes the predicate
          canEdit: true,
        },
        {
          id: 3,
          title: "Visible Child 2",
          description: null,
          previewImageId: null,
          children: [],
          parentId: 1,
          showInBrowse: true,
          canView: true, // This child passes the predicate
          canEdit: true,
        },
      ],
      parentId: null,
      showInBrowse: true,
      canView: false, // Parent fails the predicate
      canEdit: true,
    };

    const result = filterCollections((col: AssetCollection) => col.canView, [parent]);
    
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(2);
    expect(result[1].id).toBe(3);
    // Children should inherit the hidden parent's parentId
    expect(result[0].parentId).toBe(null);
    expect(result[1].parentId).toBe(null);
  });

  it("handles deeply nested collections with promotion", () => {
    // Parent passes, child fails, grandchild passes
    // Grandchild should be promoted to be direct child of parent
    const parent: AssetCollection = {
      id: 1,
      title: "Parent",
      description: null,
      previewImageId: null,
      children: [
        {
          id: 2,
          title: "Child",
          description: null,
          previewImageId: null,
          children: [
            {
              id: 3,
              title: "Grandchild",
              description: null,
              previewImageId: null,
              children: [],
              parentId: 2,
              showInBrowse: true,
              canView: true, // Grandchild passes the predicate
              canEdit: true,
            },
          ],
          parentId: 1,
          showInBrowse: true,
          canView: false, // Child fails the predicate
          canEdit: true,
        },
      ],
      parentId: null,
      showInBrowse: true,
      canView: true, // Parent passes the predicate
      canEdit: true,
    };

    const result = filterCollections((col: AssetCollection) => col.canView, [parent]);
    
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
    expect(result[0].children).toHaveLength(1);
    // The grandchild should be promoted to be a direct child of parent
    expect(result[0].children![0].id).toBe(3);
    expect(result[0].children![0].parentId).toBe(1);
  });

  it("filters multiple collections with mixed visibility", () => {
    // Mix of collections that pass and fail the predicate
    // Only passing collections should be included
    const collections: AssetCollection[] = [
      {
        id: 1,
        title: "Visible Collection",
        description: null,
        previewImageId: null,
        children: [],
        parentId: null,
        showInBrowse: true,
        canView: true, // Passes predicate
        canEdit: true,
      },
      {
        id: 2,
        title: "Hidden Collection",
        description: null,
        previewImageId: null,
        children: [],
        parentId: null,
        showInBrowse: true,
        canView: false, // Fails predicate
        canEdit: true,
      },
      {
        id: 3,
        title: "Another Visible",
        description: null,
        previewImageId: null,
        children: [],
        parentId: null,
        showInBrowse: true,
        canView: true, // Passes predicate
        canEdit: true,
      },
    ];

    const result = filterCollections((col: AssetCollection) => col.canView, collections);
    
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(1);
    expect(result[1].id).toBe(3);
  });

  it("handles collections with null children", () => {
    // Collection passes predicate but has null children instead of empty array
    // Should normalize null children to empty array
    const collection: AssetCollection = {
      id: 1,
      title: "Collection",
      description: null,
      previewImageId: null,
      children: null, // null children should be handled gracefully
      parentId: null,
      showInBrowse: true,
      canView: true, // Passes predicate
      canEdit: true,
    };

    const result = filterCollections((col: AssetCollection) => col.canView, [collection]);
    
    expect(result).toHaveLength(1);
    expect(result[0].children).toEqual([]);
  });

  it("promotes through multiple levels when all ancestors fail predicate", () => {
    // Only the great-grandchild passes predicate - it should be promoted to root level
    // Parent, child, and grandchild all fail, so great-grandchild bubbles up completely
    const parent: AssetCollection = {
      id: 1,
      title: "Parent",
      description: null,
      previewImageId: null,
      children: [
        {
          id: 2,
          title: "Child",
          description: null,
          previewImageId: null,
          children: [
            {
              id: 3,
              title: "Grandchild",
              description: null,
              previewImageId: null,
              children: [
                {
                  id: 4,
                  title: "Great Grandchild",
                  description: null,
                  previewImageId: null,
                  children: [],
                  parentId: 3,
                  showInBrowse: true,
                  canView: true, // Only this one passes the predicate
                  canEdit: true,
                },
              ],
              parentId: 2,
              showInBrowse: true,
              canView: false, // Grandchild fails predicate
              canEdit: true,
            },
          ],
          parentId: 1,
          showInBrowse: true,
          canView: false, // Child fails predicate
          canEdit: true,
        },
      ],
      parentId: null,
      showInBrowse: true,
      canView: false, // Parent fails predicate
      canEdit: true,
    };

    const result = filterCollections((col: AssetCollection) => col.canView, [parent]);
    
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(4);
    // Great grandchild should be promoted all the way up to root level
    expect(result[0].parentId).toBe(null);
  });

  it("preserves correct parentId when promoting grandchild to parent", () => {
    // Parent passes, child fails, grandchild passes
    // Grandchild should be promoted but get the failing child's parentId (the parent's id)
    const parent: AssetCollection = {
      id: 1,
      title: "Parent",
      description: null,
      previewImageId: null,
      children: [
        {
          id: 2,
          title: "Hidden Child",
          description: null,
          previewImageId: null,
          children: [
            {
              id: 3,
              title: "Grandchild",
              description: null,
              previewImageId: null,
              children: [],
              parentId: 2,
              showInBrowse: true,
              canView: true, // Grandchild passes predicate
              canEdit: true,
            },
          ],
          parentId: 1,
          showInBrowse: true,
          canView: false, // Child fails predicate
          canEdit: true,
        },
      ],
      parentId: null,
      showInBrowse: true,
      canView: true, // Parent passes predicate
      canEdit: true,
    };

    const result = filterCollections((col: AssetCollection) => col.canView, [parent]);
    
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
    expect(result[0].children).toHaveLength(1);
    expect(result[0].children![0].id).toBe(3);
    // Grandchild should get the hidden child's parentId (which was 1)
    expect(result[0].children![0].parentId).toBe(1);
  });

  it("works with custom predicate function", () => {
    // Test with different predicate - filter by title content instead of canView
    // Only collections with "Important" in title should pass
    const collections: AssetCollection[] = [
      {
        id: 1,
        title: "Important Collection", // Contains "Important" - passes predicate
        description: null,
        previewImageId: null,
        children: [],
        parentId: null,
        showInBrowse: true,
        canView: true,
        canEdit: true,
      },
      {
        id: 2,
        title: "Regular Collection", // Does not contain "Important" - fails predicate
        description: null,
        previewImageId: null,
        children: [],
        parentId: null,
        showInBrowse: true,
        canView: true,
        canEdit: true,
      },
      {
        id: 3,
        title: "Another Important One", // Contains "Important" - passes predicate
        description: null,
        previewImageId: null,
        children: [],
        parentId: null,
        showInBrowse: true,
        canView: true,
        canEdit: true,
      },
    ];

    const result = filterCollections(
      (col: AssetCollection) => col.title.includes("Important"),
      collections
    );
    
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe("Important Collection");
    expect(result[1].title).toBe("Another Important One");
  });

  it("combines direct children and promoted grandchildren", () => {
    // Parent passes, has one visible child and one hidden child with visible grandchild
    // Result should include parent with both the visible child and the promoted grandchild
    const parent: AssetCollection = {
      id: 1,
      title: "Parent",
      description: null,
      previewImageId: null,
      children: [
        {
          id: 2,
          title: "Visible Child",
          description: null,
          previewImageId: null,
          children: [],
          parentId: 1,
          showInBrowse: true,
          canView: true, // Direct child passes predicate
          canEdit: true,
        },
        {
          id: 3,
          title: "Hidden Child",
          description: null,
          previewImageId: null,
          children: [
            {
              id: 4,
              title: "Visible Grandchild",
              description: null,
              previewImageId: null,
              children: [],
              parentId: 3,
              showInBrowse: true,
              canView: true, // Grandchild passes predicate
              canEdit: true,
            },
          ],
          parentId: 1,
          showInBrowse: true,
          canView: false, // Child fails predicate, so grandchild gets promoted
          canEdit: true,
        },
      ],
      parentId: null,
      showInBrowse: true,
      canView: true, // Parent passes predicate
      canEdit: true,
    };

    const result = filterCollections((col: AssetCollection) => col.canView, [parent]);
    
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
    expect(result[0].children).toHaveLength(2);
    
    // First child should be the visible child
    expect(result[0].children![0].id).toBe(2);
    expect(result[0].children![0].parentId).toBe(1);
    
    // Second child should be the promoted grandchild
    expect(result[0].children![1].id).toBe(4);
    expect(result[0].children![1].parentId).toBe(1);
  });
});
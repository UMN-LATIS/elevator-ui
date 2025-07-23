import { Page } from "../../src/types";
import { MockPage } from "../types";
import { createBaseTable } from "./baseTable";

const pageSeeds: MockPage[] = [
  { id: 1, title: "Home Page", content: "<p>Welcome to the home page</p>" },
  { id: 2, title: "About", content: "<p>Learn more about us</p>" },
];

function toPageWithoutContent(page: MockPage): Page {
  return {
    id: page.id,
    title: page.title,
    children: page.children?.map(toPageWithoutContent) ?? ([] as Page[]),
  };
}

export function createPagesTable() {
  const baseTable = createBaseTable((page: MockPage) => page.id, pageSeeds);

  return {
    ...baseTable,
    // Table-specific methods
    getAllWithoutContent: (): Page[] => {
      return baseTable.getAll().map(toPageWithoutContent);
    },
  };
}

export type PagesTable = ReturnType<typeof createPagesTable>;

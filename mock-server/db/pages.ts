import { Page } from "../../src/types";
import { MockPage } from "../types";

const pageSeeds: MockPage[] = [
  { id: 1, title: "Home Page", content: "<p>Welcome to the home page</p>" },
  { id: 2, title: "About", content: "<p>Learn more about us</p>" },
];

const pageStore = new Map<MockPage["id"], MockPage>(
  pageSeeds.map((page) => [page.id, page])
);

function toPageWithoutContent(page: MockPage): Page {
  return {
    id: page.id,
    title: page.title,
    children: page.children?.map(toPageWithoutContent) ?? ([] as Page[]),
  };
}

export const pages = {
  get: (pageId: MockPage["id"]): MockPage | undefined => {
    return pageStore.get(pageId);
  },
  getAll: (): MockPage[] => {
    return Array.from(pageStore.values());
  },
  getAllWithoutContent: (): Page[] => {
    return Array.from(pageStore.values()).map(toPageWithoutContent);
  },
};

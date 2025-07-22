import { StaticContentPage } from "../../src/types";

const pageSeeds: StaticContentPage[] = [
  { id: 1, title: "Home Page", content: "<p>Welcome to the home page</p>" },
  { id: 2, title: "About", content: "<p>Learn more about us</p>" },
];

const pageStore = new Map<StaticContentPage["id"], StaticContentPage>(
  pageSeeds.map((page) => [page.id, page])
);

export const pages = {
  get: (pageId: StaticContentPage["id"]): StaticContentPage | undefined => {
    return pageStore.get(pageId);
  },
  getAll: (): StaticContentPage[] => {
    return Array.from(pageStore.values());
  },
};

import { Page } from "../../src/types";
import { MockPage } from "../types";
import { createBaseTable } from "./baseTable";

const pageSeeds: MockPage[] = [
  {
    id: 1,
    title: "Home Page",
    content: `<h1>Elevator Home Page</h1>
      <p>Welcome to the Elevator mock server!</p>
      <img src="https://upload.wikimedia.org/wikipedia/commons/5/59/Goldy_the_Gopher.jpg" alt="Goldy the Gopher" width="300" />
      <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Goldy_Gopher_Volleyball.jpg/500px-Goldy_Gopher_Volleyball.jpg" alt="Goldy Gopher snowboarding down a staircase at a women's volleyball game" width="300" />
    `,
  },
  {
    id: 2,
    title: "About Elevator",
    includeInNav: true,
    content: `
    <p>Learn more about us</p>
    <img src="https://upload.wikimedia.org/wikipedia/commons/5/59/Goldy_the_Gopher.jpg" alt="Goldy the Gopher" width="300" />
    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Goldy_Gopher_Volleyball.jpg/500px-Goldy_Gopher_Volleyball.jpg" alt="Goldy Gopher snowboarding down a staircase at a women's volleyball game" width="300" />
    `,
  },
  {
    id: 3,
    title: "Test Page with Broken Images",
    includeInNav: true,
    content: `
    <p>This page has a mix of valid and broken images to test error handling</p>
    <img src="https://upload.wikimedia.org/wikipedia/commons/5/59/Goldy_the_Gopher.jpg" alt="Valid image" width="300" />
    <img src="https://invalid-domain-that-does-not-exist.com/broken-image.jpg" alt="Broken image 1" width="300" />
    <img src="https://example.com/this-image-does-not-exist-404.png" alt="Broken image 2" width="300" />
    `,
  },
  {
    id: 4,
    title: "Test Page with Slow Loading Image",
    content: `
    <h1>Page with Timeout Test</h1>
    <p>This page has an image that takes longer than the timeout to load</p>
    <img src="https://upload.wikimedia.org/wikipedia/commons/5/59/Goldy_the_Gopher.jpg" alt="Fast loading image" width="300" />
    <img src="http://localhost:3001/_tests/slow-image.jpg" alt="Slow loading image" width="300" />
    `,
  },
];

function toPageWithoutContent(page: MockPage): Page {
  return {
    id: page.id,
    title: page.title,
    includeInNav: page.includeInNav,
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

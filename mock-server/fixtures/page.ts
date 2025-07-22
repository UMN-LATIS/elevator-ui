import type { StaticContentPage } from "../../src/types/index";

export const page: StaticContentPage = {
  title: "About",
  content: "<h1>About</h1><p>This is a test page.</p>",
};

// when 'title' is 'Home Page', it is used as the home page
export const homePage: StaticContentPage = {
  id: 1,
  title: "Home Page",
  content: "<h1>Elevator Home Page</h1><p>This is the home page content.</p>",
};

export const makeStaticContentPage = (
  id: number | string
): StaticContentPage => ({
  id: typeof id === "number" ? id : parseInt(id, 10),
  title: `Page ${id}`,
  content: `<h1>Page ${id}</h1><p>This is the content for page ${id}.</p>`,
});

export default page;

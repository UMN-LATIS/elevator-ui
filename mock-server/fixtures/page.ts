export interface StaticPage {
  pageId: number;
  pageTitle: string;
  content: string;
  lastModified: string;
}

export const page: StaticPage = {
  pageId: 1,
  pageTitle: "About",
  content: "<h1>About</h1><p>This is a test page.</p>",
  lastModified: "2024-01-15T10:30:00Z",
};

export default page;

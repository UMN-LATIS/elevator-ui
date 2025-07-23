import { Hono } from "hono";
import { parseFormData, delay, makeSimpleSVG } from "../utils/index";
import type { FileFormData, MockServerContext } from "../types";

const app = new Hono<MockServerContext>();

// GET /fileManager/getMetadataForObject/:fileId
app.get("/getMetadataForObject/:fileId", async (c) => {
  await delay(150);
  const db = c.get("db");
  const fileId = c.req.param("fileId");
  const metadata = db.files.getMetadata(fileId);
  return c.json(metadata);
});

// GET /fileManager/getDerivativeById/:fileId/:filetype
app.get("/getDerivativeById/:fileId/:filetype", async (c) => {
  const fileId = c.req.param("fileId");
  const filetype = c.req.param("filetype");

  console.log(`Downloading derivative: ${fileId} (${filetype})`);

  if (filetype === "thumbnail") {
    // Return a simple SVG placeholder for thumbnails
    const svg = makeSimpleSVG(fileId);
    return new Response(svg, {
      headers: { "Content-Type": "image/svg+xml" },
    });
  }

  return new Response(`Mock ${filetype} content for ${fileId}`, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="file-${fileId}.${filetype}"`,
    },
  });
});

// POST /fileManager/previewImageAvailable
app.post("/previewImageAvailable", async (c) => {
  await delay(100);
  const formData = await c.req.formData();
  const parsed = parseFormData(formData) as FileFormData;
  const fileIds = parsed.checkArray || [];

  const results = (fileIds as string[]).map((fileId: string) => ({
    fileId,
    status: Math.random() < 0.6 ? "icon" : "true",
  }));

  return c.json(results);
});

app.get("/previewImageByFileId/:fileId/true", async (c) => {
  await delay(100);
  const fileId = c.req.param("fileId");

  // Return a simple SVG placeholder for the preview
  const svg = makeSimpleSVG(fileId);
  return new Response(svg, {
    headers: { "Content-Type": "image/svg+xml" },
  });
});

export default app;

import { Hono } from "hono";
import { loadFixture, parseFormData, delay } from "../utils/fixtures.js";

const app = new Hono();
const drawersData = loadFixture("drawers.json");

// In-memory storage for demo purposes
let drawers = [...drawersData.drawersList.drawers];
let nextDrawerId = 3;

// GET /drawers/listDrawers/true
app.get("/listDrawers/true", async (c) => {
  await delay(200);
  console.log("Drawers requested");
  // Match real API - returns object with drawer IDs as keys when authenticated
  return c.json({
    "1": {
      title: "My Drawer!",
    },
  });
});

// GET /drawers/getDrawer/:drawerId
app.get("/getDrawer/:drawerId", async (c) => {
  await delay(150);
  const drawerId = Number(c.req.param("drawerId"));

  // Return drawer with matching ID or default drawer
  const drawer =
    drawerId === 1
      ? drawersData.drawer
      : {
          ...drawersData.drawer,
          drawerId,
          drawerTitle: `Drawer ${drawerId}`,
          assets: [],
        };

  return c.json(drawer);
});

// POST /drawers/addDrawer
app.post("/addDrawer", async (c) => {
  await delay(300);
  const formData = await c.req.formData();
  const drawerTitle = formData.get("drawerTitle") as string;

  const newDrawer = {
    drawerId: nextDrawerId++,
    drawerTitle,
    assetCount: 0,
    createdDate: new Date().toISOString(),
    modifiedDate: new Date().toISOString(),
  };

  drawers.push(newDrawer);

  return c.json({
    ...drawersData.createDrawerResponse,
    drawerId: newDrawer.drawerId,
    drawerTitle,
  });
});

// POST /drawers/delete/:drawerId/true
app.post("/delete/:drawerId/true", async (c) => {
  await delay(200);
  const drawerId = Number(c.req.param("drawerId"));

  drawers = drawers.filter((d) => d.drawerId !== drawerId);

  return c.json({ success: true, message: "Drawer deleted successfully" });
});

// POST /drawers/addToDrawer/true
app.post("/addToDrawer/true", async (c) => {
  await delay(250);
  const formData = await c.req.formData();
  const parsed = parseFormData(formData);

  // Handle both single asset and asset array
  const objectId = parsed.objectId;
  const objectArray = parsed.objectArray;
  const drawerId = Number(parsed.drawerList);

  if (objectArray) {
    // Multiple assets
    console.log(`Adding ${objectArray.length} assets to drawer ${drawerId}`);
  } else if (objectId) {
    // Single asset
    console.log(`Adding asset ${objectId} to drawer ${drawerId}`);

    // Handle excerpt data if present
    if (parsed.label) {
      console.log(
        `With excerpt: ${parsed.label} (${parsed.startTime}-${parsed.endTime})`
      );
    }
  }

  return c.json(drawersData.addAssetResponse);
});

// POST /drawers/removeFromDrawer/:drawerId/:assetId/true
app.post("/removeFromDrawer/:drawerId/:assetId/true", async (c) => {
  await delay(200);
  return c.json(drawersData.removeAssetResponse);
});

// POST /drawers/removeExcerpt/:drawerId/:excerptId/true
app.post("/removeExcerpt/:drawerId/:excerptId/true", async (c) => {
  await delay(200);
  return c.json(drawersData.removeAssetResponse);
});

// POST /drawers/setSortOrder/:drawerId/:sortBy
app.post("/setSortOrder/:drawerId/:sortBy", async (c) => {
  await delay(100);
  const drawerId = c.req.param("drawerId");
  const sortBy = c.req.param("sortBy");

  console.log(`Setting drawer ${drawerId} sort order to ${sortBy}`);

  return c.json({ success: true, message: "Sort order updated" });
});

// POST /drawers/setCustomOrder/:drawerId
app.post("/setCustomOrder/:drawerId", async (c) => {
  await delay(200);
  const formData = await c.req.formData();
  const parsed = parseFormData(formData);
  const orderArray = parsed.orderArray;

  console.log(
    `Setting custom order for drawer with ${orderArray?.length || 0} assets`
  );

  return c.json({ success: true, message: "Custom order updated" });
});

// POST /drawers/downloadDrawer/:drawerId/true
app.post("/downloadDrawer/:drawerId/true", async (c) => {
  await delay(400);
  return c.json(drawersData.downloadResponse);
});

export default app;

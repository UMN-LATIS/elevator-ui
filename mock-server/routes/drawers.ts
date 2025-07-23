import { Hono } from "hono";
import { parseFormData, delay } from "../utils/index";
import { db } from "../db/index.js";
import type { DrawerFormData, MockServerContext } from "../types";

const app = new Hono<MockServerContext>();

// GET /drawers/listDrawers/true
app.get("/listDrawers/true", async (c) => {
  await delay(200);
  const user = c.get("user");

  if (!user) {
    return c.json([], 200);
  }

  console.log(`Drawers requested for user ${user.username}`);
  const userDrawers = db.drawers.getByUserId(user.id);

  // Convert to API format - object with drawer IDs as keys
  const drawersList = userDrawers.reduce((acc, drawer) => {
    acc[drawer.id.toString()] = {
      title: drawer.name,
    };
    return acc;
  }, {} as Record<string, { title: string }>);

  return c.json(drawersList);
});

// GET /drawers/getDrawer/:drawerId
// app.get("/getDrawer/:drawerId", async (c) => {
//   await delay(150);
//   const drawerId = Number(c.req.param("drawerId"));
//   const user = c.get("user");

//   if (!user) {
//     return c.json({ error: "Unauthorized" }, 401);
//   }

//   const drawer = db.drawers.get(drawerId);

//   if (!drawer || drawer.userId !== user.id) {
//     return c.json({ error: "Drawer not found" }, 404);
//   }

//   return c.json(drawer);
// });

// POST /drawers/addDrawer
// app.post("/addDrawer", async (c) => {
//   await delay(300);
//   const user = c.get("user");

//   if (!user) {
//     return c.json({ error: "Unauthorized" }, 401);
//   }

//   const formData = await c.req.formData();
//   const drawerTitle = formData.get("drawerTitle") as string;

//   const newDrawer = db.drawers.create({
//     name: drawerTitle,
//     userId: user.id,
//     description: "",
//     assetIds: [],
//     isPublic: false,
//   });

//   return c.json({
//     drawerId: newDrawer.id,
//     drawerTitle: newDrawer.name,
//     success: true,
//     message: "Drawer created successfully",
//   });
// });

// POST /drawers/delete/:drawerId/true
// app.post("/delete/:drawerId/true", async (c) => {
//   await delay(200);
//   const drawerId = Number(c.req.param("drawerId"));
//   const user = c.get("user");

//   if (!user) {
//     return c.json({ error: "Unauthorized" }, 401);
//   }

//   const drawer = db.drawers.get(drawerId);
//   if (!drawer || drawer.userId !== user.id) {
//     return c.json({ error: "Drawer not found" }, 404);
//   }

//   db.drawers.delete(drawerId);

//   return c.json({ success: true, message: "Drawer deleted successfully" });
// });

// POST /drawers/addToDrawer/true
// app.post("/addToDrawer/true", async (c) => {
//   await delay(250);
//   const user = c.get("user");

//   if (!user) {
//     return c.json({ error: "Unauthorized" }, 401);
//   }

//   const formData = await c.req.formData();
//   const parsed = parseFormData(formData) as DrawerFormData;

//   // Handle both single asset and asset array
//   const objectId = parsed.objectId as string;
//   const objectArray = parsed.objectArray as string[];
//   const drawerId = Number(parsed.drawerList);

//   const drawer = db.drawers.get(drawerId);
//   if (!drawer || drawer.userId !== user.id) {
//     return c.json({ error: "Drawer not found" }, 404);
//   }

//   if (objectArray && objectArray.length > 0) {
//     // Multiple assets
//     console.log(`Adding ${objectArray.length} assets to drawer ${drawerId}`);
//     db.drawers.addAssets(drawerId, objectArray);
//   } else if (objectId) {
//     // Single asset
//     console.log(`Adding asset ${objectId} to drawer ${drawerId}`);
//     db.drawers.addAssets(drawerId, [objectId]);

//     // Handle excerpt data if present
//     if (parsed.label) {
//       console.log(
//         `With excerpt: ${parsed.label} (${parsed.startTime}-${parsed.endTime})`
//       );
//     }
//   }

//   return c.json({
//     success: true,
//     message: "Asset(s) added to drawer successfully",
//   });
// });

// POST /drawers/removeFromDrawer/:drawerId/:assetId/true
// app.post("/removeFromDrawer/:drawerId/:assetId/true", async (c) => {
//   await delay(200);
//   const drawerId = Number(c.req.param("drawerId"));
//   const assetId = c.req.param("assetId");
//   const user = c.get("user");

//   if (!user) {
//     return c.json({ error: "Unauthorized" }, 401);
//   }

//   const drawer = db.drawers.get(drawerId);
//   if (!drawer || drawer.userId !== user.id) {
//     return c.json({ error: "Drawer not found" }, 404);
//   }

//   db.drawers.removeAssets(drawerId, [assetId]);

//   return c.json({
//     success: true,
//     message: "Asset removed from drawer successfully",
//   });
// });

// POST /drawers/removeExcerpt/:drawerId/:excerptId/true
// app.post("/removeExcerpt/:drawerId/:excerptId/true", async (c) => {
//   await delay(200);
//   const drawerId = Number(c.req.param("drawerId"));
//   const excerptId = c.req.param("excerptId");
//   const user = c.get("user");

//   if (!user) {
//     return c.json({ error: "Unauthorized" }, 401);
//   }

//   const drawer = db.drawers.get(drawerId);
//   if (!drawer || drawer.userId !== user.id) {
//     return c.json({ error: "Drawer not found" }, 404);
//   }

//   console.log(`Removing excerpt ${excerptId} from drawer ${drawerId}`);

//   return c.json({
//     success: true,
//     message: "Excerpt removed from drawer successfully",
//   });
// });

// POST /drawers/setSortOrder/:drawerId/:sortBy
// app.post("/setSortOrder/:drawerId/:sortBy", async (c) => {
//   await delay(100);
//   const drawerId = c.req.param("drawerId");
//   const sortBy = c.req.param("sortBy");

//   console.log(`Setting drawer ${drawerId} sort order to ${sortBy}`);

//   return c.json({ success: true, message: "Sort order updated" });
// });

// POST /drawers/setCustomOrder/:drawerId
// app.post("/setCustomOrder/:drawerId", async (c) => {
//   await delay(200);
//   const formData = await c.req.formData();
//   const parsed = parseFormData(formData) as DrawerFormData;
//   const orderArray = (parsed.orderArray as string[]) || [];

//   console.log(
//     `Setting custom order for drawer with ${orderArray.length} assets`
//   );

//   return c.json({ success: true, message: "Custom order updated" });
// });

// POST /drawers/downloadDrawer/:drawerId/true
// app.post("/downloadDrawer/:drawerId/true", async (c) => {
//   await delay(400);
//   const drawerId = Number(c.req.param("drawerId"));
//   const user = c.get("user");

//   if (!user) {
//     return c.json({ error: "Unauthorized" }, 401);
//   }

//   const drawer = db.drawers.get(drawerId);
//   if (!drawer || drawer.userId !== user.id) {
//     return c.json({ error: "Drawer not found" }, 404);
//   }

//   return c.json({
//     downloadUrl: `/downloads/drawer-${drawerId}.zip`,
//     message: "Download prepared successfully",
//     fileName: `${drawer.name}.zip`,
//   });
// });

export default app;

import { Hono } from "hono";
import { delay } from "../utils/index";
import type { MockCollection, MockServerContext } from "../types";
import type { CollectionsTable } from "../db/collections";
import { INSTANCE_S3_DEFAULTS } from "../db/instances";
import type {
  AdminCollectionDetail,
  AdminCollectionSummary,
} from "../../src/types";

const app = new Hono<MockServerContext>();

// the validator's message, which the UI surfaces verbatim
const TITLE_REQUIRED = "This field is required";

function toAdminCollectionSummary(
  collection: MockCollection
): AdminCollectionSummary {
  return {
    id: collection.id,
    title: collection.title,
    parentId: collection.parentId,
    showInBrowse: collection.showInBrowse,
    previewImageId: collection.previewImageId,
  };
}

function toAdminCollectionDetail(
  collection: MockCollection
): AdminCollectionDetail {
  return {
    ...toAdminCollectionSummary(collection),
    description: collection.description,
    bucket: collection.bucket,
    bucketRegion: collection.bucketRegion,
    s3Key: collection.s3Key,
    s3Secret: collection.s3Secret,
  };
}

interface CollectionForm {
  title: string;
  parentId: number | null;
  showInBrowse: boolean;
  description: string;
  previewImageId: string;
  bucket: string;
  bucketRegion: string;
  s3Key: string;
  s3Secret: string;
}

// null for a path segment that is not an integer, which the API
// rejects as a bad request rather than a missing collection.
function toCollectionId(rawCollectionId: string): number | null {
  const collectionId = Number(rawCollectionId);
  if (!Number.isInteger(collectionId)) return null;
  return collectionId;
}

// The form sends 0 for top level.
function toParentId(rawParentId: string): number | null {
  const parentId = Number(rawParentId);
  if (!Number.isInteger(parentId) || parentId <= 0) return null;
  return parentId;
}

function readCollectionForm(body: Record<string, unknown>): CollectionForm {
  const readText = (key: string): string => {
    const value = body[key];
    return typeof value === "string" ? value : "";
  };

  return {
    title: readText("title"),
    parentId: toParentId(readText("parentId")),
    showInBrowse: readText("showInBrowse") === "true",
    description: readText("description"),
    previewImageId: readText("previewImageId"),
    bucket: readText("bucket"),
    bucketRegion: readText("bucketRegion"),
    s3Key: readText("s3Key"),
    s3Secret: readText("s3Secret"),
  };
}

// A blank S3 field means "unset": create falls back to the instance
// defaults, update keeps whatever is already stored. Storing "" would
// break asset storage.
function toStoredS3Setting(
  submitted: string,
  fallback: string | null
): string | null {
  if (submitted === "") return fallback;
  return submitted;
}

// Walking up from the proposed parent must reach the top level without
// meeting the collection itself, or the tree gains a cycle and every
// recursive read of it hangs.
function wouldCreateCycle(
  collections: CollectionsTable,
  collectionId: number,
  parentId: number | null
): boolean {
  let ancestorId = parentId;
  while (ancestorId !== null) {
    if (ancestorId === collectionId) return true;
    ancestorId = collections.get(ancestorId)?.parentId ?? null;
  }
  return false;
}

// every route requires a signed-in instance admin
app.use("*", async (c, next) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Not Authenticated" }, 401);
  }
  if (!user.isInstanceAdmin && !user.isSuperAdmin) {
    return c.json({ error: "Forbidden" }, 403);
  }

  await next();
});

app.get("/collections", async (c) => {
  await delay(100);
  const db = c.get("db");

  const collections = db.collections
    .getAll()
    .sort((left, right) => left.title.localeCompare(right.title))
    .map(toAdminCollectionSummary);

  return c.json({ collections });
});

app.get("/collections/:collectionId", async (c) => {
  await delay(100);
  const db = c.get("db");

  const collectionId = toCollectionId(c.req.param("collectionId"));
  if (collectionId === null) {
    return c.json({ error: "Invalid ID" }, 400);
  }

  const collection = db.collections.get(collectionId);
  if (!collection) {
    return c.json({ error: "Collection not found" }, 404);
  }

  return c.json({ collection: toAdminCollectionDetail(collection) });
});

app.post("/collections", async (c) => {
  await delay(150);
  const db = c.get("db");
  const form = readCollectionForm(await c.req.parseBody());

  if (form.title === "") {
    return c.json({ errors: { title: [TITLE_REQUIRED] } }, 422);
  }
  if (form.parentId !== null && !db.collections.get(form.parentId)) {
    return c.json({ error: "Parent collection not found" }, 422);
  }

  const collection = db.collections.create({
    title: form.title,
    parentId: form.parentId,
    showInBrowse: form.showInBrowse,
    description: form.description,
    previewImageId: form.previewImageId,
    bucket: toStoredS3Setting(form.bucket, INSTANCE_S3_DEFAULTS.bucket),
    bucketRegion: toStoredS3Setting(
      form.bucketRegion,
      INSTANCE_S3_DEFAULTS.bucketRegion
    ),
    s3Key: toStoredS3Setting(form.s3Key, INSTANCE_S3_DEFAULTS.s3Key),
    s3Secret: toStoredS3Setting(form.s3Secret, INSTANCE_S3_DEFAULTS.s3Secret),
    canView: true,
    canEdit: true,
  });

  return c.json({ collection: toAdminCollectionDetail(collection) }, 201);
});

app.put("/collections/:collectionId", async (c) => {
  await delay(150);
  const db = c.get("db");

  const collectionId = toCollectionId(c.req.param("collectionId"));
  if (collectionId === null) {
    return c.json({ error: "Invalid ID" }, 400);
  }

  const collection = db.collections.get(collectionId);
  if (!collection) {
    return c.json({ error: "Collection not found" }, 404);
  }

  const form = readCollectionForm(await c.req.parseBody());

  if (form.title === "") {
    return c.json({ errors: { title: [TITLE_REQUIRED] } }, 422);
  }
  if (form.parentId !== null && !db.collections.get(form.parentId)) {
    return c.json({ error: "Parent collection not found" }, 422);
  }
  if (wouldCreateCycle(db.collections, collectionId, form.parentId)) {
    return c.json(
      {
        error:
          "Parent cannot be the collection itself or one of its descendants",
      },
      422
    );
  }

  const updated = db.collections.update(collectionId, {
    title: form.title,
    parentId: form.parentId,
    showInBrowse: form.showInBrowse,
    description: form.description,
    previewImageId: form.previewImageId,
    bucket: toStoredS3Setting(form.bucket, collection.bucket),
    bucketRegion: toStoredS3Setting(form.bucketRegion, collection.bucketRegion),
    s3Key: toStoredS3Setting(form.s3Key, collection.s3Key),
    s3Secret: toStoredS3Setting(form.s3Secret, collection.s3Secret),
  });

  if (!updated) {
    return c.json({ error: "Collection not found" }, 404);
  }

  return c.json({ collection: toAdminCollectionDetail(updated) });
});

app.delete("/collections/:collectionId", async (c) => {
  await delay(150);
  const db = c.get("db");

  const collectionId = toCollectionId(c.req.param("collectionId"));
  if (collectionId === null) {
    return c.json({ error: "Invalid ID" }, 400);
  }

  if (!db.collections.get(collectionId)) {
    return c.json({ error: "Collection not found" }, 404);
  }

  // children move to the top level rather than being deleted too. The
  // collection's assets keep pointing at the gone id, since the backend
  // stores collectionId on an asset as a plain column, not a relation.
  db.collections
    .getChildren(collectionId)
    .forEach((child) => db.collections.update(child.id, { parentId: null }));

  db.collections.delete(collectionId);

  return c.json({ deleted: collectionId });
});

export default app;

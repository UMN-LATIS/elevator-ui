import { assets } from "./assets";
import { collections } from "./collections";
import { drawers } from "./drawers";
import { files } from "./files";
import { instances } from "./instances";
import { pages } from "./pages";
import { sessions } from "./sessions";
import { templates } from "./templates";
import { users } from "./users";
import { searches } from "./searches";

export const db = {
  assets,
  collections,
  drawers,
  files,
  instances,
  pages,
  sessions,
  templates,
  users,
  searches,
};
export type DB = typeof db;

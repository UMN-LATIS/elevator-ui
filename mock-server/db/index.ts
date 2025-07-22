import { assets } from "./assets";
import { collections } from "./collections";
import { drawers } from "./drawers";
import { instances } from "./instances";
import { pages } from "./pages";
import { sessions } from "./sessions";
import { templates } from "./templates";
import { users } from "./users";

export const db = {
  assets,
  collections,
  drawers,
  instances,
  pages,
  sessions,
  templates,
  users,
};
export type DB = typeof db;

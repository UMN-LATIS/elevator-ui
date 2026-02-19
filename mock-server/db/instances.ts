import { InstanceSettings } from "../../src/types";
import { createBaseTable } from "./baseTable";
import { PagesTable } from "./pages";
import { getDefaultInstanceSettings } from "../../src/queries/useInstanceSettingsQuery";

let lastInstanceId = 0;
const makeInstanceId = () => {
  lastInstanceId += 1;
  return lastInstanceId;
};

export const makeInstance = (
  instanceOverrides: Partial<InstanceSettings> = {}
): InstanceSettings => {
  const instanceId = instanceOverrides.instanceId ?? makeInstanceId();

  return {
    ...getDefaultInstanceSettings(instanceId),
    ...instanceOverrides,
    instanceId,
  };
};

const instanceSeeds: InstanceSettings[] = [
  makeInstance({
    instanceId: 1,
    name: "defaultinstance",
    domain: "example.edu",
    featuredAsset: "687969fd9c90c709c1021d01",
    featuredAssetText: "This is a featured asset",
  }),
];

export function createInstancesTable({ pages }: { pages: PagesTable }) {
  const baseTable = createBaseTable(
    (instance: InstanceSettings) => instance.instanceId,
    instanceSeeds
  );

  return {
    ...baseTable,
    maxId() {
      return Math.max(
        ...baseTable.getAll().map((instance) => instance.instanceId),
        0
      );
    },
    create: (
      instance: Omit<InstanceSettings, "instanceId">
    ): InstanceSettings => {
      const newInstance = makeInstance(instance);
      baseTable.set(newInstance.instanceId, newInstance);
      return newInstance;
    },
    get pages() {
      return pages.getAll();
    },
    getDefault: (): InstanceSettings => {
      if (baseTable.size() === 0) {
        throw new Error("No instances available");
      }
      const instance = baseTable.get(instanceSeeds[0].instanceId);
      if (!instance) {
        throw new Error("Default instance not found");
      }
      return instance;
    },
  };
}

export type InstancesTable = ReturnType<typeof createInstancesTable>;

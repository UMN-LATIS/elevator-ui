// Base table factory providing common CRUD operations
export function createBaseTable<T, K = unknown>(
  keyExtractor: (item: T) => K,
  seedData: T[] = []
) {
  const store = new Map<K, T>();

  return {
    // CRUD ops
    get: (key: K): T | undefined => store.get(key),
    set: (key: K, item: T): void => {
      store.set(key, item);
    },
    delete: (key: K): boolean => store.delete(key),
    has: (key: K): boolean => store.has(key),

    // Bulk ops
    getAll: (): T[] => Array.from(store.values()),
    getAllKeys: (): K[] => Array.from(store.keys()),
    size: (): number => store.size,

    // DB mgmt
    reset: (): void => store.clear(),
    seed: (): void => {
      seedData.forEach((item) => store.set(keyExtractor(item), item));
    },

    // Utility methods
    find: (predicate: (item: T) => boolean): T | undefined => {
      return Array.from(store.values()).find(predicate);
    },
    filter: (predicate: (item: T) => boolean): T[] => {
      return Array.from(store.values()).filter(predicate);
    },

    _store: store,
  };
}

// Helper type for extracting table methods
export type BaseTable<T, K = unknown> = ReturnType<
  typeof createBaseTable<T, K>
>;

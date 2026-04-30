// helpers to add client-only stable id's for things which don't have one
export type WithTempId<T> = T & { _tempId: string };

export function addTempId<T extends object>(item: T): WithTempId<T> {
  return { ...item, _tempId: crypto.randomUUID() };
}

export function stripTempId<T extends object>(item: WithTempId<T>): T {
  const { _tempId: _, ...rest } = item;
  return rest as T;
}

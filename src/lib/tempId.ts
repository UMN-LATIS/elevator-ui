/**
 * Client-only stable identifier for items that don't yet have (or won't have)
 * a server id. Useful when an editable list can be reordered, and we need a
 * key that survives reorders, inserts, and deletes — but should never be sent
 * to the server.
 *
 * Usage:
 *   const widget = addTempId(serverWidget);   // → widget._tempId is set
 *   ...
 *   await save(stripTempId(widget));          // strips _tempId before send
 */

export type WithTempId<T> = T & { _tempId: string };

export function addTempId<T extends object>(item: T): WithTempId<T> {
  return { ...item, _tempId: crypto.randomUUID() };
}

export function stripTempId<T extends object>(item: WithTempId<T>): T {
  const { _tempId: _, ...rest } = item;
  return rest as T;
}

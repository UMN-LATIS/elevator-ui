/** Remove `_meta` before sending mock objects to the client. */
export function stripMeta<T extends Record<string, unknown>>(
  obj: T
): Omit<T, "_meta"> {
  const { _meta, ...rest } = obj;
  return rest as Omit<T, "_meta">;
}

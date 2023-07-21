import { clone as cloneDeep } from "ramda";

/**
 * adds a $reset method to the store that resets the store to its initial state
 * This will work even for stores that are in setup function style
 */
export function resetStorePlugin({ store }) {
  const initialState = cloneDeep(store.$state);
  store.$reset = () => store.$patch(cloneDeep(initialState));
}

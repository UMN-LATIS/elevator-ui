import { getActivePinia, type Store, type Pinia } from "pinia";

interface ExtendedPinia extends Pinia {
  _s: Map<string, Store>;
}

/**
 * Resets all stores to their initial state.
 *
 * Only Option-style pinia stores have a $reset method
 * built-in. Add a $reset method to your setup function-style
 * stores to use this resetAllStores.
 *
 * @throws {Error} if no pinia instance is found
 * @see: https://github.com/vuejs/pinia/discussions/911
 */
export function resetAllStores() {
  const pinia = getActivePinia() as ExtendedPinia;
  if (!pinia) {
    throw new Error("Cannot reset all stores. Pinia not found.");
  }

  pinia._s.forEach((store) => store.$reset());
}

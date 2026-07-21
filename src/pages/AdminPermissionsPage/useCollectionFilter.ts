import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";

export function useCollectionFilter() {
  const route = useRoute();
  const router = useRouter();

  const collectionFilterId = computed<number | null>({
    get() {
      const raw = route.query.collection;
      const id = Number(typeof raw === "string" ? raw : NaN);
      return Number.isInteger(id) && id > 0 ? id : null;
    },
    set(id) {
      router.replace({
        query: {
          ...route.query,
          collection: id === null ? undefined : String(id),
        },
      });
    },
  });

  return { collectionFilterId };
}

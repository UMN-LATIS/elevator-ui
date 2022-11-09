// import api from "./api";
// import { onMounted, ref, Ref, watch } from "vue";
// import { SearchResultMatch } from "@/types";
// import { useIntersectionObserver } from "@vueuse/core";
// import getScrollParent from "@/components/LazyLoadImage/getScrollParent";

// export interface MoreLikeThisOptions {
//   deferUntilVisible?: boolean;
//   /**
//    * if defined, we will defer loading
//    * until this element is in view
//    */
//   containerRef?: Ref<HTMLElement | null> | undefined;
// }

// export function useMoreLikeThis(
//   assetIdRef: Ref<string | null>,
//   /**
//    * should we load more like this immediately
//    * or wait until the element is in view
//    */
//   {
//     deferUntilVisible = false,
//     containerRef = undefined,
//   }: MoreLikeThisOptions = {}
// ) {
//   console.log("useMoreLikeThis", assetIdRef.value);
//   const matches = ref<SearchResultMatch[]>([]);
//   const isReadyForLoad = ref(!deferUntilVisible);
//   const isLoaded = ref(false);

//   // if the container is in view, we set
//   // isReadyForLoad to true
//   // (and leave the rest to the watch)
//   function onIntersectionChange(
//     entries: IntersectionObserverEntry[],
//     observer: IntersectionObserver
//   ) {
//     entries.forEach((entry) => {
//       if (entry.isIntersecting) {
//         isReadyForLoad.value = true;
//         observer.unobserve(entry.target);
//       }
//     });
//   }

//   onMounted(() => {
//     if (!deferUntilVisible) return;

//     if (!containerRef) {
//       throw new Error(
//         "You must provide a containerRef when using deferUntilVisible"
//       );
//     }
//     // set up an intersection observer to check if
//     // the container element is in view (only if immediate is false)
//     useIntersectionObserver(containerRef, onIntersectionChange, {
//       root: getScrollParent(containerRef.value),
//       rootMargin: "100px",
//       threshold: 0,
//     });
//   });

//   watch(
//     [assetIdRef, isReadyForLoad],
//     async () => {
//       if (!isReadyForLoad.value) return;
//       matches.value = await api.getMoreLikeThis(assetIdRef.value);
//       isLoaded.value = true;
//     },
//     { immediate: true }
//   );

//   return { matches, isLoaded };
// }

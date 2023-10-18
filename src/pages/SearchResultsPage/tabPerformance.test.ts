import { describe, it, expect } from "@jest/globals";
import { mount } from "@vue/test-utils";
import SearchResultsPage from "./SearchResultsPage.vue";
import { createPinia } from "pinia";
import { useInstanceStore } from "@/stores/instanceStore";

describe("SearchResultsPage", () => {
  it("changes tabs with good performance", async () => {
    const pinia = createPinia();

    // initialize stores
    const instanceStore = useInstanceStore();
    instanceStore.init();

    const wrapper = mount(SearchResultsPage, {
      global: {
        plugins: [pinia],
      },
      props: {
        searchId: "ad41ae86-bf70-4453-b807-7a1a1278640c",
      },
    });

    const tab = wrapper.find(".tab-button--list");

    const start = performance.now();

    await tab.trigger("click");

    const end = performance.now();

    const time = end - start;

    console.log(`Rendering took ${time} milliseconds.`);

    expect(time).toBeLessThan(500);
  });
});

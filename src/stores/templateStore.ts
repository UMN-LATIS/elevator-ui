import { defineStore } from "pinia";
import { getTemplate } from "@/Helpers/displayUtils";
import type { Template } from "@/types";

export const useTemplateStore = defineStore("template", {
  state: () => {
    return {
      templates: [] as Template[],
    };
  },
  actions: {
    async loadTemplate(templateId: string) {
      if (this.templates[templateId]) {
        return this.templates[templateId];
      } else {
        const template = await getTemplate(templateId);
        this.templates[templateId] = template;
        return template;
      }
    },
  },
});

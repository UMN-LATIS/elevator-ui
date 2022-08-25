import { defineStore } from "pinia";

import { getTemplate } from "@/Helpers/displayUtils";
export const useTemplateStore = defineStore("template", {
  state: () => {
    return {
      templates: [] as any[],
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

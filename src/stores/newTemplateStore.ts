import { defineStore } from "pinia";
import type { Template } from "@/types";
import axios from "axios";
import handleAxiosError from "@/utils/handleAxiosError";
import config from "@/config";

export const useTemplateStore = defineStore("template2", {
  state: () => ({
    templates: new Map<string | number, Template>(),
  }),
  actions: {
    async fetchTemplate(templateId: string | number): Promise<Template | null> {
      if (this.templates.has(templateId)) {
        return this.templates.get(templateId) as Template;
      }

      try {
        const res = await axios.get<Template>(
          `${config.baseUrl}/assetManager/getTemplate/templateId`
        );
        this.templates.set(templateId, res.data);
        return res.data;
      } catch (err) {
        handleAxiosError(err);
        return null;
      }
    },
  },
});

import { Meta, StoryFn } from "@storybook/vue3";
import Map from "./Map.vue";
import { UMN_LNGLAT } from "@/constants";
import config from "@/config";

export default {
  component: Map,
} as Meta<typeof Map>;

const Template: StoryFn<typeof Map> = (args) => ({
  components: { Map },
  setup() {
    return { args };
  },
  template: `
    <Map v-bind="args">
    </Map>
  `,
});

export const Default = Template.bind({});
Default.args = {
  center: UMN_LNGLAT,
  zoom: 9,
  apiKey: config.arcgis.apiKey,
};

export const UsingEsriSource = Template.bind({});
UsingEsriSource.args = {
  center: UMN_LNGLAT,
  zoom: 9,
  apiKey: config.arcgis.apiKey,
  esriSourceUrl:
    "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer",
};

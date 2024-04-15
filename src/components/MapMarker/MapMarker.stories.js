import MapMarker from "./MapMarker.vue";
import Map from "../Map/Map.vue";
import { Default as MapStory } from "@/components/Map/Map.stories";
import { UMN_LNGLAT } from "@/constants/constants";

export default {
  component: MapMarker,
};

const Template = (args) => ({
  components: { Map, MapMarker },
  setup() {
    return { args, MapStory };
  },
  template: `
    <Map v-bind="MapStory.args">
      <MapMarker v-bind="args" />
    </Map>
  `,
});
export const Default = Template.bind({});
Default.args = {
  lng: UMN_LNGLAT.lng,
  lat: UMN_LNGLAT.lat,
};

export const ColoredMarker = Template.bind({});
ColoredMarker.args = {
  ...Default.args,
  color: "red",
};

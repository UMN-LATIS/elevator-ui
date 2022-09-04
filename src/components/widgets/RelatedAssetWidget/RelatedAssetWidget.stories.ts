import {
  getWidgetContents,
  getWidgetPropsByFieldTitle,
} from "@/Helpers/displayUtils";
import { Meta, StoryFn } from "@storybook/vue3";
import RelatedAssetWidget from "./RelatedAssetWidget.vue";
import mockAsset from "@/__mocks__/assetViewPage/crazedFruitAsset";
import mockTemplate from "@/__mocks__/assetViewPage/crazedFruitAssetTemplate";
import { RelatedAssetWidgetProps, RelatedAssetWidgetContents } from "@/types";

export default {
  title: "Widgets/RelatedAssetWidget",
  component: RelatedAssetWidget,
} as Meta<typeof RelatedAssetWidget>;

const Template: StoryFn<typeof RelatedAssetWidget> = (args) => ({
  components: { RelatedAssetWidget },
  setup() {
    return { args };
  },
  template: `
    <RelatedAssetWidget v-bind="args">
    </RelatedAssetWidget>
  `,
});

const widget = getWidgetPropsByFieldTitle<RelatedAssetWidgetProps>(
  mockTemplate,
  "worktitle_7"
);

if (!widget) throw new Error("cannot find widget");

const contents = getWidgetContents<
  RelatedAssetWidgetProps,
  RelatedAssetWidgetContents
>({
  asset: mockAsset,
  widget,
});

export const Default = Template.bind({});
Default.args = {
  widget,
  contents,
  asset: mockAsset,
};

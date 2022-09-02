import { Meta, StoryFn } from "@storybook/vue3";
import RelatedAssetWidget from "./RelatedAssetWidget.vue";
import mockAsset from "../../__mocks__/mockAsset";
import mockTemplate from "../../__mocks__/mockTemplate";
// import mockAsset from "@/__mocks__/assetViewPage/crazedFruitAsset";
// import mockTemplate from "@/__mocks__/assetViewPage/crazedFruitAssetTemplate";
import { getWidgetByFieldTitle } from "../../Helpers/displayUtils";
import { RelatedAssetWidgetContents } from "@/types";

export default {
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

export const Default = Template.bind({});
Default.args = {};

const field = "relatedstuff_1";
const widgetContents = mockAsset[field] as RelatedAssetWidgetContents;
const template = getWidgetByFieldTitle(mockTemplate, field);

const collapseItem = JSON.parse(JSON.stringify(template));
collapseItem.fieldData.collapseNestedChildren = true;
export const CollapsedInlineRelatedAsset = Template.bind({});
CollapsedInlineRelatedAsset.args = {
  contents: widgetContents,
  widget: collapseItem,
  asset: mockAsset,
};

const templateThumb = JSON.parse(JSON.stringify(template));
templateThumb.fieldData.collapseNestedChildren = false;
templateThumb.fieldData.thumbnailView = true;
export const ThumbnailView = Template.bind({});
ThumbnailView.args = {
  contents: widgetContents,
  widget: templateThumb,
  asset: mockAsset,
};

const linkedItem = JSON.parse(JSON.stringify(template));
linkedItem.fieldData.nestData = false;
linkedItem.fieldData.collapseNestedChildren = false;
export const LinkedItemRelatedAsset = Template.bind({});
LinkedItemRelatedAsset.args = {
  contents: widgetContents,
  widget: linkedItem,
  asset: mockAsset,
};

const togglePanel = JSON.parse(JSON.stringify(template));
togglePanel.fieldData.nestData = true;
togglePanel.fieldData.collapseNestedChildren = false;
togglePanel.fieldData.thumbnailView = false;
export const TogglePanelRelatedAsset = Template.bind({});
TogglePanelRelatedAsset.args = {
  contents: widgetContents,
  widget: togglePanel,
  asset: mockAsset,
};

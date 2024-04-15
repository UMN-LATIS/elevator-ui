import RelatedAssetWidget from "./RelatedAssetWidget.vue";
import mockAsset from "../../__mocks__/mockAsset.json";
import mockTemplate from "../../__mocks__/mockTemplate.json";
import { getField } from "../../Helpers/displayUtils";

export default {
  title: "View/Widgets/RelatedAssetWidget",
  component: RelatedAssetWidget,
  argTypes: {
    widget: {
        type: "object",
    },
    contents: {
        type: "object"
    },
    asset: {
      type: "object"
    }
  },
};

const Template = (args) => ({
  components: { RelatedAssetWidget },
  setup() {
    return { args };
  },
  template: `<RelatedAssetWidget v-bind="args"></RelatedAssetWidget>`,
});

let field = "relatedstuff_1"
let widgetContents = mockAsset[field];
let template = getField(mockTemplate, field);

let collapseItem = JSON.parse(JSON.stringify(template));
collapseItem.fieldData.collapseNestedChildren = true;
export const CollapsedInlineRelatedAsset = Template.bind({});
CollapsedInlineRelatedAsset.args = {
    contents: widgetContents,
    widget: collapseItem,
    asset: mockAsset
};

let templateThumb = JSON.parse(JSON.stringify(template));
templateThumb.fieldData.collapseNestedChildren = false;
templateThumb.fieldData.thumbnailView = true;
export const ThumbnailView = Template.bind({});
ThumbnailView.args = {
    contents: widgetContents,
    widget: templateThumb,
    asset: mockAsset
};


let linkedItem = JSON.parse(JSON.stringify(template));
linkedItem.fieldData.nestData = false;
linkedItem.fieldData.collapseNestedChildren = false;
export const LinkedItemRelatedAsset = Template.bind({});
LinkedItemRelatedAsset.args = {
    contents: widgetContents,
    widget: linkedItem,
    asset: mockAsset
};

let togglePanel = JSON.parse(JSON.stringify(template));
togglePanel.fieldData.nestData = true;
togglePanel.fieldData.collapseNestedChildren = false;
togglePanel.fieldData.thumbnailView = false;
export const TogglePanelRelatedAsset = Template.bind({});
TogglePanelRelatedAsset.args = {
    contents: widgetContents,
    widget: togglePanel,
    asset: mockAsset
};


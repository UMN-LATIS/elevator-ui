import { Meta, StoryFn } from "@storybook/vue3";
import RelatedAssetWidget from "./RelatedAssetWidget.vue";
import mockAsset from "@/__mocks__/mockAsset";
import mockTemplate from "@/__mocks__/mockTemplate";
import { getMockWidgetStoryArgs } from "@/helpers/getMockWidgetStoryArgs";
import { RelatedAssetWidgetContent, RelatedAssetWidgetProps } from "@/types";

export default {
  title: "Widgets/RelatedAssetWidget",
  component: RelatedAssetWidget,
  parameters: {
    backgrounds: {
      default: "neutral-200",
    },
  },
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

const getRelatedAssetWidgetStoryArgs = getMockWidgetStoryArgs<
  RelatedAssetWidgetProps,
  RelatedAssetWidgetContent
>;

export const Default = Template.bind({});
Default.args = getRelatedAssetWidgetStoryArgs({
  fieldTitle: "relatedstuff_1",
  asset: mockAsset,
  template: mockTemplate,
});

export const CollapsedJoinRecord = Template.bind({});
CollapsedJoinRecord.args = getRelatedAssetWidgetStoryArgs({
  fieldTitle: "collapsedjoinrecord_1",
  asset: mockAsset,
  template: mockTemplate,
});
CollapsedJoinRecord.parameters = {
  backgrounds: {
    default: "white",
  },
};

export const NoNesting = Template.bind({});

const noNestingArgs = getRelatedAssetWidgetStoryArgs({
  fieldTitle: "relatedstuff_1",
  asset: mockAsset,
  template: mockTemplate,
});

const noNestingWidget: RelatedAssetWidgetProps = {
  ...noNestingArgs.widget,
  fieldData: {
    ...noNestingArgs.widget.fieldData,
    nestData: false,
  },
};

NoNesting.args = {
  ...noNestingArgs,
  widget: noNestingWidget,
};

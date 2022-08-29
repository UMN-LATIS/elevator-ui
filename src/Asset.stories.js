import Asset from "./Asset.vue";

export default {
  title: "Asset",
  component: Asset,
  argTypes: {
    objectId: {
      type: "string",
    },
  },
};

const Template = (args) => ({
  components: { Asset },
  setup() {
    return { args };
  },
  template: `<Asset v-bind="args"></Asset>`,
});

export const Default = Template.bind({});
Default.args = {
  objectId: "56a3bb007d58ae8a488b4657",
};

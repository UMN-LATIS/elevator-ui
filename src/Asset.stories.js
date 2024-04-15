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
    objectId: "62e058363014725cb2193843",
};

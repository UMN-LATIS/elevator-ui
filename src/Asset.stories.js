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
    objectId: "623dee393392272653676222",
};

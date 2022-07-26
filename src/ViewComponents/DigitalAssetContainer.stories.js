import DigitalAssetContainer from "./DigitalAssetContainer.vue";

export default {
  title: "View/DigitalAssetContainer",
  component: DigitalAssetContainer,
  argTypes: {
  },
};

const Template = (args) => ({
  components: { DigitalAssetContainer },
  setup() {
    return { args };
  },
  template: `<DigitalAssetContainer v-bind="args"></DigitalAssetContainer>`,
});


// import { useAssetStore } from '@/stores/assetStore'
// const store = useAssetStore();
// store.objectId = "623dee6471cc11744319be01";

export const Default = Template.bind({});
Default.args = {

};

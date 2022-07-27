import ViewContainer from "./ViewContainer.vue";

export default {
  title: "View/ViewContainer",
  component: ViewContainer,
  argTypes: {
    objectId: {
        type: "string",
    },
    isPrimaryElement: {
        type: "boolean"
    }
  },
};

const Template = (args) => ({
  components: { ViewContainer },
  setup() {
    return { args };
  },
  template: `<ViewContainer v-bind="args"></ViewContainer>`,
});



export const Default = Template.bind({});
Default.args = {
  objectId: "62e058363014725cb2193843",
  isPrimaryElement: true
};

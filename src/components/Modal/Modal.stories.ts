import { Meta, StoryFn } from "@storybook/vue3";
import Modal from "./Modal.vue";

export default {
  component: Modal,
} as Meta<typeof Modal>;

const Template: StoryFn<typeof Modal> = (args) => ({
  components: { Modal },
  setup() {
    return { args };
  },
  template: `
    <Modal v-bind="args">
    </Modal>
  `,
});

export const Default = Template.bind({});
Default.args = {};

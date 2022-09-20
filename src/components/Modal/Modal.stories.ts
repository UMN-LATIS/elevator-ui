import { Meta, StoryFn } from "@storybook/vue3";
import Modal from "./Modal.vue";
import Button from "../Button/Button.vue";

export default {
  component: Modal,
} as Meta<typeof Modal>;

const Template: StoryFn<typeof Modal> = (args) => ({
  components: { Modal, Button },
  setup() {
    return { args };
  },
  template: `
    <Button @click="isOpen = !isOpen">Open Modal</Button>
    <Modal v-bind="args" @close="isOpen = false" :isOpen="isOpen">
      <p>This is some modal content</p>
    </Modal>
  `,
  data: () => ({
    isOpen: true,
  }),
});

export const Default = Template.bind({});
Default.args = {};

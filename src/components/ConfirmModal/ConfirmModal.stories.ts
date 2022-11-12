import { ref } from "vue";
import { Meta, StoryFn } from "@storybook/vue3";
import ConfirmModal from "./ConfirmModal.vue";
import Button from "../Button/Button.vue";

export default {
  component: ConfirmModal,
} as Meta<typeof ConfirmModal>;

const Template: StoryFn<typeof ConfirmModal> = (args) => ({
  components: { ConfirmModal, Button },
  setup() {
    const isOpen = ref(true);
    return { args, isOpen };
  },
  template: `
    <Button @click="isOpen = true">Open Modal</Button>
    <ConfirmModal v-bind="args" :isOpen="isOpen" @close="isOpen = false">
      {{ args.slot }}
    </ConfirmModal>
  `,
});

export const Default = Template.bind({});
Default.args = {
  label: "Are you sure?",
  slot: "Lorem ipsum, dolor sit amet consectetur adipisicing elit. Eius aliquam laudantium explicabo pariatur iste dolorem animi vitae error totam. At sapiente aliquam accusamus facere veritatis.",
};

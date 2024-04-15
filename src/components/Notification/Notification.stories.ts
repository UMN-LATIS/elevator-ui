import { Meta, StoryFn } from "@storybook/vue3";
import Notification from "./Notification.vue";
import Button from "@/components/Button/Button.vue";

export default {
  component: Notification,
} as Meta<typeof Notification>;

const Template: StoryFn<typeof Notification> = (args) => ({
  components: { Notification, Button },
  setup() {
    return { args };
  },
  template: `
    <Notification v-bind="args">
      <div v-html="args.slot" />
    </Notification>
  `,
});

export const Info = Template.bind({});
Info.args = {
  type: "info",
  title: "Info",
  slot: "<p>This is an informational message.</p>",
};

export const Success = Template.bind({});
Success.args = {
  type: "success",
  title: "Success",
  slot: "<p>You did it! We're so proud of you.</p>",
};

export const Warning = Template.bind({});
Warning.args = {
  type: "warning",
  title: "Warning",
  slot: "<p>Be careful! You're about to do something dangerous.</p>",
};

export const Error = Template.bind({});
Error.args = {
  type: "error",
  title: "Error",
  slot: "<p>Something went wrong. Please try again.</p>",
};

export const WithActions: StoryFn<typeof Notification> = (args) => ({
  components: { Notification, Button },
  setup() {
    return { args };
  },
  template: `
    <Notification v-bind="args">
      <p>This is an informational message with actions.</p>
      <div class="flex gap-2 mt-2">
        <Button variant="tertiary">OK</Button>
        <Button variant="tertiary">Cancel</Button>
      </div>
    </Notification>
  `,
});
WithActions.args = {
  type: "info",
  title: "Info",
};

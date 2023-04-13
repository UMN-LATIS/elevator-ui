import { Meta, StoryFn } from "@storybook/vue3";
import Tabs from "./Tabs.vue";
import Tab from "./Tab.vue";

export default {
  component: Tabs,
} as Meta<typeof Tabs>;

const Template: StoryFn<typeof Tabs> = (args) => ({
  components: { Tabs, Tab },

  setup() {
    return { args };
  },
  template: `
    <Tabs>
      <Tab id="tab-1" label="First Thing">
        <p>Content Goes Here</p>
      </Tab>
      <Tab id="tab-2" label="Second Thing">
        <p>More Content</p>
      </Tab>
    </Tabs>

  `,
});

export const Default = Template.bind({});
Default.args = {};

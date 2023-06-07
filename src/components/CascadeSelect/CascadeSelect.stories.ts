import { Meta, StoryFn } from "@storybook/vue3";
import CascadeSelect from "./CascadeSelect.vue";

export default {
  component: CascadeSelect,
} as Meta<typeof CascadeSelect>;

const Template: StoryFn<typeof CascadeSelect> = (args) => ({
  components: { CascadeSelect },
  setup() {
    return { args };
  },
  template: `
    <CascadeSelect v-bind="args">
    </CascadeSelect>
  `,
});

const options = {
  country: {
    usa: {
      state: {
        minnesota: {
          city: {
            mankato: {
              neighborhood: ["campus", "downtown"],
            },
            minneapolis: {
              neighborhood: ["uptown", "downtown"],
            },
          },
        },
        wisconsin: {
          city: ["madison", "milwaukee"],
        },
      },
    },
    canada: {
      state: {
        quebec: {
          city: ["montreal"],
        },
        alberta: {
          city: ["fakeville", "faketown"],
        },
      },
    },
  },
};

export const Default = Template.bind({});
Default.args = {
  options,
};

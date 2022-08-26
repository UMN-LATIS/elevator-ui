import { Meta, StoryFn } from "@storybook/vue3";
import Accordion from "@/components/Accordion.vue";
import Tuple from "./Tuple.vue";

export default {
  component: Accordion,
} as Meta<typeof Accordion>;

const Template: StoryFn<typeof Accordion> = (args) => ({
  components: { Accordion, Tuple },
  setup() {
    return { args };
  },
  template: `
    <Accordion v-bind="args">
      <Tuple label="Agent"></Tuple>
      <Tuple label="Display Name">
        <a
          href="https://dcl.elevator.umn.edu/search/querySearch/Frank%20Owen%20Gehry"
          >Frank Owen Gehry</a
        >
      </Tuple>
      <Tuple label="Alternate Name"
        >Frank O. Gehry; Frank Goldberg</Tuple
      >
      <Tuple label="Birth Date">1929</Tuple>
      <Tuple label="Country of Birth">Canada</Tuple>
      <Tuple label="Country Active">United States</Tuple>
      <Tuple label="Nationality">American, Canadian</Tuple>
      <Tuple label="Role">Architect</Tuple>
    </Accordion>
  `,
});

export const Default = Template.bind({});
Default.args = { label: "Frank Owen Gehry", color: "light" };

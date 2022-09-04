import { Meta, StoryFn } from "@storybook/vue3";
import Drawer from "@/components/Drawer/Drawer.vue";
import Tuple from "@/components/Tuple/Tuple.vue";
import Chip from "@/components/Chip/Chip.vue";
import Accordion from "@/components/Accordion/Accordion.vue";

export default {
  component: Drawer,
} as Meta<typeof Drawer>;

const Template: StoryFn<typeof Drawer> = (args) => ({
  components: { Drawer, Chip, Tuple, Accordion },
  setup() {
    return { args };
  },
  template: `
    <Drawer v-bind="args">
      <Tuple label="Type of View">Exterior</Tuple>
      <Tuple label="Keywords" class="flex gap-1 flex-wrap mt-2">
        <Chip
          href="https://elevator-dcl-weisman.s3.amazonaws.com/thumbnail/0064b8e41f1dbb184e0c3e65-tiny2x"
        >
          Postmodern
        </Chip>
        <Chip
          href="https://dcl.elevator.umn.edu/search/querySearch/Santa%20Monica"
        >
          Santa Monica
        </Chip>
      </Tuple>
      <Tuple label="Creator">
          <Accordion label="Frank Owen Gehry">
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
        </Tuple>
    </Drawer>
  `,
});

export const Primary = Template.bind({});
Primary.args = {
  label: "Primary Drawer Title",
  variant: "primary",
};

export const Secondary = Template.bind({});
Secondary.args = {
  label: "Secondary Drawer Title",
  variant: "secondary",
};

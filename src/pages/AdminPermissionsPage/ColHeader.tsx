import type { CSSClass } from "@/types";
import { cn } from "@/lib/utils";

// Uppercase header cell shared by the permissions tables.
export const ColHeader = (props: { text: string; class?: CSSClass }) => (
  <div
    class={cn(["font-medium uppercase text-xs tracking-wider", props.class])}>
    {props.text}
  </div>
);

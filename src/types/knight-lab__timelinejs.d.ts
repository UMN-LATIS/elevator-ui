// timelinejs.d.ts

declare module "@knight-lab/timelinejs" {
  import { TimelineJSJSON, TimelineJSOptions } from "./TimelineJSTypes";

  export class Timeline {
    constructor(
      containerId: string,
      json: TimelineJSJSON,
      options: TimelineJSOptions
    );
  }
}

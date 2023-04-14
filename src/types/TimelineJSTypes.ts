type HTMLString = string;
type URLString = string;

export interface TimelineJSDate {
  year: number;
  display_date?: string;
  month?: number;
  day?: number;
}

export interface TimelineJSText {
  headline?: HTMLString;
  text?: HTMLString;
}

export interface TimelineJSMedia {
  url: URLString;
  thumbnail?: URLString;
  caption?: HTMLString;
  credit?: HTMLString;
  alt?: HTMLString;
  link?: URL;
  link_target?: "_blank" | "_self";
}

export interface TimelineJSSlide {
  start_date: TimelineJSDate;
  end_date?: TimelineJSDate;
  text?: TimelineJSText;
  media?: TimelineJSMedia;
}

export interface TimelineJSEra {
  start_date: TimelineJSDate;
  end_date?: TimelineJSDate;
  text?: {
    headline: HTMLString;
  };
}

export interface TimelineJSJSON {
  events: TimelineJSSlide[];
  title?: TimelineJSSlide;
  eras?: TimelineJSEra[];
  scale?: "human" | "cosmological"; // default is "human"
}

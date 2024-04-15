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

export interface TimelineJSOptions {
  font?: "default" | string; // default is "default"
  debug?: boolean; // default is false
  height?: number;
  width?: number;
  is_embed?: boolean; // default is false
  hash_bookmark?: boolean; // default is false
  default_bg_color?: string;
  scale_factor?: number;
  initial_zoom?: number;
  zoom_sequence?: number[];
  timenav_position?: "top" | "bottom"; // default is "bottom"
  optimal_tick_width?: number; // 100
  base_class?: string; // "tl-timeline"
  timenav_height?: number; // 150
  timenav_height_percentage?: number; // 25
  timenav_mobile_height_percentage?: number; // 40
  timenav_height_min?: number; // 150
  marker_height_min?: number; // 30
  marker_width_min?: number; // 100
  marker_padding?: number; // 5
  start_at_slide?: number; // 0
  start_at_end?: boolean; // false
  menubar_height?: number; // 0
  use_bc?: boolean; // false
  duration?: number; // 1000
  ease?: string; // "easeInOutQuint"
  dragging?: boolean; // true
  trackResize?: boolean; // true
  slide_padding_lr?: number; // 100
  slide_default_fade?: string; // "0%"
  language?: string; // "en"
  ga_property_id?: string;
  track_events?: string[];
  script_path?: string;
  soundcite?: boolean; // false
}

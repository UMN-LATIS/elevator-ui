import { prop } from "ramda";
import type { BoundingBox, LngLat } from "@/types";
const compareUsing = (fn) => (acc, x) => fn(acc, x);

/**
 * returns bounding box corner points which contain
 * a given route
 *
 * @param {LngLat[]} listOfLngLats - list of positions
 * @returns SW and NE corner points of the
 *  bounding box: [[minLng, minLat], [maxLng, maxLat]]
 */
export default (lngLats: LngLat[]): BoundingBox => {
  const minLng = lngLats
    .map((pt) => pt.lng)
    .reduce(compareUsing(Math.min), +Infinity);

  const minLat = lngLats
    .map(prop("lat"))
    .reduce(compareUsing(Math.min), +Infinity);

  const maxLng = lngLats
    .map(prop("lng"))
    .reduce(compareUsing(Math.max), -Infinity);

  const maxLat = lngLats
    .map(prop("lat"))
    .reduce(compareUsing(Math.max), -Infinity);

  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
};

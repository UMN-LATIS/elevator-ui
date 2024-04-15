import { BoundingBox, LngLat } from "@/types";

/**
 *  gets the center point of a bounding box
 * @param {number[][]} bounds - SW and NE corner of bounding box
 * @returns {LngLat} longitude and latitude of center
 */
export function getCenterOfBoundingBox(bounds: BoundingBox): LngLat {
  const [[minLng, minLat], [maxLng, maxLat]] = bounds;
  return {
    lng: (minLng + maxLng) / 2,
    lat: (minLat + maxLat) / 2,
  };
}

import { Coordinates, LngLat } from "@/types";

const LNG_MIN = -180;
const LNG_MAX = 180;
const LAT_MIN = -90;
const LAT_MAX = 90;

function isInRange(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && value >= min && value <= max;
}

// return null if coordinates are invalid
export function toLngLat(
  coordinates: Coordinates | undefined | null
): LngLat | null {
  const lng = coordinates?.[0];
  const lat = coordinates?.[1];

  if (!isInRange(lng, LNG_MIN, LNG_MAX) || !isInRange(lat, LAT_MIN, LAT_MAX)) {
    return null;
  }

  return { lng, lat };
}

// Error message for a typed coordinate, empty string when valid.
export function validateLngInput(input: string): string {
  const value = parseFloat(input);
  if (isNaN(value)) return `Longitude must be a number`;
  if (!isInRange(value, LNG_MIN, LNG_MAX)) {
    return `Longitude must be between ${LNG_MIN} and ${LNG_MAX}`;
  }
  return "";
}

export function validateLatInput(input: string): string {
  const value = parseFloat(input);
  if (isNaN(value)) return `Latitude must be a number`;
  if (!isInRange(value, LAT_MIN, LAT_MAX)) {
    return `Latitude must be between ${LAT_MIN} and ${LAT_MAX}`;
  }
  return "";
}

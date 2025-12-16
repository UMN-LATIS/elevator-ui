import { describe, expect, it } from "vitest";

/**
 * Calculate offset for a marker in a circular pattern
 * @param index - The index of this marker among markers at the same location (0-based)
 * @param totalMarkers - Total number of markers at this location
 * @returns [lng offset, lat offset]
 */
function calculateMarkerOffset(
  index: number,
  totalMarkers: number
): [number, number] {
  if (totalMarkers <= 1) {
    return [0, 0];
  }

  const angleStep = (2 * Math.PI) / totalMarkers;
  const angle = angleStep * index;
  const radius = 0.0002; // offset distance in degrees

  return [radius * Math.cos(angle), radius * Math.sin(angle)];
}

describe("calculateMarkerOffset", () => {
  it("returns [0, 0] when there is only one marker", () => {
    const offset = calculateMarkerOffset(0, 1);
    expect(offset).toEqual([0, 0]);
  });

  it("creates two offsets at opposite sides for 2 markers", () => {
    const offset1 = calculateMarkerOffset(0, 2);
    const offset2 = calculateMarkerOffset(1, 2);

    // First marker should be at 0 degrees (right)
    expect(offset1[0]).toBeCloseTo(0.0002, 5);
    expect(offset1[1]).toBeCloseTo(0, 5);

    // Second marker should be at 180 degrees (left)
    expect(offset2[0]).toBeCloseTo(-0.0002, 5);
    expect(offset2[1]).toBeCloseTo(0, 5);
  });

  it("creates unique offsets for 6 markers in a circular pattern", () => {
    const offsets = Array.from({ length: 6 }, (_, i) =>
      calculateMarkerOffset(i, 6)
    );

    // Check that all offsets are unique
    const uniqueOffsets = new Set(offsets.map((o) => `${o[0]},${o[1]}`));
    expect(uniqueOffsets.size).toBe(6);

    // Check that all offsets have approximately the same distance from origin
    const distances = offsets.map((o) => Math.sqrt(o[0] ** 2 + o[1] ** 2));
    distances.forEach((distance) => {
      expect(distance).toBeCloseTo(0.0002, 5);
    });

    // Verify the offsets form a circle by checking specific markers
    // First marker should be at 0 degrees (east)
    expect(offsets[0][0]).toBeCloseTo(0.0002, 5);
    expect(offsets[0][1]).toBeCloseTo(0, 5);

    // Third marker should be at 120 degrees
    const angle120 = (2 * Math.PI) / 3;
    expect(offsets[2][0]).toBeCloseTo(0.0002 * Math.cos(angle120), 5);
    expect(offsets[2][1]).toBeCloseTo(0.0002 * Math.sin(angle120), 5);
  });

  it("creates offsets for many markers at the same location", () => {
    const markerCount = 12;
    const offsets = Array.from({ length: markerCount }, (_, i) =>
      calculateMarkerOffset(i, markerCount)
    );

    // All offsets should be unique
    const uniqueOffsets = new Set(offsets.map((o) => `${o[0]},${o[1]}`));
    expect(uniqueOffsets.size).toBe(markerCount);

    // All should have the same distance from origin
    const distances = offsets.map((o) => Math.sqrt(o[0] ** 2 + o[1] ** 2));
    distances.forEach((distance) => {
      expect(distance).toBeCloseTo(0.0002, 5);
    });
  });
});

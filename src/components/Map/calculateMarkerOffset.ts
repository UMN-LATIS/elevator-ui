/**
 * Calculate offset for a marker in a circular pattern (spider layout)
 * to avoid overlapping markers at the same location
 *
 * @param index - The index of this marker among markers at the same location (0-based)
 * @param totalMarkers - Total number of markers at this location
 * @returns [lng offset, lat offset] tuple
 */
export function calculateMarkerOffset(
  index: number,
  totalMarkers: number
): [number, number] {
  if (totalMarkers <= 1) {
    return [0, 0];
  }

  const angleStep = (2 * Math.PI) / totalMarkers;
  const angle = angleStep * index;
  // Use a larger offset (0.001 degrees ≈ 111 meters) to ensure
  // markers are far enough apart to not be clustered together
  const radius = 0.001;

  return [radius * Math.cos(angle), radius * Math.sin(angle)];
}

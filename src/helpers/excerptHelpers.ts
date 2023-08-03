export function isValidTimeString(timeString: string) {
  const validTimeStringRegex = /^(\d{1,2}:)?([0-5]?\d:)?[0-5]?\d$/;
  return validTimeStringRegex.test(timeString);
}

export function secondsToTimeString(seconds: number | null) {
  if (seconds === null) return "";

  if (Number.isNaN(seconds)) {
    throw new Error("Cannot convert seconds to time string: seconds is NaN");
  }

  if (seconds >= 60 * 60 * 24) {
    throw new Error(
      "Cannot convert seconds to time string: seconds larger than 1 day"
    );
  }

  if (seconds < 60 * 60) {
    // MM:SS
    return new Date(seconds * 1000).toISOString().slice(14, 19);
  }

  // HH:MM:SS
  return new Date(seconds * 1000).toISOString().slice(11, 19);
}

export function timeStringToSeconds(timeString: string): number | null {
  if (!isValidTimeString(timeString)) {
    return null;
  }

  // 12:34:56 => [56, 34, 12]
  const parts = timeString.split(":").reverse();

  let seconds = 0;
  parts.forEach((part, index) => {
    // 12:34:56 => 56 * 60^0 + 34 * 60^1 + 12 * 60^2
    seconds += Number.parseInt(part) * Math.pow(60, index);
  });
  return seconds;
}

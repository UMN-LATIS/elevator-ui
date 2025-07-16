/**
 * get a unix timestamp for a date string with some handling of BC dates
 */
export function parseDateString(dateString: string): string | null {
  if (!dateString) return null;

  const date = Date.parse(dateString + " UTC");
  if (!isNaN(date)) {
    return (date / 1000).toString();
  }

  // handle BC dates and centuries
  if (dateString.toLowerCase().indexOf("bc") != -1) {
    dateString = dateString.replace(/,/g, "");
    const pattern = /[0-9]+/g;
    const matches = dateString.match(pattern);

    if (matches && matches.length > 0) {
      let yearsAgo = parseInt(matches[0]);
      if (dateString.toLowerCase().indexOf("century") != -1) {
        yearsAgo = yearsAgo * 100;
      }

      const bceDate = -1 * yearsAgo * 31556900 - 1970 * 31556900; // seconds in a year
      return bceDate.toString();
    }
  }

  return null;
}

export function unixTimestampToFormattedDate(
  timestampString: string | null,
  preferCentury = true
): string | null {
  if (!timestampString) return null;

  const timestamp = parseInt(timestampString);

  if (isNaN(timestamp)) return null;

  // Constants - must match the ones used in parseDateString
  const secondsInYear = 31556900;

  // For dates after 1970 (positive unix timestamps)
  if (timestamp >= 0) {
    const date = new Date(timestamp * 1000);
    return date.toISOString().slice(0, 10); // YYYY-MM-DD format
  }

  // For dates before 1970 (negative timestamps)
  const yearsBefore1970 = Math.abs(timestamp) / secondsInYear;

  if (yearsBefore1970 <= 1970) {
    // Modern era but before 1970
    const date = new Date(timestamp * 1000);
    return date.toISOString().slice(0, 10); // YYYY-MM-DD format
  } else {
    // BCE era
    const yearsBCE = Math.ceil(yearsBefore1970 - 1970);

    // If it's divisible by 100 and we prefer century format, use century
    if (preferCentury && yearsBCE >= 100 && yearsBCE % 100 === 0) {
      const century = yearsBCE / 100;
      return `${century} century BCE`;
    } else {
      return `${yearsBCE} BCE`;
    }
  }
}

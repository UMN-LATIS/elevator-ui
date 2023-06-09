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

import { TimelineJSSlide, SearchResultMatch } from "@/types";

export function legacyPrepTimeline(
  match: SearchResultMatch
): TimelineJSSlide | null {
  let geoTime = false;
  // if we don't have a special dates propery, we can ignore this one
  if (!match.hasOwnProperty("dates")) {
    return null;
  }

  for (const dates of match.dates) {
    if (!dates.dateAsset) continue;
    for (const date of dates.dateAsset) {
      const startTime = parseInt(date.start.numeric, 10);
      if (startTime < -6373557595440) {
        geoTime = true;
      }
    }
  }

  for (const dates of match.dates) {
    for (const date of dates.dateAsset) {
      const newItem = {} as any;
      const startTime = parseInt(date.start["numeric"], 10);
      newItem.start_date = {};
      if (geoTime) {
        const startYear =
          -1 * Math.round(Math.abs((startTime + 1970 * 31556900) / 31556900));
        newItem.start_date.year = startYear;
      } else {
        const t = new Date(1970, 0, 1);
        t.setSeconds(startTime);
        const formattedStart = Date.utc.create(t);
        newItem.start_date.display_date = date.start["text"];
        newItem.start_date.year = formattedStart.getFullYear();
        newItem.start_date.month = formattedStart.getMonth() + 1;
        newItem.start_date.day = formattedStart.getDay() + 1;
      }
      if (date.end["numeric"] && date.end["numeric"].toString().length > 0) {
        newItem.end_date = {};
        endTime = parseInt(date.end["numeric"], 10);

        if (geoTime) {
          endYear =
            -1 * Math.round(Math.abs((endTime + 1970 * 31556900) / 31556900));
          newItem.end_date.year = endYear;
        } else {
          t = new Date(1970, 0, 1);
          t.setSeconds(endTime);
          formattedEnd = Date.utc.create(t);
          newItem.end_date.display_date = date.end["text"];
          newItem.end_date.year = formattedEnd.getFullYear();
          newItem.end_date.month = formattedEnd.getMonth() + 1;
          newItem.end_date.day = formattedEnd.getDay() + 1;
        }
      }

      const html = TimelineTemplate(match);

      newItem.text = {};
      newElement = $("<a/>", {
        href: basePath + "asset/viewAsset/" + match.objectId,
        text: match.title,
      });
      newItem.text.headline = newElement.prop("outerHTML");
      newItem.text.text = html;

      if (match.hasOwnProperty("primaryHandlerThumbnail2x")) {
        newItem.media = {};
        newItem.media.thumb = match.primaryHandlerThumbnail2x;
        newItem.media.url = match.primaryHandlerThumbnail2x;
      }

      // dedupe our array
      let ignoreItem = false;
      for (const existingDate of compiledDate.events) {
        if (JSON.stringify(existingDate) == JSON.stringify(newItem)) {
          ignoreItem = true;
        }
      }

      if (!ignoreItem) {
        compiledDate.events.push(newItem);
      }
    }
  }

  if (geoTime) {
    compiledDate.scale = "cosmological";
    injectStyles(".tl-timeaxis-minor { display: none; }");
  } else {
    $("#hackyGeoStyle").remove();
  }

  return compiledDate;
}

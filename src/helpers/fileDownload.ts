import { ApiError } from "@/api/ApiError";

/**
 * Trigger the browser's native download. The browser streams
 * straight to disk.
 */
export function triggerBrowserDownload(
  url: string,
  filename: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();

      // Safari throws a Network Error if the anchor is removed before the
      // server's response has started the download. ~2s is enough to start it
      // (not to finish), and is reliable in practice.
      const WAIT_TIME_FOR_DOWNLOAD_RESPONSE = 2000;
      setTimeout(() => {
        link.remove();
        resolve();
      }, WAIT_TIME_FOR_DOWNLOAD_RESPONSE);
    } catch (error) {
      console.error(`Error downloading file: ${url}`, error);
      reject(error);
    }
  });
}

/**
 * check if a file is downloadable without triggering download
 */
export async function isFileDownloadable(url: string) {
  const res = await fetch(url, {
    method: "GET",
    // use "manual" to avoid following the redirect
    redirect: "manual",
    credentials: "include",
  });

  // don't download any body
  res.body?.cancel();

  // if we get html back from server, it's a message
  // about restoring from glacier or some error and thus
  // not downloadable
  const isHtmlResponse =
    res.headers.get("content-type")?.includes("text/html") ?? false;
  return !isHtmlResponse;
}

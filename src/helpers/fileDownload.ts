import DOMPurify from "dompurify";

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
 * an original file
 */

type DownloadOriginalStatus =
  | { status: "downloading" }
  | {
      status: "pending";
      htmlMessage: string;
    }
  | {
      status: "error";
      message: string;
    };

/**
 * downloads an original file if possible, and if not
 * it returns the message from the server (e.g. restoring from Glacier)
 */
export async function downloadOriginalFile(
  downloadUrl: string,
  filename: string
): Promise<DownloadOriginalStatus> {
  // first probe to see what we get from when we request a download
  // if it's HTML, then it's some message we should display to the user
  // otherwise, we can trigger the download
  try {
    const res = await fetch(downloadUrl, {
      method: "GET",
      // use "manual" to avoid following the redirect
      redirect: "manual",
      credentials: "include",
    });

    const isHtmlResponse =
      res.headers.get("content-type")?.includes("text/html") ?? false;

    if (isHtmlResponse) {
      const unsafeHtml = await res.text();
      return {
        status: "pending",
        htmlMessage: DOMPurify.sanitize(unsafeHtml),
      };
    }

    // stop the actual download during probe
    res.body?.cancel();

    // trigger download
    await triggerBrowserDownload(downloadUrl, filename);

    return {
      status: "downloading",
    };
  } catch (err) {
    console.error(err);
    return {
      status: "error",
      message: err instanceof Error ? err.message : String(err),
    };
  }
}

import { defineStore } from "pinia";
import { ref, computed } from "vue";
import axios, { CancelTokenSource } from "axios";
import { FileDownloadNormalized } from "@/types";

export enum DownloadStatus {
  PENDING = "pending",
  DOWNLOADING = "downloading",
  PAUSED = "paused",
  COMPLETED = "completed",
  ERROR = "error",
}

export interface DownloadItem {
  id: string;
  filename: string;
  url: string;
  size: number | null;
  downloadedBytes: number;
  status: DownloadStatus;
  progress: number;
  error?: string;
  startTime?: Date;
  endTime?: Date;
  cancelToken?: CancelTokenSource; // For axios cancel token
}

export const useDownloadStore = defineStore("downloads", () => {
  // State
  const downloadQueue = ref<DownloadItem[]>([]);
  const activeDownloads = ref<Set<string>>(new Set());
  const maxConcurrentDownloads = ref(3);

  // Computed
  const pendingDownloads = computed(() =>
    downloadQueue.value.filter((item) => item.status === DownloadStatus.PENDING)
  );

  const completedDownloads = computed(() =>
    downloadQueue.value.filter(
      (item) => item.status === DownloadStatus.COMPLETED
    )
  );

  const failedDownloads = computed(() =>
    downloadQueue.value.filter((item) => item.status === DownloadStatus.ERROR)
  );

  const inProgressDownloads = computed(() =>
    downloadQueue.value.filter(
      (item) => item.status === DownloadStatus.DOWNLOADING
    )
  );

  const totalProgress = computed(() => {
    // FIXME: We currently don't get file size from
    // the server, so we can't calculate total progress
    const totalBytes = downloadQueue.value.reduce(
      (sum, item) => sum + (item.size ?? 0),
      0
    );
    const downloadedBytes = downloadQueue.value.reduce(
      (sum, item) => sum + item.downloadedBytes,
      0
    );
    return totalBytes > 0
      ? Math.round((downloadedBytes / totalBytes) * 100)
      : 0;
  });

  const addToQueue = (files: FileDownloadNormalized[]) => {
    files.forEach((file) => {
      const id = generateUniqueId();
      const filename = `${file.originalFilename}_${file.filetype}.${file.extension}`;

      downloadQueue.value.push({
        id,
        filename,
        size: null,
        url: file.url,
        downloadedBytes: 0,
        status: DownloadStatus.PENDING,
        progress: 0,
      });
    });

    processQueue();
  };

  /**
   * Process the download queue, starting downloads up to the concurrent limit
   */
  const processQueue = () => {
    if (activeDownloads.value.size >= maxConcurrentDownloads.value) return;

    const nextDownload = downloadQueue.value.find(
      (item) =>
        item.status === DownloadStatus.PENDING &&
        !activeDownloads.value.has(item.id)
    );

    if (nextDownload) {
      startDownload(nextDownload.id);
    }
  };

  /**
   * Start downloading a specific file by ID
   */
  const startDownload = async (id: string) => {
    const download = downloadQueue.value.find((item) => item.id === id);
    if (!download || activeDownloads.value.has(id)) return;

    download.status = DownloadStatus.DOWNLOADING;
    download.startTime = new Date();
    activeDownloads.value.add(id);

    try {
      // For files that can be tracked, use axios with progress tracking
      await trackDownloadProgress(download);
    } catch (error) {
      handleDownloadError(
        id,
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  };

  const trackDownloadProgress = async (download: DownloadItem) => {
    // Create a cancel token source for this download
    // so that we can cancel the request if needed
    const cancelTokenSource = axios.CancelToken.source();
    download.cancelToken = cancelTokenSource;

    try {
      const response = await axios({
        url: download.url,
        method: "GET",
        responseType: "blob",
        cancelToken: cancelTokenSource.token,
        onDownloadProgress: (progressEvent) => {
          // Update progress as data is received
          if (progressEvent.total) {
            download.size = progressEvent.total;
            download.downloadedBytes = progressEvent.loaded;
            download.progress = Math.round(
              (progressEvent.loaded / progressEvent.total) * 100
            );
          }
        },
      });

      // Complete the download with the received blob
      await completeDownload(download.id, response.data);
    } catch (error) {
      // Only handle as error if it's not a cancellation
      if (!axios.isCancel(error)) {
        throw error;
      }
    }
  };

  /**
   * Mark a download as complete and save the file
   */
  const completeDownload = async (id: string, blob?: Blob) => {
    const download = downloadQueue.value.find((item) => item.id === id);
    if (!download) return;

    download.status = DownloadStatus.COMPLETED;
    download.progress = 100;
    download.endTime = new Date();
    activeDownloads.value.delete(id);

    if (blob) {
      // Create a download link for the blob
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", download.filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the object URL to prevent memory leaks
      URL.revokeObjectURL(url);
    }

    // Process next item in queue
    processQueue();
  };

  /**
   * Pause an active download
   */
  const pauseDownload = (id: string) => {
    const download = downloadQueue.value.find((item) => item.id === id);
    if (!download || download.status !== DownloadStatus.DOWNLOADING) return;

    // Cancel the axios request
    if (download.cancelToken) {
      download.cancelToken.cancel("Download paused by user");
    }

    download.status = DownloadStatus.PAUSED;
    activeDownloads.value.delete(id);
    processQueue();
  };

  /**
   * Resume a paused download
   */
  const resumeDownload = (id: string) => {
    const download = downloadQueue.value.find((item) => item.id === id);
    if (!download || download.status !== DownloadStatus.PAUSED) return;

    download.status = DownloadStatus.PENDING;
    processQueue();
  };

  /**
   * Cancel and remove a download from the queue
   */
  const cancelDownload = (id: string) => {
    const download = downloadQueue.value.find((item) => item.id === id);
    if (!download) return;

    // Cancel any active download
    if (
      download.status === DownloadStatus.DOWNLOADING &&
      download.cancelToken
    ) {
      download.cancelToken.cancel("Download canceled by user");
    }

    if (activeDownloads.value.has(id)) {
      activeDownloads.value.delete(id);
      processQueue();
    }

    // Remove from queue
    const index = downloadQueue.value.findIndex((item) => item.id === id);
    if (index !== -1) {
      downloadQueue.value.splice(index, 1);
    }
  };

  /**
   * Retry a failed download
   */
  const retryDownload = (id: string) => {
    const download = downloadQueue.value.find((item) => item.id === id);
    if (!download || download.status !== DownloadStatus.ERROR) return;

    // Reset download state
    download.status = DownloadStatus.PENDING;
    download.progress = 0;
    download.downloadedBytes = 0;
    download.error = undefined;
    processQueue();
  };

  /**
   * Handle download errors
   */
  const handleDownloadError = (id: string, errorMessage: string) => {
    const download = downloadQueue.value.find((item) => item.id === id);
    if (!download) return;

    download.status = DownloadStatus.ERROR;
    download.error = errorMessage;
    activeDownloads.value.delete(id);
    processQueue();
  };

  /**
   * Remove all completed downloads from the queue
   */
  const clearCompleted = () => {
    downloadQueue.value = downloadQueue.value.filter(
      (item) => item.status !== DownloadStatus.COMPLETED
    );
  };

  /**
   * Generate a unique ID for a download
   */
  const generateUniqueId = (): string => {
    return `download-${crypto.randomUUID()}`;
  };

  return {
    downloadQueue,
    pendingDownloads,
    completedDownloads,
    failedDownloads,
    inProgressDownloads,
    totalProgress,
    addToQueue,
    startDownload,
    pauseDownload,
    resumeDownload,
    cancelDownload,
    retryDownload,
    clearCompleted,
  };
});

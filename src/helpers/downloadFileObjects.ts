import { FileDownloadNormalized } from "@/types";
import api from "@/api";
import { computed, ref } from "vue";
import { downloadZip } from "client-zip";

export type DownloadStatus = "pending" | "downloading" | "completed" | "error";

export interface DownloadTask {
  id: string;
  filename: string;
  url: string;
  status: DownloadStatus;
  error?: Error;
}

export type DownloadableStream = {
  name: string; // filename
  lastModified: Date;
  input: Response;
};

// function getPendingTasks(tasks: DownloadTask[]) {
//   return tasks.filter((task) => task.status === "pending");
// }

// function getDownloadingTasks(tasks: DownloadTask[]) {
//   return tasks.filter((task) => task.status === "downloading");
// }

// function getCompletedTasks(tasks: DownloadTask[]) {
//   return tasks.filter((task) => task.status === "completed");
// }

// function getErroredTasks(tasks: DownloadTask[]) {
//   return tasks.filter((task) => task.status === "errored");
// }

// function areAllSettled(tasks: DownloadTask[]) {
//   return tasks.every(
//     (task) => task.status === "completed" || task.status === "errored"
//   );
// }

export interface FileDownloadInfo {
  filename: string;
  url: string;
}

async function getDownloadTask(object: { fileId: string; assetId: string }) {
  const downloadInfo = await api.getFileDownloadInfo(
    object.fileId,
    object.assetId
  );

  if (!downloadInfo?.length) {
    // we can mark this task as errored
    return {
      id: object.fileId,
      filename: "",
      url: "",
      status: "error",
      error: new Error("No download info retrieved from api"),
    } as DownloadTask;
  }

  const preferredDownload = downloadInfo[0];

  return {
    id: object.fileId,
    status: "pending",
    filename: `${object.fileId}-${preferredDownload.filetype}.${preferredDownload.extension}`,
    url: preferredDownload.url,
  } as DownloadTask;
}

async function getDownloadTasks(
  objects: Array<{ fileId: string; assetId: string }>
) {
  const tasks: DownloadTask[] = [];

  for (const object of objects) {
    const task = await getDownloadTask(object);
    tasks.push(task);
  }

  return tasks;
}

export function useFileDownloader() {
  const tasks = ref<DownloadTask[]>([]);
  const isDownloading = ref(false);
  const pending = computed(() =>
    tasks.value.filter((task) => task.status === "pending")
  );

  async function downloadFiles(
    objects: Array<{ fileId: string; assetId: string }>
  ) {
    isDownloading.value = true;

    const assetId = objects[0].assetId;
    console.log("Getting download info for each file");
    const downloadTasks = await getDownloadTasks(objects);
    tasks.value = downloadTasks;

    // collect fetch responses downloadZip
    // will use these as input streams
    const streams = [] as DownloadableStream[];
    console.log("Getting download streams for each file");
    for (const task of tasks.value) {
      console.log(`Fetching ${task.url}`);
      const response = await fetch(task.url);
      streams.push({
        name: task.filename,
        lastModified: new Date(),
        input: response,
      });
    }

    // get the ZIP stream in a Blob
    console.log("Getting the blob");
    const blob = await downloadZip(streams).blob();

    // make and click a temporary link to download the Blob
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    const isoDate = new Date().toISOString().replace(/T.*/g, "");
    link.download = `asset-${assetId}-${isoDate}.zip`;
    link.click();
    link.remove();

    console.log("Revoking the Blob URL");

    // revoke the Blob URL
    URL.revokeObjectURL(link.href);

    isDownloading.value = false;
  }

  return {
    tasks,
    isDownloading,
    pending,
    downloadFiles,
  };
}

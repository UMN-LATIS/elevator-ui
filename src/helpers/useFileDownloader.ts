import api from "@/api";
import { ref } from "vue";
import { downloadZip } from "client-zip";
import streamSaver from "streamsaver";

export type DownloadStatus = "pending" | "downloading" | "completed" | "error";

interface DownloadTask {
  id: string;
  filename: string;
  url: string;
}

// see `client-zip` docs for more info
interface DownloadableStream {
  name: string; // filename
  lastModified: Date;
  input: Response;
}

async function getDownloadTask(
  assetId: string,
  fileId: string
): Promise<DownloadTask | null> {
  try {
    const downloadInfo = await api.getFileDownloadInfo(fileId, assetId);

    if (!downloadInfo?.length) {
      console.warn(`No download info for fileId ${fileId}`);
      return null;
    }

    const preferredDownload = downloadInfo[0];

    return {
      id: fileId,
      filename: `${fileId}-${preferredDownload.filetype}.${preferredDownload.extension}`,
      url: preferredDownload.url,
    } as DownloadTask;
  } catch (error) {
    console.error(`Error getting download info for fileId ${fileId}`, error);
    return null;
  }
}

async function getDownloadTasks(assetId: string, fileIds: string[]) {
  const tasks = await Promise.all(
    fileIds.map((fileId) => getDownloadTask(assetId, fileId))
  );
  // remove any errored tasks
  return tasks.filter((task) => task !== null) as DownloadTask[];
}

export function useFileDownloader() {
  const tasks = ref<DownloadTask[]>([]);
  const isDownloading = ref(false);

  async function downloadAssetFiles(assetId: string, fileIds: string[]) {
    isDownloading.value = true;
    tasks.value = await getDownloadTasks(assetId, fileIds);

    // collect fetch responses downloadZip
    // will use these as input streams
    const streams = [] as DownloadableStream[];
    for (const task of tasks.value) {
      console.log(`Fetching ${task.url}`);
      const response = await fetch(task.url);
      streams.push({
        name: task.filename,
        lastModified: new Date(),
        input: response,
      });
    }

    const zipStream = downloadZip(streams);
    const isoDate = new Date().toISOString().split("T")[0];
    const filename = `asset-${assetId}-${isoDate}.zip`;

    const fileStream = streamSaver.createWriteStream(filename);

    zipStream.body?.pipeTo(fileStream).then(() => {
      isDownloading.value = false;
    });
  }

  return {
    tasks,
    isDownloading,
    downloadAssetFiles,
  };
}

import { ref, Ref } from "vue";
import axios, { AxiosProgressEvent, AxiosResponse } from "axios";

export function useFileDownloader() {
  const isDownloading: Ref<boolean> = ref(false);
  const progress: Ref<number> = ref(0);

  const downloadFile = async (url: string, fileName = "file") => {
    isDownloading.value = true;

    // download the file to memory so that we can monitor
    // the progress of the download
    const response: AxiosResponse = await axios.get(url, {
      responseType: "blob",
      onDownloadProgress: (progressEvent: AxiosProgressEvent) => {
        progress.value = Math.round(
          // use 100 as the total if it's not available for some reason
          (progressEvent.loaded * 100) / (progressEvent.total ?? 100)
        );
      },
    });

    // create a temporary link and download the file
    // from memory to the user's computer
    const urlObj: string = window.URL.createObjectURL(
      new Blob([response.data])
    );
    const link: HTMLAnchorElement = document.createElement("a");
    link.href = urlObj;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    isDownloading.value = false;
  };

  return {
    isDownloading,
    progress,
    downloadFile,
  };
}

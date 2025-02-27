<!-- components/DownloadManager.vue -->
<template>
  <div
    class="w-full max-w-3xl mx-auto bg-white shadow-lg rounded-lg border border-black">
    <!-- Header with summary info -->
    <div class="p-4 border-b border-gray-200">
      <h2 class="text-xl font-semibold text-gray-800">Downloads</h2>
      <div v-if="downloadQueue.length > 0" class="mt-3">
        <div class="h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            class="h-full bg-blue-500 transition-all duration-300"
            :style="{ width: `${totalProgress}%` }"></div>
        </div>
        <div class="flex gap-4 mt-2 text-sm text-gray-600">
          <span>{{ inProgressDownloads.length }} active</span>
          <span>{{ pendingDownloads.length }} pending</span>
          <span>{{ completedDownloads.length }} completed</span>
          <span v-if="failedDownloads.length > 0" class="text-red-600">
            {{ failedDownloads.length }} failed
          </span>
        </div>
        <button
          v-if="completedDownloads.length > 0"
          class="mt-2 text-sm text-blue-500 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
          @click="clearCompleted">
          Clear completed
        </button>
      </div>
      <div v-else class="mt-3 text-gray-600">No downloads in queue</div>
    </div>

    <!-- Download list -->
    <div class="max-h-96 overflow-y-auto">
      <TransitionGroup name="list" class="divide-y divide-gray-200">
        <div
          v-for="item in downloadQueue"
          :key="item.id"
          class="p-4 flex items-center"
          :class="{
            'bg-gray-50': item.status === DownloadStatus.COMPLETED,
            'bg-red-50': item.status === DownloadStatus.ERROR,
          }">
          <div class="flex-1">
            <div class="font-medium text-gray-800">{{ item.filename }}</div>
            <div class="text-xs text-gray-600 mt-1">
              {{ formatFileSize(item.size) }} • {{ getStatusText(item) }}
            </div>
            <div v-if="item.error" class="text-xs text-red-600 mt-1">
              {{ item.error }}
            </div>
          </div>

          <div
            v-if="item.status === DownloadStatus.DOWNLOADING"
            class="w-36 mx-4">
            <div class="h-1 bg-gray-200 rounded-full overflow-hidden">
              <div
                class="h-full bg-blue-500 transition-all duration-300"
                :style="{ width: `${item.progress}%` }"></div>
            </div>
            <div class="text-xs text-center text-gray-600 mt-1">
              {{ item.progress }}%
            </div>
          </div>
          <div v-else class="w-36 mx-4"></div>

          <div class="flex gap-2">
            <button
              v-if="item.status === DownloadStatus.PENDING"
              class="text-xs px-3 py-1.5 border border-gray-200 rounded text-blue-500 hover:bg-gray-50 transition-colors"
              @click="startDownload(item.id)">
              Start
            </button>

            <button
              v-if="item.status === DownloadStatus.DOWNLOADING"
              class="text-xs px-3 py-1.5 border border-gray-200 rounded text-gray-600 hover:bg-gray-50 transition-colors"
              @click="pauseDownload(item.id)">
              Pause
            </button>

            <button
              v-if="item.status === DownloadStatus.PAUSED"
              class="text-xs px-3 py-1.5 border border-gray-200 rounded text-blue-500 hover:bg-gray-50 transition-colors"
              @click="resumeDownload(item.id)">
              Resume
            </button>

            <button
              v-if="item.status === DownloadStatus.ERROR"
              class="text-xs px-3 py-1.5 border border-gray-200 rounded text-red-600 hover:bg-gray-50 transition-colors"
              @click="retryDownload(item.id)">
              Retry
            </button>

            <button
              class="text-xs px-3 py-1.5 border border-gray-200 rounded text-gray-600 hover:bg-gray-50 transition-colors"
              @click="cancelDownload(item.id)">
              {{
                item.status === DownloadStatus.COMPLETED ? "Remove" : "Cancel"
              }}
            </button>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  useDownloadStore,
  DownloadStatus,
  type DownloadItem,
} from "@/stores/downloadStore";
import { storeToRefs } from "pinia";

// Get store and extract reactive properties
const downloadStore = useDownloadStore();
const {
  downloadQueue,
  pendingDownloads,
  completedDownloads,
  failedDownloads,
  inProgressDownloads,
  totalProgress,
} = storeToRefs(downloadStore);

// Extract methods from the store
const {
  startDownload,
  pauseDownload,
  resumeDownload,
  cancelDownload,
  retryDownload,
  clearCompleted,
} = downloadStore;

/**
 * Format file size in human-readable format
 * @param bytes Size in bytes
 * @returns Formatted size string (e.g., "2.5 MB")
 */
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

/**
 * Get human-readable status text for a download item
 * @param item The download item
 * @returns Status text to display
 */
const getStatusText = (item: DownloadItem): string => {
  switch (item.status) {
    case DownloadStatus.PENDING:
      return "Waiting to start";
    case DownloadStatus.DOWNLOADING:
      return `Downloading (${item.progress}%)`;
    case DownloadStatus.PAUSED:
      return "Paused";
    case DownloadStatus.COMPLETED:
      return "Completed";
    case DownloadStatus.ERROR:
      return "Error";
    default:
      return "";
  }
};
</script>

<style>
/* Only keeping transition animations, everything else uses Tailwind */
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>

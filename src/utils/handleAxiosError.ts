import axios from "axios";
import { useNotificationStore } from "@/stores/notificationStore";

const notificationStore = useNotificationStore();

export default function handleAxiosError(err: unknown) {
  if (axios.isAxiosError(err) || err instanceof Error) {
    notificationStore.show(err.message);
  }
  console.error(err);
}

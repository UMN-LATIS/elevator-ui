import { defineStore } from "pinia";

const getRandomId = () =>
  (Math.random().toString(36) + Date.now().toString(36)).substr(2);

interface Notification {
  id: string;
  message: string;
}

export const useNotificationStore = defineStore("notification", {
  state: () => ({
    active: false,
    autoHide: true,
    notifications: [] as Notification[],
  }),

  actions: {
    showNotification(notification) {
      this.notifications.push({
        ...notification,
        id: getRandomId(),
      });
    },

    hideNotification(data) {
      this.notifications = this.notifications.filter((notification) => {
        return notification.id != data.id;
      });
    },
  },
});

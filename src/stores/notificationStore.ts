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
    timeout: 5000,
    notifications: [] as Notification[],
  }),

  actions: {
    show(message: string) {
      const notification = {
        id: getRandomId(),
        message,
      };
      this.notifications.push(notification);

      if (this.autoHide) {
        setTimeout(() => this.hide(notification.id), this.timeout);
      }
    },

    hide(id: string) {
      this.notifications = this.notifications.filter((item) => id !== item.id);
    },
  },
});

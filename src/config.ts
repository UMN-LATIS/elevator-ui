export default {
  baseUrl: import.meta.env.VITE_BASE_URL || "http://localhost",
  mapBox: {
    accessToken:
      import.meta.env.VITE_MAPBOX_ACCESS_TOKEN ??
      "PLEASE_SET_MAPBOX_ACCESS_TOKEN",
  },
};

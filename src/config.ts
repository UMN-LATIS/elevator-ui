export default {
  baseUrl: import.meta.env.VITE_BASE_URL || "http://localhost",
  arcgis: {
    apiKey:
      import.meta.env.VITE_ARCGIS_API_KEY ?? "PLEASE_SET_MAPBOX_ACCESS_TOKEN",
  },
  // mapBox: {
  //   accessToken:
  //     import.meta.env.VITE_MAPBOX_ACCESS_TOKEN ??
  //     "PLEASE_SET_MAPBOX_ACCESS_TOKEN",
  // },
};

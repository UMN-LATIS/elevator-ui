function prepMap() {
  if (cachedResults === "") {
    return;
  }
  if (markers["mapPane"]) {
    markers["mapPane"].clearLayers();
  }

  if (!map["mapPane"]) {
    loadMap("mapPane");
  }
  markers["mapPane"] = L.markerClusterGroup({ showCoverageOnHover: false });

  $.each(cachedResults.matches, function (index, value) {
    if (value.locations) {
      $.each(value.locations, function (index2, value2) {
        $.each(value2.entries, function (index3, value3) {
          loc = value3.loc.coordinates;
          value.base_url = basePath;
          const html = MarkerTemplate(value);

          if (loc[1] === 0 && loc[0] === 0) {
            return true;
          }

          localMarker = L.marker([loc[1], loc[0]]);
          localMarker.bindPopup(html);
          markers["mapPane"].addLayer(localMarker);
        });
      });
    }
  });

  map["mapPane"].addLayer(markers["mapPane"]);
  map["mapPane"].fitBounds(markers["mapPane"].getBounds().pad(0.5));
}

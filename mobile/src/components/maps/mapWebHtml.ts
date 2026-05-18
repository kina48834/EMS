import { statusToHexColor } from '../../lib/incidentMap';
import type { IncidentMapMarker } from './types';

const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

export function buildIncidentsMapHtml(markers: IncidentMapMarker[], selectedId: string | null): string {
  const data = JSON.stringify(
    markers.map((m) => ({
      id: m.id,
      lat: m.lat,
      lng: m.lng,
      title: m.title,
      description: m.description ?? m.status,
      color: statusToHexColor(m.status),
      selected: m.id === selectedId,
    })),
  );

  return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"/>
<link rel="stylesheet" href="${LEAFLET_CSS}" crossorigin="anonymous"/>
<style>html,body,#map{margin:0;padding:0;width:100%;height:100%;}#map{background:#e2e8f0;}</style>
</head><body>
<div id="map"></div></body>
<script src="${LEAFLET_JS}" crossorigin="anonymous"></script>
<script>
(function(){
  var markers = ${data};
  var map = L.map('map', { zoomControl: true }).setView([12.8797, 121.774], 6);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OSM' }).addTo(map);
  var group = L.layerGroup().addTo(map);
  function post(obj) {
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(obj));
  }
  function render() {
    group.clearLayers();
    markers.forEach(function(m) {
      var c = L.circleMarker([m.lat, m.lng], {
        radius: m.selected ? 10 : 7,
        weight: m.selected ? 3 : 2,
        color: m.color,
        fillColor: m.color,
        fillOpacity: 0.85
      });
      c.bindTooltip('<strong>' + m.title + '</strong>');
      c.on('click', function() { post({ type: 'markerPress', id: m.id }); });
      c.addTo(group);
    });
    if (markers.length === 1) map.setView([markers[0].lat, markers[0].lng], 14);
    else if (markers.length > 1) {
      var b = L.latLngBounds(markers.map(function(m){ return [m.lat, m.lng]; }));
      if (b.isValid()) map.fitBounds(b.pad(0.12), { maxZoom: 15 });
    }
    setTimeout(function(){ map.invalidateSize(); }, 50);
  }
  window.__emsMap = {
    setMarkers: function(next) { markers = next; render(); },
    fitMarkers: function() { render(); },
    focus: function(lat, lng) {
      var z = map.getZoom();
      map.setView([lat, lng], z < 11 ? 14 : z);
      map.invalidateSize();
    }
  };
  render();
  post({ type: 'ready' });
})();
</script>
</html>`;
}

export function buildPickerMapHtml(
  markers: IncidentMapMarker[],
  pin: { lat: number; lng: number } | null,
  pickEnabled: boolean,
): string {
  const markerData = JSON.stringify(
    markers.map((m) => ({
      lat: m.lat,
      lng: m.lng,
      title: m.title,
      color: statusToHexColor(m.status),
    })),
  );
  const pinData = pin ? JSON.stringify(pin) : 'null';

  return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"/>
<link rel="stylesheet" href="${LEAFLET_CSS}" crossorigin="anonymous"/>
<style>html,body,#map{margin:0;padding:0;width:100%;height:100%;}#map{background:#e2e8f0;}</style>
</head><body>
<div id="map"></div></body>
<script src="${LEAFLET_JS}" crossorigin="anonymous"></script>
<script>
(function(){
  var markers = ${markerData};
  var pin = ${pinData};
  var pickEnabled = ${pickEnabled ? 'true' : 'false'};
  var map = L.map('map', { zoomControl: true }).setView([12.8797, 121.774], 6);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OSM' }).addTo(map);
  var group = L.layerGroup().addTo(map);
  function post(obj) {
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(obj));
  }
  function render() {
    group.clearLayers();
    markers.forEach(function(m) {
      L.circleMarker([m.lat, m.lng], {
        radius: 7, weight: 2, color: m.color, fillColor: m.color, fillOpacity: 0.85
      }).bindTooltip(m.title).addTo(group);
    });
    if (pin) {
      L.circleMarker([pin.lat, pin.lng], {
        radius: 10, weight: 3, color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.9
      }).bindTooltip('New pin').addTo(group);
      map.setView([pin.lat, pin.lng], Math.max(map.getZoom(), 14));
    } else if (markers.length > 0) {
      var b = L.latLngBounds(markers.map(function(m){ return [m.lat, m.lng]; }));
      if (b.isValid()) map.fitBounds(b.pad(0.12), { maxZoom: 15 });
    }
    document.getElementById('map').style.cursor = pickEnabled ? 'crosshair' : 'default';
    setTimeout(function(){ map.invalidateSize(); }, 50);
  }
  map.on('click', function(e) {
    if (!pickEnabled) return;
    post({ type: 'pick', lat: e.latlng.lat, lng: e.latlng.lng });
  });
  window.__emsMap = {
    setState: function(m, p, pick) { markers = m; pin = p; pickEnabled = pick; render(); },
    fitMarkers: function() { render(); },
    focus: function(lat, lng) { map.setView([lat, lng], 14); map.invalidateSize(); }
  };
  render();
  post({ type: 'ready' });
})();
</script>
</html>`;
}

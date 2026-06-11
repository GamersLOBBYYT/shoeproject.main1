import { useEffect, useRef } from "react";
import L from "leaflet";

const makeIcon = (html, cls) =>
  L.divIcon({ html, className: cls, iconSize: [34, 34], iconAnchor: [17, 17] });

const LEGEND = [
  { color: "#7c3aed", label: "Warehouse" },
  { color: "#ff4757", label: "Your Package" },
  { color: "#00c8a0", label: "Destination" },
];

export const TrackingMap = ({ tracking }) => {
  const mapRef = useRef(null);
  const mapObj = useRef(null);
  const packageMarker = useRef(null);
  const traveledLine = useRef(null);

  // Initialise the map once tracking data is available
  useEffect(() => {
    if (!tracking || !mapRef.current || mapObj.current) return;
    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: false,
    });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", { maxZoom: 19 }).addTo(map);

    const route = tracking.route;
    L.polyline(route, { color: "rgba(255,255,255,0.25)", weight: 3, dashArray: "6 8" }).addTo(map);
    traveledLine.current = L.polyline([route[0]], { color: "#ff4757", weight: 4 }).addTo(map);

    L.marker(route[0], { icon: makeIcon('<i class="fa-solid fa-warehouse"></i>', "map-pin map-pin--warehouse") }).addTo(map);
    L.marker(route[route.length - 1], { icon: makeIcon('<i class="fa-solid fa-house"></i>', "map-pin map-pin--home") }).addTo(map);
    packageMarker.current = L.marker(tracking.position, {
      icon: makeIcon('<i class="fa-solid fa-truck-fast"></i>', "map-pin map-pin--package"),
      zIndexOffset: 1000,
    }).addTo(map);

    map.fitBounds(L.latLngBounds(route), { padding: [50, 50] });
    mapObj.current = map;
  }, [tracking]);

  // Move the package marker + extend the traveled path on every poll
  useEffect(() => {
    if (!tracking || !mapObj.current) return;
    packageMarker.current?.setLatLng(tracking.position);
    if (!traveledLine.current) return;
    const route = tracking.route;
    if (tracking.progress <= 0) {
      traveledLine.current.setLatLngs([route[0]]);
      return;
    }
    const segs = route.length - 1;
    const idx = Math.min(Math.floor(tracking.progress * segs), segs - 1);
    traveledLine.current.setLatLngs(route.slice(0, idx + 1).concat([tracking.position]));
  }, [tracking]);

  // Cleanup on unmount
  useEffect(
    () => () => {
      mapObj.current?.remove();
      mapObj.current = null;
    },
    []
  );

  return (
    <>
      <div className="map-box" ref={mapRef} data-testid="track-map" />
      <div className="map-legend">
        {LEGEND.map((l) => (
          <span key={l.label}>
            <span className="map-legend__dot" style={{ background: l.color }} /> {l.label}
          </span>
        ))}
      </div>
    </>
  );
};

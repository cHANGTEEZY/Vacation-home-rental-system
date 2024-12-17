import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import "./MapBox.css";

mapboxgl.accessToken = import.meta.env.VITE_MAP_BOX_ACCESS_TOKEN;

const MapBox = ({
  onLocationChange,
  showSearchLocation = true,
  showLatitude = true,
  showLongitude = true,
  initialLatitude,
  initialLongitude,
  showPopup = false,
}) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);
  const searchInputRef = useRef(null);
  const latInputRef = useRef(null);
  const lngInputRef = useRef(null);
  const popup = useRef(null);

  const [lng, setLng] = useState(initialLongitude || 85.3198);
  const [lat, setLat] = useState(initialLatitude || 27.7167);
  const [zoom, setZoom] = useState(15);
  const [mapLoadError, setMapLoadError] = useState(false);

  const handleSearch = async () => {
    const searchTerm = searchInputRef.current.value;
    if (searchTerm) {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          searchTerm
        )}.json?bbox=80.0581,26.347,88.2015,30.447&access_token=${
          mapboxgl.accessToken
        }`
      );
      const data = await response.json();
      if (data.features.length > 0) {
        const [newLng, newLat] = data.features[0].geometry.coordinates;
        setLng(newLng);
        setLat(newLat);
        map.current.flyTo({ center: [newLng, newLat], zoom: 14 });

        marker.current.setLngLat([newLng, newLat]);

        if (showPopup && popup.current) {
          popup.current
            .setLngLat([newLng, newLat])
            .setHTML(`<h1>Where you will nest</h1>`)
            .addTo(map.current);
        }

        onLocationChange(newLat, newLng);

        // Update the input fields
        if (latInputRef.current) latInputRef.current.value = newLat.toFixed(6);
        if (lngInputRef.current) lngInputRef.current.value = newLng.toFixed(6);
      } else {
        console.warn("No search results found");
      }
    }
  };

  const handleLatLngChange = () => {
    const newLat = parseFloat(latInputRef.current.value);
    const newLng = parseFloat(lngInputRef.current.value);

    if (!isNaN(newLat) && !isNaN(newLng)) {
      setLat(newLat);
      setLng(newLng);
      map.current.flyTo({ center: [newLng, newLat], zoom: 14 });

      marker.current.setLngLat([newLng, newLat]);

      if (showPopup && popup.current) {
        popup.current
          .setLngLat([newLng, newLat])
          .setHTML(`<h1>Where you will nest</h1>`)
          .addTo(map.current);
      }

      onLocationChange(newLat, newLng);
    } else {
      console.warn("Invalid latitude or longitude");
    }
  };

  useEffect(() => {
    if (map.current) return;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [lng, lat],
      zoom: zoom,
      trackResize: false,
    });

    mapboxgl.config.SEND_EVENTS = false;

    marker.current = new mapboxgl.Marker({ draggable: true })
      .setLngLat([lng, lat])
      .addTo(map.current);

    if (showPopup) {
      popup.current = new mapboxgl.Popup({ closeOnClick: false })
        .setLngLat([lng, lat])
        .setHTML(`<h1 className="map-popup-text">Where you will nest</h1>`)
        .addTo(map.current);
    }

    marker.current.on("dragend", () => {
      const lngLat = marker.current.getLngLat();
      setLng(lngLat.lng);
      setLat(lngLat.lat);

      if (showPopup && popup.current) {
        popup.current
          .setLngLat(lngLat)
          .setHTML(`<p>Where you will nest</p>`)
          .addTo(map.current);
      }

      onLocationChange(lngLat.lat, lngLat.lng);

      // Update the input fields
      if (latInputRef.current)
        latInputRef.current.value = lngLat.lat.toFixed(6);
      if (lngInputRef.current)
        lngInputRef.current.value = lngLat.lng.toFixed(6);
    });

    map.current.on("click", (e) => {
      const { lng, lat } = e.lngLat;
      marker.current.setLngLat([lng, lat]);
      setLng(lng);
      setLat(lat);
      onLocationChange(lat, lng);

      // Update the input fields
      if (latInputRef.current) latInputRef.current.value = lat.toFixed(6);
      if (lngInputRef.current) lngInputRef.current.value = lng.toFixed(6);
    });

    map.current.on("error", (e) => {
      console.error("Mapbox GL error:", e);
      setMapLoadError(true);
    });
  }, [showPopup, lng, lat, zoom]);

  useEffect(() => {
    if (!map.current) return;

    if (showPopup && !popup.current) {
      popup.current = new mapboxgl.Popup({ closeOnClick: false })
        .setLngLat([lng, lat])
        .setHTML(`<p>Where you will nest</p>`)
        .addTo(map.current);
    } else if (!showPopup && popup.current) {
      popup.current.remove();
      popup.current = null;
    }
  }, [showPopup, lng, lat]);

  return (
    <div>
      {mapLoadError && (
        <div style={{ color: "red", marginBottom: "10px" }}>
          There was an error loading the map. If you're using an ad-blocker, try
          disabling it for this site.
        </div>
      )}
      {showSearchLocation && (
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search for a location..."
          onKeyUp={(e) => {
            if (e.key === "Enter") {
              handleSearch();
            }
          }}
        />
      )}
      <div>
        {showLatitude && (
          <input
            ref={latInputRef}
            type="text"
            placeholder="Enter latitude..."
            defaultValue={lat.toFixed(6)}
            onKeyUp={(e) => {
              if (e.key === "Enter") {
                handleLatLngChange();
              }
            }}
          />
        )}
        {showLongitude && (
          <input
            ref={lngInputRef}
            type="text"
            placeholder="Enter longitude..."
            defaultValue={lng.toFixed(6)}
            onKeyUp={(e) => {
              if (e.key === "Enter") {
                handleLatLngChange();
              }
            }}
          />
        )}
      </div>
      <div ref={mapContainer} style={{ width: "100%", height: "25rem" }} />
    </div>
  );
};

export default MapBox;

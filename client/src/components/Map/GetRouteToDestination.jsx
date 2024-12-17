import { useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import MapboxDirections from "@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions";

mapboxgl.accessToken = import.meta.env.VITE_MAP_BOX_ACCESS_TOKEN;

const GetRouteToDestination = ({ userCurrentLocation, destination }) => {
  const [map, setMap] = useState(null);
  const [lng, setLng] = useState(userCurrentLocation.lng);
  const [lat, setLat] = useState(userCurrentLocation.lat);

  useEffect(() => {
    if (!map) {
      // Initialize the map
      const initializeMap = ({ setMap, mapboxgl }) => {
        const mapInstance = new mapboxgl.Map({
          container: "map", // container ID
          style: "mapbox://styles/mapbox/streets-v11", // map style
          center: [lng, lat], // starting position [lng, lat]
          zoom: 13, // starting zoom
        });

        // Add map controls (zoom, rotation)
        mapInstance.addControl(new mapboxgl.NavigationControl());

        // Add the directions control
        const directions = new MapboxDirections({
          accessToken: mapboxgl.accessToken,
          unit: "metric", // or 'imperial'
          profile: "mapbox/driving", // 'walking', 'cycling' or 'driving'
        });

        directions.setOrigin([lng, lat]); // Current position
        directions.setDestination([destination.lng, destination.lat]); // Destination

        mapInstance.addControl(directions, "top-left");

        setMap(mapInstance);
      };

      if (lng && lat) {
        initializeMap({ setMap, mapboxgl });
      }
    }
  }, [map, lng, lat, destination]);

  return <div id="map" style={{ width: "100%", height: "500px" }}></div>;
};

export default GetRouteToDestination;

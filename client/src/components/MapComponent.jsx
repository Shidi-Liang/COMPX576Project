/*import React from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';

const MapComponent = ({ places }) => {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
  });

  if (!isLoaded) return <div>Loading...</div>;

  return (
    <GoogleMap
      center={{ lat: -36.8485, lng: 174.7633 }} // 
      zoom={12}
      mapContainerStyle={{ width: '100%', height: '600px' }}
    >
      {places.map((place, index) => (
        <Marker
          key={index}
          position={{ lat: place.lat, lng: place.lng }}
        />
      ))}
    </GoogleMap>
  );
};

export default MapComponent;*/

// client/src/components/MapComponent.jsx
/*import React, { useEffect, useState, useCallback, useRef } from 'react';
import { GoogleMap, Marker, DirectionsRenderer, useJsApiLoader } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '100vh',
};

const center = {
  lat: -36.8485,
  lng: 174.7633,
};

const MapComponent = ({ routeOptions }) => {
  const [markersList, setMarkersList] = useState([]); // array of arrays
  const [directionsList, setDirectionsList] = useState([]); // array of results
  const mapRef = useRef(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: ['places'],
  });

  const geocodePlaces = async (places) => {
    const geocoder = new window.google.maps.Geocoder();
    const results = await Promise.all(
      places.map(place =>
        new Promise(resolve => {
          geocoder.geocode({ address: place }, (res, status) => {
            if (status === 'OK' && res[0]) {
              const { lat, lng } = res[0].geometry.location;
              resolve({ lat: lat(), lng: lng(), name: place });
            } else {
              console.warn('⚠️ Geocode failed for:', place);
              resolve(null);
            }
          });
        })
      )
    );
    return results.filter(Boolean);
  };

  const loadRoutes = useCallback(async () => {
    if (!isLoaded || !routeOptions) return;

    const allMarkers = [];
    const allDirections = [];

    for (let i = 0; i < routeOptions.length; i++) {
      const stops = routeOptions[i].stops.map(stop => stop.place);
      const coords = await geocodePlaces(stops);

      if (coords.length < 2) {
        console.warn(`⚠️ Skipping route ${i + 1}: not enough valid coordinates`, coords);
        continue;
      }

      allMarkers.push(coords);

      const directionsService = new window.google.maps.DirectionsService();
      const result = await new Promise(resolve => {
        directionsService.route(
          {
            origin: coords[0],
            destination: coords[coords.length - 1],
            waypoints: coords.slice(1, -1).map(loc => ({ location: loc, stopover: true })),
            travelMode: window.google.maps.TravelMode.DRIVING,
          },
          (res, status) => {
            if (status === 'OK') {
              resolve(res);
            } else {
              console.warn(`⚠️ Directions request failed for route ${i + 1}:`, status);
              resolve(null);
            }
          }
        );
      });

      allDirections.push(result);
    }

    setMarkersList(allMarkers);
    setDirectionsList(allDirections);
  }, [routeOptions, isLoaded]);

  useEffect(() => {
    loadRoutes();
  }, [loadRoutes]);

  const onLoad = useCallback(map => {
    mapRef.current = map;
  }, []);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  if (!isLoaded) return <div>Loading Map...</div>;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={12}
      onLoad={onLoad}
      onUnmount={onUnmount}
    >
      {markersList.map((routeMarkers, routeIdx) =>
        routeMarkers.map((marker, stopIdx) => (
          <Marker
            key={`${routeIdx}-${stopIdx}`}
            position={{ lat: marker.lat, lng: marker.lng }}
            label={`${routeIdx + 1}-${stopIdx + 1}`}
          />
        ))
      )}

      {directionsList.map((directions, idx) =>
        directions ? (
          <DirectionsRenderer
            key={idx}
            directions={directions}
            options={{
              suppressMarkers: true,
              preserveViewport: true,
              polylineOptions: { strokeColor: '#3366FF', strokeWeight: 4 },
            }}
          />
        ) : null
      )}
    </GoogleMap>
  );
};

export default MapComponent;*/

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { GoogleMap, Marker, DirectionsRenderer, useJsApiLoader } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '100vh',
};

const center = {
  lat: -36.8485,
  lng: 174.7633,
};

// 动态生成颜色函数（确保路线颜色不同）
const getColor = (index) => `hsl(${(index * 75) % 360}, 100%, 50%)`;

const MapComponent = ({ routeOptions }) => {
  const [markersList, setMarkersList] = useState([]); // 每条路线的坐标数组
  const [directionsList, setDirectionsList] = useState([]); // 每条路线的 DirectionsResult
  const mapRef = useRef(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: ['places'],
  });

  // 地址转坐标
  const geocodePlaces = async (places) => {
    const geocoder = new window.google.maps.Geocoder();
    const results = await Promise.all(
      places.map(place =>
        new Promise(resolve => {
          geocoder.geocode({ address: place }, (res, status) => {
            if (status === 'OK' && res[0]) {
              const { lat, lng } = res[0].geometry.location;
              resolve({ lat: lat(), lng: lng(), name: place });
            } else {
              console.warn('⚠️ Geocode failed for:', place);
              resolve(null);
            }
          });
        })
      )
    );
    return results.filter(Boolean);
  };

  // 加载所有路线
  const loadRoutes = useCallback(async () => {
    if (!isLoaded || !routeOptions) return;

    const allMarkers = [];
    const allDirections = [];

    for (let i = 0; i < routeOptions.length; i++) {
      const stops = routeOptions[i].stops.map(stop => stop.place);
      const coords = await geocodePlaces(stops);

      if (coords.length < 2) {
        console.warn(`⚠️ Skipping route ${i + 1}: not enough valid coordinates`, coords);
        continue;
      }

      allMarkers.push(coords);

      const directionsService = new window.google.maps.DirectionsService();
      const result = await new Promise(resolve => {
        directionsService.route(
          {
            origin: coords[0],
            destination: coords[coords.length - 1],
            waypoints: coords.slice(1, -1).map(loc => ({ location: loc, stopover: true })),
            travelMode: window.google.maps.TravelMode.DRIVING,
          },
          (res, status) => {
            if (status === 'OK') {
              resolve(res);
            } else {
              console.warn(`⚠️ Directions request failed for route ${i + 1}:`, status);
              resolve(null);
            }
          }
        );
      });

      allDirections.push(result);
    }

    setMarkersList(allMarkers);
    setDirectionsList(allDirections);
  }, [routeOptions, isLoaded]);

  useEffect(() => {
    loadRoutes();
  }, [loadRoutes]);

  const onLoad = useCallback(map => {
    mapRef.current = map;
  }, []);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  if (!isLoaded) return <div>Loading Map...</div>;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={12}
      onLoad={onLoad}
      onUnmount={onUnmount}
    >
      {/* 渲染所有标记 */}
      {markersList.map((routeMarkers, routeIdx) =>
        routeMarkers.map((marker, stopIdx) => (
          <Marker
            key={`${routeIdx}-${stopIdx}`}
            position={{ lat: marker.lat, lng: marker.lng }}
            label={`${routeIdx + 1}-${stopIdx + 1}`}
          />
        ))
      )}

      {/* 渲染所有路线，每条路线使用不同颜色 */}
      {directionsList.map((directions, idx) =>
        directions ? (
          <DirectionsRenderer
            key={idx}
            directions={directions}
            options={{
              suppressMarkers: true,
              preserveViewport: true,
              polylineOptions: {
                strokeColor: getColor(idx),
                strokeWeight: 4,
              },
            }}
          />
        ) : null
      )}
    </GoogleMap>
  );
};

export default MapComponent;


/*import React, { useEffect, useState, useCallback, useRef } from 'react';
import { GoogleMap, Marker, DirectionsRenderer, useJsApiLoader } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '100vh',
};

const center = {
  lat: -36.8485,
  lng: 174.7633,
};

// 手动设置三种颜色：红、绿、蓝
const getColor = (index) => {
  const colors = ['#FF0000', '#00AA00', '#0000FF'];
  return colors[index % colors.length];
};

const MapComponent = ({ routeOptions }) => {
  const [markersList, setMarkersList] = useState([]);
  const [directionsList, setDirectionsList] = useState([]);
  const mapRef = useRef(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: ['places'],
  });

  const geocodePlaces = async (places) => {
    const geocoder = new window.google.maps.Geocoder();
    const results = await Promise.all(
      places.map(place =>
        new Promise(resolve => {
          geocoder.geocode({ address: place }, (res, status) => {
            if (status === 'OK' && res[0]) {
              const { lat, lng } = res[0].geometry.location;
              resolve({ lat: lat(), lng: lng(), name: place });
            } else {
              console.warn('⚠️ Geocode failed for:', place);
              resolve(null);
            }
          });
        })
      )
    );
    return results.filter(Boolean);
  };

  const applyOffsetToPolyline = (overviewPath, offsetIdx) => {
    const offsetPath = overviewPath.map(latlng => ({
      lat: latlng.lat() + offsetIdx * 0.0002,
      lng: latlng.lng() + offsetIdx * 0.0002,
    }));
    return offsetPath;
  };

  const loadRoutes = useCallback(async () => {
    if (!isLoaded || !routeOptions) return;

    const allMarkers = [];
    const allDirections = [];

    for (let i = 0; i < routeOptions.length; i++) {
      const stops = routeOptions[i].stops.map(stop => stop.place);
      const coords = await geocodePlaces(stops);

      if (coords.length < 2) {
        console.warn(`⚠️ Skipping route ${i + 1}: not enough valid coordinates`, coords);
        continue;
      }

      allMarkers.push(coords);

      const directionsService = new window.google.maps.DirectionsService();
      const result = await new Promise(resolve => {
        directionsService.route(
          {
            origin: coords[0],
            destination: coords[coords.length - 1],
            waypoints: coords.slice(1, -1).map(loc => ({ location: loc, stopover: true })),
            travelMode: window.google.maps.TravelMode.DRIVING,
          },
          (res, status) => {
            if (status === 'OK') {
              // 对每条路线添加偏移字段
              res.overview_path_offset = applyOffsetToPolyline(res.routes[0].overview_path, i);
              resolve(res);
            } else {
              console.warn(`⚠️ Directions request failed for route ${i + 1}:`, status);
              resolve(null);
            }
          }
        );
      });

      allDirections.push(result);
    }

    setMarkersList(allMarkers);
    setDirectionsList(allDirections);
  }, [routeOptions, isLoaded]);

  useEffect(() => {
    loadRoutes();
  }, [loadRoutes]);

  const onLoad = useCallback(map => {
    mapRef.current = map;
  }, []);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  if (!isLoaded) return <div>Loading Map...</div>;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={12}
      onLoad={onLoad}
      onUnmount={onUnmount}
    >
      {/* 渲染所有标记 *///}
      /*{markersList.map((routeMarkers, routeIdx) =>
        routeMarkers.map((marker, stopIdx) => (
          <Marker
            key={`${routeIdx}-${stopIdx}`}
            position={{ lat: marker.lat, lng: marker.lng }}
            label={`${routeIdx + 1}-${stopIdx + 1}`}
          />
        ))
      )}

      {/* 渲染所有路线 *///}
      /*{directionsList.map((directions, idx) =>
        directions ? (
          <DirectionsRenderer
            key={idx}
            directions={directions}
            options={{
              suppressMarkers: true,
              preserveViewport: true,
              polylineOptions: {
                path: directions.overview_path_offset, // 用偏移路径
                strokeColor: getColor(idx),
                strokeWeight: 4,
              },
            }}
          />
        ) : null
      )}
    </GoogleMap>
  );
};

export default MapComponent;*/










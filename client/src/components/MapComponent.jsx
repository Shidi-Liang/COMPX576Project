import React from 'react';
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

export default MapComponent;

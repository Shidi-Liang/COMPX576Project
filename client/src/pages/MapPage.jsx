import React, { useState } from 'react';
import UserForm from '../components/UserForm';
import Map from '../components/MapComponent';

const MapPage = () => {
  const [places, setPlaces] = useState([]);

  return (
    <div>
      <h1>Smart Travel Buddy</h1>
      <UserForm onResults={setPlaces} />
      <Map places={places} />
    </div>
  );
};

export default MapPage;
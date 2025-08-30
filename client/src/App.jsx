/*import React from 'react';
import MapPage from './pages/MapPage';

function App() {
  return (
    <div className="App">
      <MapPage />
    </div>
  );
}

export default App;*/

import React, { useState } from 'react';
import LoginForm from './components/LoginForm';
import MapPage from './pages/MapPage';

function App() {
  const [user, setUser] = useState(null);

  return (
    <div>
      {!user ? (
        <LoginForm onLogin={setUser} />
      ) : (
        <MapPage user={user} />
      )}
    </div>
  );
}

export default App;

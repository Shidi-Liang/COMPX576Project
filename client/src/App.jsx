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

/*import React, { useState } from 'react';
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

export default App;*/

import React, { useState } from "react";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import MapPage from "./pages/MapPage";

function App() {
  const [user, setUser] = useState(null);
  const [showRegister, setShowRegister] = useState(false);

  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser);
  };

  const handleRegistered = () => {
    // 注册成功后回到登录页（也可以在这里直接 setUser 自动登录）
    setShowRegister(false);
  };

  if (user) {
    return <MapPage user={user} />;
  }

  return (
    <div>
      {showRegister ? (
        <RegisterForm
          onRegistered={handleRegistered}            // 注册成功时调用
          onShowLogin={() => setShowRegister(false)}  // “已有账号？去登录”
        />
      ) : (
        <LoginForm
          onLogin={handleLogin}                       // 登录成功时调用
          onShowRegister={() => setShowRegister(true)}// “没有账号？去注册”
        />
      )}
    </div>
  );
}

export default App;


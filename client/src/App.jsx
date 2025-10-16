import React, { useEffect, useState } from "react";
import "./Auth.css";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import MapPage from "./pages/MapPage";
import TopNav from "./components/TopNav";

function App() {
  const [user, setUser] = useState(null);
  const [showRegister, setShowRegister] = useState(false);
  const [showSavedRoutes, setShowSavedRoutes] = useState(false); // Open "My Route" from the avatar menu

  // Restore login from localStorage on mount
  useEffect(() => {
    const cachedUser = localStorage.getItem("stb_user");
    if (cachedUser) {
      try { setUser(JSON.parse(cachedUser)); } catch {}
    }
  }, []);

  // Login successful: save user/token
  const handleLogin = (u, remember, token) => {
    setUser(u);
    if (remember) {
      localStorage.setItem("stb_user", JSON.stringify(u));
      if (token) localStorage.setItem("stb_token", token);
    } else {
      localStorage.removeItem("stb_user");
      localStorage.removeItem("stb_token");
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("stb_user");
    localStorage.removeItem("stb_token");
    setShowSavedRoutes(false);
  };

  const handleRegistered = () => setShowRegister(false);

  // Logged in: Top navigation + Home page
  if (user) {
    return (
      <div>
        <TopNav
          user={user}
          onLogout={handleLogout}
          onMyRoutes={() => setShowSavedRoutes(true)}   // Click the menu to open
        />
        <MapPage
          user={user}
          showSavedRoutes={showSavedRoutes}              // Pass to MapPage
          onCloseSavedRoutes={() => setShowSavedRoutes(false)}
        />
      </div>
    );
  }

  // Not logged in: Log in / Register
  return (
    <div>
      {showRegister ? (
        <RegisterForm
          onRegistered={handleRegistered}
          onShowLogin={() => setShowRegister(false)}
        />
      ) : (
        <LoginForm
          onLogin={handleLogin}
          onShowRegister={() => setShowRegister(true)}
        />
      )}
    </div>
  );
}

export default App;

import React, { useEffect, useState } from "react";
import "./Auth.css";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import MapPage from "./pages/MapPage";
import TopNav from "./components/TopNav";

function App() {
  const [user, setUser] = useState(null);
  const [showRegister, setShowRegister] = useState(false);
  const [showSavedRoutes, setShowSavedRoutes] = useState(false); // ✅ 头像菜单打开“我的路线”

  // 挂载时从 localStorage 恢复登录
  useEffect(() => {
    const cachedUser = localStorage.getItem("stb_user");
    if (cachedUser) {
      try { setUser(JSON.parse(cachedUser)); } catch {}
    }
  }, []);

  // 登录成功：保存 user / token（LoginForm 要传 onLogin(user, remember, token)）
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

  // 已登录：顶部导航 + 主页面
  if (user) {
    return (
      <div>
        <TopNav
          user={user}
          onLogout={handleLogout}
          onMyRoutes={() => setShowSavedRoutes(true)}   // ✅ 点击菜单打开
        />
        <MapPage
          user={user}
          showSavedRoutes={showSavedRoutes}              // ✅ 传给 MapPage
          onCloseSavedRoutes={() => setShowSavedRoutes(false)}
        />
      </div>
    );
  }

  // 未登录：登录 / 注册
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

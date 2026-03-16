import AppIcon from "./components/AppIcon";
import { BrowserRouter, Routes, Route, useLocation, NavLink } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import appTheme from "./theme.js";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { useState } from "react";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home.jsx";
import Skills from "./pages/Skills";
import MySkills from "./pages/MySkills";
import Profile from "./pages/Profile";
import Recommendations from "./pages/Recommendations.jsx";
import RecommendationHistory from "./pages/RecommendationHistory.jsx";
import Chat from "./pages/Chat.jsx";
import SidebarNav from "./components/SideBar.jsx";
import AppTopBar from "./components/AppTopBar.jsx";
import FloatingChatButton from "./components/FloatingChatButton.jsx";
import Planner from "./pages/Planner.jsx";
import Interviews from "./pages/Interviews.jsx";
import { useAuth } from "./auth/AuthContext";
import NotFound from "./pages/NotFound.jsx";
import SplashScreen from "./components/SplashScreen.jsx";



function PublicTopNav() {
  const linkClass = ({ isActive }) => `public-link${isActive ? " is-active" : ""}`;
  return (
    <header className="public-topbar">
      <div className="public-topbar-inner">
        <div className="public-brand">
          <AppIcon size={28} />
          <div>
            <div className="public-title">AI Career Coach</div>
            <div className="public-sub">Student dashboard</div>
          </div>
        </div>
        <nav className="public-nav">
          <NavLink to="/" end className={linkClass}>Home</NavLink>
          <NavLink to="/skills" className={linkClass}>Skills</NavLink>
          <NavLink to="/login" className={linkClass}>Login</NavLink>
          <NavLink to="/register" className={linkClass}>Register</NavLink>
        </nav>
      </div>
    </header>
  );
}



function AppLayout() {
  const { pathname } = useLocation();
  const { isAuthed } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAuthRoute = pathname === "/login" || pathname === "/register";
  const isHome = pathname === "/";

  if (!isAuthed) {
    return (
      <div className="public-shell">
        <PublicTopNav />
        <main className={isAuthRoute ? "public-content auth-in-public" : isHome ? "" : "public-content"}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/skills" element={<Skills />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </main>
      </div>
    );
  }

  return (
    <div className="dash-shell">
      <aside className="dash-sidebar">
        <SidebarNav mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      </aside>
      <div className="dash-main">
        <header className="dash-topbar">
          <AppTopBar onMenuClick={() => setMobileOpen(true)} />
        </header>
        <main className="dash-content">
          <FloatingChatButton />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/skills" element={<Skills />} />
            <Route path="/my-skills" element={<ProtectedRoute><MySkills /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/recommendations" element={<ProtectedRoute><Recommendations /></ProtectedRoute>} />
            <Route path="/recommendations/history" element={<ProtectedRoute><RecommendationHistory /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
            <Route path="/planner" element={<ProtectedRoute><Planner /></ProtectedRoute>} />
            <Route path="/interviews" element={<ProtectedRoute><Interviews /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const [splashDone, setSplashDone] = useState(false);
  return (
    <BrowserRouter>
      <ThemeProvider theme={appTheme}>
        {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}
        <AppLayout />
      </ThemeProvider>
    </BrowserRouter>
  );
}
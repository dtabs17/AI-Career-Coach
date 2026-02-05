import { BrowserRouter, Routes, Route, useLocation, NavLink } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

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
import { useAuth } from "./auth/AuthContext";

function PublicTopNav() {
  const linkClass = ({ isActive }) => `public-link${isActive ? " is-active" : ""}`;

  return (
    <header className="public-topbar">
      <div className="public-topbar-inner">
        <div className="public-brand">
          <div className="app-mark" aria-hidden="true">✨</div>
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

  const isAuthRoute = pathname === "/login" || pathname === "/register";
  if (!isAuthed) {
    return (
      <div className="public-shell">
        <PublicTopNav />

        <main className={isAuthRoute ? "public-content auth-in-public" : "public-content"}>
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
        <SidebarNav />
      </aside>

      <div className="dash-main">
        <header className="dash-topbar">
          <AppTopBar />
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
            <Route path="*" element={<div>Not found</div>} />
          </Routes>
        </main>
      </div>
    </div>
  );
}


export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

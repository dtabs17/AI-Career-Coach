import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useState } from "react";
//import {HouseDoorFill} from "react-bootstrap-icons"

function linkClass({ isActive }) {
  return `sb-link${isActive ? " active" : ""}`;
}

export default function Sidebar() {
  const { user } = useAuth();
  const { pathname } = useLocation();

  const name = user?.full_name || user?.fullName || user?.name || "Student";
  const meta = user?.course || user?.email || "Use top right logout";

  const inRecsSection = pathname.startsWith("/recommendations");
  const [recsToggledOpen, setRecsToggledOpen] = useState(false);

  const recsOpen = inRecsSection || recsToggledOpen;

  function toggleRecs() {
    if (inRecsSection) return;
    setRecsToggledOpen((v) => !v);
  }

  const recsParentClass = `sb-link${inRecsSection ? " active" : ""}`;

  return (
    <div className="sb">
      <div className="sb-brand">
        <div className="sb-logo" aria-hidden="true">✨</div>
        <div>
          <div className="sb-appname">AI Career Coach</div>
          <div className="sb-sub">Student dashboard</div>
        </div>
      </div>

      <div className="sb-section">App</div>

      <NavLink to="/" end className={linkClass}>
        <span className="sb-ico" aria-hidden="true">🏠</span>
        <span>Home</span>
      </NavLink>

      <NavLink to="/skills" className={linkClass}>
        <span className="sb-ico" aria-hidden="true">📚</span>
        <span>Skills</span>
      </NavLink>

      <NavLink to="/my-skills" className={linkClass}>
        <span className="sb-ico" aria-hidden="true">✅</span>
        <span>My Skills</span>
      </NavLink>

      <div className="sb-section">Insights</div>
      <button
        type="button"
        className={recsParentClass}
        onClick={toggleRecs}
        aria-expanded={recsOpen}
        style={{ width: "100%", textAlign: "left" }}
      >
        <span className="sb-ico" aria-hidden="true">✨</span>
        <span style={{ flex: 1 }}>Recommendations</span>
        <span aria-hidden="true" style={{ opacity: 0.7 }}>
          {recsOpen ? "▾" : "▸"}
        </span>
      </button>

      {recsOpen && (
        <div className="sb-submenu">
          <NavLink to="/recommendations" className={linkClass}>
            <span className="sb-ico sb-ico--mini" aria-hidden="true">⚡</span>
            <span>Generate</span>
          </NavLink>

          <NavLink to="/recommendations/history" className={linkClass}>
            <span className="sb-ico sb-ico--mini" aria-hidden="true">🕘</span>
            <span>History</span>
          </NavLink>
        </div>
      )}
      <NavLink to="/planner" className={linkClass}>
        <span className="sb-ico" aria-hidden="true">🎯</span>
        <span>Planner</span>
      </NavLink>


      <div className="sb-footer">
        <div className="sb-footdot" aria-hidden="true" />
        <div>
          <div className="sb-footname">{name}</div>
          <div className="sb-footmeta">{meta}</div>
        </div>
      </div>
    </div>
  );
}

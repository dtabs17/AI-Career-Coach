import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function FloatingChatButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isReady, isAuthed } = useAuth();

  const [showLabel, setShowLabel] = useState(true);

  useEffect(() => {
    const id = setInterval(() => setShowLabel((v) => !v), 2200);
    return () => clearInterval(id);
  }, []);

  const hideOnRoutes = useMemo(() => new Set(["/login", "/register", "/chat"]), []);
  const shouldHide = hideOnRoutes.has(location.pathname);

  if (!isReady) return null;
  if (!isAuthed) return null;
  if (shouldHide) return null;

  return (
    <div className="fab-wrap">
      <button
        type="button"
        className="fab-chat"
        onClick={() => navigate("/chat")}
        aria-label="Start chat"
        title="Start Chat"
      >
        <span className={`fab-label ${showLabel ? "is-visible" : ""}`}>
          Start Chat
        </span>

        <span className="fab-icon" aria-hidden="true">
          💬
        </span>
      </button>
    </div>
  );
}

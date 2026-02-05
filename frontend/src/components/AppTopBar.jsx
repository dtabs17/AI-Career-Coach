import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

function getTopbarTitle(pathname) {
    if (pathname === "/") return "Dashboard";
    if (pathname === "/skills") return "Skills";
    if (pathname === "/my-skills") return "My Skills";
    if (pathname === "/recommendations") return "Recommendations";
    if (pathname === "/recommendations/history") return "Recommendation history";
    if (pathname === "/chat") return "Chat";
    if (pathname === "/profile") return "Profile";
    return "AI Career Coach";
}

export default function AppTopBar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { pathname } = useLocation();

    const [open, setOpen] = useState(false);
    const wrapRef = useRef(null);

    useEffect(() => {
        function onDocClick(e) {
            if (!wrapRef.current) return;
            if (!wrapRef.current.contains(e.target)) setOpen(false);
        }
        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, []);

    const displayName = user?.full_name || user?.fullName || "Account";
    const displayEmail = user?.email || "";

    async function handleLogout() {
        try {
            await logout();
        } finally {
            setOpen(false);
            navigate("/");
        }
    }

    const title = getTopbarTitle(pathname);

    return (
        <div className="topbar-row">
            <div className="topbar-left">
                <div className="topbar-title">{title}</div>
            </div>

            <div className="topbar-right" ref={wrapRef}>
                <button
                    type="button"
                    className="topbar-iconbtn"
                    onClick={() => setOpen((v) => !v)}
                    aria-haspopup="menu"
                    aria-expanded={open}
                    title="Account"
                >
                    <span className="pfp-dot" aria-hidden="true" />
                </button>

                {open && (
                    <div className="topbar-menu" role="menu">
                        <div className="topbar-menu-head">
                            <div className="topbar-menu-name">{displayName}</div>
                            {displayEmail ? (
                                <div className="topbar-menu-email">{displayEmail}</div>
                            ) : null}
                        </div>

                        <button
                            type="button"
                            className="topbar-menu-item"
                            onClick={() => {
                                setOpen(false);
                                navigate("/profile");
                            }}
                            role="menuitem"
                        >
                            View profile
                        </button>

                        <button
                            type="button"
                            className="topbar-menu-item danger"
                            onClick={handleLogout}
                            role="menuitem"
                        >
                            Log out
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

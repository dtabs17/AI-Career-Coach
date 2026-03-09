import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Box, Typography } from "@mui/material";
import { keyframes } from "@emotion/react";
import { Chat } from "@mui/icons-material";

const pulseRing = keyframes`
  0%   { transform: scale(1);   opacity: 0.55; }
  70%  { transform: scale(1.55); opacity: 0;   }
  100% { transform: scale(1.55); opacity: 0;   }
`;

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

  if (!isReady || !isAuthed || shouldHide) return null;

  return (
    <Box
      onClick={() => navigate("/chat")}
      role="button"
      aria-label="Start chat"
      title="Start Chat"
      sx={{
        position: "fixed",
        bottom: { xs: 16, sm: 28 },
        right: { xs: 16, sm: 28 },
        zIndex: 1200,
        isolation: "isolate",
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: 2,
        py: 1.25,
        borderRadius: "999px",
        background: "linear-gradient(135deg, #f59e0b, #fb923c)",
        boxShadow: "0 4px 20px rgba(245,158,11,0.28)",
        cursor: "pointer",
        transition: "transform 150ms ease, box-shadow 150ms ease",
        userSelect: "none",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 8px 28px rgba(245,158,11,0.38)",
          filter: "brightness(1.07)",
        },
        "&:active": {
          transform: "translateY(0) scale(0.97)",
        },
      }}
    >
      <Box sx={{
        position: "absolute",
        inset: 0,
        borderRadius: "999px",
        background: "rgba(245,158,11,0.45)",
        animation: `${pulseRing} 2.4s ease-out infinite`,
        pointerEvents: "none",
        zIndex: -1,
      }} />
      <Chat sx={{ fontSize: 17, color: "#0c0b0f", flexShrink: 0 }} />
      <Box sx={{
        overflow: "hidden",
        maxWidth: showLabel ? 80 : 0,
        opacity: showLabel ? 1 : 0,
        transition: "max-width 350ms ease, opacity 300ms ease",
        whiteSpace: "nowrap",
      }}>
        <Typography sx={{
          fontSize: "0.8rem",
          fontWeight: 700,
          color: "#0c0b0f",
          fontFamily: "Manrope, system-ui, sans-serif",
          lineHeight: 1,
        }}>
          Start Chat
        </Typography>
      </Box>
    </Box>
  );
}
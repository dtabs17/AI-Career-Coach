import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import {
  Box, Typography, IconButton, Menu, MenuItem,
  Avatar, Divider, ListItemIcon, useMediaQuery,
} from "@mui/material";
import { Person, Logout, KeyboardArrowRight, Menu as MenuIcon } from "@mui/icons-material";

const routeMeta = {
  "/": { label: "Dashboard", parent: null },
  "/skills": { label: "Skills", parent: null },
  "/my-skills": { label: "My Skills", parent: null },
  "/recommendations": { label: "Recommendations", parent: null },
  "/recommendations/history": { label: "History", parent: "Recommendations" },
  "/chat": { label: "Chat", parent: null },
  "/profile": { label: "Profile", parent: null },
  "/planner": { label: "Planner", parent: null },
  "/interviews": { label: "Interviews", parent: null },
};

export default function AppTopBar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isMobile = useMediaQuery("(max-width:900px)");

  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);

  const displayName = user?.full_name || "Account";
  const displayEmail = user?.email || "";

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const meta = routeMeta[pathname] || { label: "AI Career Coach", parent: null };

  function openMenu(e) { setAnchorEl(e.currentTarget); }
  function closeMenu() { setAnchorEl(null); }

  async function handleLogout() {
    closeMenu();
    try { await logout(); } finally { navigate("/"); }
  }

  return (
    <Box sx={{
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      px: { xs: 2, sm: 3 },
      gap: 2,
    }}>

      {isMobile && (
        <IconButton
          onClick={onMenuClick}
          size="small"
          sx={{
            color: "rgba(241,240,255,0.65)",
            flexShrink: 0,
            "&:hover": { color: "#f1f0ff", bgcolor: "rgba(255,255,255,0.05)" },
          }}
        >
          <MenuIcon sx={{ fontSize: 22 }} />
        </IconButton>
      )}

      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0, flex: 1 }}>
        {meta.parent && (
          <>
            <Typography sx={{
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "rgba(241,240,255,0.35)",
              letterSpacing: "-0.01em",
              whiteSpace: "nowrap",
            }}>
              {meta.parent}
            </Typography>
            <KeyboardArrowRight sx={{ fontSize: 15, color: "rgba(241,240,255,0.20)", flexShrink: 0 }} />
          </>
        )}
        <Typography sx={{
          fontSize: "0.9rem",
          fontWeight: 680,
          color: "#f1f0ff",
          letterSpacing: "-0.01em",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}>
          {meta.label}
        </Typography>
      </Box>

      <Box sx={{ flexShrink: 0 }}>
        <IconButton
          onClick={openMenu}
          aria-haspopup="true"
          aria-expanded={menuOpen}
          size="small"
          disableRipple
          sx={{
            p: 0,
            border: menuOpen
              ? "2px solid rgba(245,158,11,0.60)"
              : "2px solid rgba(255,255,255,0.08)",
            borderRadius: "50%",
            background: "transparent",
            transition: "border-color 120ms ease",
            "&:hover": {
              border: "2px solid rgba(245,158,11,0.35)",
              background: "transparent",
            },
          }}
        >
          <Avatar sx={{
            width: 28,
            height: 28,
            fontSize: "0.68rem",
            fontWeight: 750,
            letterSpacing: "0.03em",
            background: "linear-gradient(135deg, #f59e0b, #fb923c)",
            color: "#0c0b0f",
          }}>
            {initials}
          </Avatar>
        </IconButton>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={closeMenu}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        slotProps={{
          paper: {
            sx: {
              mt: 1.2,
              minWidth: 210,
              backgroundColor: "rgba(10,9,16,0.99)",
              border: "1px solid rgba(255,255,255,0.09)",
              borderRadius: "10px",
              backdropFilter: "blur(24px)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.55)",
              overflow: "hidden",
              "&:hover": {
                transform: "none !important",
                boxShadow: "0 8px 32px rgba(0,0,0,0.55) !important",
              },
              "& .MuiList-root": { py: 0 },
            },
          },
        }}
      >
        <Box sx={{
          px: 2,
          pt: 1.75,
          pb: 1.5,
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
            <Avatar sx={{
              width: 32,
              height: 32,
              fontSize: "0.75rem",
              fontWeight: 750,
              background: "linear-gradient(135deg,#f59e0b,#fb923c)",
              color: "#0c0b0f",
              flexShrink: 0,
            }}>
              {initials}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{
                fontWeight: 680,
                fontSize: "0.855rem",
                color: "#f1f0ff",
                lineHeight: 1.3,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}>
                {displayName}
              </Typography>
              {displayEmail && (
                <Typography variant="caption" sx={{
                  color: "rgba(241,240,255,0.38)",
                  display: "block",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                  {displayEmail}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>

        <Box sx={{ py: 1 }}>
          <MenuItem
            onClick={() => { closeMenu(); navigate("/profile"); }}
            sx={{
              py: 1.1, px: 1.75,
              fontSize: "0.855rem",
              color: "rgba(241,240,255,0.75)",
              gap: 1.25,
              borderRadius: "6px",
              mx: 0.75,
              "&:hover": {
                background: "rgba(255,255,255,0.05)",
                color: "#f1f0ff",
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: "unset" }}>
              <Person sx={{ fontSize: 16, color: "rgba(241,240,255,0.35)" }} />
            </ListItemIcon>
            View Profile
          </MenuItem>

          <Divider sx={{ borderColor: "rgba(255,255,255,0.07)", my: 0.5, mx: 0.75 }} />

          <MenuItem
            onClick={handleLogout}
            sx={{
              py: 1.1, px: 1.75,
              fontSize: "0.855rem",
              color: "rgba(252,165,165,0.75)",
              gap: 1.25,
              borderRadius: "6px",
              mx: 0.75,
              "&:hover": {
                background: "rgba(239,68,68,0.07)",
                color: "#fca5a5",
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: "unset" }}>
              <Logout sx={{ fontSize: 16, color: "rgba(252,165,165,0.40)" }} />
            </ListItemIcon>
            Log out
          </MenuItem>
        </Box>
      </Menu>
    </Box>
  );
}
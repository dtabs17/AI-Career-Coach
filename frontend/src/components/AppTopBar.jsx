import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import {
  Box, Typography, IconButton, Menu, MenuItem,
  Avatar, Divider, ListItemIcon,
} from "@mui/material";
import { Person, Logout, KeyboardArrowRight } from "@mui/icons-material";



const routeMeta = {
  "/":                        { label: "Dashboard",              parent: null },
  "/skills":                  { label: "Skills",                 parent: null },
  "/my-skills":               { label: "My Skills",              parent: null },
  "/recommendations":         { label: "Recommendations",        parent: null },
  "/recommendations/history": { label: "History",                parent: "Recommendations" },
  "/chat":                    { label: "Chat",                   parent: null },
  "/profile":                 { label: "Profile",                parent: null },
  "/planner":                 { label: "Planner",                parent: null },
  "/interviews":              { label: "Interviews",             parent: null },
};

export default function AppTopBar() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const { pathname }     = useLocation();

  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);

  const displayName  = user?.full_name || "Account";
  const displayEmail = user?.email || "";

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const meta = routeMeta[pathname] || { label: "AI Career Coach", parent: null };

  function openMenu(e)  { setAnchorEl(e.currentTarget); }
  function closeMenu()  { setAnchorEl(null); }

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
      px: 3,
      gap: 2,
    }}>

      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0 }}>
        {meta.parent && (
          <>
            <Typography sx={{
              fontSize: "0.95rem",
              fontWeight: 500,
              color: "rgba(241,240,255,0.38)",
              letterSpacing: "-0.01em",
              whiteSpace: "nowrap",
            }}>
              {meta.parent}
            </Typography>
            <KeyboardArrowRight sx={{ fontSize: 16, color: "rgba(241,240,255,0.22)", flexShrink: 0 }} />
          </>
        )}
        <Typography sx={{
          fontSize: "0.97rem",
          fontWeight: 700,
          color: "#f1f0ff",
          letterSpacing: "-0.01em",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}>
          {meta.label}
        </Typography>
      </Box>

      <Box sx={{ flexShrink: 0, ml: "auto" }}>
        <IconButton
          onClick={openMenu}
          aria-haspopup="true"
          aria-expanded={menuOpen}
          size="small"
          disableRipple
          sx={{
            p: 0,
            border: menuOpen
              ? "2px solid rgba(245,158,11,0.55)"
              : "2px solid rgba(255,255,255,0.08)",
            borderRadius: "50%",
            background: "transparent",
            transition: "border-color 150ms ease",
            "&:hover": {
              border: "2px solid rgba(245,158,11,0.38)",
              background: "transparent",
            },
          }}
        >
          <Avatar sx={{
            width: 30,
            height: 30,
            fontSize: "0.72rem",
            fontWeight: 750,
            letterSpacing: "0.03em",
            background: "linear-gradient(135deg, #f59e0b 0%, #fb7185 100%)",
            color: "#fff",
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
              minWidth: 220,
              backgroundColor: "rgba(12,11,15,0.97)",
              border: "1px solid rgba(255,255,255,0.09)",
              borderRadius: "16px",
              backdropFilter: "blur(24px)",
              boxShadow: "0 24px 70px rgba(0,0,0,0.65)",
              overflow: "hidden",
              "&:hover": {
                transform: "none !important",
                boxShadow: "0 24px 70px rgba(0,0,0,0.65) !important",
              },
              "& .MuiList-root": { py: 0 },
            },
          },
        }}
      >

        <Box sx={{
          px: 2.5,
          pt: 2,
          pb: 1.5,
          background: "linear-gradient(180deg, rgba(245,158,11,0.06) 0%, transparent 100%)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Avatar sx={{
              width: 36,
              height: 36,
              fontSize: "0.8rem",
              fontWeight: 750,
              background: "linear-gradient(135deg, #f59e0b 0%, #fb7185 100%)",
              color: "#fff",
              flexShrink: 0,
            }}>
              {initials}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{
                fontWeight: 700,
                fontSize: "0.875rem",
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
                  color: "rgba(241,240,255,0.40)",
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
              py: 1.2, px: 2,
              fontSize: "0.875rem",
              color: "rgba(241,240,255,0.80)",
              gap: 1.5,
              borderRadius: "8px",
              mx: 1,
              "&:hover": {
                background: "rgba(255,255,255,0.05)",
                color: "#f1f0ff",
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: "unset" }}>
              <Person sx={{ fontSize: 17, color: "rgba(241,240,255,0.40)" }} />
            </ListItemIcon>
            View Profile
          </MenuItem>

          <Divider sx={{ borderColor: "rgba(255,255,255,0.07)", my: 0.75, mx: 1 }} />

          <MenuItem
            onClick={handleLogout}
            sx={{
              py: 1.2, px: 2,
              fontSize: "0.875rem",
              color: "rgba(252,165,165,0.80)",
              gap: 1.5,
              borderRadius: "8px",
              mx: 1,
              "&:hover": {
                background: "rgba(239,68,68,0.08)",
                color: "#fca5a5",
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: "unset" }}>
              <Logout sx={{ fontSize: 17, color: "rgba(252,165,165,0.45)" }} />
            </ListItemIcon>
            Log out
          </MenuItem>
        </Box>
      </Menu>
    </Box>
  );
}
import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import {
  Box, List, ListItemButton, ListItemText,
  Collapse, Typography, Divider,
} from "@mui/material";
import { ExpandMore } from "@mui/icons-material";



const navItemSx = {
  borderRadius: "10px",
  mb: 0.5,
  px: 1.5,
  py: 0.9,
  color: "rgba(241,240,255,0.68)",
  transition: "all 140ms ease",
  "&:hover": {
    background: "rgba(255,255,255,0.04)",
    color: "rgba(241,240,255,0.92)",
  },
  "&.Mui-selected": {
    background: "rgba(245,158,11,0.10)",
    color: "rgba(241,240,255,0.95)",
    "&:hover": { background: "rgba(245,158,11,0.13)" },
  },
};

const labelProps = (isActive) => ({
  fontWeight: isActive ? 650 : 500,
  fontSize: "0.875rem",
  fontFamily: "Manrope, system-ui, sans-serif",
  letterSpacing: "-0.01em",
  color: "inherit",
});






function NavItem({ to, end = false, icon, label, indent = false }) {
  return (
    <NavLink to={to} end={end} style={{ textDecoration: "none", display: "block" }}>
      {({ isActive }) => (
        <ListItemButton selected={isActive} sx={{ ...navItemSx, pl: indent ? 3 : 1.5 }}>
          <Box component="span" sx={{ mr: 1.5, fontSize: "1rem", lineHeight: 1, flexShrink: 0 }}>
            {icon}
          </Box>
          <ListItemText
            primary={label}
            primaryTypographyProps={labelProps(isActive)}
          />
        </ListItemButton>
      )}
    </NavLink>
  );
}



function SectionLabel({ children }) {
  return (
    <Typography sx={{
      px: 1.5,
      mb: 1,
      fontSize: "0.68rem",
      fontWeight: 700,
      letterSpacing: "0.07em",
      textTransform: "uppercase",
      color: "rgba(241,240,255,0.32)",
    }}>
      {children}
    </Typography>
  );
}



export default function Sidebar() {
  const { user } = useAuth();
  const { pathname } = useLocation();

  const name = user?.full_name || "Student";
  const meta = user?.course || user?.email || "";

  const inRecsSection      = pathname.startsWith("/recommendations");
  const [recsOpen, setRecsOpen] = useState(false);
  const recsExpanded       = inRecsSection || recsOpen;

  return (
    <Box sx={{
      height: "100%",
      display: "flex",
      flexDirection: "column",
      background: "rgba(12,11,15,0.15)",
      backdropFilter: "blur(12px)",
      borderRight: "1px solid rgba(255,255,255,0.06)",
      px: 1.5,
      py: 2,
      overflowY: "auto",
    }}>

      <Box sx={{ px: 1, mb: 3, display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box sx={{
          width: 34,
          height: 34,
          borderRadius: "10px",
          display: "grid",
          placeItems: "center",
          background: "linear-gradient(135deg, rgba(245,158,11,0.88), rgba(251,113,133,0.65))",
          fontSize: "16px",
          flexShrink: 0,
          boxShadow: "0 6px 20px rgba(0,0,0,0.28)",
        }}>
          ✨
        </Box>
        <Box>
          <Typography sx={{
            fontWeight: 750,
            fontSize: "0.875rem",
            letterSpacing: "-0.01em",
            color: "#f1f0ff",
            lineHeight: 1.3,
          }}>
            AI Career Coach
          </Typography>
          <Typography sx={{
            fontSize: "0.70rem",
            color: "rgba(241,240,255,0.40)",
          }}>
            Student dashboard
          </Typography>
        </Box>
      </Box>

      <SectionLabel>App</SectionLabel>
      <List disablePadding>
        <NavItem to="/" end icon="🏠" label="Home" />
        <NavItem to="/skills" icon="📚" label="Skills" />
        <NavItem to="/my-skills" icon="✅" label="My Skills" />
      </List>

      <SectionLabel sx={{ mt: 2 }}>Insights</SectionLabel>
      <List disablePadding>
        <ListItemButton
          selected={inRecsSection}
          onClick={() => { if (!inRecsSection) setRecsOpen((v) => !v); }}
          sx={{ ...navItemSx }}
        >
          <Box component="span" sx={{ mr: 1.5, fontSize: "1rem", flexShrink: 0 }}>✨</Box>
          <ListItemText
            primary="Recommendations"
            primaryTypographyProps={labelProps(inRecsSection)}
            sx={{ flex: 1 }}
          />
          <ExpandMore sx={{
            fontSize: 17,
            opacity: 0.55,
            transform: recsExpanded ? "rotate(0deg)" : "rotate(-90deg)",
            transition: "transform 200ms ease",
            flexShrink: 0,
          }} />
        </ListItemButton>

        <Collapse in={recsExpanded} timeout={180} unmountOnExit>
          <List disablePadding>
            <NavItem to="/recommendations" end icon="⚡" label="Generate" indent />
            <NavItem to="/recommendations/history" icon="🕘" label="History" indent />
          </List>
        </Collapse>

        <NavItem to="/planner"    icon="🎯" label="Planner" />
        <NavItem to="/interviews" icon="🎤" label="Interviews" />
      </List>

      <Box sx={{ mt: "auto", pt: 2 }}>
        <Divider sx={{ borderColor: "rgba(255,255,255,0.06)", mb: 2 }} />
        <Box sx={{ px: 1, display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{
            width: 30,
            height: 30,
            borderRadius: "50%",
            flexShrink: 0,
            background: "linear-gradient(135deg, rgba(245,158,11,0.70), rgba(251,113,133,0.50))",
          }} />
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{
              fontWeight: 650,
              fontSize: "0.82rem",
              color: "rgba(241,240,255,0.88)",
              lineHeight: 1.3,
            }}>
              {name}
            </Typography>
            {meta && (
              <Typography sx={{
                fontSize: "0.72rem",
                color: "rgba(241,240,255,0.40)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}>
                {meta}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

    </Box>
  );
}
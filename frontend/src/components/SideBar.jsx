import AppIcon from "./AppIcon";
import { useState, useCallback, createContext, useContext } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { api } from "../api/client";
import {
  Box, List, ListItemButton, ListItemText,
  Collapse, Typography, Divider, Popover, CircularProgress, Drawer,
} from "@mui/material";
import {
  Home, MenuBook, CheckCircleOutline, AutoAwesome,
  BoltOutlined, HistoryOutlined, CalendarMonth,
  MicNoneOutlined, ExpandMore, Person, BarChart,
} from "@mui/icons-material";

const NavContext = createContext({ onNavigate: () => { } });

const navItemSx = {
  borderRadius: "7px",
  mb: 0.5,
  px: 1.5,
  py: 0.85,
  position: "relative",
  color: "rgba(241,240,255,0.55)",
  transition: "all 120ms ease",
  "&:hover": {
    background: "rgba(255,255,255,0.04)",
    color: "rgba(241,240,255,0.85)",
  },
  "&.Mui-selected": {
    background: "rgba(245,158,11,0.06)",
    color: "rgba(241,240,255,0.95)",
    "&::before": {
      content: '""',
      position: "absolute",
      left: 0,
      top: "20%",
      height: "60%",
      width: "2px",
      borderRadius: "0 2px 2px 0",
      background: "#f59e0b",
    },
    "&:hover": { background: "rgba(139,92,246,0.08)" },
  },
};

const labelProps = (isActive) => ({
  fontWeight: isActive ? 650 : 500,
  fontSize: "0.855rem",
  fontFamily: "Manrope, system-ui, sans-serif",
  letterSpacing: "-0.01em",
  color: "inherit",
});

/**
 * Sidebar navigation item that can notify the mobile drawer when a route is selected.
 */
function NavItem({ to, end = false, icon, label, indent = false }) {
  const { onNavigate } = useContext(NavContext);
  return (
    <NavLink to={to} end={end} style={{ textDecoration: "none", display: "block" }} onClick={onNavigate}>
      {({ isActive }) => (
        <ListItemButton selected={isActive} sx={{ ...navItemSx, pl: indent ? 3 : 1.5 }}>
          <Box sx={{
            mr: 1.5, flexShrink: 0, display: "flex", alignItems: "center",
            color: isActive ? "#f59e0b" : "rgba(241,240,255,0.35)",
            transition: "color 120ms ease",
          }}>
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

/**
 * Uppercase label used to separate logical groups within the sidebar.
 */
function SectionLabel({ children }) {
  return (
    <Typography sx={{
      px: 1.5, mb: 0.75,
      fontSize: "0.65rem",
      fontWeight: 700,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: "rgba(241,240,255,0.28)",
    }}>
      {children}
    </Typography>
  );
}

/**
 * Shared sidebar body used in both the desktop rail and the mobile drawer.
 */
function SidebarContent({ onNavigate }) {
  const { user } = useAuth();
  const { pathname } = useLocation();

  const name = user?.full_name || "Student";
  const meta = user?.course || user?.email || "";

  const inRecsSection = pathname.startsWith("/recommendations");
  const [recsOpen, setRecsOpen] = useState(false);
  // Keep the recommendations sub-menu open while the user moves between its child routes.
  const recsExpanded = inRecsSection || recsOpen;

  const [anchorEl, setAnchorEl] = useState(null);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Fetch sidebar stats on demand to avoid extra dashboard requests on every page load.
  const openStats = useCallback(async (e) => {
    setAnchorEl(e.currentTarget);
    setStatsLoading(true);
    try {
      const [profile, userSkills, runs] = await Promise.all([
        api("/api/profile"),
        api("/api/user-skills"),
        api("/api/recommendations/runs"),
      ]);
      const skills = Array.isArray(userSkills) ? userSkills : [];
      const withEvidence = skills.filter((s) => s.evidence).length;
      const lastRun = Array.isArray(runs) && runs.length > 0
        ? new Date(runs[0].created_at).toLocaleDateString()
        : null;
      let completion = 0;
      if (profile) {
        const checks = [
          Boolean(profile.full_name),
          Boolean(profile.year_of_study),
          Boolean(profile.course),
          Boolean(profile.interests),
          Boolean(profile.academic_focus),
          Array.isArray(profile.preferred_technologies) && profile.preferred_technologies.length > 0,
          Array.isArray(profile.preferred_roles) && profile.preferred_roles.length > 0,
          skills.length > 0,
        ];
        completion = Math.round((checks.filter(Boolean).length / checks.length) * 100);
      }
      setStats({
        completion,
        skillsAdded: skills.length,
        evidencePct: skills.length > 0 ? Math.round((withEvidence / skills.length) * 100) : 0,
        lastRun,
      });
    } catch {
      // Stats are supplemental to navigation, so failures should not block the
      // drawer or leave it stuck in a loading state.
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  function closeStats() { setAnchorEl(null); }

  return (
    <NavContext.Provider value={{ onNavigate }}>
      <Box sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        px: 1.5,
        py: 2,
        overflowY: "auto",
      }}>


        <Box sx={{ px: 1, mb: 3.5, display: "flex", alignItems: "center", gap: 1.25 }}>
          <AppIcon size={28} />
          <Box>
            <Typography sx={{
              fontWeight: 720, fontSize: "0.855rem",
              letterSpacing: "-0.01em", color: "#f1f0ff", lineHeight: 1.3,
            }}>
              AI Career Coach
            </Typography>
            <Typography sx={{ fontSize: "0.68rem", color: "rgba(241,240,255,0.35)" }}>
              Student dashboard
            </Typography>
          </Box>
        </Box>


        <SectionLabel>App</SectionLabel>
        <List disablePadding sx={{ mb: 2 }}>
          <NavItem to="/" end icon={<Home sx={{ fontSize: 17 }} />} label="Home" />
          <NavItem to="/profile" icon={<Person sx={{ fontSize: 17 }} />} label="Profile" />
          <NavItem to="/skills" icon={<MenuBook sx={{ fontSize: 17 }} />} label="Skills" />
          <NavItem to="/my-skills" icon={<CheckCircleOutline sx={{ fontSize: 17 }} />} label="My Skills" />
        </List>


        <SectionLabel>Insights</SectionLabel>
        <List disablePadding>
          <ListItemButton
            selected={inRecsSection}
            onClick={() => { if (!inRecsSection) setRecsOpen((v) => !v); }}
            sx={{ ...navItemSx }}
          >
            <Box sx={{
              mr: 1.5, flexShrink: 0, display: "flex", alignItems: "center",
              color: inRecsSection ? "#f59e0b" : "rgba(241,240,255,0.35)",
              transition: "color 120ms ease",
            }}>
              <AutoAwesome sx={{ fontSize: 17 }} />
            </Box>
            <ListItemText
              primary="Recommendations"
              primaryTypographyProps={labelProps(inRecsSection)}
              sx={{ flex: 1 }}
            />
            <ExpandMore sx={{
              fontSize: 16,
              color: "rgba(241,240,255,0.30)",
              transform: recsExpanded ? "rotate(0deg)" : "rotate(-90deg)",
              transition: "transform 200ms ease",
              flexShrink: 0,
            }} />
          </ListItemButton>

          <Collapse in={recsExpanded} timeout={180} unmountOnExit>
            <List disablePadding>
              <NavItem to="/recommendations" end icon={<BoltOutlined sx={{ fontSize: 16 }} />} label="Generate" indent />
              <NavItem to="/recommendations/history" icon={<HistoryOutlined sx={{ fontSize: 16 }} />} label="History" indent />
            </List>
          </Collapse>

          <NavItem to="/planner" icon={<CalendarMonth sx={{ fontSize: 17 }} />} label="Planner" />
          <NavItem to="/interviews" icon={<MicNoneOutlined sx={{ fontSize: 17 }} />} label="Interviews" />
        </List>


        <Box sx={{ mt: "auto", pt: 2 }}>
          <Divider sx={{ borderColor: "rgba(255,255,255,0.06)", mb: 2 }} />
          <Box
            onClick={openStats}
            role="button"
            aria-label="View stats"
            sx={{
              px: 1, py: 0.75,
              display: "flex", alignItems: "center", gap: 1.25,
              borderRadius: "7px",
              cursor: "pointer",
              transition: "background 120ms ease",
              "&:hover": { background: "rgba(255,255,255,0.04)" },
            }}
          >
            <Box sx={{
              width: 26, height: 26, borderRadius: "7px", flexShrink: 0,
              background: "linear-gradient(135deg, rgba(245,158,11,0.80), rgba(251,146,60,0.65))",
            }} />
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography sx={{ fontWeight: 650, fontSize: "0.8125rem", color: "rgba(241,240,255,0.85)", lineHeight: 1.3 }}>
                {name}
              </Typography>
              {meta && (
                <Typography sx={{
                  fontSize: "0.7rem", color: "rgba(241,240,255,0.38)",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {meta}
                </Typography>
              )}
            </Box>
            <BarChart sx={{ fontSize: 15, color: "rgba(241,240,255,0.22)", flexShrink: 0 }} />
          </Box>

          <Popover
            open={Boolean(anchorEl)}
            anchorEl={anchorEl}
            onClose={closeStats}
            anchorOrigin={{ vertical: "top", horizontal: "left" }}
            transformOrigin={{ vertical: "bottom", horizontal: "left" }}
            slotProps={{
              paper: {
                sx: {
                  ml: 1.5,
                  mb: 1,
                  minWidth: 220,
                  bgcolor: "rgba(10,9,16,0.99)",
                  border: "1px solid rgba(255,255,255,0.09)",
                  borderRadius: "10px",
                  backdropFilter: "blur(24px)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.55)",
                  p: 2,
                },
              },
            }}
          >
            <Typography sx={{
              fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.07em",
              textTransform: "uppercase", color: "rgba(241,240,255,0.30)", mb: 1.5,
            }}>
              Your progress
            </Typography>

            {statsLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 1 }}>
                <CircularProgress size={18} />
              </Box>
            ) : stats ? (
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.25 }}>
                {[
                  { value: `${stats.completion}%`, label: "Profile complete" },
                  { value: stats.skillsAdded, label: "Skills added" },
                  { value: `${stats.evidencePct}%`, label: "Evidence" },
                  { value: stats.lastRun || "Never", label: "Last run" },
                ].map(({ value, label }) => (
                  <Box key={label} sx={{
                    bgcolor: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "7px",
                    px: 1.25, py: 1,
                  }}>
                    <Typography sx={{
                      fontWeight: 750, fontSize: "1rem", lineHeight: 1,
                      letterSpacing: "-0.03em", color: "#f1f0ff", mb: 0.25,
                    }}>
                      {value}
                    </Typography>
                    <Typography sx={{ fontSize: "0.68rem", color: "rgba(241,240,255,0.38)", fontWeight: 550 }}>
                      {label}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
                Could not load stats.
              </Typography>
            )}
          </Popover>
        </Box>
      </Box>
    </NavContext.Provider>
  );
}

/**
 * Responsive dashboard navigation that renders as a drawer on small screens.
 */
export default function Sidebar({ mobileOpen = false, onClose = () => { } }) {
  return (
    <>

      <Drawer
        open={mobileOpen}
        onClose={onClose}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            width: 256,
            bgcolor: "rgba(12,11,18,0.98)",
            borderRight: "1px solid rgba(255,255,255,0.06)",
            backgroundImage: "none",
          },
        }}
      >
        <SidebarContent onNavigate={onClose} />
      </Drawer>


      <SidebarContent onNavigate={() => { }} />
    </>
  );
}
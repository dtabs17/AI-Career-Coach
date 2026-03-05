import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { api } from "../api/client";
import {
  Box, Paper, Typography, Button, Chip,
  LinearProgress, CircularProgress, Divider,
} from "@mui/material";
import {
  AutoAwesome, TrendingUp, Chat, ArrowForward,
} from "@mui/icons-material";

function fmt(ts) {
  try { return new Date(ts).toLocaleString(); } catch { return ""; }
}



function StatCard({ label, value }) {
  return (
    <Box sx={{
      flex: 1,
      border: "1px solid rgba(255,255,255,0.07)",
      bgcolor: "rgba(18,17,26,0.45)",
      borderRadius: "14px",
      p: 1.5,
    }}>
      <Typography sx={{ fontSize: "0.72rem", color: "text.secondary", mb: 0.5 }}>{label}</Typography>
      <Typography sx={{ fontWeight: 850, fontSize: 26, lineHeight: 1, color: "#f1f0ff" }}>{value}</Typography>
    </Box>
  );
}



function StepButton({ label, to }) {
  return (
    <Box
      component={Link}
      to={to}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: 2,
        py: 1.5,
        borderRadius: "12px",
        border: "1px solid rgba(255,255,255,0.08)",
        bgcolor: "rgba(18,17,26,0.35)",
        color: "rgba(241,240,255,0.85)",
        textDecoration: "none",
        fontSize: "0.875rem",
        fontWeight: 500,
        fontFamily: "Manrope, system-ui, sans-serif",
        transition: "all 140ms ease",
        "&:hover": {
          border: "1px solid rgba(245,158,11,0.30)",
          bgcolor: "rgba(245,158,11,0.04)",
          color: "#f1f0ff",
        },
      }}
    >
      {label}
      <ArrowForward sx={{ fontSize: 15, opacity: 0.45, flexShrink: 0 }} />
    </Box>
  );
}



function BulletItem({ title, sub }) {
  return (
    <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
      <Box sx={{
        width: 7, height: 7, borderRadius: "50%", flexShrink: 0, mt: 0.6,
        background: "linear-gradient(135deg, #f59e0b, #fb7185)",
      }} />
      <Box>
        <Typography sx={{ fontWeight: 650, fontSize: "0.875rem", color: "#f1f0ff" }}>{title}</Typography>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>{sub}</Typography>
      </Box>
    </Box>
  );
}



export default function Home() {
  const { isAuthed, firstName } = useAuth();

  const [profileCompletion, setProfileCompletion] = useState(0);
  const [skillsAdded, setSkillsAdded] = useState(0);
  const [skillsWithEvidence, setSkillsWithEvidence] = useState(0);
  const [loadingChats, setLoadingChats] = useState(false);
  const [recentChats, setRecentChats] = useState([]);

  useEffect(() => {
    if (!isAuthed) return;
    let mounted = true;
    (async () => {
      try {
        const [profile, userSkills] = await Promise.all([
          api("/api/profile"),
          api("/api/user-skills"),
        ]);
        if (!mounted) return;
        const skills = Array.isArray(userSkills) ? userSkills : [];
        setSkillsAdded(skills.length);
        setSkillsWithEvidence(skills.filter((s) => s.evidence).length);
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
          setProfileCompletion(Math.round((checks.filter(Boolean).length / checks.length) * 100));
        } else {
          setProfileCompletion(skills.length > 0 ? 12 : 0);
        }
      } catch {
        //
      }
    })();
    return () => { mounted = false; };
  }, [isAuthed]);

  useEffect(() => {
    if (!isAuthed) return;
    let mounted = true;
    setLoadingChats(true);
    (async () => {
      try {
        const list = await api("/api/chat/sessions");
        const arr = Array.isArray(list) ? list : [];
        const top = arr.slice(0, 3).map((s) => ({
          id: s.id,
          title: s.title || "New Chat",
          when: fmt(s.last_message_at || s.created_at),
        }));
        if (mounted) setRecentChats(top);
      } catch {
        if (mounted) setRecentChats([]);
      } finally {
        if (mounted) setLoadingChats(false);
      }
    })();
    return () => { mounted = false; };
  }, [isAuthed]);

  const nextSteps = useMemo(() => [
    { label: "Add evidence for 3 skills", to: "/my-skills" },
    { label: "Set preferred roles in your profile", to: "/profile" },
    { label: "Run recommendations", to: "/recommendations" },
  ], []);



  if (!isAuthed) {
    return (
      <Box className="page-animate" sx={{ maxWidth: 1100, mx: "auto", px: { xs: 2, md: 3 }, py: 4 }}>
        <Paper sx={{ p: { xs: 3, md: 4 }, mb: 3, "&:hover": { transform: "none" } }}>
          <Typography variant="h4" sx={{ mb: 1 }}>Welcome</Typography>
          <Typography sx={{ color: "text.secondary", maxWidth: 560, mb: 3.5 }}>
            Browse the skills library without an account. Create an account to save skills,
            build your profile, generate role recommendations, and use coach chat.
          </Typography>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 2 }}>
            {[
              { title: "Skills Library", sub: "Browse skills and see what you can add later.", to: "/skills", cta: "View skills" },
              { title: "Login", sub: "Access your dashboard, skills, recommendations, and chat.", to: "/login", cta: "Login" },
              { title: "Register", sub: "Create an account to unlock all features.", to: "/register", cta: "Create account" },
            ].map(({ title, sub, to, cta }) => (
              <Paper
                key={title}
                sx={{
                  p: 2.5,
                  display: "flex", flexDirection: "column",
                  bgcolor: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  "&:hover": { transform: "translateY(-2px)" },
                }}
              >
                <Typography sx={{ fontWeight: 700, mb: 0.75 }}>{title}</Typography>
                <Typography variant="body2" sx={{ color: "text.secondary", mb: 2, flexGrow: 1 }}>{sub}</Typography>
                <Button variant="contained" component={Link} to={to} fullWidth>{cta}</Button>
              </Paper>
            ))}
          </Box>
        </Paper>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "7fr 5fr" }, gap: 2.5 }}>
          <Paper sx={{ p: 3, "&:hover": { transform: "none" } }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5 }}>
              <Typography sx={{ fontWeight: 750 }}>What you can do now</Typography>
              <Chip label="Open" size="small" sx={{ bgcolor: "rgba(34,197,94,0.12)", color: "#86efac", border: "1px solid rgba(34,197,94,0.22)" }} />
            </Box>
            <Box sx={{ display: "grid", gap: 1.5, mb: 3 }}>
              <BulletItem title="Browse all skills" sub="Explore the library and categories." />
              <BulletItem title="See how the system works" sub="Create an account when you're ready to save progress." />
              <BulletItem title="Login or register anytime" sub="Your dashboard is available right after signup." />
            </Box>
            <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
              <Button variant="outlined" color="secondary" component={Link} to="/skills">Browse skills</Button>
              <Button variant="outlined" color="secondary" component={Link} to="/register">Create account</Button>
            </Box>
          </Paper>

          <Paper sx={{ p: 3, "&:hover": { transform: "none" } }}>
            <Typography sx={{ fontWeight: 750, mb: 0.75 }}>Next steps</Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 2.5 }}>
              Create an account to unlock recommendations and coach chat.
            </Typography>
            <Box sx={{ display: "grid", gap: 1.5 }}>
              <StepButton label="Create your account" to="/register" />
              <StepButton label="Login to your dashboard" to="/login" />
              <StepButton label="Browse skills library" to="/skills" />
            </Box>
          </Paper>
        </Box>
      </Box>
    );
  }



  return (
    <Box className="page-animate page-content">

      { }
      <Paper sx={{ p: { xs: 3, md: 4 }, mb: 3, "&:hover": { transform: "none" } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ mb: 0.5 }}>Welcome, {firstName || ""}</Typography>
            <Typography sx={{ color: "text.secondary" }}>
              Track your skills, get role recommendations, and improve your interview performance.
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 2, mt: 3 }}>
          {[
            { title: "Skills Library", sub: "Browse skills and build your profile.", to: "/skills", cta: "View skills" },
            { title: "My Skills", sub: "Add skill levels and evidence.", to: "/my-skills", cta: "Manage my skills" },
            { title: "Profile", sub: "Set interests, preferred roles, and technologies.", to: "/profile", cta: "Edit profile" },
          ].map(({ title, sub, to, cta }) => (
            <Paper
              key={title}
              sx={{
                p: 2.5, display: "flex", flexDirection: "column",
                bgcolor: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
                "&:hover": { transform: "translateY(-2px)" },
              }}
            >
              <Typography sx={{ fontWeight: 700, mb: 0.75 }}>{title}</Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", mb: 2, flexGrow: 1 }}>{sub}</Typography>
              <Button variant="contained" component={Link} to={to} fullWidth>{cta}</Button>
            </Paper>
          ))}
        </Box>
      </Paper>

      { }
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "7fr 5fr" }, gap: 2.5 }}>
        <Box sx={{ display: "grid", gap: 2.5 }}>

          { }
          <Paper sx={{ p: 3, "&:hover": { transform: "none" } }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <TrendingUp sx={{ fontSize: 18, color: "#f59e0b" }} />
                <Typography sx={{ fontWeight: 750 }}>Your progress</Typography>
              </Box>
              <Chip
                label="This week"
                size="small"
                sx={{ bgcolor: "rgba(255,255,255,0.06)", color: "text.secondary", border: "1px solid rgba(255,255,255,0.08)" }}
              />
            </Box>

            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>Profile completion</Typography>
              <Typography sx={{ fontWeight: 700, fontSize: "0.875rem" }}>{profileCompletion}%</Typography>
            </Box>
            <LinearProgress variant="determinate" value={profileCompletion} sx={{ mb: 3 }} />

            <Box sx={{ display: "flex", gap: 2 }}>
              <StatCard label="Skills added" value={skillsAdded} />
              <StatCard label="Skills with evidence" value={skillsWithEvidence} />
            </Box>
          </Paper>

          { }
          <Paper sx={{ p: 3, "&:hover": { transform: "none" } }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Chat sx={{ fontSize: 18, color: "#a78bfa" }} />
                <Typography sx={{ fontWeight: 750 }}>Recent chats</Typography>
              </Box>
              <Button
                variant="outlined"
                color="secondary"
                size="small"
                component={Link}
                to="/chat"
                sx={{ borderRadius: "10px" }}
              >
                Open chat
              </Button>
            </Box>

            {loadingChats ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1 }}>
                <CircularProgress size={14} />
                <Typography variant="body2" sx={{ color: "text.secondary" }}>Loading...</Typography>
              </Box>
            ) : recentChats.length === 0 ? (
              <Typography variant="body2" sx={{ color: "text.secondary" }}>No chats yet.</Typography>
            ) : (
              <Box sx={{ display: "grid", gap: 1.5 }}>
                {recentChats.map((c) => (
                  <Box
                    key={c.id}
                    sx={{
                      display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2,
                      border: "1px solid rgba(255,255,255,0.07)",
                      bgcolor: "rgba(18,17,26,0.35)",
                      borderRadius: "12px",
                      px: 2, py: 1.5,
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: "0.875rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {c.title}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>{c.when}</Typography>
                    </Box>
                    <Button
                      variant="outlined"
                      color="secondary"
                      size="small"
                      component={Link}
                      to="/chat"
                      sx={{ borderRadius: "10px", whiteSpace: "nowrap", flexShrink: 0 }}
                    >
                      View
                    </Button>
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </Box>

        <Box sx={{ display: "grid", gap: 2.5, alignContent: "start" }}>
          <Paper sx={{ p: 3, "&:hover": { transform: "none" } }}>
            <Typography sx={{ fontWeight: 750, mb: 0.5 }}>Next steps</Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 2.5 }}>
              Do these to improve recommendation quality.
            </Typography>
            <Box sx={{ display: "grid", gap: 1.5 }}>
              {nextSteps.map((s) => <StepButton key={s.label} label={s.label} to={s.to} />)}
            </Box>
          </Paper>

          <Paper sx={{ p: 3, "&:hover": { transform: "none" } }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <AutoAwesome sx={{ fontSize: 18, color: "#f59e0b" }} />
                <Typography sx={{ fontWeight: 750 }}>Recommendations</Typography>
              </Box>
              <Chip
                label="Insights"
                size="small"
                sx={{ bgcolor: "rgba(245,158,11,0.10)", color: "#fcd34d", border: "1px solid rgba(245,158,11,0.20)" }}
              />
            </Box>
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 2.5 }}>
              Run a fresh recommendation to see your top matched roles.
            </Typography>
            <Divider sx={{ mb: 2.5 }} />
            <Box sx={{ display: "flex", gap: 1.5 }}>
              <Button variant="contained" component={Link} to="/recommendations" sx={{ flexGrow: 1 }}>
                Generate
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                component={Link}
                to="/recommendations/history"
                sx={{ borderRadius: "12px" }}
              >
                History
              </Button>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}
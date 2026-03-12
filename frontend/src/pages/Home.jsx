import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { api } from "../api/client";
import {
  Box, Paper, Typography, Button, CircularProgress, Divider, Dialog,
} from "@mui/material";
import {
  AutoAwesome, Chat, ArrowForward, MenuBook,
  CheckCircleOutline, Person, TrendingUp,
  CalendarMonth, MicNoneOutlined,
  CheckCircle, RadioButtonUnchecked, OpenInNew, GetApp,
} from "@mui/icons-material";
import AppIcon from "../components/AppIcon";

function fmt(ts) {
  try { return new Date(ts).toLocaleString(); } catch { return ""; }
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

const ONBOARDING_STEPS = [
  {
    n: 1,
    title: "Add your skills",
    desc: "Go to My Skills and add everything you know. Rate each one from 1 (aware of it) to 5 (expert). This is the core input the whole app runs on.",
    to: "/my-skills",
  },
  {
    n: 2,
    title: "Complete your profile",
    desc: "Set your course, academic focus, and preferred roles. The recommendations engine uses this to apply a preference bonus on top of your skill scores.",
    to: "/profile",
  },
  {
    n: 3,
    title: "Run recommendations",
    desc: "The engine scores every IT role against your skills and preferences and ranks them. You will see a breakdown of matched, partial, and missing skills for each role.",
    to: "/recommendations",
  },
  {
    n: 4,
    title: "Use the planner and interviews",
    desc: "Pick a target role in the Planner to see your skill gaps and generate a weekly study plan. Use Interviews to practise with AI-generated questions and get scored feedback.",
    to: "/planner",
  },
  {
    n: 5,
    title: "The chat knows your profile",
    desc: "Every conversation starts with your skills, preferred roles, and academic focus already loaded. You do not need to explain yourself, just ask.",
    to: "/chat",
  },
];

function OnboardingModal({ open, onClose, onStart }) {
  return (
    <Dialog
      open={open}
      onClose={()=>{}}
      disableEscapeKeyDown
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: "#0e0d16",
          border: "1px solid rgba(255,255,255,0.09)",
          borderRadius: "14px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.70)",
          p: { xs: 2.5, sm: 3.5 },
        },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 2.5 }}>
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.75 }}>
            <AppIcon size={28} />
            <Typography sx={{ fontWeight: 750, fontSize: "1.0625rem", color: "#f1f0ff" }}>
              Welcome to AI Career Coach
            </Typography>
          </Box>
          <Typography sx={{ fontSize: "0.875rem", color: "rgba(241,240,255,0.50)", lineHeight: 1.55 }}>
            Here is how to get the most out of the app in four steps.
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {ONBOARDING_STEPS.map((step, i) => (
          <Box
            key={step.n}
            sx={{
              display: "flex",
              gap: 1.75,
              py: 1.75,
              borderBottom: i < ONBOARDING_STEPS.length - 1
                ? "1px solid rgba(255,255,255,0.05)"
                : "none",
            }}
          >
            <Box sx={{
              width: 24, height: 24, borderRadius: "50%", flexShrink: 0, mt: "1px",
              border: "1px solid rgba(245,158,11,0.35)",
              bgcolor: "rgba(245,158,11,0.08)",
              display: "grid", placeItems: "center",
            }}>
              <Typography sx={{ fontSize: "0.7rem", fontWeight: 750, color: "#f59e0b", lineHeight: 1 }}>
                {step.n}
              </Typography>
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 670, fontSize: "0.875rem", color: "#f1f0ff", mb: 0.35 }}>
                {step.title}
              </Typography>
              <Typography sx={{ fontSize: "0.80rem", color: "rgba(241,240,255,0.45)", lineHeight: 1.55 }}>
                {step.desc}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>

      <Box sx={{ display: "flex", gap: 1.25, mt: 3, flexWrap: "wrap" }}>
        <Button
          variant="contained"
          onClick={onStart}
          endIcon={<ArrowForward sx={{ fontSize: "15px !important" }} />}
          sx={{ flex: 1, minWidth: 160 }}
        >
          Start by adding my skills
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          onClick={onClose}
          sx={{ flex: 1, minWidth: 140 }}
        >
          I will explore on my own
        </Button>
      </Box>
    </Dialog>
  );
}

function Stat({ value, label, amber, green }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
      <Typography sx={{
        fontWeight: 820,
        fontSize: "1.75rem",
        lineHeight: 1,
        letterSpacing: "-0.04em",
        color: green ? "#22c55e" : amber ? "#f59e0b" : "#f1f0ff",
      }}>
        {value}
      </Typography>
      <Typography sx={{
        fontSize: "0.72rem",
        color: "text.secondary",
        fontWeight: 550,
        letterSpacing: "0.02em",
      }}>
        {label}
      </Typography>
    </Box>
  );
}

function NextStep({ label, hint, to, done }) {
  return (
    <Box
      component={done ? "div" : Link}
      to={done ? undefined : to}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.25,
        py: 1.1,
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        textDecoration: "none",
        cursor: done ? "default" : "pointer",
        "&:last-child": { borderBottom: "none" },
        "&:hover": done ? {} : { "& .step-label": { color: "#f1f0ff" } },
      }}
    >
      {done
        ? <CheckCircle sx={{ fontSize: 15, color: "#22c55e", flexShrink: 0, mt: hint ? "3px" : 0 }} />
        : <RadioButtonUnchecked sx={{ fontSize: 15, color: "rgba(241,240,255,0.20)", flexShrink: 0, mt: hint ? "3px" : 0 }} />
      }
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Typography className="step-label" sx={{
          fontSize: "0.8375rem",
          fontWeight: 550,
          color: done ? "rgba(241,240,255,0.30)" : "rgba(241,240,255,0.72)",
          textDecoration: done ? "line-through" : "none",
          transition: "color 120ms ease",
        }}>
          {label}
        </Typography>
        {hint && !done && (
          <Typography sx={{
            fontSize: "0.72rem",
            color: "rgba(241,240,255,0.28)",
            lineHeight: 1.4,
            mt: 0.15,
          }}>
            {hint}
          </Typography>
        )}
      </Box>
      {!done && <ArrowForward sx={{ fontSize: 12, color: "rgba(241,240,255,0.20)", flexShrink: 0 }} />}
    </Box>
  );
}

function ShortcutTile({ icon, label, to }) {
  return (
    <Box
      component={Link}
      to={to}
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1.25,
        p: 2,
        borderRadius: "8px",
        border: "1px solid rgba(255,255,255,0.07)",
        bgcolor: "rgba(255,255,255,0.015)",
        textDecoration: "none",
        transition: "all 120ms ease",
        "&:hover": {
          borderColor: "rgba(245,158,11,0.30)",
          bgcolor: "rgba(245,158,11,0.04)",
          "& .shortcut-icon": { color: "#f59e0b" },
          "& .shortcut-label": { color: "#f1f0ff" },
        },
      }}
    >
      <Box
        className="shortcut-icon"
        sx={{ color: "rgba(241,240,255,0.35)", transition: "color 120ms ease" }}
      >
        {icon}
      </Box>
      <Typography className="shortcut-label" sx={{
        fontSize: "0.8125rem",
        fontWeight: 620,
        color: "rgba(241,240,255,0.62)",
        lineHeight: 1.2,
        transition: "color 120ms ease",
      }}>
        {label}
      </Typography>
    </Box>
  );
}

function FeatureCard({ icon, title, sub, to, cta }) {
  return (
    <Box sx={{
      p: 2.5,
      borderRadius: "10px",
      border: "1px solid rgba(255,255,255,0.07)",
      bgcolor: "rgba(255,255,255,0.015)",
      display: "flex",
      flexDirection: "column",
      transition: "border-color 120ms ease",
      "&:hover": { borderColor: "rgba(245,158,11,0.25)" },
    }}>
      <Box sx={{ color: "rgba(241,240,255,0.38)", mb: 1.5 }}>{icon}</Box>
      <Typography sx={{ fontWeight: 680, fontSize: "0.9375rem", mb: 0.5 }}>{title}</Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 2.5, flexGrow: 1, lineHeight: 1.55 }}>
        {sub}
      </Typography>
      <Button
        variant="outlined"
        color="secondary"
        component={Link}
        to={to}
        size="small"
        fullWidth
      >
        {cta}
      </Button>
    </Box>
  );
}

export default function Home() {
  const { isAuthed, firstName, user } = useAuth();
  const navigate = useNavigate();

  const [profileCompletion, setProfileCompletion] = useState(0);
  const [skillsAdded, setSkillsAdded] = useState(0);
  const [skillsWithEvidence, setSkillsWithEvidence] = useState(0);
  const [loadingChats, setLoadingChats] = useState(false);
  const [recentChats, setRecentChats] = useState([]);
  const [hasPreferredRoles, setHasPreferredRoles] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [appInstalled, setAppInstalled] = useState(false);

  useEffect(() => {
    if (!isAuthed || !user?.id) return;
    const key = `onboarding_seen_${user.id}`;
    if (!localStorage.getItem(key)) {
      setShowOnboarding(true);
    }
  }, [isAuthed, user?.id]);

  useEffect(() => {
    if (window.__installPrompt) {
      setInstallPrompt(window.__installPrompt);
    }

    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      window.__installPrompt = e;
    };
    const installedHandler = () => {
      setAppInstalled(true);
      window.__installPrompt = null;
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installedHandler);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  async function handleInstall() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") setAppInstalled(true);
    setInstallPrompt(null);
  }

  function dismissOnboarding() {
    if (user?.id) localStorage.setItem(`onboarding_seen_${user.id}`, "1");
    setShowOnboarding(false);
  }

  function startOnboarding() {
    dismissOnboarding();
    navigate("/my-skills");
  }

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
          setHasPreferredRoles(Array.isArray(profile.preferred_roles) && profile.preferred_roles.length > 0);
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
        if (mounted) setRecentChats(arr.slice(0, 4).map((s) => ({
          id: s.id,
          title: s.title || "New Chat",
          when: fmt(s.last_message_at || s.created_at),
        })));
      } catch {
        if (mounted) setRecentChats([]);
      } finally {
        if (mounted) setLoadingChats(false);
      }
    })();
    return () => { mounted = false; };
  }, [isAuthed]);

  useEffect(() => {
    if (!isAuthed) return;
    let mounted = true;
    (async () => {
      try {
        const runs = await api("/api/recommendations/runs");
        if (mounted) setHasRun(Array.isArray(runs) && runs.length > 0);
      } catch {
        //
      }
    })();
    return () => { mounted = false; };
  }, [isAuthed]);

  const evidencePct = skillsAdded > 0 ? Math.round((skillsWithEvidence / skillsAdded) * 100) : 0;

  if (!isAuthed) {
    return (
      <Box className="page-animate" sx={{ maxWidth: 1100, mx: "auto", px: { xs: 2, md: 3 }, py: 5 }}>
        <Box sx={{ mb: 5 }}>
          <Typography variant="h4" sx={{ fontSize: { xs: "1.75rem", md: "2.25rem" }, mb: 1.25, letterSpacing: "-0.035em" }}>
            Your AI-powered career coach
          </Typography>
          <Typography sx={{ color: "text.secondary", maxWidth: 500, lineHeight: 1.7 }}>
            Track your skills, find the right IT roles, practise interviews, and build a learning plan.
            Browse the skills library now, or create a free account to unlock everything.
          </Typography>
          <Box sx={{ display: "flex", gap: 1.5, mt: 3, flexWrap: "wrap" }}>
            <Button variant="contained" component={Link} to="/register" sx={{ px: 3 }}>
              Create free account
            </Button>
            <Button variant="outlined" color="secondary" component={Link} to="/skills">
              Browse skills
            </Button>
          </Box>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 1.5, mb: 4 }}>
          <FeatureCard
            icon={<MenuBook sx={{ fontSize: 20 }} />}
            title="Skills Library"
            sub="Browse every skill in the system. See required levels for each IT role."
            to="/skills"
            cta="View skills"
          />
          <FeatureCard
            icon={<AutoAwesome sx={{ fontSize: 20 }} />}
            title="Role Recommendations"
            sub="Get AI-scored role matches based on your current skills and profile."
            to="/register"
            cta="Get started"
          />
          <FeatureCard
            icon={<MicNoneOutlined sx={{ fontSize: 20 }} />}
            title="Mock Interviews"
            sub="Practise with voice-enabled AI interviews tailored to your target role."
            to="/register"
            cta="Get started"
          />
        </Box>

        <Divider sx={{ mb: 4 }} />

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>
          <Box>
            <Typography sx={{ fontWeight: 680, mb: 0.5 }}>No account needed</Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>Start exploring right now.</Typography>
            <Box sx={{ display: "grid", gap: 1 }}>
              {[
                { title: "Browse the Skills Library", sub: "See every skill and what level each role requires." },
                { title: "Explore IT career paths", sub: "Learn what skills map to which roles." },
              ].map((item) => (
                <Box key={item.title} sx={{ display: "flex", gap: 1.25, alignItems: "flex-start" }}>
                  <Box sx={{ width: 5, height: 5, borderRadius: "50%", bgcolor: "#f59e0b", mt: 0.85, flexShrink: 0 }} />
                  <Box>
                    <Typography sx={{ fontWeight: 630, fontSize: "0.875rem" }}>{item.title}</Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>{item.sub}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 680, mb: 0.5 }}>With an account</Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>Everything above, plus:</Typography>
            <Box sx={{ display: "grid", gap: 1 }}>
              {[
                { title: "Add skills and evidence", sub: "Track your proficiency with proof." },
                { title: "AI role recommendations", sub: "Get scored matches against 20+ IT roles." },
                { title: "Weekly learning planner", sub: "Generate a gap-based plan for any target role." },
                { title: "Mock interview practice", sub: "Voice-enabled AI coach with instant feedback." },
              ].map((item) => (
                <Box key={item.title} sx={{ display: "flex", gap: 1.25, alignItems: "flex-start" }}>
                  <CheckCircle sx={{ fontSize: 13, color: "#22c55e", mt: 0.55, flexShrink: 0 }} />
                  <Box>
                    <Typography sx={{ fontWeight: 630, fontSize: "0.875rem" }}>{item.title}</Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>{item.sub}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box className="page-animate" sx={{ pb: 3 }}>
      <OnboardingModal
        open={showOnboarding}
        onClose={dismissOnboarding}
        onStart={startOnboarding}
      />

      <Box sx={{
        pt: 3, pb: 3.5, mb: 3,
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        flexWrap: "wrap",
        gap: 3,
      }}>
        <Box>
          <Typography sx={{
            fontSize: "0.75rem", color: "text.secondary", fontWeight: 600,
            letterSpacing: "0.05em", textTransform: "uppercase", mb: 0.75,
          }}>
            {greeting()}
          </Typography>
          <Typography variant="h4" sx={{ fontSize: { xs: "1.7rem", md: "2rem" }, mb: 1, letterSpacing: "-0.035em" }}>
            {firstName || "Student"}
          </Typography>
          <Typography sx={{ color: "text.secondary", fontSize: "0.875rem" }}>
            Track your skills, get role recommendations, and improve your interview performance.
          </Typography>
          {installPrompt && !appInstalled && (
            <Box sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                color="primary"
                size="small"
                startIcon={<GetApp sx={{ fontSize: "15px !important" }} />}
                onClick={handleInstall}
                sx={{ fontSize: "0.8rem" }}
              >
                Install app
              </Button>
            </Box>
          )}
        </Box>

        <Box sx={{
          display: "flex",
          gap: 0,
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "10px",
          overflow: "hidden",
          bgcolor: "rgba(255,255,255,0.015)",
          minWidth: 0,
          width: "100%",
        }}>
          {[
            { value: `${profileCompletion}%`, label: "Profile complete", amber: profileCompletion < 100, green: profileCompletion === 100 },
            { value: skillsAdded, label: "Skills added", amber: false },
            { value: `${evidencePct}%`, label: "Evidence coverage", amber: false },
          ].map((s, i) => (
            <Box key={s.label} sx={{
              flex: 1,
              minWidth: 0,
              px: { xs: 1.5, sm: 2.5 }, py: 1.75,
              borderLeft: i === 0 ? "none" : "1px solid rgba(255,255,255,0.07)",
            }}>
              <Stat value={s.value} label={s.label} amber={s.amber} green={s.green} />
            </Box>
          ))}
        </Box>
      </Box>

      <Box sx={{
        display: "grid",
        gap: 1.5,
        gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr 1fr" },
      }}>

        <Paper sx={{ p: 3, gridColumn: { xs: "1", lg: "1 / 3" } }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
            <Typography sx={{ fontWeight: 700, fontSize: "0.9375rem" }}>Next steps</Typography>
            <Typography variant="caption" sx={{
              color: "text.secondary",
              bgcolor: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "5px",
              px: 1, py: 0.25,
            }}>
              {[skillsAdded > 0, skillsWithEvidence >= 3, hasPreferredRoles, hasRun].filter(Boolean).length} / 4 done
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 2.5 }}>
            Complete these to get better recommendation results.
          </Typography>
          <NextStep label="Add at least one skill" hint="Recommendations need your skills to score against roles." to="/my-skills" done={skillsAdded > 0} />
          <NextStep label="Add evidence for at least 3 skills" hint="Evidence improves scoring accuracy and tracks your proof of work." to="/my-skills" done={skillsWithEvidence >= 3} />
          <NextStep label="Set preferred roles in your profile" hint="Preferred roles apply a bonus to your matching scores." to="/profile" done={hasPreferredRoles} />
          <NextStep label="Run your first recommendation" hint="See which IT roles best match your current skill set." to="/recommendations" done={hasRun} />
        </Paper>

        <Box sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 1.5,
          gridColumn: { xs: "1", lg: "3" },
          alignContent: "start",
        }}>
          <ShortcutTile icon={<AutoAwesome sx={{ fontSize: 19 }} />} label="Recommendations" to="/recommendations" />
          <ShortcutTile icon={<CalendarMonth sx={{ fontSize: 19 }} />} label="Planner" to="/planner" />
          <ShortcutTile icon={<MicNoneOutlined sx={{ fontSize: 19 }} />} label="Interviews" to="/interviews" />
          <ShortcutTile icon={<TrendingUp sx={{ fontSize: 19 }} />} label="Rec History" to="/recommendations/history" />
        </Box>

        <Box sx={{
          gridColumn: { xs: "1", lg: "1 / -1" },
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
          gap: 1.5,
        }}>
          <FeatureCard
            icon={<MenuBook sx={{ fontSize: 18 }} />}
            title="Skills Library"
            sub="Browse all available skills and see what to add to your profile."
            to="/skills"
            cta="View skills"
          />
          <FeatureCard
            icon={<CheckCircleOutline sx={{ fontSize: 18 }} />}
            title="My Skills"
            sub="Add skill levels, paste in evidence, and track your proficiency over time."
            to="/my-skills"
            cta="Manage my skills"
          />
          <FeatureCard
            icon={<Person sx={{ fontSize: 18 }} />}
            title="Profile"
            sub="Set interests, preferred roles, and technologies to sharpen your recommendations."
            to="/profile"
            cta="Edit profile"
          />
        </Box>

        <Paper sx={{ p: 3, gridColumn: { xs: "1", lg: "1 / -1" } }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Chat sx={{ fontSize: 16, color: "rgba(241,240,255,0.40)" }} />
              <Typography sx={{ fontWeight: 700, fontSize: "0.9375rem" }}>Recent chats</Typography>
            </Box>
            <Button
              variant="outlined"
              color="secondary"
              size="small"
              component={Link}
              to="/chat"
              endIcon={<OpenInNew sx={{ fontSize: "13px !important" }} />}
            >
              Open chat
            </Button>
          </Box>

          {loadingChats ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 0.5 }}>
              <CircularProgress size={13} />
              <Typography variant="body2" sx={{ color: "text.secondary" }}>Loading...</Typography>
            </Box>
          ) : recentChats.length === 0 ? (
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              No chats yet. Ask the coach anything about your career or skills.
            </Typography>
          ) : (
            <Box sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
              gap: 1.25,
            }}>
              {recentChats.map((c) => (
                <Box
                  key={c.id}
                  component={Link}
                  to="/chat"
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.5,
                    p: 1.75,
                    borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.06)",
                    bgcolor: "rgba(255,255,255,0.015)",
                    textDecoration: "none",
                    transition: "all 120ms ease",
                    "&:hover": {
                      borderColor: "rgba(245,158,11,0.25)",
                      bgcolor: "rgba(245,158,11,0.03)",
                    },
                  }}
                >
                  <Typography sx={{
                    fontWeight: 620, fontSize: "0.8125rem",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    color: "rgba(241,240,255,0.82)",
                  }}>
                    {c.title}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>{c.when}</Typography>
                </Box>
              ))}
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
}
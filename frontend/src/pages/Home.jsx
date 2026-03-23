import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { api } from "../api/client";
import {
  Box, Typography, Button, CircularProgress, Dialog,
} from "@mui/material";
import {
  AutoAwesome, Chat, ArrowForward, MenuBook,
  MicNoneOutlined, CheckCircle, OpenInNew, GetApp,
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

function daysSince(ts) {
  if (!ts) return null;
  const diff = Date.now() - new Date(ts).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
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
      onClose={() => { }}
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
            Here is how to get the most out of the app in five steps.
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column" }}>
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

function ScoreRing({ score, size = 130 }) {
  const r = 46;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const trackArc = (circumference * 270) / 360;
  const filled = Math.max(0, Math.min(1, score / 100)) * trackArc;
  return (
    <Box sx={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(135deg)", display: "block" }}>
        <circle cx={cx} cy={cy} r={r} fill="none"
          stroke="rgba(255,255,255,0.06)" strokeWidth={8}
          strokeDasharray={`${trackArc} ${circumference}`}
          strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={r} fill="none"
          stroke="#f59e0b" strokeWidth={8}
          strokeDasharray={`${filled} ${circumference}`}
          strokeLinecap="round" />
      </svg>
      <Box sx={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        pb: "12px",
      }}>
        <Typography sx={{
          fontSize: "1.45rem", fontWeight: 800,
          letterSpacing: "-0.04em", lineHeight: 1,
          color: "#f1f0ff",
        }}>
          {score % 1 === 0 ? score : score.toFixed(1)}
        </Typography>
        <Typography sx={{
          fontSize: "0.60rem", color: "rgba(241,240,255,0.25)",
          fontWeight: 600, letterSpacing: "0.06em", mt: 0.25,
        }}>
          OUT OF 100
        </Typography>
      </Box>
    </Box>
  );
}

function InsightCard({ value, label, sub, to, positive, amber }) {
  const borderColor = positive ? "rgba(34,197,94,0.18)" : amber ? "rgba(245,158,11,0.18)" : "rgba(255,255,255,0.07)";
  const bgColor = positive ? "rgba(34,197,94,0.04)" : amber ? "rgba(245,158,11,0.04)" : "rgba(255,255,255,0.015)";
  const valueColor = positive ? "#4ade80" : amber ? "#f59e0b" : "#f1f0ff";
  return (
    <Box
      component={Link}
      to={to}
      sx={{
        flex: 1,
        minWidth: { xs: "100%", sm: 0 },
        p: 2,
        borderRadius: "10px",
        border: `1px solid ${borderColor}`,
        bgcolor: bgColor,
        textDecoration: "none",
        display: "flex",
        flexDirection: "column",
        gap: 0.4,
        transition: "border-color 120ms ease, background 120ms ease",
        "&:hover": {
          borderColor: positive ? "rgba(34,197,94,0.35)" : "rgba(245,158,11,0.30)",
          bgcolor: positive ? "rgba(34,197,94,0.07)" : "rgba(245,158,11,0.07)",
        },
      }}
    >
      <Typography sx={{
        fontSize: "1.5rem",
        fontWeight: 800,
        letterSpacing: "-0.04em",
        lineHeight: 1,
        color: valueColor,
      }}>
        {value}
      </Typography>
      <Typography sx={{
        fontSize: "0.8rem",
        fontWeight: 650,
        color: "rgba(241,240,255,0.72)",
        lineHeight: 1.3,
        mt: 0.25,
      }}>
        {label}
      </Typography>
      {sub && (
        <Typography sx={{
          fontSize: "0.70rem",
          color: "rgba(241,240,255,0.30)",
          lineHeight: 1.35,
          mt: 0.3,
        }}>
          {sub}
        </Typography>
      )}
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
  const [lastRunDate, setLastRunDate] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [appInstalled, setAppInstalled] = useState(false);
  const [topRoles, setTopRoles] = useState([]);

  // Show the first-run onboarding only once per authenticated user on the device.
  useEffect(() => {
    if (!isAuthed || !user?.id) return;
    const key = `onboarding_seen_${user.id}`;
    if (!localStorage.getItem(key)) setShowOnboarding(true);
  }, [isAuthed, user?.id]);

  // Preserve the deferred PWA install prompt so the dashboard can surface it
  // from a normal button instead of relying on the browser's default timing.
  useEffect(() => {
    if (window.__installPrompt) setInstallPrompt(window.__installPrompt);
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e); window.__installPrompt = e; };
    const installedHandler = () => { setAppInstalled(true); window.__installPrompt = null; };
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

  // The dashboard summary depends on both profile fields and skills, so load
  // them together and derive completion metrics from the combined result.
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
          setHasPreferredRoles(
            Array.isArray(profile.preferred_roles) && profile.preferred_roles.length > 0
          );
        } else {
          setProfileCompletion(skills.length > 0 ? 12 : 0);
        }
      } catch {
        // Keep the rest of the dashboard interactive if the profile summary request fails.
      }
    })();
    return () => { mounted = false; };
  }, [isAuthed]);

  // Recent chat titles help the dashboard feel alive, but they are secondary
  // data and should never block the rest of the page from rendering.
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

  // Recommendation history drives the dashboard's "where to go next" guidance,
  // including the latest run date and a compact preview of top matched roles.
  useEffect(() => {
    if (!isAuthed) return;
    let mounted = true;
    (async () => {
      try {
        const runs = await api("/api/recommendations/runs");
        if (!mounted) return;
        const hasRuns = Array.isArray(runs) && runs.length > 0;
        setHasRun(hasRuns);
        if (hasRuns) {
          setLastRunDate(runs[0].created_at || null);
          const runData = await api(`/api/recommendations/runs/${runs[0].id}`);
          if (mounted && Array.isArray(runData?.items)) {
            setTopRoles(
              runData.items.slice(0, 5).map((item) => ({
                name: item.title,
                score: Number(item.final_score),
                matched: Array.isArray(item.explanation?.matched) ? item.explanation.matched.length : 0,
                partial: Array.isArray(item.explanation?.partial) ? item.explanation.partial.length : 0,
                missing: Array.isArray(item.explanation?.missing) ? item.explanation.missing.length : 0,
              }))
            );
          }
        }
      } catch {
        // Keep the rest of the dashboard interactive if the recommendation preview request fails.
      }
    })();
    return () => { mounted = false; };
  }, [isAuthed]);

  const skillsNoEvidence = skillsAdded - skillsWithEvidence;
  const topRoleMissing = topRoles.length > 0 ? topRoles[0].missing : null;
  const topRoleName = topRoles.length > 0 ? topRoles[0].name : null;


  const localClickTs = user?.id ? localStorage.getItem(`last_run_clicked_${user.id}`) : null;
  // Prefer the freshest timestamp between the stored button click and the real
  // run record so relative dashboard copy stays stable across navigation flows.
  const effectiveRunDate = (() => {
    if (!lastRunDate && !localClickTs) return null;
    if (!lastRunDate) return localClickTs;
    if (!localClickTs) return lastRunDate;
    return new Date(localClickTs) > new Date(lastRunDate) ? localClickTs : lastRunDate;
  })();
  const runDaysAgo = daysSince(effectiveRunDate);

  if (!isAuthed) {
    return (
      <Box>

        <Box sx={{
          position: "relative",
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          overflow: "hidden",
          px: { xs: 3, sm: 3, md: 10 },
          pt: "54px",
          pb: { xs: 5, md: 7 },
        }}>

          <Box sx={{
            position: "absolute",
            bottom: -120, right: -80,
            width: 600, height: 600,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(245,158,11,0.09) 0%, transparent 65%)",
            pointerEvents: "none",
          }} />
          <Box sx={{
            position: "absolute",
            top: "30%", left: "55%",
            width: 400, height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(245,158,11,0.04) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />


          <Box sx={{ position: "relative", zIndex: 1, maxWidth: 620 }}>
            <Typography sx={{
              fontSize: "0.65rem", fontWeight: 750,
              letterSpacing: "0.1em", textTransform: "uppercase",
              color: "rgba(245,158,11,0.7)", mb: 2,
            }}>
              AI Career Coach
            </Typography>
            <Typography sx={{
              fontSize: { xs: "2.2rem", sm: "3rem", md: "3.6rem" },
              fontWeight: 820,
              letterSpacing: "-0.04em",
              lineHeight: 1.08,
              color: "#f1f0ff",
              mb: 2.5,
            }}>
              Know exactly<br />where you stand<br />in the IT job market.
            </Typography>
            <Typography sx={{
              color: "rgba(241,240,255,0.45)",
              fontSize: { xs: "0.9rem", md: "1rem" },
              lineHeight: 1.75,
              maxWidth: 460,
              mb: 3.5,
            }}>
              Add your skills, get scored against 40+ real IT roles, and see a breakdown of what you match, what you partially cover, and what you are missing. Built for IT students.
            </Typography>
            <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
              <Button
                variant="contained"
                component={Link}
                to="/register"
                endIcon={<ArrowForward sx={{ fontSize: "14px !important" }} />}
                sx={{ px: 3, py: 1.1 }}
              >
                Create free account
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                component={Link}
                to="/skills"
                sx={{ px: 2.5, py: 1.1 }}
              >
                Browse skills
              </Button>
            </Box>
          </Box>
        </Box>

        {[
          {
            label: "Role Recommendations",
            title: "See exactly how you rank against every IT role.",
            sub: "The engine scores your skills against 40+ career paths and returns a full breakdown: matched skills, partial matches, and gaps for every single role.",
            icon: <AutoAwesome sx={{ fontSize: 22, color: "#f59e0b" }} />,
            cta: "Get started",
            to: "/register",
          },
          {
            label: "Gap-Based Planner",
            title: "Turn your skill gaps into a weekly study plan.",
            sub: "Pick any role as your target. The planner looks at what you are missing and builds a week-by-week learning schedule around those exact gaps.",
            icon: <MenuBook sx={{ fontSize: 22, color: "#f59e0b" }} />,
            cta: "Build a plan",
            to: "/register",
          },
          {
            label: "Mock Interviews",
            title: "Practise with AI-generated questions for your role.",
            sub: "Get interview questions tailored to your target role and current skill level. Each session ends with scored feedback so you can track your improvement.",
            icon: <MicNoneOutlined sx={{ fontSize: 22, color: "#f59e0b" }} />,
            cta: "Practise now",
            to: "/register",
          },
        ].map((feat, i) => (
          <Box
            key={feat.label}
            sx={{
              minHeight: "100dvh",
              display: "flex",
              alignItems: "center",
              px: { xs: 3, sm: 6, md: 10 },
              py: { xs: 7, md: 0 },
              bgcolor: i % 2 === 1 ? "rgba(255,255,255,0.018)" : "transparent",
            }}
          >
            <Box sx={{ maxWidth: 560 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 2 }}>
                {feat.icon}
                <Typography sx={{
                  fontSize: "0.65rem", fontWeight: 750,
                  letterSpacing: "0.09em", textTransform: "uppercase",
                  color: "rgba(245,158,11,0.65)",
                }}>
                  {feat.label}
                </Typography>
              </Box>
              <Typography sx={{
                fontSize: { xs: "1.5rem", md: "2rem" },
                fontWeight: 780,
                letterSpacing: "-0.03em",
                lineHeight: 1.2,
                color: "#f1f0ff",
                mb: 2,
              }}>
                {feat.title}
              </Typography>
              <Typography sx={{
                color: "rgba(241,240,255,0.42)",
                fontSize: "0.9rem",
                lineHeight: 1.8,
                mb: 3,
                maxWidth: 460,
              }}>
                {feat.sub}
              </Typography>
              <Button
                variant="outlined"
                color="secondary"
                component={Link}
                to={feat.to}
                endIcon={<ArrowForward sx={{ fontSize: "13px !important" }} />}
                sx={{ px: 2.5 }}
              >
                {feat.cta}
              </Button>
            </Box>
          </Box>
        ))}

        <Box sx={{
          px: { xs: 3, sm: 6, md: 10 },
          py: { xs: 7, md: 9 },
        }}>
          <Typography sx={{
            fontSize: { xs: "1.4rem", md: "1.8rem" },
            fontWeight: 780,
            letterSpacing: "-0.03em",
            color: "#f1f0ff",
            mb: 5,
          }}>
            Start for free. No card required.
          </Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: { xs: 5, md: 8 } }}>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", mb: 0.75, color: "rgba(241,240,255,0.55)" }}>Without an account</Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {[
                  { title: "Browse the Skills Library", sub: "See every skill in the system and what level each role requires." },
                  { title: "Explore IT career paths", sub: "Learn which skills map to which roles before you sign up." },
                ].map((item) => (
                  <Box key={item.title} sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                    <Box sx={{ width: 5, height: 5, borderRadius: "50%", bgcolor: "#f59e0b", mt: 0.7, flexShrink: 0 }} />
                    <Box>
                      <Typography sx={{ fontWeight: 630, fontSize: "0.875rem" }}>{item.title}</Typography>
                      <Typography variant="caption" sx={{ color: "rgba(241,240,255,0.38)" }}>{item.sub}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", mb: 0.75, color: "rgba(241,240,255,0.55)" }}>With a free account</Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {[
                  { title: "Track your skills and proficiency", sub: "Rate yourself 1–5 and attach evidence for each skill." },
                  { title: "Get scored role recommendations", sub: "See exactly how you score against every IT role, with a full breakdown." },
                  { title: "Build a personalised study plan", sub: "Target any role and get a week-by-week plan based on your gaps." },
                  { title: "Practise mock interviews", sub: "Role-specific AI questions with instant feedback and scoring." },
                ].map((item) => (
                  <Box key={item.title} sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                    <CheckCircle sx={{ fontSize: 13, color: "#22c55e", mt: 0.55, flexShrink: 0 }} />
                    <Box>
                      <Typography sx={{ fontWeight: 630, fontSize: "0.875rem" }}>{item.title}</Typography>
                      <Typography variant="caption" sx={{ color: "rgba(241,240,255,0.38)" }}>{item.sub}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
              <Button
                variant="contained"
                component={Link}
                to="/register"
                sx={{ mt: 3.5, px: 3 }}
              >
                Create free account
              </Button>
            </Box>
          </Box>
        </Box>

      </Box>
    );
  }

  const stepsLeft = [skillsAdded > 0, skillsWithEvidence >= 3, hasPreferredRoles, hasRun].filter(Boolean).length;

  return (
    <Box className="page-animate" sx={{ pb: 4 }}>
      <OnboardingModal
        open={showOnboarding}
        onClose={dismissOnboarding}
        onStart={startOnboarding}
      />


      <Box sx={{
        pt: 3, pb: 2.5, mb: 2.5,
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 1.5,
      }}>
        <Box>
          <Typography sx={{
            fontSize: "0.72rem", color: "rgba(241,240,255,0.30)",
            fontWeight: 600, letterSpacing: "0.06em",
            textTransform: "uppercase", mb: 0.5,
          }}>
            {greeting()}
          </Typography>
          <Typography sx={{
            fontSize: { xs: "1.8rem", md: "2.1rem" },
            fontWeight: 800,
            letterSpacing: "-0.04em",
            lineHeight: 1,
            color: "#f1f0ff",
          }}>
            {firstName || "Student"}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          {[
            { value: String(skillsAdded), label: "skills", to: "/my-skills", color: null },
            { value: String(skillsWithEvidence), label: "with evidence", to: "/my-skills", color: null },
            { value: `${profileCompletion}%`, label: "profile", to: "/profile", color: profileCompletion === 100 ? "#4ade80" : "#f59e0b" },
          ].map((s) => (
            <Box
              key={s.to + s.label}
              component={Link}
              to={s.to}
              sx={{
                display: "flex", alignItems: "baseline", gap: 0.5,
                px: 1.25, py: 0.6,
                borderRadius: "20px",
                border: `1px solid ${s.color ? `${s.color}28` : "rgba(255,255,255,0.07)"}`,
                bgcolor: s.color ? `${s.color}0a` : "rgba(255,255,255,0.02)",
                textDecoration: "none",
                transition: "border-color 120ms ease, background 120ms ease",
                "&:hover": { borderColor: "rgba(245,158,11,0.30)", bgcolor: "rgba(245,158,11,0.05)" },
              }}
            >
              <Typography sx={{ fontSize: "0.8rem", fontWeight: 750, lineHeight: 1, color: s.color ?? "#f1f0ff" }}>
                {s.value}
              </Typography>
              {s.label && (
                <Typography sx={{ fontSize: "0.68rem", color: "rgba(241,240,255,0.32)", fontWeight: 500 }}>
                  {s.label}
                </Typography>
              )}
            </Box>
          ))}
        </Box>
      </Box>


      <Box sx={{
        position: "relative",
        overflow: "hidden",
        borderRadius: "14px",
        border: "1px solid rgba(255,255,255,0.07)",
        bgcolor: "rgba(255,255,255,0.015)",
        mb: 2,
        minHeight: 220,
        display: "flex",
        alignItems: "center",
      }}>
        {/* Amber accent line at the top of the hero card, consistent with app design language */}
        <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, #f59e0b 0%, rgba(251,146,60,0.55) 55%, transparent 100%)", opacity: 0.50, zIndex: 2 }} />
        <Box sx={{
          position: "absolute",
          bottom: -60, left: -60,
          width: 340, height: 340,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(245,158,11,0.10) 0%, transparent 68%)",
          pointerEvents: "none",
        }} />

        {topRoles.length > 0 ? (
          <Box sx={{
            position: "relative", zIndex: 1,
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            px: { xs: 2.5, sm: 4 },
            py: { xs: 3, sm: 3.5 },
            gap: 3,
            flexWrap: { xs: "wrap", sm: "nowrap" },
            alignItems: "center",
          }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{
                fontSize: "0.65rem", fontWeight: 750,
                letterSpacing: "0.08em", textTransform: "uppercase",
                color: "rgba(245,158,11,0.65)", mb: 1,
              }}>
                #1 best match
              </Typography>
              <Typography sx={{
                fontSize: { xs: "1.55rem", sm: "1.9rem", md: "2.1rem" },
                fontWeight: 820,
                letterSpacing: "-0.035em",
                lineHeight: 1.1,
                color: "#f1f0ff",
                mb: 1.5,
              }}>
                {topRoles[0].name}
              </Typography>

              {(topRoles[0].matched + topRoles[0].partial + topRoles[0].missing > 0) && (
                <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", mb: 2.5 }}>
                  {topRoles[0].matched > 0 && (
                    <Box sx={{ px: 0.9, py: 0.25, borderRadius: "5px", bgcolor: "rgba(34,197,94,0.10)", border: "1px solid rgba(34,197,94,0.20)" }}>
                      <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: "#86efac" }}>{topRoles[0].matched} matched</Typography>
                    </Box>
                  )}
                  {topRoles[0].partial > 0 && (
                    <Box sx={{ px: 0.9, py: 0.25, borderRadius: "5px", bgcolor: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.18)" }}>
                      <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: "#fcd34d" }}>{topRoles[0].partial} partial</Typography>
                    </Box>
                  )}
                  {topRoles[0].missing > 0 && (
                    <Box sx={{ px: 0.9, py: 0.25, borderRadius: "5px", bgcolor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)" }}>
                      <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: "#fca5a5" }}>{topRoles[0].missing} missing</Typography>
                    </Box>
                  )}
                </Box>
              )}

              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  variant="contained"
                  size="small"
                  component={Link}
                  to="/recommendations/history"
                  endIcon={<ArrowForward sx={{ fontSize: "13px !important" }} />}
                  sx={{ px: 2 }}
                >
                  View full results
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  size="small"
                  component={Link}
                  to="/recommendations"
                >
                  Re-run
                </Button>
              </Box>
            </Box>

            <Box sx={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5, width: { xs: "100%", sm: "auto" } }}>
              <ScoreRing score={topRoles[0].score} size={140} />
              {topRoles.length > 1 && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.6, width: { xs: "100%", sm: 160 } }}>
                  {topRoles.slice(1, 4).map((role, i) => (
                    <Box key={role.name} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography sx={{ fontSize: "0.65rem", color: "rgba(241,240,255,0.22)", minWidth: 14, fontWeight: 600 }}>
                        #{i + 2}
                      </Typography>
                      <Typography sx={{
                        fontSize: "0.72rem", color: "rgba(241,240,255,0.50)",
                        flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {role.name}
                      </Typography>
                      <Typography sx={{ fontSize: "0.72rem", color: "rgba(241,240,255,0.32)", fontWeight: 650, flexShrink: 0 }}>
                        {role.score % 1 === 0 ? role.score : role.score.toFixed(1)}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        ) : (
          <Box sx={{
            position: "relative", zIndex: 1,
            width: "100%",
            px: { xs: 2.5, sm: 4 }, py: { xs: 3, sm: 3.5 },
          }}>
            <Typography sx={{
              fontSize: "0.65rem", fontWeight: 750,
              letterSpacing: "0.08em", textTransform: "uppercase",
              color: "rgba(245,158,11,0.55)", mb: 1,
            }}>
              {stepsLeft === 4 ? "Ready to go" : `${stepsLeft} / 4 setup steps done`}
            </Typography>
            <Typography sx={{
              fontSize: { xs: "1.55rem", sm: "1.9rem" },
              fontWeight: 820,
              letterSpacing: "-0.035em",
              lineHeight: 1.15,
              color: "#f1f0ff",
              mb: 1,
              maxWidth: 520,
            }}>
              Find out which IT roles fit you best
            </Typography>
            <Typography sx={{ color: "rgba(241,240,255,0.40)", fontSize: "0.875rem", mb: 2.5, maxWidth: 440 }}>
              Add your skills, complete your profile, and run a recommendation to see your personalised career matches.
            </Typography>
            <Button
              variant="contained"
              component={Link}
              to="/recommendations"
              endIcon={<ArrowForward sx={{ fontSize: "14px !important" }} />}
              sx={{ px: 2.5 }}
            >
              Run recommendations
            </Button>
          </Box>
        )}
      </Box>


      {hasRun ? (
        <Box sx={{
          display: "flex",
          gap: 1.25,
          mb: 2.5,
          flexWrap: { xs: "wrap", sm: "nowrap" },
        }}>
          {skillsAdded > 0 && (
            skillsNoEvidence === 0 ? (
              <InsightCard
                value="All good"
                label="Evidence coverage"
                sub={`All ${skillsAdded} skills have evidence attached`}
                to="/my-skills"
                positive
              />
            ) : (
              <InsightCard
                value={skillsNoEvidence}
                label={`skill${skillsNoEvidence === 1 ? "" : "s"} with no evidence`}
                sub="Evidence improves your recommendation accuracy"
                to="/my-skills"
              />
            )
          )}

          <InsightCard
            value={
              runDaysAgo === 0 ? "Today"
                : runDaysAgo === 1 ? "Yesterday"
                  : `${runDaysAgo}d ago`
            }
            label="Last recommendation run"
            sub={
              runDaysAgo > 14
                ? "Your skills may have changed since then"
                : runDaysAgo > 7
                  ? "Re-run if you have added skills recently"
                  : runDaysAgo === 0
                    ? "Nice, you ran it today"
                    : "Results are up to date"
            }
            to="/recommendations"
            positive={runDaysAgo === 0}
          />

          {topRoleName !== null && (
            topRoleMissing === 0 ? (
              <InsightCard
                value="No gaps"
                label={`for ${topRoleName}`}
                sub="You have all required skills for your top match"
                to="/planner"
                positive
              />
            ) : (
              <InsightCard
                value={topRoleMissing}
                label={`skill${topRoleMissing === 1 ? "" : "s"} missing for ${topRoleName}`}
                sub="Open the Planner to build a study plan around these gaps"
                to="/planner"
              />
            )
          )}
        </Box>
      ) : (

        <Box sx={{
          mb: 2.5,
          p: 2.5,
          borderRadius: "12px",
          border: "1px solid rgba(255,255,255,0.07)",
          bgcolor: "rgba(255,255,255,0.015)",
        }}>
          <Typography sx={{
            fontSize: "0.72rem", fontWeight: 700,
            letterSpacing: "0.06em", textTransform: "uppercase",
            color: "rgba(241,240,255,0.28)", mb: 1.75,
          }}>
            Get started
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {[
              { label: "Add at least one skill", done: skillsAdded > 0, to: "/my-skills" },
              { label: "Add evidence to 3 or more skills", done: skillsWithEvidence >= 3, to: "/my-skills" },
              { label: "Complete your profile", done: profileCompletion === 100, to: "/profile" },
              { label: "Run your first recommendation", done: false, to: "/recommendations" },
            ].map((step, i, arr) => (
              <Box
                key={step.label}
                component={step.done ? "div" : Link}
                to={step.done ? undefined : step.to}
                sx={{
                  display: "flex", alignItems: "center", gap: 1.5,
                  py: 1.1,
                  borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                  textDecoration: "none",
                  "&:hover": step.done ? {} : { "& .cl": { color: "#f1f0ff" } },
                }}
              >
                {step.done
                  ? <CheckCircle sx={{ fontSize: 14, color: "#22c55e", flexShrink: 0 }} />
                  : <Box sx={{ width: 14, height: 14, borderRadius: "50%", border: "1.5px solid rgba(241,240,255,0.18)", flexShrink: 0 }} />
                }
                <Typography className="cl" sx={{
                  fontSize: "0.8375rem",
                  fontWeight: 520,
                  color: step.done ? "rgba(241,240,255,0.28)" : "rgba(241,240,255,0.65)",
                  textDecoration: step.done ? "line-through" : "none",
                  transition: "color 120ms ease",
                }}>
                  {step.label}
                </Typography>
                {!step.done && (
                  <ArrowForward sx={{ fontSize: 11, color: "rgba(241,240,255,0.18)", ml: "auto", flexShrink: 0 }} />
                )}
              </Box>
            ))}
          </Box>
        </Box>
      )}


      <Box>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
          <Typography sx={{
            fontSize: "0.72rem", fontWeight: 700,
            letterSpacing: "0.06em", textTransform: "uppercase",
            color: "rgba(241,240,255,0.28)",
          }}>
            Recent chats
          </Typography>
          <Box
            component={Link}
            to="/chat"
            sx={{
              fontSize: "0.75rem", color: "rgba(245,158,11,0.65)",
              textDecoration: "none", fontWeight: 600,
              display: "flex", alignItems: "center", gap: 0.5,
              "&:hover": { color: "#f59e0b" },
              transition: "color 120ms ease",
            }}
          >
            Open chat
            <OpenInNew sx={{ fontSize: "11px" }} />
          </Box>
        </Box>

        {loadingChats ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <CircularProgress size={13} />
            <Typography variant="body2" sx={{ color: "text.secondary" }}>Loading...</Typography>
          </Box>
        ) : recentChats.length === 0 ? (
          <Box
            component={Link}
            to="/chat"
            sx={{
              display: "flex", alignItems: "center", gap: 1.5,
              px: 2.5, py: 2,
              borderRadius: "10px",
              border: "1px dashed rgba(255,255,255,0.08)",
              textDecoration: "none",
              transition: "border-color 120ms ease",
              "&:hover": { borderColor: "rgba(245,158,11,0.25)" },
            }}
          >
            <Chat sx={{ fontSize: 16, color: "rgba(241,240,255,0.20)" }} />
            <Typography sx={{ fontSize: "0.8375rem", color: "rgba(241,240,255,0.30)" }}>
              No chats yet. Ask the coach anything.
            </Typography>
          </Box>
        ) : (
          <Box sx={{
            display: "flex",
            gap: 1.25,
            overflowX: "auto",
            pb: 0.5,
            "&::-webkit-scrollbar": { display: "none" },
          }}>
            {recentChats.map((c) => (
              <Box
                key={c.id}
                component={Link}
                to="/chat"
                sx={{
                  flexShrink: 0,
                  width: 200,
                  display: "flex",
                  flexDirection: "column",
                  gap: 0.5,
                  p: 1.75,
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.06)",
                  bgcolor: "rgba(255,255,255,0.015)",
                  textDecoration: "none",
                  transition: "border-color 120ms ease, background 120ms ease",
                  "&:hover": {
                    borderColor: "rgba(245,158,11,0.22)",
                    bgcolor: "rgba(245,158,11,0.025)",
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
                <Typography variant="caption" sx={{ color: "rgba(241,240,255,0.28)" }}>
                  {c.when}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {installPrompt && !appInstalled && (
        <Box sx={{ mt: 3 }}>
          <Button
            variant="outlined"
            color="secondary"
            size="small"
            startIcon={<GetApp sx={{ fontSize: "14px !important" }} />}
            onClick={handleInstall}
          >
            Install app
          </Button>
        </Box>
      )}
    </Box>
  );
}
import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import {
  Box, Paper, Typography, Button, Alert, Chip, Tooltip,
  FormControl, InputLabel, Select, MenuItem, TextField,
  LinearProgress, CircularProgress, IconButton,
} from "@mui/material";
import {
  Search, AutoAwesome, Delete, OpenInNew,
  CheckCircle, RemoveCircle, Cancel, AddTask,
} from "@mui/icons-material";
import { useToast } from "../toast/ToastContext";
import ConfirmDialog from "../components/ConfirmDialog";


function groupByStatus(items) {
  const g = { missing: [], partial: [], matched: [] };
  for (const it of items || []) {
    if (g[it.status]) g[it.status].push(it);
  }
  return g;
}

const sectionLabel = {
  color: "text.secondary",
  fontWeight: 650,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  fontSize: "0.65rem",
};

const statusSx = {
  missing: { bgcolor: "rgba(239,68,68,0.10)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.20)" },
  partial: { bgcolor: "rgba(245,158,11,0.10)", color: "#fcd34d", border: "1px solid rgba(245,158,11,0.20)" },
  matched: { bgcolor: "rgba(34,197,94,0.10)", color: "#86efac", border: "1px solid rgba(34,197,94,0.20)" },
};


function SkillRow({ it, type }) {
  const meta =
    type === "missing" ? `Required L${it.required_level} · Importance ${it.importance}` :
      type === "partial" ? `You L${it.user_level} → Required L${it.required_level} · Importance ${it.importance}` :
        `You L${it.user_level} · Required L${it.required_level}`;
  return (
    <Box sx={{
      display: "flex", alignItems: "flex-start", justifyContent: "space-between",
      py: 1.25, borderBottom: "1px solid rgba(255,255,255,0.04)",
      "&:last-child": { borderBottom: "none" },
    }}>
      <Box>
        <Typography sx={{ fontWeight: 650, fontSize: "0.875rem" }}>{it.name}</Typography>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>{meta}</Typography>
      </Box>
      <Chip label={type} size="small" sx={{ ...statusSx[type], flexShrink: 0, ml: 1, fontSize: "0.68rem" }} />
    </Box>
  );
}


function SkillCard({ it, mySkillIds, completingId, onComplete }) {
  const learned = mySkillIds.has(it.skill_id);

  return (
    <Box sx={{
      p: { xs: "16px 16px 18px", sm: "18px 20px 20px" },
      borderRadius: "10px",
      border: learned
        ? "1px solid rgba(34,197,94,0.20)"
        : it.status === "missing"
          ? "1px solid rgba(239,68,68,0.14)"
          : "1px solid rgba(245,158,11,0.14)",
      bgcolor: learned
        ? "rgba(34,197,94,0.04)"
        : it.status === "missing"
          ? "rgba(239,68,68,0.03)"
          : "rgba(245,158,11,0.03)",
      display: "flex",
      flexDirection: "column",
      gap: 1.5,
      opacity: learned ? 0.65 : 1,
      transition: "opacity 200ms ease, border-color 200ms ease",
    }}>

      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, justifyContent: "space-between" }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{
            fontWeight: 680,
            fontSize: "0.9rem",
            lineHeight: 1.3,
            letterSpacing: "-0.01em",
            textDecoration: learned ? "line-through" : "none",
            color: learned ? "rgba(241,240,255,0.45)" : "#f1f0ff",
          }}>
            {it.name}
          </Typography>
          <Box sx={{ mt: 0.6 }}>
            <Chip
              label={it.status}
              size="small"
              sx={{ ...statusSx[it.status] || statusSx.missing, fontSize: "0.65rem", height: 20 }}
            />
          </Box>
        </Box>

        {learned ? (
          <Tooltip title="Already in your profile" arrow>
            <CheckCircle sx={{ fontSize: 20, color: "#22c55e", flexShrink: 0, mt: 0.25 }} />
          </Tooltip>
        ) : (
          <Tooltip title="Mark as learned. Adds to My Skills at level 3 (Intermediate)" arrow>
            <span>
              <IconButton
                size="small"
                disabled={completingId === it.skill_id}
                onClick={() => onComplete(it.skill_id)}
                sx={{
                  flexShrink: 0,
                  color: "rgba(241,240,255,0.25)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  bgcolor: "rgba(255,255,255,0.03)",
                  "&:hover": {
                    color: "#22c55e",
                    bgcolor: "rgba(34,197,94,0.10)",
                    borderColor: "rgba(34,197,94,0.25)",
                  },
                  transition: "all 150ms ease",
                }}
              >
                {completingId === it.skill_id
                  ? <CircularProgress size={14} sx={{ color: "#22c55e" }} />
                  : <AddTask sx={{ fontSize: 16 }} />
                }
              </IconButton>
            </span>
          </Tooltip>
        )}
      </Box>

      {it.suggested_tasks?.length > 0 && (
        <Box>
          <Typography sx={{ ...sectionLabel, mb: 0.75 }}>Tasks</Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            {it.suggested_tasks.map((t) => (
              <Box key={t} sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
                <Box sx={{
                  width: 4, height: 4, borderRadius: "50%",
                  bgcolor: it.status === "missing" ? "#fca5a5" : "#fcd34d",
                  mt: "6px", flexShrink: 0,
                  opacity: 0.70,
                }} />
                <Typography sx={{
                  fontSize: "0.8125rem",
                  color: "rgba(241,240,255,0.72)",
                  lineHeight: 1.55,
                }}>
                  {t}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {it.suggested_evidence && (
        <Box sx={{
          pt: 1.25,
          borderTop: "1px solid rgba(255,255,255,0.05)",
        }}>
          <Typography sx={{ ...sectionLabel, mb: 0.5 }}>Evidence</Typography>
          <Typography sx={{
            fontSize: "0.7875rem",
            color: "rgba(241,240,255,0.45)",
            lineHeight: 1.55,
            fontStyle: "italic",
          }}>
            {it.suggested_evidence}
          </Typography>
        </Box>
      )}
    </Box>
  );
}


export default function Planner() {
  const [roles, setRoles] = useState([]);
  const [roleId, setRoleId] = useState("");
  const [weeks, setWeeks] = useState(4);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [gapResult, setGapResult] = useState(null);
  const [planResult, setPlanResult] = useState(null);
  const [savedPlanId, setSavedPlanId] = useState(null);
  const [savedPlans, setSavedPlans] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [weekIndex, setWeekIndex] = useState(0);
  const showToast = useToast();
  const [confirmDialog, setConfirmDialog] = useState({ open: false, planId: null });
  const [mySkillIds, setMySkillIds] = useState(new Set());
  const [completingId, setCompletingId] = useState(null);
  // fromUrlRef tracks whether the current roleId was set from a URL query param.
  // It gates the auto-generate effect below so the plan only fires once on
  // deep-link entry, not every time the user manually changes the role selector.
  const fromUrlRef = React.useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await api("/api/roles");
        setRoles(Array.isArray(r) ? r : []);
      } catch (e) { setErr(e.message); }
    })();
  }, []);

  // Recommendation links can deep-link into the planner with a role_id query
  // parameter, so capture that once the role catalogue is available.
  useEffect(() => {
    if (!roles.length) return;
    const params = new URLSearchParams(window.location.search);
    const qRoleId = params.get("role_id");
    if (qRoleId) {
      fromUrlRef.current = true;
      setRoleId(Number(qRoleId));
    }
  }, [roles]);

  useEffect(() => {
    if (!roleId || !fromUrlRef.current) return;
    fromUrlRef.current = false;
    generatePlan();
  }, [roleId]);

  async function loadSaved() {
    setLoadingSaved(true);
    try {
      const list = await api("/api/planner/plans");
      setSavedPlans(Array.isArray(list) ? list : []);
    } catch { setSavedPlans([]); }
    finally { setLoadingSaved(false); }
  }

  useEffect(() => { loadSaved(); }, []);

  useEffect(() => {
    (async () => {
      try {
        const userSkills = await api("/api/user-skills");
        if (Array.isArray(userSkills)) {
          setMySkillIds(new Set(userSkills.map((s) => s.skill_id)));
        }
      } catch { /* silent */ }
    })();
  }, []);

  const grouped = useMemo(() => groupByStatus(gapResult?.items), [gapResult]);
  const totalWeeks = planResult?.weeks_data?.length || 0;
  const currentWeek = totalWeeks ? planResult.weeks_data[weekIndex] : null;

  const planProgress = useMemo(() => {
    if (!planResult?.weeks_data) return null;
    const allSkills = planResult.weeks_data.flatMap((w) => w.items || []);
    if (!allSkills.length) return null;
    const done = allSkills.filter((it) => mySkillIds.has(it.skill_id)).length;
    return { done, total: allSkills.length, pct: Math.round((done / allSkills.length) * 100) };
  }, [planResult, mySkillIds]);

  useEffect(() => {
    if (!totalWeeks) return;
    if (weekIndex > totalWeeks - 1) setWeekIndex(totalWeeks - 1);
    if (weekIndex < 0) setWeekIndex(0);
  }, [totalWeeks, weekIndex]);

  // Gap analysis is a read-only check against the selected role. Clear any
  // saved plan state first so the page does not mix stale plan data with fresh results.
  async function analyzeGap() {
    setErr(""); setLoading(true); setGapResult(null); setPlanResult(null); setSavedPlanId(null); setWeekIndex(0);
    try {
      const data = await api(`/api/planner/gap/${roleId}`);
      setGapResult(data);
      showToast("Gap analysis complete.");
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }

  // Plan generation persists the returned schedule immediately so the user can
  // reopen it later from the saved-plans list without regenerating it.
  async function generatePlan() {
    setErr(""); setLoading(true); setPlanResult(null); setSavedPlanId(null); setWeekIndex(0);
    try {
      const out = await api("/api/planner/plan", {
        method: "POST",
        body: JSON.stringify({ role_id: Number(roleId), weeks: Number(weeks), save: true }),
      });
      setPlanResult(out.plan);
      setSavedPlanId(out.saved_entry_id || null);
      setWeekIndex(0);
      await loadSaved();
      showToast("Learning plan generated and saved.");
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }

  // Opening a saved entry restores the exact stored plan and re-syncs the
  // selected role so follow-up actions stay aligned with the saved target role.
  async function openSaved(id) {
    setErr(""); setLoading(true); setPlanResult(null); setSavedPlanId(id); setWeekIndex(0);
    try {
      const row = await api(`/api/planner/plans/${id}`);
      setPlanResult(row.details);
      setRoleId(String(row.details?.role_id || ""));
      setGapResult(null); setWeekIndex(0);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }

  function confirmDelete(id) {
    setConfirmDialog({ open: true, planId: id });
  }

  async function deleteSaved(id) {
    setConfirmDialog({ open: false, planId: null });
    setErr(""); setDeletingId(id);
    try {
      await api(`/api/planner/plans/${id}`, { method: "DELETE" });
      if (Number(savedPlanId) === Number(id)) { setPlanResult(null); setSavedPlanId(null); setWeekIndex(0); }
      await loadSaved();
      showToast("Plan deleted.", "info");
    } catch (e) { setErr(e.message); }
    finally { setDeletingId(null); }
  }

  // Completing a skill from the planner writes it straight into the user's
  // profile so progress indicators update immediately across the app.
  async function completeSkill(skillId) {
    setCompletingId(skillId);
    try {
      await api("/api/user-skills", {
        method: "POST",
        // Skills added directly from the planner are recorded at level 3 (Intermediate)
        // as a sensible starting point. Users can adjust the level in My Skills.
        body: JSON.stringify({ skill_id: Number(skillId), proficiency_level: 3, evidence: null }),
      });
      setMySkillIds((prev) => new Set([...prev, skillId]));
      showToast("Skill added to your profile.");
    } catch (e) {
      showToast(e.message || "Failed to add skill.", "error");
    } finally {
      setCompletingId(null);
    }
  }


  return (
    <Box className="page-animate page-content">

      <Box sx={{ pb: 3, mb: 3, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <Typography variant="h4" sx={{ mb: 0.5 }}>Skill gap analyser</Typography>
        <Typography sx={{ color: "text.secondary" }}>
          Pick a target role, see missing skills, then generate a weekly learning plan.
        </Typography>
      </Box>

      {err && <Alert severity="error" sx={{ mb: 2.5 }}>{err}</Alert>}

      <Paper sx={{ p: 0, mb: 2.5, overflow: "hidden" }}>
        {/* Amber accent line consistent with app design language */}
        <Box sx={{ height: 2, background: "linear-gradient(90deg, #f59e0b 0%, rgba(251,146,60,0.55) 55%, transparent 100%)", opacity: 0.50 }} />
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "5fr 1fr auto" }, gap: 2, alignItems: "flex-end" }}>
            <FormControl fullWidth>
              <InputLabel>Target role</InputLabel>
              <Select value={roleId} label="Target role" onChange={(e) => setRoleId(e.target.value)}>
                <MenuItem value="">
                  <em style={{ color: "rgba(241,240,255,0.38)", fontStyle: "normal" }}>Select a role...</em>
                </MenuItem>
                {roles.map((r) => <MenuItem key={r.id} value={r.id}>{r.title}</MenuItem>)}
              </Select>
            </FormControl>

            <TextField
              label="Weeks"
              type="number"
              value={weeks}
              onChange={(e) => setWeeks(e.target.value)}
              inputProps={{ min: 1, max: 24 }}
              fullWidth
            />

            <Box sx={{ display: "flex", gap: 1.5 }}>
              <Button
                variant="outlined"
                color="secondary"
                onClick={analyzeGap}
                disabled={!roleId || loading}
                startIcon={loading ? <CircularProgress size={14} /> : <Search />}
                sx={{ whiteSpace: "nowrap" }}
              >
                Analyse gap
              </Button>
              <Button
                variant="contained"
                onClick={generatePlan}
                disabled={!roleId || loading}
                startIcon={loading
                  ? <CircularProgress size={14} sx={{ color: "rgba(0,0,0,0.50)" }} />
                  : <AutoAwesome />
                }
                sx={{ whiteSpace: "nowrap" }}
              >
                Generate plan
              </Button>
            </Box>
          </Box>
        </Box>
      </Paper>


      {gapResult && (
        <Paper sx={{ p: 3, mb: 2.5 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2, mb: 2.5 }}>
            <Typography sx={{ fontWeight: 700, fontSize: "1rem" }}>
              Gap summary for <Box component="span" sx={{ color: "#f59e0b" }}>{gapResult.role?.title}</Box>
            </Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Chip icon={<Cancel sx={{ fontSize: "13px !important", color: "#fca5a5 !important" }} />}
                label={`Missing: ${gapResult.summary.missing}`} size="small"
                sx={{ bgcolor: "rgba(239,68,68,0.10)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.20)" }} />
              <Chip icon={<RemoveCircle sx={{ fontSize: "13px !important", color: "#fcd34d !important" }} />}
                label={`Partial: ${gapResult.summary.partial}`} size="small"
                sx={{ bgcolor: "rgba(245,158,11,0.10)", color: "#fcd34d", border: "1px solid rgba(245,158,11,0.20)" }} />
              <Chip icon={<CheckCircle sx={{ fontSize: "13px !important", color: "#86efac !important" }} />}
                label={`Matched: ${gapResult.summary.matched}`} size="small"
                sx={{ bgcolor: "rgba(34,197,94,0.10)", color: "#86efac", border: "1px solid rgba(34,197,94,0.20)" }} />
            </Box>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.75 }}>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>Role readiness</Typography>
              <Typography sx={{ fontWeight: 700, fontSize: "0.875rem" }}>{gapResult.summary.progressPct}%</Typography>
            </Box>
            <LinearProgress variant="determinate" value={gapResult.summary.progressPct} />
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" }, gap: 2 }}>
            {[
              { key: "missing", label: "Missing", items: grouped.missing },
              { key: "partial", label: "Partial", items: grouped.partial },
              { key: "matched", label: "Matched", items: grouped.matched },
            ].map(({ key, label, items }) => (
              <Box key={key}>
                <Typography sx={{ ...sectionLabel, mb: 1.5 }}>{label}</Typography>
                {items.length > 0
                  ? items.slice(0, 10).map((it) => <SkillRow key={it.skill_id} it={it} type={key} />)
                  : <Typography variant="body2" sx={{ color: "text.secondary" }}>None</Typography>
                }
              </Box>
            ))}
          </Box>
        </Paper>
      )}


      {planResult && (
        <Paper sx={{ p: 0, mb: 2.5, overflow: "hidden" }}>

          <Box sx={{
            px: { xs: 2.5, sm: 3 },
            pt: { xs: 2.5, sm: 3 },
            pb: 2.5,
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 2,
          }}>
            <Box>
              <Typography sx={{
                fontWeight: 750,
                fontSize: "1rem",
                letterSpacing: "-0.01em",
                mb: 0.4,
              }}>
                {planResult.role_title}
                <Box component="span" sx={{ color: "text.secondary", fontWeight: 400, fontSize: "0.875rem", ml: 1 }}>
                  {planResult.weeks} weeks
                </Box>
              </Typography>

              {planProgress && (
                <Box sx={{ mt: 1.25, minWidth: { xs: "100%", sm: 280 } }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.6 }}>
                    <Typography sx={{ fontSize: "0.72rem", color: "text.secondary", fontWeight: 600 }}>
                      Plan progress
                    </Typography>
                    <Typography sx={{
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      color: planProgress.pct === 100 ? "#22c55e" : "#f59e0b",
                    }}>
                      {planProgress.done}/{planProgress.total} skills &nbsp;·&nbsp; {planProgress.pct}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={planProgress.pct}
                    sx={{
                      height: 5,
                      borderRadius: 3,
                      bgcolor: "rgba(255,255,255,0.06)",
                      "& .MuiLinearProgress-bar": {
                        borderRadius: 3,
                        bgcolor: planProgress.pct === 100 ? "#22c55e" : "#f59e0b",
                      },
                    }}
                  />
                </Box>
              )}
            </Box>

            {savedPlanId && (() => {
              const idx = savedPlans.findIndex((p) => Number(p.id) === Number(savedPlanId));
              const planNumber = idx >= 0 ? savedPlans.length - idx : null;
              const planLabel = planNumber ? `Plan ${planNumber} of ${savedPlans.length}` : "Saved";
              return (
                <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", flexShrink: 0 }}>
                  <Chip
                    label={planLabel}
                    size="small"
                    sx={{
                      bgcolor: "rgba(255,255,255,0.06)",
                      color: "rgba(241,240,255,0.60)",
                      border: "1px solid rgba(255,255,255,0.10)",
                    }}
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => confirmDelete(savedPlanId)}
                    disabled={deletingId === savedPlanId}
                    startIcon={deletingId === savedPlanId ? <CircularProgress size={13} /> : <Delete />}
                    sx={{
                      borderColor: "rgba(239,68,68,0.30)", color: "#fca5a5",
                      "&:hover": { borderColor: "rgba(239,68,68,0.55)", bgcolor: "rgba(239,68,68,0.08)" },
                    }}
                  >
                    {deletingId === savedPlanId ? "Deleting..." : "Delete plan"}
                  </Button>
                </Box>
              );
            })()}
          </Box>

          {totalWeeks > 0 && (
            <Box sx={{
              px: { xs: 2, sm: 2.5 },
              py: 1.5,
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              bgcolor: "rgba(11,10,16,0.60)",
              display: "flex",
              gap: 1,
              overflowX: "auto",
              "&::-webkit-scrollbar": { display: "none" },
              scrollbarWidth: "none",
            }}>
              {planResult.weeks_data.map((w, i) => {
                const isActive = weekIndex === i;
                const weekSkills = w.items || [];
                const learnedCount = weekSkills.filter((it) => mySkillIds.has(it.skill_id)).length;
                const allDone = weekSkills.length > 0 && learnedCount === weekSkills.length;

                return (
                  <Box
                    key={i}
                    onClick={() => setWeekIndex(i)}
                    sx={{
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      gap: 0.75,
                      px: 1.5,
                      py: 0.75,
                      borderRadius: "7px",
                      cursor: "pointer",
                      border: isActive
                        ? "1px solid rgba(245,158,11,0.45)"
                        : "1px solid rgba(255,255,255,0.07)",
                      bgcolor: isActive
                        ? "rgba(245,158,11,0.08)"
                        : "rgba(255,255,255,0.02)",
                      transition: "all 120ms ease",
                      "&:hover": isActive ? {} : {
                        borderColor: "rgba(255,255,255,0.14)",
                        bgcolor: "rgba(255,255,255,0.04)",
                      },
                    }}
                  >
                    <Typography sx={{
                      fontSize: "0.8rem",
                      fontWeight: isActive ? 700 : 520,
                      color: isActive ? "#f59e0b" : "rgba(241,240,255,0.55)",
                      whiteSpace: "nowrap",
                      lineHeight: 1,
                      transition: "color 120ms ease",
                    }}>
                      Week {i + 1}
                    </Typography>

                    {weekSkills.length > 0 && (
                      allDone ? (
                        <CheckCircle sx={{ fontSize: 12, color: "#22c55e", flexShrink: 0 }} />
                      ) : (
                        <Typography sx={{
                          fontSize: "0.62rem",
                          fontWeight: 700,
                          color: isActive ? "#f59e0b" : "rgba(241,240,255,0.35)",
                          lineHeight: 1,
                          letterSpacing: "0.02em",
                          flexShrink: 0,
                        }}>
                          {learnedCount}/{weekSkills.length}
                        </Typography>
                      )
                    )}
                  </Box>
                );
              })}
            </Box>
          )}

          {currentWeek && (
            <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>

              <Box sx={{ mb: 2.5 }}>
                <Typography sx={{
                  fontWeight: 720,
                  fontSize: "0.9375rem",
                  letterSpacing: "-0.01em",
                  color: "#f1f0ff",
                }}>
                  {currentWeek.title}
                </Typography>
                {currentWeek.items.length > 0 && (
                  <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.35, display: "block" }}>
                    {currentWeek.items.length} skill{currentWeek.items.length !== 1 ? "s" : ""} this week
                    {" · "}
                    {currentWeek.items.filter((it) => mySkillIds.has(it.skill_id)).length} learned
                  </Typography>
                )}
              </Box>

              {currentWeek.items.length === 0 ? (
                <Box sx={{
                  py: 3, px: 2,
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.06)",
                  bgcolor: "rgba(255,255,255,0.015)",
                  textAlign: "center",
                }}>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Light week. Focus on reviewing progress and adding evidence to existing skills.
                  </Typography>
                </Box>
              ) : (
                <Box sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: { xs: 1.5, sm: 2 },
                }}>
                  {currentWeek.items.map((it) => (
                    <SkillCard
                      key={it.skill_id}
                      it={it}
                      mySkillIds={mySkillIds}
                      completingId={completingId}
                      onComplete={completeSkill}
                    />
                  ))}
                </Box>
              )}
            </Box>
          )}
        </Paper>
      )}


      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Typography sx={{ fontWeight: 720, fontSize: "0.9375rem" }}>Saved plans</Typography>
          {loadingSaved && <CircularProgress size={14} />}
        </Box>

        {savedPlans.length === 0 ? (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            No saved plans yet. Generate one to store it.
          </Typography>
        ) : (
          <Box sx={{ overflow: "hidden", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.07)" }}>
            <Box sx={{
              display: { xs: "none", md: "grid" },
              gridTemplateColumns: "3fr 1fr 1fr 2fr 100px",
              px: 2.5, py: 1.25,
              bgcolor: "rgba(255,255,255,0.015)",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
            }}>
              {["Role", "Weeks", "Progress", "Created", ""].map((h) => (
                <Typography key={h} sx={{ ...sectionLabel }}>{h}</Typography>
              ))}
            </Box>

            {savedPlans.map((p, i) => (
              <Box
                key={p.id}
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr auto", md: "3fr 1fr 1fr 2fr 100px" },
                  px: 2.5, py: 1.75,
                  alignItems: "center",
                  gap: { xs: 1, md: 0 },
                  borderBottom: i < savedPlans.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                  bgcolor: Number(savedPlanId) === Number(p.id) ? "rgba(245,158,11,0.04)" : "transparent",
                  transition: "background 120ms ease",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.025)" },
                }}
              >
                <Box>
                  <Typography sx={{ fontWeight: 650, fontSize: "0.875rem" }}>
                    {p.role_title || "Unknown role"}
                  </Typography>
                  <Typography variant="body2" sx={{
                    color: "text.secondary", fontSize: "0.75rem",
                    display: { md: "none" }, mt: 0.25,
                  }}>
                    {p.created_at ? new Date(p.created_at).toLocaleDateString() : "N/A"}
                  </Typography>
                </Box>

                <Box sx={{ display: { xs: "none", md: "block" } }}>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>{p.weeks || "N/A"}</Typography>
                </Box>

                <Box sx={{ display: { xs: "none", md: "block" } }}>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    {Number.isFinite(Number(p.progress_pct)) ? `${p.progress_pct}%` : "N/A"}
                  </Typography>
                </Box>

                <Typography variant="body2" sx={{
                  color: "text.secondary", fontSize: "0.78rem",
                  display: { xs: "none", md: "block" },
                }}>
                  {p.created_at ? new Date(p.created_at).toLocaleString() : "N/A"}
                </Typography>

                <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                  <Tooltip title="Open plan" arrow>
                    <IconButton
                      size="small"
                      onClick={() => openSaved(p.id)}
                      sx={{ "&:hover": { bgcolor: "rgba(245,158,11,0.10) !important", color: "#fcd34d !important", borderColor: "rgba(245,158,11,0.25) !important" } }}
                    >
                      <OpenInNew fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete plan" arrow>
                    <span>
                      <IconButton
                        size="small"
                        onClick={() => confirmDelete(p.id)}
                        disabled={deletingId === p.id}
                        sx={{ "&:hover": { bgcolor: "rgba(239,68,68,0.12) !important", color: "#fca5a5 !important", borderColor: "rgba(239,68,68,0.25) !important" } }}
                      >
                        {deletingId === p.id
                          ? <CircularProgress size={13} sx={{ color: "rgba(241,240,241,0.45)" }} />
                          : <Delete fontSize="small" />
                        }
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Paper>

      <ConfirmDialog
        open={confirmDialog.open}
        title="Delete plan"
        message="This plan will be permanently deleted. This cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => deleteSaved(confirmDialog.planId)}
        onCancel={() => setConfirmDialog({ open: false, planId: null })}
      />
    </Box>
  );
}
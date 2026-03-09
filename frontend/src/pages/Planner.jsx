import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import {
  Box, Paper, Typography, Button, Alert, Chip, Tooltip,
  FormControl, InputLabel, Select, MenuItem, TextField,
  LinearProgress, CircularProgress, IconButton,
} from "@mui/material";
import {
  Search, AutoAwesome, ChevronLeft, ChevronRight,
  Delete, OpenInNew, CheckCircle, RemoveCircle, Cancel, AddTask,
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


function SkillRow({ it, type }) {
  const colours = {
    missing: { bgcolor: "rgba(239,68,68,0.10)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.20)" },
    partial: { bgcolor: "rgba(245,158,11,0.10)", color: "#fcd34d", border: "1px solid rgba(245,158,11,0.20)" },
    matched: { bgcolor: "rgba(34,197,94,0.10)", color: "#86efac", border: "1px solid rgba(34,197,94,0.20)" },
  };
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
      <Chip label={type} size="small" sx={{ ...colours[type], flexShrink: 0, ml: 1, fontSize: "0.68rem" }} />
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

  useEffect(() => {
    (async () => {
      try {
        const r = await api("/api/roles");
        setRoles(Array.isArray(r) ? r : []);
      } catch (e) { setErr(e.message); }
    })();
  }, []);

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
      } catch {
        //
      }
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

  async function analyzeGap() {
    setErr(""); setLoading(true); setGapResult(null); setPlanResult(null); setSavedPlanId(null); setWeekIndex(0);
    try {
      const data = await api(`/api/planner/gap/${roleId}`);
      setGapResult(data);
      showToast("Gap analysis complete.");
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }

  async function generatePlan() {
    setErr(""); setLoading(true); setPlanResult(null); setSavedPlanId(null); setWeekIndex(0);
    try {
      const out = await api("/api/planner/plan", {
        method: "POST",
        body: JSON.stringify({ role_id: Number(roleId), weeks: Number(weeks), save: true }),
      });
      setGapResult({ role: out.role, summary: out.gap.summary, items: out.gap.items });
      setPlanResult(out.plan);
      setSavedPlanId(out.saved_entry_id || null);
      setWeekIndex(0);
      await loadSaved();
      showToast("Learning plan generated and saved.");
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }

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

  async function completeSkill(skillId) {
    setCompletingId(skillId);
    try {
      await api("/api/user-skills", {
        method: "POST",
        body: JSON.stringify({
          skill_id: Number(skillId),
          proficiency_level: 3,
          evidence: null,
        }),
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

      <Box sx={{
        pb: 3, mb: 3,
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <Typography variant="h4" sx={{ mb: 0.5 }}>Skill gap analyzer</Typography>
        <Typography sx={{ color: "text.secondary" }}>
          Pick a target role, see missing skills, then generate a weekly learning plan.
        </Typography>
      </Box>

      {err && <Alert severity="error" sx={{ mb: 2.5 }}>{err}</Alert>}

      <Paper sx={{ p: 3, mb: 2.5 }}>
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
              Analyze gap
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
        <Paper sx={{ p: 3, mb: 2.5 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2, mb: 2.5 }}>
            <Typography sx={{ fontWeight: 700, fontSize: "1rem" }}>
              Plan for <Box component="span" sx={{ color: "#f59e0b" }}>{planResult.role_title}</Box>
              <Box component="span" sx={{ color: "text.secondary", fontWeight: 400 }}> ({planResult.weeks} weeks)</Box>
            </Typography>
            {savedPlanId && (() => {



              const idx = savedPlans.findIndex((p) => Number(p.id) === Number(savedPlanId));
              const planNumber = idx >= 0 ? savedPlans.length - idx : null;
              const planLabel = planNumber ? `Plan ${planNumber} of ${savedPlans.length}` : "Saved";
              return (
                <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
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

          {/* Plan progress */}
          {planProgress && (
            <Box sx={{ mb: 2.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.75 }}>
                <Typography sx={{ fontSize: "0.78rem", color: "text.secondary" }}>
                  Plan progress
                </Typography>
                <Typography sx={{ fontSize: "0.78rem", fontWeight: 650, color: planProgress.pct === 100 ? "#22c55e" : "#f59e0b" }}>
                  {planProgress.done} / {planProgress.total} skills learned &nbsp;({planProgress.pct}%)
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={planProgress.pct}
                sx={{
                  height: 6,
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

          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {totalWeeks ? `Week ${weekIndex + 1} of ${totalWeeks}` : "No weeks"}
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <IconButton size="small" onClick={() => setWeekIndex((i) => Math.max(0, i - 1))} disabled={!totalWeeks || weekIndex === 0}>
                <ChevronLeft fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => setWeekIndex((i) => Math.min(totalWeeks - 1, i + 1))} disabled={!totalWeeks || weekIndex >= totalWeeks - 1}>
                <ChevronRight fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          {currentWeek && (
            <Box sx={{ p: 2.5, borderRadius: "8px", bgcolor: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <Typography sx={{ fontWeight: 700, mb: 2 }}>{currentWeek.title}</Typography>

              {currentWeek.items.length === 0 ? (
                <Typography variant="body2" sx={{ color: "text.secondary" }}>Light week. Focus on review and evidence.</Typography>
              ) : (
                <Box>
                  <Box sx={{ display: { xs: "none", sm: "grid" }, gridTemplateColumns: "2fr 1fr 3fr 2fr 40px", px: 1, mb: 1 }}>
                    {["Skill", "Status", "Tasks", "Evidence", ""].map((h) => (
                      <Typography key={h} sx={{ ...sectionLabel }}>{h}</Typography>
                    ))}
                  </Box>
                  {currentWeek.items.map((it) => (
                    <Box
                      key={it.skill_id}
                      sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", sm: "2fr 1fr 3fr 2fr 40px" },
                        px: 1, py: 1.5, alignItems: "flex-start",
                        borderTop: "1px solid rgba(255,255,255,0.04)",
                        "&:first-of-type": { borderTop: "none" },
                      }}
                    >
                      <Typography sx={{ fontWeight: 650, fontSize: "0.875rem" }}>{it.name}</Typography>
                      <Box>
                        <Chip
                          label={it.status}
                          size="small"
                          sx={
                            it.status === "missing"
                              ? { bgcolor: "rgba(239,68,68,0.10)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.20)", fontSize: "0.68rem" }
                              : { bgcolor: "rgba(245,158,11,0.10)", color: "#fcd34d", border: "1px solid rgba(245,158,11,0.20)", fontSize: "0.68rem" }
                          }
                        />
                      </Box>
                      <Box component="ul" sx={{ m: 0, pl: 2, pr: 1 }}>
                        {it.suggested_tasks.map((t) => (
                          <Box component="li" key={t} sx={{ fontSize: "0.82rem", color: "text.primary", mb: 0.5 }}>{t}</Box>
                        ))}
                      </Box>
                      <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.80rem" }}>
                        {it.suggested_evidence}
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "flex-start", pt: 0.25 }}>
                        {mySkillIds.has(it.skill_id) ? (
                          <Tooltip title="Already in your profile" arrow>
                            <CheckCircle sx={{ fontSize: 18, color: "#22c55e" }} />
                          </Tooltip>
                        ) : (
                          <Tooltip title="Mark as learned: Adds to My Skills at Intermediate level" arrow>
                            <span>
                              <IconButton
                                size="small"
                                disabled={completingId === it.skill_id}
                                onClick={() => completeSkill(it.skill_id)}
                                sx={{
                                  p: 0.25,
                                  color: "rgba(241,240,255,0.25)",
                                  "&:hover": {
                                    color: "#22c55e",
                                    bgcolor: "rgba(34,197,94,0.08)",
                                  },
                                }}
                              >
                                {completingId === it.skill_id
                                  ? <CircularProgress size={16} />
                                  : <AddTask sx={{ fontSize: 17 }} />
                                }
                              </IconButton>
                            </span>
                          </Tooltip>
                        )}
                      </Box>
                    </Box>
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
              display: { xs: "none", md: "grid" }, gridTemplateColumns: "3fr 1fr 1fr 2fr 100px",
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
                  px: 2.5, py: 1.75, alignItems: "center", gap: { xs: 1, md: 0 },
                  borderBottom: i < savedPlans.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                  bgcolor: Number(savedPlanId) === Number(p.id) ? "rgba(245,158,11,0.04)" : "transparent",
                  transition: "background 120ms ease",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.025)" },
                }}
              >
                <Box>
                  <Typography sx={{ fontWeight: 650, fontSize: "0.875rem" }}>{p.role_title || "Unknown role"}</Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.75rem", display: { md: "none" }, mt: 0.25 }}>
                    {p.created_at ? new Date(p.created_at).toLocaleDateString() : "—"}
                  </Typography>
                </Box>
                <Box sx={{ display: { xs: "none", md: "block" } }}>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>{p.weeks || "—"}</Typography>
                </Box>
                <Box sx={{ display: { xs: "none", md: "block" } }}>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    {Number.isFinite(Number(p.progress_pct)) ? `${p.progress_pct}%` : "—"}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.78rem", display: { xs: "none", md: "block" } }}>
                  {p.created_at ? new Date(p.created_at).toLocaleString() : "—"}
                </Typography>
                <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                  <Tooltip title="Open plan" arrow>
                    <IconButton size="small" onClick={() => openSaved(p.id)}
                      sx={{ "&:hover": { bgcolor: "rgba(245,158,11,0.10) !important", color: "#fcd34d !important", borderColor: "rgba(245,158,11,0.25) !important" } }}>
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
                          ? <CircularProgress size={13} sx={{ color: "rgba(241,240,255,0.45)" }} />
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
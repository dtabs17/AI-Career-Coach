import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import {
  Box, Paper, Typography, Button, Alert, Chip, Tooltip,
  FormControl, InputLabel, Select, MenuItem, TextField,
  CircularProgress, IconButton, Collapse, ListSubheader,
} from "@mui/material";
import { Delete, Add, CheckCircle, RadioButtonUnchecked, Edit } from "@mui/icons-material";
import { Tooltip as RechartsTooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { useToast } from "../toast/ToastContext";
import ConfirmDialog from "../components/ConfirmDialog";

const levelLabels = { 1: "Beginner", 2: "Elementary", 3: "Intermediate", 4: "Advanced", 5: "Expert" };

function levelChipSx(level) {
  if (level >= 5) return {
    bgcolor: "rgba(34,197,94,0.10)", color: "#86efac",
    border: "1px solid rgba(34,197,94,0.20)",
  };
  if (level >= 4) return {
    bgcolor: "rgba(245,158,11,0.10)", color: "#fcd34d",
    border: "1px solid rgba(245,158,11,0.20)",
  };
  return {
    bgcolor: "rgba(255,255,255,0.06)", color: "rgba(241,240,255,0.60)",
    border: "1px solid rgba(255,255,255,0.10)",
  };
}

function LevelDot({ n, selected, onClick }) {
  return (
    <Tooltip title={`${n} · ${levelLabels[n]}`} arrow>
      <Box
        onClick={onClick}
        sx={{
          width: 34,
          height: 34,
          borderRadius: "50%",
          bgcolor: selected ? "rgba(245,158,11,0.12)" : "rgba(255,255,255,0.03)",
          border: selected
            ? "1px solid rgba(245,158,11,0.50)"
            : "1px solid rgba(255,255,255,0.09)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
          transition: "all 150ms ease",
          boxShadow: selected ? "0 0 0 3px rgba(245,158,11,0.10)" : "none",
          "&:hover": {
            bgcolor: selected ? "rgba(245,158,11,0.16)" : "rgba(255,255,255,0.06)",
            borderColor: selected ? "rgba(245,158,11,0.65)" : "rgba(255,255,255,0.16)",
          },
          flexShrink: 0,
        }}
      >
        <Typography sx={{
          fontSize: "0.78rem",
          fontWeight: selected ? 750 : 500,
          color: selected ? "#f59e0b" : "rgba(241,240,255,0.40)",
          lineHeight: 1,
          transition: "color 150ms ease",
        }}>
          {n}
        </Typography>
      </Box>
    </Tooltip>
  );
}

const sectionLabel = {
  color: "text.secondary",
  fontWeight: 650,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  fontSize: "0.68rem",
  mb: 1,
};

export default function MySkills() {
  const [skills, setSkills] = useState([]);
  const [mySkills, setMySkills] = useState([]);
  const [err, setErr] = useState("");
  const [adding, setAdding] = useState(false);

  const [skillId, setSkillId] = useState("");
  const [level, setLevel] = useState(3);
  const [evidence, setEvidence] = useState("");

  const navigate = useNavigate();
  const showToast = useToast();

  const [editingId, setEditingId] = useState(null);
  const [editLevel, setEditLevel] = useState(3);
  const [editEvidence, setEditEvidence] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, skillId: null });
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 5;

  const addedSkillIds = useMemo(
    () => new Set(mySkills.map((s) => s.skill_id)),
    [mySkills]
  );

  const skillOptions = useMemo(() => {
    const available = skills.filter((s) => !addedSkillIds.has(s.id));
    const grouped = {};
    available.forEach((s) => {
      const cat = s.category || "Other";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(s);
    });
    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([cat, items]) => ({
        cat,
        items: items.sort((a, b) => a.name.localeCompare(b.name)),
      }));
  }, [skills, addedSkillIds]);

  const withEvidence = mySkills.filter((s) => s.evidence).length;
  const evidencePct = mySkills.length > 0
    ? Math.round((withEvidence / mySkills.length) * 100)
    : 0;

  async function refresh() {
    try {
      const [allSkills, userSkills] = await Promise.all([
        api("/api/skills"),
        api("/api/user-skills"),
      ]);
      setSkills(allSkills);
      setMySkills(userSkills);
      setPage((p) => {
        const maxPage = Math.max(0, Math.ceil(userSkills.length / PAGE_SIZE) - 1);
        return p > maxPage ? maxPage : p;
      });
      setErr("");
    } catch (e) {
      if (e.status === 401) navigate("/login");
      else setErr(e.message);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [allSkills, userSkills] = await Promise.all([
          api("/api/skills"),
          api("/api/user-skills"),
        ]);
        if (cancelled) return;
        setSkills(allSkills);
        setMySkills(userSkills);
      } catch (e) {
        if (cancelled) return;
        if (e.status === 401) navigate("/login");
        else setErr(e.message);
      }
    })();
    return () => { cancelled = true; };
  }, [navigate]);

  async function addSkill(e) {
    e.preventDefault();
    setErr("");
    setAdding(true);
    try {
      await api("/api/user-skills", {
        method: "POST",
        body: JSON.stringify({
          skill_id: Number(skillId),
          proficiency_level: Number(level),
          evidence: evidence || null,
        }),
      });
      setSkillId("");
      setLevel(3);
      setEvidence("");
      await refresh();
      showToast("Skill added.");
    } catch (e) {
      if (e.status === 401) navigate("/login");
      else setErr(e.message);
    } finally {
      setAdding(false);
    }
  }

  function confirmRemove(id) {
    setDeleteConfirm({ open: true, skillId: id });
  }

  async function removeSkill(id) {
    setDeleteConfirm({ open: false, skillId: null });
    setErr("");
    try {
      await api(`/api/user-skills/${id}`, { method: "DELETE" });
      await refresh();
      showToast("Skill removed.", "info");
    } catch (e) {
      if (e.status === 401) navigate("/login");
      else setErr(e.message);
    }
  }

  function startEdit(s) {
    setEditingId(s.skill_id);
    setEditLevel(s.proficiency_level);
    setEditEvidence(s.evidence || "");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditLevel(3);
    setEditEvidence("");
  }

  async function saveEdit(skillId) {
    setSaving(true);
    try {
      await api("/api/user-skills", {
        method: "POST",
        body: JSON.stringify({
          skill_id: Number(skillId),
          proficiency_level: Number(editLevel),
          evidence: editEvidence || null,
        }),
      });
      await refresh();
      cancelEdit();
      showToast("Skill updated.");
    } catch (e) {
      if (e.status === 401) navigate("/login");
      else showToast(e.message || "Failed to update skill.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Box className="page-animate page-content">

       
      <Box sx={{
        pb: 3, mb: 3,
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        flexWrap: "wrap",
        gap: 2,
      }}>
        <Box>
          <Typography variant="h4" sx={{ mb: 0.5 }}>My Skills</Typography>
          <Typography sx={{ color: "text.secondary" }}>
            Add skills with a proficiency level and evidence to personalise your recommendations.
          </Typography>
        </Box>

        {mySkills.length > 0 && (
          <Box sx={{
            display: "flex",
            gap: 0,
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "8px",
            overflow: "hidden",
            bgcolor: "rgba(255,255,255,0.015)",
            flexShrink: 0,
          }}>
            <Box sx={{ px: 2, py: 1.25, borderRight: "1px solid rgba(255,255,255,0.07)" }}>
              <Typography sx={{ fontWeight: 800, fontSize: "1.25rem", lineHeight: 1, letterSpacing: "-0.03em", color: "#f1f0ff" }}>
                {mySkills.length}
              </Typography>
              <Typography sx={{ fontSize: "0.68rem", color: "text.secondary", fontWeight: 550, mt: 0.25 }}>
                Skills added
              </Typography>
            </Box>
            <Box sx={{ px: 2, py: 1.25 }}>
              <Typography sx={{ fontWeight: 800, fontSize: "1.25rem", lineHeight: 1, letterSpacing: "-0.03em", color: evidencePct > 0 ? "#22c55e" : "rgba(241,240,255,0.45)" }}>
                {evidencePct}%
              </Typography>
              <Typography sx={{ fontSize: "0.68rem", color: "text.secondary", fontWeight: 550, mt: 0.25 }}>
                Have evidence
              </Typography>
            </Box>
          </Box>
        )}

        {mySkills.length > 0 && (() => {
          const levelColours = {
            1: "rgba(239,68,68,0.70)",
            2: "rgba(249,115,22,0.70)",
            3: "rgba(245,158,11,0.70)",
            4: "rgba(132,204,22,0.70)",
            5: "rgba(34,197,94,0.70)",
          };
          const catData = Object.entries(
            mySkills.reduce((acc, s) => {
              const cat = s.category || "Other";
              acc[cat] = (acc[cat] || 0) + 1;
              return acc;
            }, {})
          )
            .sort((a, b) => b[1] - a[1])
            .map(([cat, count]) => ({ cat: cat.length > 14 ? cat.slice(0, 13) + "…" : cat, count }));

          const levelData = [1, 2, 3, 4, 5].map((n) => ({
            level: levelLabels[n],
            count: mySkills.filter((s) => s.proficiency_level === n).length,
            colour: levelColours[n],
          }));

          return (
            <Box sx={{
              mt: 3,
              width: "100%",
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2,
            }}>
               
              <Paper sx={{ p: 2.5 }}>
                <Typography sx={{ ...sectionLabel, mb: 2 }}>Skills by category</Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <ResponsiveContainer width={140} height={140}>
                    <PieChart>
                      <RechartsTooltip
                        contentStyle={{
                          background: "rgba(10,9,16,0.98)",
                          border: "1px solid rgba(255,255,255,0.10)",
                          borderRadius: 8,
                          fontFamily: "Manrope, system-ui, sans-serif",
                          fontSize: 12,
                        }}
                        itemStyle={{ color: "#f1f0ff" }}
                        formatter={(v, name) => [v, name]}
                      />
                      <Pie
                        data={catData}
                        dataKey="count"
                        nameKey="cat"
                        cx="50%"
                        cy="50%"
                        innerRadius={38}
                        outerRadius={62}
                        paddingAngle={2}
                        strokeWidth={0}
                      >
                        {catData.map((_, i) => (
                          <Cell
                            key={i}
                            fill={[
                              "#f59e0b", "#a78bfa", "#22c55e", "#38bdf8",
                              "#fb923c", "#f472b6", "#34d399", "#818cf8",
                            ][i % 8]}
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 0.6, minWidth: 0 }}>
                    {catData.slice(0, 6).map((item, i) => (
                      <Box key={item.cat} sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0 }}>
                        <Box sx={{
                          width: 8, height: 8, borderRadius: "2px", flexShrink: 0,
                          bgcolor: [
                            "#f59e0b", "#a78bfa", "#22c55e", "#38bdf8",
                            "#fb923c", "#f472b6", "#34d399", "#818cf8",
                          ][i % 8],
                        }} />
                        <Typography sx={{
                          fontSize: "0.75rem", color: "rgba(241,240,255,0.65)",
                          flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {item.cat}
                        </Typography>
                        <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "rgba(241,240,255,0.85)", flexShrink: 0 }}>
                          {item.count}
                        </Typography>
                      </Box>
                    ))}
                    {catData.length > 6 && (
                      <Typography sx={{ fontSize: "0.70rem", color: "text.secondary", mt: 0.25 }}>
                        +{catData.length - 6} more
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Paper>

              <Paper sx={{ p: 2.5 }}>
                <Typography sx={{ ...sectionLabel, mb: 2 }}>Proficiency distribution</Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <ResponsiveContainer width={140} height={140}>
                    <PieChart>
                      <RechartsTooltip
                        contentStyle={{
                          background: "rgba(10,9,16,0.98)",
                          border: "1px solid rgba(255,255,255,0.10)",
                          borderRadius: 8,
                          fontFamily: "Manrope, system-ui, sans-serif",
                          fontSize: 12,
                        }}
                        itemStyle={{ color: "#f1f0ff" }}
                        formatter={(v, name) => [v, name]}
                      />
                      <Pie
                        data={levelData.filter((d) => d.count > 0)}
                        dataKey="count"
                        nameKey="level"
                        cx="50%"
                        cy="50%"
                        innerRadius={38}
                        outerRadius={62}
                        paddingAngle={2}
                        strokeWidth={0}
                      >
                        {levelData.filter((d) => d.count > 0).map((entry, i) => (
                          <Cell key={i} fill={entry.colour} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 0.6 }}>
                    {levelData.map((item) => (
                      <Box key={item.level} sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: "2px", flexShrink: 0, bgcolor: item.colour, opacity: item.count === 0 ? 0.25 : 1 }} />
                        <Typography sx={{
                          fontSize: "0.75rem",
                          color: item.count === 0 ? "rgba(241,240,255,0.28)" : "rgba(241,240,255,0.65)",
                          flex: 1,
                        }}>
                          {item.level}
                        </Typography>
                        <Typography sx={{
                          fontSize: "0.75rem", fontWeight: 700,
                          color: item.count === 0 ? "rgba(241,240,255,0.22)" : "rgba(241,240,255,0.85)",
                          flexShrink: 0,
                        }}>
                          {item.count}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Paper>
            </Box>
          );
        })()}
      </Box>

      {err && <Alert severity="error" sx={{ mb: 3 }}>{err}</Alert>}

       
      <Paper sx={{ p: 0, mb: 2.5, overflow: "hidden" }}>

         
        <Box sx={{
          height: 2,
          background: "linear-gradient(90deg, #f59e0b 0%, rgba(251,146,60,0.55) 55%, transparent 100%)",
          opacity: 0.50,
        }} />

        <Box component="form" onSubmit={addSkill} sx={{ p: { xs: 2.5, sm: 3 } }}>
          <Typography sx={{ ...sectionLabel, mb: 0.25 }}>Add a skill</Typography>
          <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 2.5 }}>
            Select a skill, set your level, and optionally add evidence.
          </Typography>

           
          <Box sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 2,
            mb: 2.5,
          }}>
            <FormControl fullWidth required>
              <InputLabel>Skill</InputLabel>
              <Select
                value={skillId}
                label="Skill"
                onChange={(e) => setSkillId(e.target.value)}
              >
                <MenuItem value="">
                  <em style={{ color: "rgba(241,240,255,0.38)", fontStyle: "normal" }}>Select a skill...</em>
                </MenuItem>
                {skillOptions.flatMap(({ cat, items }) => [
                  <ListSubheader key={`cat-${cat}`} sx={{
                    bgcolor: "transparent",
                    color: "rgba(241,240,255,0.30)",
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                    lineHeight: 2.2,
                  }}>
                    {cat}
                  </ListSubheader>,
                  ...items.map((s) => (
                    <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                  )),
                ])}
              </Select>
            </FormControl>

            <TextField
              label="Evidence (optional)"
              placeholder="GitHub link, project name, module..."
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              fullWidth
            />
          </Box>

           
          <Box sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 2,
          }}>
            <Box>
              <Typography sx={{
                fontSize: "0.68rem",
                fontWeight: 700,
                color: "rgba(241,240,255,0.30)",
                letterSpacing: "0.07em",
                textTransform: "uppercase",
                mb: 1,
              }}>
                Proficiency level: {level} · {levelLabels[level]}
              </Typography>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <LevelDot
                    key={n}
                    n={n}
                    selected={level === n}
                    onClick={() => setLevel(n)}
                  />
                ))}
              </Box>
              <Typography variant="caption" sx={{ color: "rgba(241,240,255,0.38)", mt: 0.75, display: "block" }}>
                {[
                  "Aware of it, never used it in a real project",
                  "Used occasionally, still needs guidance",
                  "Can work with it independently",
                  "Confident and comfortable, minimal reference needed",
                  "Deep expertise, could mentor others",
                ][level - 1]}
              </Typography>
            </Box>

            <Button
              type="submit"
              variant="contained"
              disabled={!skillId || adding}
              startIcon={adding
                ? <CircularProgress size={14} sx={{ color: "rgba(0,0,0,0.50)" }} />
                : <Add />
              }
              sx={{ px: 3, alignSelf: "flex-end" }}
            >
              {adding ? "Adding..." : "Add skill"}
            </Button>
          </Box>
        </Box>
      </Paper>

       
      <Paper sx={{ overflow: "hidden" }}>

         
        <Box sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr auto", md: "3fr 2fr 2fr 3fr 96px" },
          px: 3, py: 1.5,
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          bgcolor: "rgba(255,255,255,0.015)",
        }}>
          {["Skill", "Category", "Level", "Evidence", ""].map((h, i) => (
            <Typography
              key={h}
              sx={{
                ...sectionLabel, mb: 0,
                display: (i === 1 || i === 2 || i === 3) ? { xs: "none", md: "block" } : "block",
              }}
            >
              {h}
            </Typography>
          ))}
        </Box>

        {mySkills.length === 0 ? (
          <Box sx={{ px: 3, py: 6, textAlign: "center" }}>
            <Typography sx={{ color: "text.secondary", fontSize: "0.875rem" }}>
              No skills added yet. Use the form above to add your first skill.
            </Typography>
          </Box>
        ) : (
          <>
            {mySkills.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map((s, i) => {
              const isEditing = editingId === s.skill_id;
              return (
                <Box key={s.skill_id}>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr auto", md: "3fr 2fr 2fr 3fr 96px" },
                      px: 3, py: 1.75,
                      alignItems: "center",
                      borderBottom: isEditing
                        ? "none"
                        : i < mySkills.length - 1
                          ? "1px solid rgba(255,255,255,0.04)"
                          : "none",
                      transition: "background 120ms ease",
                      bgcolor: isEditing ? "rgba(245,158,11,0.03)" : "transparent",
                      "&:hover": { bgcolor: isEditing ? "rgba(245,158,11,0.03)" : "rgba(255,255,255,0.02)" },
                    }}
                  >
                     
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 650, fontSize: "0.875rem" }}>
                        {s.name}
                      </Typography>
                      <Box sx={{ display: { xs: "flex", md: "none" }, alignItems: "center", gap: 1, mt: 0.5, flexWrap: "wrap" }}>
                        <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.78rem" }}>
                          {s.category || "—"}
                        </Typography>
                        <Chip
                          label={`${s.proficiency_level} · ${levelLabels[s.proficiency_level] || ""}`}
                          size="small"
                          sx={{ ...levelChipSx(s.proficiency_level), height: 20, fontSize: "0.70rem" }}
                        />
                      </Box>
                    </Box>

                    <Typography variant="body2" sx={{ color: "text.secondary", display: { xs: "none", md: "block" } }}>
                      {s.category || "—"}
                    </Typography>

                    <Box sx={{ display: { xs: "none", md: "block" } }}>
                      <Chip
                        label={`${s.proficiency_level} · ${levelLabels[s.proficiency_level] || ""}`}
                        size="small"
                        sx={levelChipSx(s.proficiency_level)}
                      />
                    </Box>

                    <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 1, pr: 2, minWidth: 0 }}>
                      {s.evidence ? (
                        <>
                          <CheckCircle sx={{ fontSize: 13, color: "#22c55e", flexShrink: 0 }} />
                          <Tooltip title={s.evidence} arrow placement="top">
                            <Typography
                              variant="body2"
                              sx={{
                                fontSize: "0.82rem",
                                color: "rgba(241,240,255,0.72)",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                cursor: "default",
                              }}
                            >
                              {s.evidence}
                            </Typography>
                          </Tooltip>
                        </>
                      ) : (
                        <>
                          <RadioButtonUnchecked sx={{ fontSize: 13, color: "rgba(241,240,255,0.18)", flexShrink: 0 }} />
                          <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.82rem" }}>
                            No evidence
                          </Typography>
                        </>
                      )}
                    </Box>

                    <Box sx={{ display: "flex", gap: 0.5, justifyContent: "flex-end" }}>
                      <Tooltip title={isEditing ? "Cancel edit" : "Edit skill"} arrow>
                        <IconButton
                          size="small"
                          onClick={() => isEditing ? cancelEdit() : startEdit(s)}
                          sx={{
                            color: isEditing ? "#fcd34d" : "rgba(241,240,255,0.35)",
                            "&:hover": {
                              bgcolor: "rgba(245,158,11,0.10) !important",
                              color: "#fcd34d !important",
                            },
                          }}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Remove skill" arrow>
                        <IconButton
                          size="small"
                          onClick={() => confirmRemove(s.skill_id)}
                          sx={{
                            "&:hover": {
                              bgcolor: "rgba(239,68,68,0.12) !important",
                              color: "#fca5a5 !important",
                            },
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>

                  <Collapse in={isEditing} unmountOnExit>
                    <Box sx={{
                      px: 3, py: 2.5,
                      bgcolor: "rgba(245,158,11,0.03)",
                      borderTop: "1px solid rgba(245,158,11,0.10)",
                      borderBottom: i < mySkills.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                    }}>
                       
                      <Typography sx={{
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        color: "rgba(241,240,255,0.30)",
                        letterSpacing: "0.07em",
                        textTransform: "uppercase",
                        mb: 1,
                      }}>
                        Level: {editLevel} · {levelLabels[editLevel]}
                      </Typography>
                      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <LevelDot
                            key={n}
                            n={n}
                            selected={editLevel === n}
                            onClick={() => setEditLevel(n)}
                          />
                        ))}
                      </Box>
                      <Typography variant="caption" sx={{ color: "rgba(241,240,255,0.38)", mt: 0.75, display: "block", mb: 2 }}>
                        {[
                          "Aware of it, never used it in a real project",
                          "Used occasionally, still needs guidance",
                          "Can work with it independently",
                          "Confident and comfortable, minimal reference needed",
                          "Deep expertise, could mentor others",
                        ][editLevel - 1]}
                      </Typography>

                      <Box sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", sm: "1fr auto auto" },
                        gap: 1.5,
                        alignItems: "flex-end",
                      }}>
                        <TextField
                          label="Evidence"
                          value={editEvidence}
                          onChange={(e) => setEditEvidence(e.target.value)}
                          placeholder="GitHub link, project name, module..."
                          size="small"
                          fullWidth
                        />
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => saveEdit(s.skill_id)}
                          disabled={saving}
                          startIcon={saving ? <CircularProgress size={13} sx={{ color: "rgba(0,0,0,0.50)" }} /> : null}
                          sx={{ whiteSpace: "nowrap" }}
                        >
                          {saving ? "Saving..." : "Save"}
                        </Button>
                        <Button
                          variant="outlined"
                          color="secondary"
                          size="small"
                          onClick={cancelEdit}
                          sx={{ whiteSpace: "nowrap" }}
                        >
                          Cancel
                        </Button>
                      </Box>
                    </Box>
                  </Collapse>
                </Box>
              );
            }
            )}
            {mySkills.length > PAGE_SIZE && (
              <Box sx={{
                px: 3, py: 1.75,
                borderTop: "1px solid rgba(255,255,255,0.06)",
                bgcolor: "rgba(255,255,255,0.012)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
                flexWrap: "wrap",
              }}>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, mySkills.length)} of {mySkills.length} skills
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    variant="outlined"
                    color="secondary"
                    size="small"
                    disabled={page === 0}
                    onClick={() => setPage((p) => p - 1)}
                    sx={{ minWidth: 80 }}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outlined"
                    color="secondary"
                    size="small"
                    disabled={(page + 1) * PAGE_SIZE >= mySkills.length}
                    onClick={() => setPage((p) => p + 1)}
                    sx={{ minWidth: 80 }}
                  >
                    Next
                  </Button>
                </Box>
              </Box>
            )}
          </>
        )}
      </Paper>

      <ConfirmDialog
        open={deleteConfirm.open}
        title="Remove skill"
        message="This skill and its evidence will be removed from your profile."
        confirmLabel="Remove"
        onConfirm={() => removeSkill(deleteConfirm.skillId)}
        onCancel={() => setDeleteConfirm({ open: false, skillId: null })}
      />
    </Box>
  );
}
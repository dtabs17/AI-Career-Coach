import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import {
  Box, Paper, Typography, Button, Alert, Chip, Tooltip,
  TextField, FormControl, InputLabel, Select, MenuItem,
  CircularProgress, LinearProgress,
} from "@mui/material";
import { Add, Refresh, Save, CheckCircle, RadioButtonUnchecked } from "@mui/icons-material";
import { useToast } from "../toast/ToastContext";

function uniq(arr) {
  const out = [];
  const seen = new Set();
  for (const x of arr || []) {
    const v = String(x || "").trim();
    if (!v) continue;
    const key = v.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out;
}

function asArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return uniq(value);
  return [];
}

const sectionLabel = {
  color: "text.secondary",
  fontWeight: 650,
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  fontSize: "0.67rem",
  mb: 0.5,
};

const chipSx = {
  bgcolor: "rgba(255,255,255,0.06)",
  color: "rgba(241,240,255,0.82)",
  border: "1px solid rgba(255,255,255,0.10)",
  cursor: "pointer",
  "& .MuiChip-deleteIcon": {
    color: "rgba(241,240,255,0.35)",
    "&:hover": { color: "rgba(241,240,255,0.75)" },
  },
  "&:hover": {
    bgcolor: "rgba(245,158,11,0.08)",
    borderColor: "rgba(245,158,11,0.25)",
    color: "#f1f0ff",
  },
};



function CompletionItem({ label, done }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      {done
        ? <CheckCircle sx={{ fontSize: 13, color: "#22c55e", flexShrink: 0 }} />
        : <RadioButtonUnchecked sx={{ fontSize: 13, color: "rgba(241,240,255,0.20)", flexShrink: 0 }} />
      }
      <Typography sx={{
        fontSize: "0.78rem",
        color: done ? "rgba(241,240,255,0.55)" : "rgba(241,240,255,0.42)",
        textDecoration: done ? "line-through" : "none",
      }}>
        {label}
      </Typography>
    </Box>
  );
}



export default function Profile() {
const [err, setErr] = useState("");
const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState(false);
const showToast = useToast();

  const [fullName, setFullName] = useState("");
  const [yearOfStudy, setYearOfStudy] = useState("");
  const [course, setCourse] = useState("");
  const [interests, setInterests] = useState("");
  const [academicFocus, setAcademicFocus] = useState("");

  const [roleOptions, setRoleOptions] = useState([]);
  const [skillOptions, setSkillOptions] = useState([]);

  const [preferredTech, setPreferredTech] = useState([]);
  const [preferredRoles, setPreferredRoles] = useState([]);

  const [techSearch, setTechSearch] = useState("");
  const [roleSearch, setRoleSearch] = useState("");
  const [techPick, setTechPick] = useState("");
  const [rolePick, setRolePick] = useState("");

  const filteredTechOptions = useMemo(() => {
    const q = techSearch.trim().toLowerCase();
    const base = uniq(skillOptions.map((s) => s.name));
    if (!q) return base.slice(0, 120);
    return base.filter((n) => n.toLowerCase().includes(q)).slice(0, 120);
  }, [skillOptions, techSearch]);

  const filteredRoleOptions = useMemo(() => {
    const q = roleSearch.trim().toLowerCase();
    const base = uniq(roleOptions.map((r) => r.title));
    if (!q) return base.slice(0, 80);
    return base.filter((t) => t.toLowerCase().includes(q)).slice(0, 80);
  }, [roleOptions, roleSearch]);

  const checks = useMemo(() => ({
    name: Boolean(String(fullName || "").trim()),
    year: Boolean(String(yearOfStudy || "").trim()),
    course: Boolean(String(course || "").trim()),
    focus: Boolean(String(academicFocus || "").trim()),
    interests: Boolean(String(interests || "").trim()),
    tech: preferredTech.length > 0,
    roles: preferredRoles.length > 0,
  }), [fullName, yearOfStudy, course, academicFocus, interests, preferredTech, preferredRoles]);

  const completionPct = Math.round(
    (Object.values(checks).filter(Boolean).length / Object.keys(checks).length) * 100
  );

  async function load() {
    setErr(""); setLoading(true);
    try {
      const [p, skills, roles] = await Promise.all([
        api("/api/profile"),
        api("/api/skills"),
        api("/api/roles"),
      ]);
      setSkillOptions(skills || []);
      setRoleOptions(roles || []);
      if (p) {
        setFullName(p.full_name || "");
        setYearOfStudy(p.year_of_study || "");
        setCourse(p.course || "");
        setInterests(p.interests || "");
        setAcademicFocus(p.academic_focus || "");
        setPreferredTech(asArray(p.preferred_technologies));
        setPreferredRoles(asArray(p.preferred_roles));
      } else {
        setPreferredTech([]); setPreferredRoles([]);
      }
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function addTech(name) {
    const v = String(name || "").trim();
    if (!v) return;
    setPreferredTech((prev) => uniq([...(prev || []), v]));
  }
  function removeTech(name) {
    const key = String(name || "").toLowerCase();
    setPreferredTech((prev) => (prev || []).filter((x) => String(x).toLowerCase() !== key));
  }
  function addRole(title) {
    const v = String(title || "").trim();
    if (!v) return;
    setPreferredRoles((prev) => uniq([...(prev || []), v]));
  }
  function removeRole(title) {
    const key = String(title || "").toLowerCase();
    setPreferredRoles((prev) => (prev || []).filter((x) => String(x).toLowerCase() !== key));
  }

  async function save(e) {
    e.preventDefault();
setErr(""); setSaving(true);
    try {
      await api("/api/profile", {
        method: "PUT",
        body: JSON.stringify({
          full_name: fullName || null,
          year_of_study: yearOfStudy || null,
          course: course || null,
          interests: interests || null,
          academic_focus: academicFocus || null,
          preferred_technologies: preferredTech.length ? preferredTech : null,
          preferred_roles: preferredRoles.length ? preferredRoles : null,
        }),
      });
showToast("Profile saved.");
    } catch (e2) {
      setErr(e2.message);
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
        alignItems: "flex-start",
        flexWrap: "wrap",
        gap: 2,
      }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h4" sx={{ mb: 0.5 }}>Profile</Typography>
          <Typography sx={{ color: "text.secondary", mb: 2 }}>
            A complete profile gives the coach more context and improves your recommendation accuracy.
          </Typography>

           
          <Box sx={{ maxWidth: 420 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.75 }}>
              <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", fontWeight: 600 }}>
                Profile completion
              </Typography>
              <Typography sx={{
                fontSize: "0.75rem",
                fontWeight: 750,
                color: completionPct === 100 ? "#22c55e" : "#f59e0b",
              }}>
                {completionPct}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={completionPct}
              sx={{
                height: 6,
                "& .MuiLinearProgress-bar": {
                  background: completionPct === 100
                    ? "#22c55e"
                    : "linear-gradient(90deg, #f59e0b, #fb923c)",
                },
              }}
            />
          </Box>
        </Box>

      </Box>

{err && <Alert severity="error" sx={{ mb: 2.5 }}>{err}</Alert>}

      <Box component="form" onSubmit={save}>

        <Box sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1fr 300px" },
          gap: 2.5,
          mb: 2.5,
          alignItems: "start",
        }}>

           
          <Paper sx={{ p: 3 }}>
            <Typography sx={{ ...sectionLabel }}>Basic info</Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 2 }}>
              Used to personalise advice and contextualise your skills.
            </Typography>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "3fr 1fr 2fr" }, gap: 2, mb: 2 }}>
              <TextField
                label="Full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Any Name..."
                disabled={loading}
                fullWidth
              />
              <TextField
                label="Year of study"
                value={yearOfStudy}
                onChange={(e) => setYearOfStudy(e.target.value)}
                placeholder="4"
                disabled={loading}
                fullWidth
              />
              <TextField
                label="Course"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                placeholder="Software Development"
                disabled={loading}
                fullWidth
              />
            </Box>

            <TextField
              label="Academic focus"
              value={academicFocus}
              onChange={(e) => setAcademicFocus(e.target.value)}
              placeholder="Backend, cloud, AI systems..."
              disabled={loading}
              fullWidth
              sx={{ mb: 2 }}
            />
            <TextField
              label="Interests"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              placeholder="What do you enjoy building? What kind of roles interest you?"
              disabled={loading}
              fullWidth
              multiline
              rows={3}
            />
          </Paper>

           
          <Paper sx={{ p: 2.5 }}>
            <Typography sx={{ ...sectionLabel, mb: 1.5 }}>Checklist</Typography>
            <Box sx={{ display: "grid", gap: 1.25 }}>
              <CompletionItem label="Full name" done={checks.name} />
              <CompletionItem label="Year of study" done={checks.year} />
              <CompletionItem label="Course" done={checks.course} />
              <CompletionItem label="Academic focus" done={checks.focus} />
              <CompletionItem label="Interests" done={checks.interests} />
              <CompletionItem label="Preferred technologies" done={checks.tech} />
              <CompletionItem label="Preferred roles" done={checks.roles} />
            </Box>
            <Box sx={{
              mt: 2, pt: 2,
              borderTop: "1px solid rgba(255,255,255,0.06)",
            }}>
              <Typography variant="caption" sx={{ color: "text.secondary", lineHeight: 1.6 }}>
                A fuller profile gives the AI more context when generating recommendations and interview questions.
              </Typography>
            </Box>
          </Paper>
        </Box>

         
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2.5, mb: 2.5 }}>

           
          <Paper sx={{ p: 3 }}>
            <Typography sx={{ ...sectionLabel }}>Preferred technologies</Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 2 }}>
              Technologies you want to be matched against in recommendations.
            </Typography>

            <Box sx={{ display: "flex", gap: 1, mb: 1.5 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Select a technology</InputLabel>
                <Select
                  value={techPick}
                  label="Select a technology"
                  onChange={(e) => setTechPick(e.target.value)}
                  disabled={loading}
                >
                  <MenuItem value="">
                    <em style={{ color: "rgba(241,240,255,0.38)", fontStyle: "normal" }}>Select a technology...</em>
                  </MenuItem>
                  {filteredTechOptions.map((name) => (
                    <MenuItem key={name} value={name}>{name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="contained"
                size="small"
                onClick={() => { addTech(techPick); setTechPick(""); }}
                disabled={loading || !techPick}
                sx={{ px: 2, flexShrink: 0 }}
                startIcon={<Add />}
              >
                Add
              </Button>
            </Box>

            <TextField
              label="Search technologies"
              value={techSearch}
              onChange={(e) => setTechSearch(e.target.value)}
              disabled={loading}
              fullWidth
              size="small"
              sx={{ mb: 2 }}
            />

            {preferredTech.length > 0 ? (
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {preferredTech.map((t) => (
                  <Tooltip key={t} title="Click to remove" arrow>
                    <Chip
                      label={t}
                      size="small"
                      onClick={() => removeTech(t)}
                      onDelete={() => removeTech(t)}
                      sx={chipSx}
                    />
                  </Tooltip>
                ))}
              </Box>
            ) : (
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                No technologies selected yet.
              </Typography>
            )}
          </Paper>

           
          <Paper sx={{ p: 3 }}>
            <Typography sx={{ ...sectionLabel }}>Preferred roles</Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 2 }}>
              Roles you are targeting. The coach prioritises these when scoring recommendations.
            </Typography>

            <Box sx={{ display: "flex", gap: 1, mb: 1.5 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Select a role</InputLabel>
                <Select
                  value={rolePick}
                  label="Select a role"
                  onChange={(e) => setRolePick(e.target.value)}
                  disabled={loading}
                >
                  <MenuItem value="">
                    <em style={{ color: "rgba(241,240,255,0.38)", fontStyle: "normal" }}>Select a role...</em>
                  </MenuItem>
                  {filteredRoleOptions.map((title) => (
                    <MenuItem key={title} value={title}>{title}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="contained"
                size="small"
                onClick={() => { addRole(rolePick); setRolePick(""); }}
                disabled={loading || !rolePick}
                sx={{ px: 2, flexShrink: 0 }}
                startIcon={<Add />}
              >
                Add
              </Button>
            </Box>

            <TextField
              label="Search roles"
              value={roleSearch}
              onChange={(e) => setRoleSearch(e.target.value)}
              disabled={loading}
              fullWidth
              size="small"
              sx={{ mb: 2 }}
            />

            {preferredRoles.length > 0 ? (
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {preferredRoles.map((r) => (
                  <Tooltip key={r} title="Click to remove" arrow>
                    <Chip
                      label={r}
                      size="small"
                      onClick={() => removeRole(r)}
                      onDelete={() => removeRole(r)}
                      sx={chipSx}
                    />
                  </Tooltip>
                ))}
              </Box>
            ) : (
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                No roles selected yet.
              </Typography>
            )}
          </Paper>
        </Box>

        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || saving}
            startIcon={saving ? <CircularProgress size={14} sx={{ color: "rgba(0,0,0,0.50)" }} /> : <Save />}
          >
            {saving ? "Saving..." : "Save profile"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import {
  Box, Paper, Typography, Button, Alert, Chip, Tooltip,
  TextField, FormControl, InputLabel, Select, MenuItem,
  CircularProgress, LinearProgress,
} from "@mui/material";
import { Add, Save, CheckCircle, RadioButtonUnchecked } from "@mui/icons-material";
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


/* ── Reusable picker panel for technologies + roles ── */
function PickerPanel({ title, subtitle, searchLabel, selectLabel, searchValue, onSearchChange,
  options, pickValue, onPickChange, onAdd, addDisabled, items, onRemove }) {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography sx={{ ...sectionLabel }}>{title}</Typography>
      <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 2.5 }}>
        {subtitle}
      </Typography>

      {/* Step 1: search filter */}
      <TextField
        label={searchLabel}
        value={searchValue}
        onChange={onSearchChange}
        fullWidth
        size="small"
        sx={{ mb: 1.5 }}
        placeholder="Type to filter..."
      />

      {/* Step 2: select + add */}
      <Box sx={{ display: "flex", gap: 1, mb: 2.5 }}>
        <FormControl fullWidth size="small">
          <InputLabel>{selectLabel}</InputLabel>
          <Select
            value={pickValue}
            label={selectLabel}
            onChange={onPickChange}
          >
            <MenuItem value="">
              <em style={{ color: "rgba(241,240,255,0.38)", fontStyle: "normal" }}>
                {options.length === 0 ? "No results — try a different search" : `${options.length} option${options.length !== 1 ? "s" : ""} available`}
              </em>
            </MenuItem>
            {options.map((opt) => (
              <MenuItem key={opt} value={opt}>{opt}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant="contained"
          size="small"
          onClick={onAdd}
          disabled={addDisabled}
          sx={{ px: 2, flexShrink: 0 }}
          startIcon={<Add />}
        >
          Add
        </Button>
      </Box>

      {/* Selected items */}
      {items.length > 0 ? (
        <Box>
          <Typography sx={{ ...sectionLabel, mb: 1 }}>Selected</Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {items.map((item) => (
              <Tooltip key={item} title="Click to remove" arrow>
                <Chip
                  label={item}
                  size="small"
                  onClick={() => onRemove(item)}
                  onDelete={() => onRemove(item)}
                  sx={chipSx}
                />
              </Tooltip>
            ))}
          </Box>
        </Box>
      ) : (
        <Box sx={{
          py: 2, px: 2.5,
          borderRadius: "8px",
          border: "1px dashed rgba(255,255,255,0.07)",
          textAlign: "center",
        }}>
          <Typography variant="caption" sx={{ color: "rgba(241,240,255,0.28)" }}>
            Nothing selected yet
          </Typography>
        </Box>
      )}
    </Paper>
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
    name:      Boolean(String(fullName      || "").trim()),
    year:      Boolean(String(yearOfStudy   || "").trim()),
    course:    Boolean(String(course        || "").trim()),
    focus:     Boolean(String(academicFocus || "").trim()),
    interests: Boolean(String(interests     || "").trim()),
    tech:      preferredTech.length  > 0,
    roles:     preferredRoles.length > 0,
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
          full_name:               fullName      || null,
          year_of_study:           yearOfStudy   || null,
          course:                  course        || null,
          interests:               interests     || null,
          academic_focus:          academicFocus || null,
          preferred_technologies:  preferredTech.length  ? preferredTech  : null,
          preferred_roles:         preferredRoles.length ? preferredRoles : null,
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

      {/* ── Page header ── */}
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

          {/* Completion bar */}
          <Box sx={{ maxWidth: 420 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.75 }}>
              <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", fontWeight: 600 }}>
                Profile completion
              </Typography>
              <Typography sx={{
                fontSize: "0.75rem", fontWeight: 750,
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

        {/* ── Basic info + checklist ── */}
        <Box sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1fr 280px" },
          gap: 2.5,
          mb: 2.5,
          alignItems: "start",
        }}>
          <Paper sx={{ p: 3 }}>
            <Typography sx={{ ...sectionLabel }}>Basic info</Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 2.5 }}>
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

          {/* Checklist sidebar */}
          <Paper sx={{ p: 2.5 }}>
            <Typography sx={{ ...sectionLabel, mb: 1.5 }}>Checklist</Typography>
            <Box sx={{ display: "grid", gap: 1.25 }}>
              <CompletionItem label="Full name"             done={checks.name}      />
              <CompletionItem label="Year of study"         done={checks.year}      />
              <CompletionItem label="Course"                done={checks.course}    />
              <CompletionItem label="Academic focus"        done={checks.focus}     />
              <CompletionItem label="Interests"             done={checks.interests} />
              <CompletionItem label="Preferred technologies" done={checks.tech}     />
              <CompletionItem label="Preferred roles"       done={checks.roles}     />
            </Box>
            <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <Typography variant="caption" sx={{ color: "text.secondary", lineHeight: 1.6 }}>
                A fuller profile gives the AI more context when generating recommendations and interview questions.
              </Typography>
            </Box>
          </Paper>
        </Box>

        {/* ── Preferred technologies + roles ── */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2.5, mb: 2.5 }}>

          <PickerPanel
            title="Preferred technologies"
            subtitle="Technologies you want to be matched against in recommendations."
            searchLabel="Search technologies"
            selectLabel="Select a technology"
            searchValue={techSearch}
            onSearchChange={(e) => { setTechSearch(e.target.value); setTechPick(""); }}
            options={filteredTechOptions}
            pickValue={techPick}
            onPickChange={(e) => setTechPick(e.target.value)}
            onAdd={() => { addTech(techPick); setTechPick(""); }}
            addDisabled={loading || !techPick}
            items={preferredTech}
            onRemove={removeTech}
          />

          <PickerPanel
            title="Preferred roles"
            subtitle="Roles you are targeting. The coach prioritises these when scoring recommendations."
            searchLabel="Search roles"
            selectLabel="Select a role"
            searchValue={roleSearch}
            onSearchChange={(e) => { setRoleSearch(e.target.value); setRolePick(""); }}
            options={filteredRoleOptions}
            pickValue={rolePick}
            onPickChange={(e) => setRolePick(e.target.value)}
            onAdd={() => { addRole(rolePick); setRolePick(""); }}
            addDisabled={loading || !rolePick}
            items={preferredRoles}
            onRemove={removeRole}
          />
        </Box>

        {/* ── Save ── */}
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || saving}
            startIcon={saving
              ? <CircularProgress size={14} sx={{ color: "rgba(0,0,0,0.50)" }} />
              : <Save />
            }
          >
            {saving ? "Saving..." : "Save profile"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
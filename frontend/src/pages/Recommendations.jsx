import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import RoleRecommendationsTable from "../components/RoleRecommendationsTable";
import {
  Box, Typography, Button, Alert, CircularProgress,
} from "@mui/material";
import { AutoAwesome, History } from "@mui/icons-material";
import { useToast } from "../toast/ToastContext";

const viewModes = [
  { key: "skills", label: "Best fit", subtitle: "Scored on your current skills only, no preference weighting." },
  { key: "final", label: "Best fit + preferences", subtitle: "Skills score with preferred roles and technologies as a tie-breaker." },
  { key: "preferred", label: "Preferred roles", subtitle: "Your preferred roles ranked by how close you are based on current skills." },
];

// ─── View mode pill ───────────────────────────────────────────────────────────

function ViewPill({ label, active, onClick }) {
  return (
    <Box
      onClick={onClick}
      sx={{
        px: 1.75, py: 0.65,
        borderRadius: "6px",
        border: active
          ? "1px solid rgba(245,158,11,0.45)"
          : "1px solid rgba(255,255,255,0.08)",
        bgcolor: active
          ? "rgba(245,158,11,0.08)"
          : "rgba(255,255,255,0.02)",
        color: active ? "#fcd34d" : "rgba(241,240,255,0.55)",
        fontSize: "0.8rem",
        fontWeight: active ? 680 : 500,
        fontFamily: "Manrope, system-ui, sans-serif",
        cursor: "pointer",
        transition: "all 120ms ease",
        userSelect: "none",
        flexShrink: 0,
        "&:hover": {
          borderColor: active ? "rgba(245,158,11,0.55)" : "rgba(255,255,255,0.14)",
          color: active ? "#fcd34d" : "rgba(241,240,255,0.82)",
        },
      }}
    >
      {label}
    </Box>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Recommendations() {
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const [run, setRun] = useState(null);
  const [views, setViews] = useState(null);
  const [viewMode, setViewMode] = useState("final");
  const [executedAt, setExecutedAt] = useState(null);

  const navigate = useNavigate();
  const showToast = useToast();

  async function runNow() {
    setErr("");
    setLoading(true);
    try {
      const data = await api("/api/recommendations/run", {
        method: "POST",
        body: JSON.stringify({ top_n: 10 }),
      });
      setRun(data.run);
      setViews(data.views || null);
      setExecutedAt(data.executed_at || null);
      showToast("Recommendations ready.");
    } catch (e) {
      if (e.status === 401) navigate("/login");
      else setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  function getList() {
    if (viewMode === "skills") return views?.best_fit || [];
    if (viewMode === "preferred") return views?.preferred_roles_alignment || [];
    return views?.best_fit_plus_preferences || [];
  }

  const list = getList();
  const current = viewModes.find((v) => v.key === viewMode);

  const emptyText =
    viewMode === "preferred" && views
      ? "No preferred roles found. Add some in Profile, then run recommendations again."
      : "No results yet. Click \"Run recommendations\".";

  return (
    <Box className="page-animate page-content">

      {/* Page header */}
      <Box sx={{
        pb: 3, mb: 3,
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        flexWrap: "wrap",
        gap: 2,
      }}>
        <Box>
          <Typography variant="h4" sx={{ mb: 0.5 }}>Recommendations</Typography>
          <Typography sx={{ color: "text.secondary" }}>
            AI-scored role matches based on your skills and profile.
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center" }}>
          <Button
            variant="outlined"
            color="secondary"
            size="small"
            startIcon={<History />}
            onClick={() => navigate("/recommendations/history")}
          >
            History
          </Button>
          <Button
            variant="contained"
            onClick={runNow}
            disabled={loading}
            startIcon={
              loading
                ? <CircularProgress size={14} sx={{ color: "rgba(0,0,0,0.50)" }} />
                : <AutoAwesome />
            }
            sx={{
              px: 2.5,
              boxShadow: "0 0 16px rgba(245,158,11,0.30)",
              "&:hover": {
                boxShadow: "0 0 22px rgba(245,158,11,0.45)",
              },
            }}
          >
            {loading ? "Running..." : "Run recommendations"}
          </Button>
        </Box>
      </Box>

      {/* View mode toggle */}
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1.25 }}>
        {viewModes.map(({ key, label }) => (
          <ViewPill
            key={key}
            label={label}
            active={viewMode === key}
            onClick={() => setViewMode(key)}
          />
        ))}
      </Box>

      <Typography variant="body2" sx={{ color: "text.secondary", mb: run ? 0.5 : 0 }}>
        {current?.subtitle}
      </Typography>

      {run && (
        <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 0.5 }}>
          Last run: {new Date(executedAt || run.created_at).toLocaleString()}
        </Typography>
      )}

      {err && <Alert severity="error" sx={{ mt: 2 }}>{err}</Alert>}

      <RoleRecommendationsTable
        key={`${run?.id || "none"}-${viewMode}`}
        items={list}
        emptyText={emptyText}
      />
    </Box>
  );
}
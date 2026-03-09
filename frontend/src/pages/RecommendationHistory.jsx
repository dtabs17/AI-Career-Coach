import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import RoleRecommendationsTable from "../components/RoleRecommendationsTable.jsx";
import {
  Box, Paper, Typography, Button, Alert, CircularProgress,
  Chip, Divider, Tooltip, IconButton,
} from "@mui/material";
import { ArrowBack, Refresh, OpenInNew } from "@mui/icons-material";

function fmt(ts) {
  try { return new Date(ts).toLocaleString(); } catch { return ""; }
}

const sectionLabel = {
  color: "text.secondary",
  fontWeight: 650,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  fontSize: "0.65rem",
};

export default function RecommendationHistory() {
  const navigate = useNavigate();

  const [err,         setErr]         = useState("");
  const [loadingRuns, setLoadingRuns] = useState(true);
  const [loadingRun,  setLoadingRun]  = useState(false);

  const [runs,      setRuns]      = useState([]);
  const [activeRun, setActiveRun] = useState(null);

  async function loadRuns() {
    setErr("");
    setLoadingRuns(true);
    setActiveRun(null);
    try {
      const data = await api("/api/recommendations/runs");
      setRuns(Array.isArray(data) ? data : []);
    } catch (e) {
      if (e.status === 401) navigate("/login");
      else setErr(e.message);
    } finally {
      setLoadingRuns(false);
    }
  }

  async function openRun(runId) {
    setErr("");
    setLoadingRun(true);
    try {
      const data = await api(`/api/recommendations/runs/${runId}`);
      setActiveRun(data);
    } catch (e) {
      if (e.status === 401) navigate("/login");
      else setErr(e.message);
    } finally {
      setLoadingRun(false);
    }
  }

  useEffect(() => { loadRuns(); }, []);

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
        <Box>
          <Typography variant="h4" sx={{ mb: 0.5 }}>Recommendation history</Typography>
          <Typography sx={{ color: "text.secondary" }}>
            View previous runs and compare results over time.
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Button
            variant="outlined"
            color="secondary"
            size="small"
            startIcon={<ArrowBack />}
            onClick={() => navigate("/recommendations")}
          >
            Back
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={
              loadingRuns
                ? <CircularProgress size={13} sx={{ color: "rgba(0,0,0,0.50)" }} />
                : <Refresh />
            }
            onClick={loadRuns}
            disabled={loadingRuns}
          >
            {loadingRuns ? "Refreshing..." : "Refresh"}
          </Button>
        </Box>
      </Box>

      {err && <Alert severity="error" sx={{ mb: 2.5 }}>{err}</Alert>}
      
      <Paper sx={{ overflow: "hidden", mb: 2.5 }}>

        <Box sx={{
          display: "grid",
          gridTemplateColumns: "2fr 1.5fr 3fr 48px",
          px: 3, py: 1.5,
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          bgcolor: "rgba(255,255,255,0.015)",
        }}>
          {["Created", "Algorithm", "Top result", ""].map((h) => (
            <Typography key={h} sx={{ ...sectionLabel }}>{h}</Typography>
          ))}
        </Box>

        {loadingRuns ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 3, py: 3 }}>
            <CircularProgress size={15} />
            <Typography variant="body2" sx={{ color: "text.secondary" }}>Loading runs...</Typography>
          </Box>
        ) : runs.length === 0 ? (
          <Box sx={{ px: 3, py: 5, textAlign: "center" }}>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              No runs yet. Go run recommendations first.
            </Typography>
          </Box>
        ) : (
          runs.map((r, i) => (
            <Box
              key={r.id}
              sx={{
                display: "grid",
                gridTemplateColumns: "2fr 1.5fr 3fr 48px",
                px: 3, py: 1.75,
                alignItems: "center",
                borderBottom: i < runs.length - 1
                  ? "1px solid rgba(255,255,255,0.04)"
                  : "none",
                transition: "background 120ms ease",
                bgcolor: activeRun?.run?.id === r.id
                  ? "rgba(245,158,11,0.04)"
                  : "transparent",
                "&:hover": { bgcolor: "rgba(255,255,255,0.025)" },
              }}
            >
              <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.82rem" }}>
                {fmt(r.created_at)}
              </Typography>

              <Box>
                <Chip
                  label={r.algo_version}
                  size="small"
                  sx={{
                    bgcolor: "rgba(255,255,255,0.06)",
                    color:   "rgba(241,240,255,0.60)",
                    border:  "1px solid rgba(255,255,255,0.10)",
                    fontSize: "0.72rem",
                  }}
                />
              </Box>

              <Typography
                variant="body2"
                sx={{
                  fontSize: "0.82rem",
                  color: r.top_role_title
                    ? "rgba(241,240,255,0.75)"
                    : "text.secondary",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  pr: 2,
                  fontStyle: r.top_role_title ? "normal" : "italic",
                }}
              >
                {r.top_role_title || "Open to view"}
              </Typography>

              <Tooltip title="Open this run" arrow>
                <span>
                  <IconButton
                    size="small"
                    onClick={() => openRun(r.id)}
                    disabled={loadingRun}
                    sx={{
                      "&:hover": {
                        bgcolor:     "rgba(245,158,11,0.10) !important",
                        color:       "#fcd34d !important",
                        borderColor: "rgba(245,158,11,0.25) !important",
                      },
                    }}
                  >
                    <OpenInNew fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          ))
        )}
      </Paper>

      {loadingRun && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 2 }}>
          <CircularProgress size={15} />
          <Typography variant="body2" sx={{ color: "text.secondary" }}>Loading run details...</Typography>
        </Box>
      )}

      {!loadingRun && activeRun?.run && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 0.5,
            flexWrap: "wrap",
            gap: 1,
          }}>
            <Typography sx={{ fontWeight: 700 }}>Run results</Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {fmt(activeRun.run.created_at)}
            </Typography>
          </Box>
          <Divider sx={{ mb: 0.5 }} />
          <RoleRecommendationsTable
            items={activeRun.items || []}
            emptyText="No items found for this run."
          />
        </Paper>
      )}
    </Box>
  );
}
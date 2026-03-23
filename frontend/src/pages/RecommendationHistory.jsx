import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import RoleRecommendationsTable from "../components/RoleRecommendationsTable.jsx";
import {
  Box, Paper, Typography, Button, Alert, CircularProgress,
  Chip, Divider, Tooltip, IconButton,
} from "@mui/material";
import { ArrowBack, Refresh, OpenInNew, TrendingUp } from "@mui/icons-material";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
} from "recharts";

function fmt(ts) {
  try { return new Date(ts).toLocaleString(); } catch { return ""; }
}

function fmtShort(ts) {
  try {
    const d = new Date(ts);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  } catch { return ""; }
}

const sectionLabel = {
  color: "text.secondary",
  fontWeight: 650,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  fontSize: "0.65rem",
};


const LINE_COLOURS = ["#f59e0b", "#a78bfa", "#22c55e", "#38bdf8", "#fb923c"];


function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{
      bgcolor: "rgba(10,9,16,0.98)",
      border: "1px solid rgba(255,255,255,0.10)",
      borderRadius: "8px",
      p: 1.5,
      minWidth: 160,
    }}>
      <Typography sx={{ fontSize: "0.72rem", color: "rgba(241,240,255,0.40)", mb: 0.75 }}>
        {label}
      </Typography>
      {[...payload].sort((a, b) => b.value - a.value).map((entry) => (
        <Box key={entry.name} sx={{ display: "flex", justifyContent: "space-between", gap: 2, mb: 0.3 }}>
          <Typography sx={{ fontSize: "0.78rem", color: entry.color, fontWeight: 600, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {entry.name}
          </Typography>
          <Typography sx={{ fontSize: "0.78rem", color: entry.color, fontWeight: 700, flexShrink: 0 }}>
            {Number(entry.value).toFixed(1)}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}


export default function RecommendationHistory() {
  const navigate = useNavigate();

  const [err, setErr] = useState("");
  const [loadingRuns, setLoadingRuns] = useState(true);
  const [loadingRun, setLoadingRun] = useState(false);
  const [loadingChart, setLoadingChart] = useState(false);

  const [runs, setRuns] = useState([]);
  const [activeRun, setActiveRun] = useState(null);
  const [prevRunItems, setPrevRunItems] = useState(null);
  const [prevRunDate, setPrevRunDate] = useState(null);

  const [chartData, setChartData] = useState([]);
  const [chartRoles, setChartRoles] = useState([]);

  async function loadRuns() {
    setErr("");
    setLoadingRuns(true);
    setActiveRun(null);
    setPrevRunItems(null);
    setPrevRunDate(null);
    setChartData([]);
    setChartRoles([]);
    try {
      const data = await api("/api/recommendations/runs");
      const list = Array.isArray(data) ? data : [];
      setRuns(list);
      if (list.length >= 2) {
        buildChart(list);
      }
    } catch (e) {
      if (e.status === 401) navigate("/login");
      else setErr(e.message);
    } finally {
      setLoadingRuns(false);
    }
  }

  async function buildChart(runList) {
    setLoadingChart(true);
    try {
      
      const slice = runList.slice(0, 5).reverse();
      const details = await Promise.all(
        slice.map((r) => api(`/api/recommendations/runs/${r.id}`))
      );

      
      const latestItems = details[details.length - 1]?.items || [];
      const topRoles = latestItems
        .slice(0, 5)
        .map((item) => ({ id: item.role_id, title: item.title }));

      if (!topRoles.length) return;

      
      const points = details.map((detail, i) => {
        const items = detail?.items || [];
        const point = { date: fmtShort(slice[i].created_at) };
        topRoles.forEach((role) => {
          const match = items.find((it) => it.role_id === role.id);
          point[role.title] = match ? Number(Number(match.final_score).toFixed(1)) : null;
        });
        return point;
      });

      setChartRoles(topRoles);
      setChartData(points);
    } catch {
      //
    } finally {
      setLoadingChart(false);
    }
  }

  async function openRun(runId) {
    setErr("");
    setLoadingRun(true);
    setPrevRunItems(null);
    setPrevRunDate(null);
    try {
      const idx = runs.findIndex((r) => r.id === runId);
      const prevRun = idx >= 0 && idx + 1 < runs.length ? runs[idx + 1] : null;

      const [data, prevData] = await Promise.all([
        api(`/api/recommendations/runs/${runId}`),
        prevRun ? api(`/api/recommendations/runs/${prevRun.id}`) : Promise.resolve(null),
      ]);

      setActiveRun(data);
      if (prevData?.items?.length) {
        setPrevRunItems(prevData.items);
        setPrevRunDate(prevRun.created_at);
      }
    } catch (e) {
      if (e.status === 401) navigate("/login");
      else setErr(e.message);
    } finally {
      setLoadingRun(false);
    }
  }

  useEffect(() => { loadRuns(); }, []);

  const prevItemsMap = prevRunItems
    ? new Map(prevRunItems.map((item) => [item.role_id, item]))
    : null;

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
            View previous runs and compare scores over time.
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

       
      {(loadingChart || chartData.length >= 2) && (
        <Paper sx={{ p: 0, mb: 2.5, overflow: "hidden" }}>
          {/* Amber accent line consistent with app design language */}
          <Box sx={{ height: 2, background: "linear-gradient(90deg, #f59e0b 0%, rgba(251,146,60,0.55) 55%, transparent 100%)", opacity: 0.50 }} />
          <Box sx={{
            px: { xs: 2.5, sm: 3 },
            pt: 2.5, pb: 2,
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            gap: 1.25,
          }}>
            <TrendingUp sx={{ fontSize: 18, color: "#f59e0b" }} />
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: "0.9375rem", letterSpacing: "-0.01em" }}>
                Score trends
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Final scores for your top 5 roles across the last {chartData.length} runs
              </Typography>
            </Box>
          </Box>

          <Box sx={{ px: { xs: 1, sm: 2 }, py: 2.5 }}>
            {loadingChart ? (
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, gap: 1.5 }}>
                <CircularProgress size={16} />
                <Typography variant="body2" sx={{ color: "text.secondary" }}>Building chart...</Typography>
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={chartData} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "rgba(241,240,255,0.35)", fontSize: 11, fontFamily: "Manrope, system-ui, sans-serif" }}
                    axisLine={{ stroke: "rgba(255,255,255,0.07)" }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: "rgba(241,240,255,0.35)", fontSize: 11, fontFamily: "Manrope, system-ui, sans-serif" }}
                    axisLine={false}
                    tickLine={false}
                    tickCount={5}
                  />
                  <RechartsTooltip content={<ChartTooltip />} />
                  <Legend
                    wrapperStyle={{
                      paddingTop: 16,
                      fontSize: "0.75rem",
                      fontFamily: "Manrope, system-ui, sans-serif",
                      color: "rgba(241,240,255,0.55)",
                    }}
                  />
                  {chartRoles.map((role, i) => (
                    <Line
                      key={role.id}
                      type="monotone"
                      dataKey={role.title}
                      stroke={LINE_COLOURS[i % LINE_COLOURS.length]}
                      strokeWidth={2}
                      dot={{ r: 3, fill: LINE_COLOURS[i % LINE_COLOURS.length], strokeWidth: 0 }}
                      activeDot={{ r: 5, strokeWidth: 0 }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </Box>
        </Paper>
      )}

       
      <Paper sx={{ overflow: "hidden", mb: 2.5 }}>
        <Box sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr 48px", md: "2fr 1.5fr 3fr 48px" },
          px: 3, py: 1.5,
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          bgcolor: "rgba(255,255,255,0.015)",
        }}>
          {["Created", "Algorithm", "Top result", ""].map((h) => (
            <Typography
              key={h}
              sx={{
                ...sectionLabel,
                display: (h === "Algorithm" || h === "Top result") ? { xs: "none", md: "block" } : "block",
              }}
            >
              {h}
            </Typography>
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
                gridTemplateColumns: { xs: "1fr 48px", md: "2fr 1.5fr 3fr 48px" },
                px: 3, py: 1.75,
                alignItems: "center",
                borderBottom: i < runs.length - 1
                  ? "1px solid rgba(255,255,255,0.04)"
                  : "none",
                transition: "background 120ms ease",
                bgcolor: activeRun?.run?.id === r.id
                  ? "rgba(245,158,11,0.04)"
                  : "transparent",
              }}
            >
              <Typography sx={{ fontSize: "0.8375rem", color: "rgba(241,240,255,0.75)" }}>
                {fmt(r.created_at)}
              </Typography>

              <Box sx={{ display: { xs: "none", md: "block" } }}>
                <Chip
                  label={r.algo_version || "unknown"}
                  size="small"
                  sx={{
                    bgcolor: "rgba(255,255,255,0.06)",
                    color: "rgba(241,240,255,0.55)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    fontSize: "0.72rem",
                    height: 20,
                  }}
                />
              </Box>

              <Typography sx={{
                fontSize: "0.8375rem",
                display: { xs: "none", md: "block" },
                color: r.top_role_title ? "rgba(241,240,255,0.75)" : "text.secondary",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                pr: 2,
                fontStyle: r.top_role_title ? "normal" : "italic",
              }}>
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
                        bgcolor: "rgba(245,158,11,0.10) !important",
                        color: "#fcd34d !important",
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
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
              <Typography sx={{ fontWeight: 700 }}>Run results</Typography>
              {prevRunDate && (
                <Chip
                  label={`vs ${fmt(prevRunDate)}`}
                  size="small"
                  sx={{
                    bgcolor: "rgba(255,255,255,0.05)",
                    color: "rgba(241,240,255,0.45)",
                    border: "1px solid rgba(255,255,255,0.09)",
                    fontSize: "0.70rem",
                    height: 20,
                  }}
                />
              )}
            </Box>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {fmt(activeRun.run.created_at)}
            </Typography>
          </Box>
          {prevRunDate && (
            <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 1 }}>
              Score changes shown against the previous run. Green = improved, red = declined, "new" = role not in previous run.
            </Typography>
          )}
          <Divider sx={{ mb: 0.5 }} />
          <RoleRecommendationsTable
            key={activeRun.run.id}
            items={activeRun.items || []}
            prevItems={prevItemsMap}
            emptyText="No items found for this run."
          />
        </Paper>
      )}
    </Box>
  );
}
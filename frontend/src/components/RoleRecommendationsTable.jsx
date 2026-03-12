import { useState } from "react";
import {
  Box, Paper, Typography, Chip, Collapse, IconButton, Tooltip, Divider, Button,
} from "@mui/material";
import { ExpandMore, Star, CheckCircle, RemoveCircle, Cancel, AutoAwesome, CalendarMonth } from "@mui/icons-material";
import { Link } from "react-router-dom";

function safeNum(n) {
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
}

function joinNames(arr, limit = 12) {
  const names = (arr || []).map((x) => x?.name).filter(Boolean);
  if (!names.length) return "";
  const clipped = names.slice(0, limit);
  return clipped.join(", ") + (names.length > limit ? "..." : "");
}

function DeltaPill({ roleId, finalScore, prevItems }) {
  if (!prevItems) return null;

  const prev = prevItems.get(roleId);
  if (!prev) {
    return (
      <Tooltip title="This role was not in your previous run" arrow>
        <Chip
          label="new"
          size="small"
          sx={{
            bgcolor: "rgba(34,197,94,0.10)",
            color: "#86efac",
            border: "1px solid rgba(34,197,94,0.20)",
            fontWeight: 700,
            fontSize: "0.67rem",
            height: 20,
          }}
        />
      </Tooltip>
    );
  }

  const delta = finalScore - prev.final_score;
  if (Math.abs(delta) < 0.05) return null;
  const up = delta > 0;
  return (
    <Tooltip title={`Score changed from ${prev.final_score.toFixed(1)} in previous run`} arrow>
      <Chip
        label={up ? `+${delta.toFixed(1)}` : delta.toFixed(1)}
        size="small"
        sx={{
          bgcolor: up ? "rgba(34,197,94,0.10)" : "rgba(239,68,68,0.10)",
          color: up ? "#86efac" : "#fca5a5",
          border: `1px solid ${up ? "rgba(34,197,94,0.20)" : "rgba(239,68,68,0.20)"}`,
          fontWeight: 700,
          fontSize: "0.70rem",
          height: 20,
        }}
      />
    </Tooltip>
  );
}

function ScorePill({ value, type }) {
  const styles = {
    amber: { bgcolor: "rgba(245,158,11,0.12)", color: "#fcd34d", border: "1px solid rgba(245,158,11,0.22)" },
    green: { bgcolor: "rgba(34,197,94,0.10)", color: "#86efac", border: "1px solid rgba(34,197,94,0.20)" },
    yellow: { bgcolor: "rgba(234,179,8,0.10)", color: "#fde047", border: "1px solid rgba(234,179,8,0.20)" },
    red: { bgcolor: "rgba(239,68,68,0.10)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.20)" },
    muted: { bgcolor: "rgba(255,255,255,0.06)", color: "rgba(241,240,255,0.40)", border: "1px solid rgba(255,255,255,0.10)" },
  };
  return (
    <Chip
      label={value}
      size="small"
      sx={{ ...styles[type] || styles.muted, fontWeight: 700, minWidth: 52, justifyContent: "center" }}
    />
  );
}

const sectionLabel = {
  color: "text.secondary",
  fontWeight: 650,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  fontSize: "0.65rem",
};

export default function RoleRecommendationsTable({
  items,
  prevItems = null,
  emptyText = "No recommendations to show.",
}) {
  const [openRoleId, setOpenRoleId] = useState(null);

  function toggle(roleId) {
    setOpenRoleId((prev) => (prev === roleId ? null : roleId));
  }

  const [page, setPage] = useState(0);
  const PAGE_SIZE = 5;
  const totalPages = Math.ceil(items.length / PAGE_SIZE);
  const visibleItems = items.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);


  if (!items || items.length === 0) {
    return (
      <Box sx={{
        mt: 3, py: 7, px: 3,
        textAlign: "center",
        border: "1px dashed rgba(255,255,255,0.08)",
        borderRadius: "10px",
        bgcolor: "rgba(255,255,255,0.008)",
      }}>
        <Box sx={{
          width: 44, height: 44, borderRadius: "10px",
          bgcolor: "rgba(245,158,11,0.08)",
          border: "1px solid rgba(245,158,11,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center",
          mx: "auto", mb: 2,
        }}>
          <AutoAwesome sx={{ fontSize: 20, color: "#f59e0b" }} />
        </Box>
        <Typography sx={{ fontWeight: 650, fontSize: "0.9375rem", mb: 0.75 }}>
          No results yet
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", maxWidth: 340, mx: "auto" }}>
          {emptyText}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 3, display: "grid", gap: 1.5 }}>
      {visibleItems.map((r, idx) => {
        const rank = page * PAGE_SIZE + idx + 1;
        const competency = safeNum(r.competency_score);
        const bonus = safeNum(r.preference_bonus);
        const finalScore = safeNum(r.final_score);
        const isOpen = openRoleId === r.role_id;
        const exp = r.explanation || null;

        const matched = exp?.summary?.matched_count ?? exp?.matched?.length ?? 0;
        const partial = exp?.summary?.partial_count ?? exp?.partial?.length ?? 0;
        const missing = exp?.summary?.missing_count ?? exp?.missing?.length ?? 0;

        const pref = r.preference || exp?.preference || null;
        const isPreferredRole = pref?.is_preferred_role ? true : false;
        const techOverlapCount = safeNum(pref?.tech_overlap_count);
        const missingText = joinNames(exp?.missing, 12);

        return (
          <Paper key={r.role_id} sx={{ overflow: "hidden" }}>
            <Box sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              px: 3,
              py: 2,
              flexWrap: "wrap",
            }}>

              <Typography sx={{
                fontWeight: 800,
                fontSize: "0.78rem",
                color: "rgba(241,240,255,0.22)",
                minWidth: 22,
                flexShrink: 0,
              }}>
                #{rank}
              </Typography>

              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                  <Typography sx={{ fontWeight: 700, fontSize: "0.9375rem" }}>{r.title}</Typography>
                  {isPreferredRole && (
                    <Chip
                      icon={<Star sx={{ fontSize: "12px !important", color: "#fcd34d !important" }} />}
                      label="Preferred"
                      size="small"
                      sx={{
                        bgcolor: "rgba(245,158,11,0.10)",
                        color: "#fcd34d",
                        border: "1px solid rgba(245,158,11,0.20)",
                        height: 20,
                        fontSize: "0.70rem",
                      }}
                    />
                  )}
                </Box>
                {r.description && (
                  <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.25, fontSize: "0.82rem" }}>
                    {r.description}
                  </Typography>
                )}
              </Box>

              <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexShrink: 0, flexWrap: "wrap" }}>
                <Tooltip title="Competency score: How well your current skills match what this role requires. Based on skill levels vs required levels." arrow>
                  <span><ScorePill
                    value={competency.toFixed(1)}
                    type={competency === 0 ? "red" : competency < 40 ? "red" : competency < 65 ? "muted" : competency < 80 ? "yellow" : "green"}
                  /></span>
                </Tooltip>
                <Tooltip title="Preference bonus: A small capped boost applied if this role or its technologies match your profile preferences. Acts as a tie-breaker only." arrow>
                  <span><ScorePill value={`+${bonus.toFixed(1)}`} type={bonus > 0 ? "green" : "muted"} /></span>
                </Tooltip>
                <Tooltip title="Final score: Competency score plus preference bonus. This is the number used to rank roles." arrow>
                  <span><ScorePill value={finalScore.toFixed(1)} type="amber" /></span>
                </Tooltip>

                <DeltaPill roleId={r.role_id} finalScore={finalScore} prevItems={prevItems} />
              </Box>

              <Tooltip title={isOpen ? "Hide details" : "Show details"} arrow>
                <IconButton
                  size="small"
                  onClick={() => toggle(r.role_id)}
                  sx={{
                    flexShrink: 0,
                    transition: "transform 200ms ease",
                    transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                >
                  <ExpandMore fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>

            <Collapse in={isOpen} unmountOnExit>
              <Divider sx={{ borderColor: "rgba(255,255,255,0.06)" }} />
              <Box sx={{ px: 3, py: 2.5, bgcolor: "rgba(255,255,255,0.012)" }}>

                <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mb: 2 }}>
                  <Chip
                    icon={<CheckCircle sx={{ fontSize: "13px !important", color: "#86efac !important" }} />}
                    label={`Matched: ${matched}`}
                    size="small"
                    sx={{ bgcolor: "rgba(34,197,94,0.10)", color: "#86efac", border: "1px solid rgba(34,197,94,0.20)" }}
                  />
                  <Chip
                    icon={<RemoveCircle sx={{ fontSize: "13px !important", color: "#fcd34d !important" }} />}
                    label={`Partial: ${partial}`}
                    size="small"
                    sx={{ bgcolor: "rgba(245,158,11,0.10)", color: "#fcd34d", border: "1px solid rgba(245,158,11,0.20)" }}
                  />
                  <Chip
                    icon={<Cancel sx={{ fontSize: "13px !important", color: "#fca5a5 !important" }} />}
                    label={`Missing: ${missing}`}
                    size="small"
                    sx={{ bgcolor: "rgba(239,68,68,0.10)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.20)" }}
                  />
                  {techOverlapCount > 0 && (
                    <Chip
                      label={`Tech overlap: ${techOverlapCount}`}
                      size="small"
                      sx={{
                        bgcolor: "rgba(255,255,255,0.06)",
                        color: "rgba(241,240,255,0.60)",
                        border: "1px solid rgba(255,255,255,0.10)",
                      }}
                    />
                  )}
                </Box>

                <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: missingText ? 2 : 0 }}>
                  Competency is based on required skills vs your saved skills. Bonus is a capped
                  tie-breaker using preferred roles and preferred technologies.
                </Typography>

                {(() => {
                  if (!prevItems) return null;
                  const prev = prevItems.get(r.role_id);
                  if (!prev) return null;
                  const prevExp = prev.explanation || {};
                  const currExp = exp || {};
                  const prevMatchedIds = new Set((prevExp.matched || []).map((s) => s.skill_id));
                  const currMatchedIds = new Set((currExp.matched || []).map((s) => s.skill_id));
                  const gained = (currExp.matched || []).filter((s) => !prevMatchedIds.has(s.skill_id));
                  const lost = (prevExp.matched || []).filter((s) => !currMatchedIds.has(s.skill_id));
                  if (!gained.length && !lost.length) return null;
                  return (
                    <Box sx={{ mt: 2 }}>
                      <Typography sx={{ ...sectionLabel, mb: 0.75 }}>Changes since last run</Typography>
                      {gained.length > 0 && (
                        <Typography variant="body2" sx={{ color: "#86efac", fontSize: "0.82rem", mb: 0.5 }}>
                          Now matching: {gained.map((s) => s.name).join(", ")}
                        </Typography>
                      )}
                      {lost.length > 0 && (
                        <Typography variant="body2" sx={{ color: "#fca5a5", fontSize: "0.82rem" }}>
                          No longer matching: {lost.map((s) => s.name).join(", ")}
                        </Typography>
                      )}
                    </Box>
                  );
                })()}

                {missingText && (
                  <Box sx={{ mt: 2 }}>
                    <Typography sx={{ ...sectionLabel, mb: 0.75 }}>Skills to work on</Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.82rem" }}>
                      {missingText}
                    </Typography>
                  </Box>
                )}
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="outlined"
                    color="secondary"
                    size="small"
                    component={Link}
                    to={`/planner?role_id=${r.role_id}`}
                    startIcon={<CalendarMonth sx={{ fontSize: "15px !important" }} />}
                  >
                    Build a plan for this role
                  </Button>
                </Box>
              </Box>
            </Collapse>
          </Paper>
        );
      })}
      {totalPages > 1 && (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 1.5, px: 0.5 }}>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, items.length)} of {items.length} roles
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              size="small"
              variant="outlined"
              color="secondary"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              sx={{ minWidth: 80 }}
            >
              Previous
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="secondary"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              sx={{ minWidth: 80 }}
            >
              Next
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}
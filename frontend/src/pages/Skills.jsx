import { useEffect, useMemo, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import {
  Box, Paper, Typography, Button, Alert, Tooltip,
  CircularProgress, TextField, InputAdornment, IconButton, Popover,
} from "@mui/material";
import { Search, Add, CheckCircle, InfoOutlined, KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";
import { useToast } from "../toast/ToastContext";

const sectionLabel = {
  color: "text.secondary",
  fontWeight: 650,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  fontSize: "0.68rem",
};



function FilterPill({ label, count, active, onClick }) {
  return (
    <Box
      onClick={onClick}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.75,
        px: 1.5,
        py: 0.6,
        borderRadius: "6px",
        border: active
          ? "1px solid rgba(245,158,11,0.45)"
          : "1px solid rgba(255,255,255,0.08)",
        bgcolor: active
          ? "rgba(245,158,11,0.08)"
          : "rgba(255,255,255,0.02)",
        cursor: "pointer",
        transition: "all 120ms ease",
        userSelect: "none",
        flexShrink: 0,
        "&:hover": {
          borderColor: active ? "rgba(245,158,11,0.55)" : "rgba(255,255,255,0.14)",
          bgcolor: active ? "rgba(245,158,11,0.10)" : "rgba(255,255,255,0.04)",
        },
      }}
    >
      <Typography sx={{
        fontSize: "0.8rem",
        fontWeight: active ? 650 : 520,
        color: active ? "#f59e0b" : "rgba(241,240,255,0.65)",
        lineHeight: 1,
        transition: "color 120ms ease",
      }}>
        {label}
      </Typography>
      <Typography sx={{
        fontSize: "0.68rem",
        fontWeight: 650,
        color: active ? "rgba(245,158,11,0.75)" : "rgba(241,240,255,0.30)",
        lineHeight: 1,
      }}>
        {count}
      </Typography>
    </Box>
  );
}



export default function Skills() {
  const { isAuthed } = useAuth();
  const [skills, setSkills] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [mySkillIds, setMySkillIds] = useState(new Set());
  const [addingId, setAddingId] = useState(null);
  const showToast = useToast();
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [categoryShowMore, setCategoryShowMore] = useState({});
  const CAT_PAGE_SIZE = 8;
  const [infoAnchor, setInfoAnchor] = useState(null);
  const [infoSkill, setInfoSkill] = useState(null);
  const [infoRoles, setInfoRoles] = useState(null);
  const rolesCache = useRef({});

  useEffect(() => {
    (async () => {
      try {
        const promises = [api("/api/skills")];
        if (isAuthed) promises.push(api("/api/user-skills"));
        const [data, userSkills] = await Promise.all(promises);
        setSkills(Array.isArray(data) ? data : []);
        if (userSkills) {
          setMySkillIds(new Set(userSkills.map((s) => s.skill_id)));
        }
      } catch (e) {
        setErr(e.message || "Failed to load skills.");
      } finally {
        setLoading(false);
      }
    })();
  }, [isAuthed]);


  const categories = useMemo(() => {
    const cats = [...new Set(skills.map((s) => s.category || "Other"))].sort();
    return ["All", ...cats];
  }, [skills]);


  const categoryCounts = useMemo(() => {
    const counts = { All: skills.length };
    for (const s of skills) {
      const cat = s.category || "Other";
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return counts;
  }, [skills]);


  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return skills.filter((s) => {
      const matchesCat = activeCategory === "All" || (s.category || "Other") === activeCategory;
      const matchesQ = !q || s.name.toLowerCase().includes(q);
      return matchesCat && matchesQ;
    });
  }, [skills, activeCategory, query]);


  const grouped = useMemo(() => {
    return filtered.reduce((acc, s) => {
      const cat = s.category || "Other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(s);
      return acc;
    }, {});
  }, [filtered]);

  const groupedCategories = Object.keys(grouped).sort();

  useEffect(() => {
    setExpandedGroups(new Set());
    setCategoryShowMore({});
  }, [activeCategory, query]);

  const isGroupExpanded = (cat) => activeCategory !== "All" || expandedGroups.has(cat);

  function toggleGroup(cat) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }


  async function fetchRolesFor(skillId) {
    if (rolesCache.current[skillId] !== undefined) return rolesCache.current[skillId];
    try {
      const data = await api(`/api/skills/${skillId}/roles`);
      rolesCache.current[skillId] = Array.isArray(data) ? data : [];
    } catch {
      rolesCache.current[skillId] = [];
    }
    return rolesCache.current[skillId];
  }

  function openInfo(e, skill) {
    e.stopPropagation();
    setInfoAnchor(e.currentTarget);
    setInfoSkill(skill);
    const cached = rolesCache.current[skill.id];
    setInfoRoles(cached !== undefined ? cached : null);
    fetchRolesFor(skill.id).then((data) => setInfoRoles(data));
  }

  function closeInfo() {
    setInfoAnchor(null);
    setInfoSkill(null);
    setInfoRoles(null);
  }

  async function quickAdd(skill) {
    setAddingId(skill.id);
    try {
      await api("/api/user-skills", {
        method: "POST",
        body: JSON.stringify({
          skill_id: skill.id,
          proficiency_level: 3,
          evidence: null,
        }),
      });
      setMySkillIds((prev) => new Set([...prev, skill.id]));
      showToast(`${skill.name} added at Intermediate level.`);
    } catch (e) {
      showToast(e.message || "Failed to add skill.", "error");
    } finally {
      setAddingId(null);
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
        <Box>
          <Typography variant="h4" sx={{ mb: 0.5 }}>Skills Library</Typography>
          <Typography sx={{ color: "text.secondary" }}>
            {skills.length} skills across {categories.length - 1} categories. Use the filters below to browse by area.{" "}
            {isAuthed ? "Quick-add any skill directly from this page." : "Create an account to track them."}
          </Typography>
        </Box>
        {!isAuthed && (
          <Button variant="contained" component={Link} to="/register">
            Create account
          </Button>
        )}
      </Box>

      {err && <Alert severity="error" sx={{ mb: 3 }}>{err}</Alert>}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Box sx={{ mb: 2.5, display: "flex", flexDirection: "column", gap: 1.5 }}>
            <TextField
              placeholder="Search skills..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              size="small"
              sx={{ maxWidth: 340 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ fontSize: 17, color: "rgba(241,240,255,0.30)" }} />
                  </InputAdornment>
                ),
              }}
            />

            <Box>
              <Typography sx={{
                fontSize: "0.68rem",
                fontWeight: 700,
                letterSpacing: "0.07em",
                textTransform: "uppercase",
                color: "rgba(241,240,255,0.28)",
                mb: 0.75,
              }}>
                Filter by category
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {categories.map((cat) => (
                  <FilterPill
                    key={cat}
                    label={cat}
                    count={categoryCounts[cat] || 0}
                    active={activeCategory === cat}
                    onClick={() => setActiveCategory(cat)}
                  />
                ))}
              </Box>
            </Box>
          </Box>

          {(query || activeCategory !== "All") && (
            <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 2 }}>
              {filtered.length} result{filtered.length !== 1 ? "s" : ""}
              {query ? ` for "${query}"` : ""}
              {activeCategory !== "All" ? ` in ${activeCategory}` : ""}
            </Typography>
          )}

          {groupedCategories.length === 0 ? (
            <Box sx={{ py: 6, textAlign: "center" }}>
              <Typography sx={{ color: "text.secondary" }}>No skills match your search.</Typography>
            </Box>
          ) : (
            <Box sx={{ display: "grid", gap: 1.5 }}>
              {groupedCategories.map((cat) => (
                <Paper key={cat} sx={{ overflow: "hidden" }}>

                  <Box
                    onClick={() => activeCategory === "All" && toggleGroup(cat)}
                    sx={{
                      px: 3, py: 1.75,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderBottom: isGroupExpanded(cat) ? "1px solid rgba(255,255,255,0.06)" : "none",
                      bgcolor: "rgba(255,255,255,0.012)",
                      cursor: activeCategory === "All" ? "pointer" : "default",
                      userSelect: "none",
                      transition: "background 120ms ease",
                      "&:hover": activeCategory === "All" ? { bgcolor: "rgba(255,255,255,0.025)" } : {},
                    }}
                  >
                    <Typography sx={{
                      fontWeight: 680,
                      fontSize: "0.875rem",
                      color: "rgba(241,240,255,0.88)",
                    }}>
                      {cat}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography sx={{ ...sectionLabel }}>
                        {grouped[cat].length} skill{grouped[cat].length !== 1 ? "s" : ""}
                      </Typography>
                      {activeCategory === "All" && (
                        isGroupExpanded(cat)
                          ? <KeyboardArrowUp sx={{ fontSize: 16, color: "rgba(241,240,255,0.35)" }} />
                          : <KeyboardArrowDown sx={{ fontSize: 16, color: "rgba(241,240,255,0.35)" }} />
                      )}
                    </Box>
                  </Box>
{isGroupExpanded(cat) && (
                    <Box>
                      {grouped[cat].slice(0, categoryShowMore[cat] ? grouped[cat].length : CAT_PAGE_SIZE).map((s, i, arr) => (
                        <Box
                          key={s.id}
                          onMouseEnter={() => fetchRolesFor(s.id)}
                          sx={{
                            px: 3, py: 1.4,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            borderBottom: i < arr.length - 1
                              ? "1px solid rgba(255,255,255,0.04)"
                              : "none",
                            transition: "background 120ms ease",
                            "&:hover": { bgcolor: "rgba(255,255,255,0.02)" },
                          }}
                        >
                          <Typography sx={{ fontWeight: 580, fontSize: "0.875rem" }}>
                            {s.name}
                          </Typography>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            <Tooltip title="See which roles require this skill" arrow>
                              <IconButton
                                size="small"
                                onClick={(e) => openInfo(e, s)}
                                onMouseEnter={() => fetchRolesFor(s.id)}
                                sx={{
                                  opacity: 0,
                                  ".MuiBox-root:hover &": { opacity: 1 },
                                  transition: "opacity 120ms ease",
                                  color: "rgba(241,240,255,0.45)",
                                  "&:hover": {
                                    bgcolor: "rgba(255,255,255,0.06) !important",
                                    color: "rgba(241,240,255,0.90) !important",
                                  },
                                }}
                              >
                                <InfoOutlined sx={{ fontSize: 15 }} />
                              </IconButton>
                            </Tooltip>
                            {isAuthed && (
                              mySkillIds.has(s.id) ? (
                                <Tooltip title="Already in My Skills" arrow>
                                  <CheckCircle sx={{ fontSize: 16, color: "#22c55e", flexShrink: 0 }} />
                                </Tooltip>
                              ) : (
                                <Tooltip title="Add to My Skills at Intermediate level" arrow>
                                  <span>
                                    <IconButton
                                      size="small"
                                      disabled={addingId === s.id}
                                      onClick={() => quickAdd(s)}
                                      sx={{
                                        opacity: 0,
                                        ".MuiBox-root:hover &": { opacity: 1 },
                                        transition: "opacity 120ms ease",
                                        "&:hover": {
                                          bgcolor: "rgba(245,158,11,0.10) !important",
                                          color: "#fcd34d !important",
                                        },
                                      }}
                                    >
                                      {addingId === s.id
                                        ? <CircularProgress size={13} />
                                        : <Add fontSize="small" />
                                      }
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              )
                            )}
                          </Box>
                        </Box>
                      ))}

                      {grouped[cat].length > CAT_PAGE_SIZE && (
                        <Box
                          onClick={() => setCategoryShowMore((prev) => ({ ...prev, [cat]: !prev[cat] }))}
                          sx={{
                            px: 3, py: 1.25,
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            cursor: "pointer",
                            borderTop: "1px solid rgba(255,255,255,0.04)",
                            bgcolor: "rgba(255,255,255,0.008)",
                            transition: "background 120ms ease",
                            "&:hover": { bgcolor: "rgba(255,255,255,0.02)" },
                          }}
                        >
                          <Typography sx={{
                            fontSize: "0.78rem",
                            fontWeight: 620,
                            color: "rgba(245,158,11,0.75)",
                            "&:hover": { color: "#f59e0b" },
                            transition: "color 120ms ease",
                          }}>
                            {categoryShowMore[cat]
                              ? "Show less"
                              : `Show ${grouped[cat].length - CAT_PAGE_SIZE} more`
                            }
                          </Typography>
                          {categoryShowMore[cat]
                            ? <KeyboardArrowUp sx={{ fontSize: 14, color: "rgba(245,158,11,0.75)" }} />
                            : <KeyboardArrowDown sx={{ fontSize: 14, color: "rgba(245,158,11,0.75)" }} />
                          }
                        </Box>
                      )}
                    </Box>
                  )}
                </Paper>
              ))}
            </Box>
          )}
        </>
      )}

      <Popover
        open={Boolean(infoAnchor)}
        anchorEl={infoAnchor}
        onClose={closeInfo}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        sx={{
          "& .MuiPopover-paper": {
            bgcolor: "#13111f",
            border: "1px solid rgba(255,255,255,0.09)",
            borderRadius: "10px",
            p: 2,
            maxWidth: 260,
            minWidth: 180,
          },
        }}
      >
        {infoSkill && (
          <Box>
            <Typography sx={{ fontWeight: 680, fontSize: "0.875rem", mb: 1 }}>
              {infoSkill.name}
            </Typography>
            {infoRoles === null ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={12} sx={{ color: "rgba(241,240,255,0.45)" }} />
                <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>Loading...</Typography>
              </Box>
            ) : infoRoles.length === 0 ? (
              <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
                Not required by any role.
              </Typography>
            ) : (
              <>
                <Typography sx={{ ...sectionLabel, mb: 0.75 }}>Required by</Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.4 }}>
                  {infoRoles.map((r) => (
                    <Typography key={r.id} sx={{ fontSize: "0.8125rem", color: "rgba(241,240,255,0.80)" }}>
                      {r.title}
                    </Typography>
                  ))}
                </Box>
              </>
            )}
          </Box>
        )}
      </Popover>
    </Box>
  );
}
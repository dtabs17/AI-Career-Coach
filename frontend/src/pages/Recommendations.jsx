import { useState } from "react";
import { Card, Button, Alert, Table, Collapse, Badge, Spinner, ButtonGroup } from "react-bootstrap";
import { api } from "../api/client";

function safeNum(n) {
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
}

export default function Recommendations() {
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const [run, setRun] = useState(null);
  const [views, setViews] = useState(null); // { best_fit, best_fit_plus_preferences, preferred_roles_alignment }
  const [openRoleId, setOpenRoleId] = useState(null);

  const [viewMode, setViewMode] = useState("final"); // "skills" | "final" | "preferred"

  const [executedAt, setExecutedAt] = useState(null);


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
      setOpenRoleId(null);

    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  function toggle(roleId) {
    setOpenRoleId((prev) => (prev === roleId ? null : roleId));
  }

  const list =
    viewMode === "skills"
      ? (views?.best_fit || [])
      : viewMode === "preferred"
        ? (views?.preferred_roles_alignment || [])
        : (views?.best_fit_plus_preferences || []);

  const subtitle =
    viewMode === "skills"
      ? "Best fit based on your current skills (competency only)."
      : viewMode === "preferred"
        ? "Your preferred roles and how close you are based on current skills."
        : "Best fit with preferences applied as a small tie-breaker.";

  return (
    <div className="page-animate">
      <Card className="shadow-sm">
        <Card.Body>
          <div className="d-flex align-items-start justify-content-between flex-wrap gap-2">
            <div>
              <h3 className="page-title">Recommendations</h3>
              <div className="page-subtitle">{subtitle}</div>
            </div>

            <div className="d-flex gap-2 align-items-center flex-wrap">
              <ButtonGroup>
                <Button
                  variant={viewMode === "skills" ? "primary" : "outline-light"}
                  onClick={() => setViewMode("skills")}
                >
                  Best fit
                </Button>
                <Button
                  variant={viewMode === "final" ? "primary" : "outline-light"}
                  onClick={() => setViewMode("final")}
                >
                  Best fit + preferences
                </Button>
                <Button
                  variant={viewMode === "preferred" ? "primary" : "outline-light"}
                  onClick={() => setViewMode("preferred")}
                >
                  Preferred roles
                </Button>
              </ButtonGroup>

              <Button className="btn-primary" onClick={runNow} disabled={loading}>
                {loading ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Running...
                  </>
                ) : (
                  "Run recommendations"
                )}
              </Button>
            </div>
          </div>

          {err ? <Alert variant="danger" className="mt-3">{err}</Alert> : null}

          {run ? (
            <div className="mt-3 text-muted" style={{ fontSize: 12 }}>
              Last run: {new Date(executedAt || run.created_at).toLocaleString()}
              
            </div>
          ) : null}


          {views && viewMode === "preferred" && !list.length ? (
            <div className="mt-3 text-muted" style={{ fontSize: 13 }}>
              No preferred roles found. Add some in Profile, then run recommendations again.
            </div>
          ) : null}

          {list.length ? (
            <div className="mt-3">
              <Table responsive hover className="mb-0">
                <thead>
                  <tr>
                    <th style={{ width: 120 }}>Competency</th>
                    <th style={{ width: 110 }}>Bonus</th>
                    <th style={{ width: 110 }}>Final</th>
                    <th>Role</th>
                    <th style={{ width: 160 }}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((r) => {
                    const competency = safeNum(r.competency_score);
                    const bonus = safeNum(r.preference_bonus);
                    const finalScore = safeNum(r.final_score);

                    const isOpen = openRoleId === r.role_id;
                    const exp = r.explanation;

                    const matched = exp?.summary?.matched_count ?? exp?.matched?.length ?? 0;
                    const partial = exp?.summary?.partial_count ?? exp?.partial?.length ?? 0;
                    const missing = exp?.summary?.missing_count ?? exp?.missing?.length ?? 0;

                    const pref = r.preference || exp?.preference || null;
                    const isPreferredRole = pref?.is_preferred_role ? true : false;
                    const techOverlapCount = safeNum(pref?.tech_overlap_count);

                    return (
                      <tr key={r.role_id}>
                        <td>
                          <Badge bg="info">{competency.toFixed(1)}</Badge>
                        </td>
                        <td>
                          <Badge bg={bonus > 0 ? "success" : "secondary"}>{bonus.toFixed(1)}</Badge>
                        </td>
                        <td>
                          <Badge bg="warning" text="dark">{finalScore.toFixed(1)}</Badge>
                        </td>
                        <td>
                          <div style={{ fontWeight: 650 }}>{r.title}</div>
                          <div className="text-muted" style={{ fontSize: 13 }}>
                            {r.description || "No description yet."}
                          </div>

                          <Collapse in={isOpen}>
                            <div className="mt-3">
                              <div className="d-flex gap-2 flex-wrap mb-2">
                                <Badge bg="success">Matched: {matched}</Badge>
                                <Badge bg="warning" text="dark">Partial: {partial}</Badge>
                                <Badge bg="danger">Missing: {missing}</Badge>
                                {isPreferredRole ? <Badge bg="primary">Preferred role</Badge> : null}
                                {techOverlapCount > 0 ? <Badge bg="primary">Tech overlap: {techOverlapCount}</Badge> : null}
                              </div>

                              <div className="text-muted" style={{ fontSize: 13 }}>
                                Competency is based on required skills vs your saved skills. Bonus is a capped tie-breaker using preferred roles and preferred technologies.
                              </div>

                              {exp?.missing?.length ? (
                                <div className="mt-2">
                                  <div style={{ fontWeight: 650, fontSize: 13 }}>Missing skills</div>
                                  <div className="text-muted" style={{ fontSize: 13 }}>
                                    {exp.missing.slice(0, 8).map((s) => s.name).join(", ")}
                                    {exp.missing.length > 8 ? "..." : ""}
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          </Collapse>
                        </td>
                        <td>
                          <Button variant="outline-light" onClick={() => toggle(r.role_id)}>
                            {isOpen ? "Hide" : "Show"}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          ) : (
            <div className="mt-3 text-muted" style={{ fontSize: 13 }}>
              No results yet. Click “Run recommendations”.
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}

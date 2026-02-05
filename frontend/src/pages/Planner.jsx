import { useEffect, useMemo, useState } from "react";
import {
  Card,
  Button,
  Form,
  Row,
  Col,
  Alert,
  Badge,
  ProgressBar,
  Table,
  Spinner,
} from "react-bootstrap";
import { api } from "../api/client";

function groupByStatus(items) {
  const g = { missing: [], partial: [], matched: [] };
  for (const it of items || []) {
    if (g[it.status]) g[it.status].push(it);
  }
  return g;
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

  useEffect(() => {
    (async () => {
      try {
        const r = await api("/api/roles");
        setRoles(Array.isArray(r) ? r : []);
      } catch (e) {
        setErr(e.message);
      }
    })();
  }, []);

  async function loadSaved() {
    setLoadingSaved(true);
    try {
      const list = await api("/api/planner/plans");
      setSavedPlans(Array.isArray(list) ? list : []);
    } catch {
      setSavedPlans([]);
    } finally {
      setLoadingSaved(false);
    }
  }

  useEffect(() => {
    loadSaved();
  }, []);

  const grouped = useMemo(() => groupByStatus(gapResult?.items), [gapResult]);

  const totalWeeks = planResult?.weeks_data?.length || 0;
  const currentWeek = totalWeeks ? planResult.weeks_data[weekIndex] : null;

  useEffect(() => {
    if (!totalWeeks) return;
    if (weekIndex > totalWeeks - 1) setWeekIndex(totalWeeks - 1);
    if (weekIndex < 0) setWeekIndex(0);
  }, [totalWeeks, weekIndex]);

  async function analyzeGap() {
    setErr("");
    setLoading(true);
    setGapResult(null);
    setPlanResult(null);
    setSavedPlanId(null);
    setWeekIndex(0);

    try {
      const data = await api(`/api/planner/gap/${roleId}`);
      setGapResult(data);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function generatePlan() {
    setErr("");
    setLoading(true);
    setPlanResult(null);
    setSavedPlanId(null);
    setWeekIndex(0);

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
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function openSaved(id) {
    setErr("");
    setLoading(true);
    setPlanResult(null);
    setSavedPlanId(id);
    setWeekIndex(0);

    try {
      const row = await api(`/api/planner/plans/${id}`);
      setPlanResult(row.details);
      setRoleId(String(row.details?.role_id || ""));
      setGapResult(null);
      setWeekIndex(0);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function deleteSaved(id) {
    const ok = window.confirm("Delete this saved plan? This cannot be undone.");
    if (!ok) return;

    setErr("");
    setDeletingId(id);

    try {
      await api(`/api/planner/plans/${id}`, { method: "DELETE" });

      if (Number(savedPlanId) === Number(id)) {
        setPlanResult(null);
        setSavedPlanId(null);
        setWeekIndex(0);
      }

      await loadSaved();
    } catch (e) {
      setErr(e.message);
    } finally {
      setDeletingId(null);
    }
  }

  function prevWeek() {
    setWeekIndex((i) => Math.max(0, i - 1));
  }

  function nextWeek() {
    setWeekIndex((i) => Math.min(totalWeeks - 1, i + 1));
  }

  return (
    <div className="page-animate">
      <Card>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
            <div>
              <h1 className="page-title">Skill gap analyzer</h1>
              <p className="page-subtitle">
                Pick a target role, see missing skills, then generate a weekly plan and save it.
              </p>
            </div>
          </div>

          {err ? <Alert variant="danger">{err}</Alert> : null}

          <Row className="g-3 align-items-end">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Target role</Form.Label>
                <Form.Select value={roleId} onChange={(e) => setRoleId(e.target.value)}>
                  <option value="">Select a role...</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={2}>
              <Form.Group>
                <Form.Label>Weeks</Form.Label>
                <Form.Control
                  type="number"
                  min={1}
                  max={24}
                  value={weeks}
                  onChange={(e) => setWeeks(e.target.value)}
                />
              </Form.Group>
            </Col>

            <Col md={4} className="d-flex gap-2">
              <Button
                variant="outline-light"
                className="btn-soft"
                onClick={analyzeGap}
                disabled={!roleId || loading}
              >
                {loading ? <Spinner size="sm" /> : "Analyze gap"}
              </Button>

              <Button className="btn-primary" onClick={generatePlan} disabled={!roleId || loading}>
                {loading ? <Spinner size="sm" className="me-2" /> : null}
                Generate plan
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {gapResult ? (
        <Card className="mt-3">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div className="planner-section-title">
                Gap summary for <span className="planner-em">{gapResult.role?.title}</span>
              </div>
              <div className="d-flex gap-2 flex-wrap">
                <Badge bg="danger">Missing: {gapResult.summary.missing}</Badge>
                <Badge bg="warning" text="dark">Partial: {gapResult.summary.partial}</Badge>
                <Badge bg="success">Matched: {gapResult.summary.matched}</Badge>
              </div>
            </div>

            <div className="mt-3 planner-progress">
              <div className="d-flex justify-content-between">
                <div className="text-muted small">Role readiness</div>
                <div className="planner-strong">{gapResult.summary.progressPct}%</div>
              </div>
              <ProgressBar now={gapResult.summary.progressPct} />
            </div>

            <Row className="g-3 mt-3">
              <Col md={4}>
                <div className="planner-col-title">Missing</div>
                <Table responsive hover className="mb-0">
                  <tbody>
                    {grouped.missing.length ? (
                      grouped.missing.slice(0, 10).map((it) => (
                        <tr key={it.skill_id}>
                          <td>
                            <div className="planner-skill">{it.name}</div>
                            <div className="text-muted planner-meta">
                              Required L{it.required_level} | Importance {it.importance}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td className="text-muted">None</td></tr>
                    )}
                  </tbody>
                </Table>
              </Col>

              <Col md={4}>
                <div className="planner-col-title">Partial</div>
                <Table responsive hover className="mb-0">
                  <tbody>
                    {grouped.partial.length ? (
                      grouped.partial.slice(0, 10).map((it) => (
                        <tr key={it.skill_id}>
                          <td>
                            <div className="planner-skill">{it.name}</div>
                            <div className="text-muted planner-meta">
                              You L{it.user_level} → Required L{it.required_level} | Importance {it.importance}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td className="text-muted">None</td></tr>
                    )}
                  </tbody>
                </Table>
              </Col>

              <Col md={4}>
                <div className="planner-col-title">Matched</div>
                <Table responsive hover className="mb-0">
                  <tbody>
                    {grouped.matched.length ? (
                      grouped.matched.slice(0, 10).map((it) => (
                        <tr key={it.skill_id}>
                          <td>
                            <div className="planner-skill">{it.name}</div>
                            <div className="text-muted planner-meta">
                              You L{it.user_level} | Required L{it.required_level}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td className="text-muted">None</td></tr>
                    )}
                  </tbody>
                </Table>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      ) : null}

      {planResult ? (
        <Card className="mt-3">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div className="planner-section-title">
                Plan for <span className="planner-em">{planResult.role_title}</span> ({planResult.weeks} weeks)
              </div>

              <div className="d-flex align-items-center gap-2 flex-wrap">
                {savedPlanId ? <Badge bg="secondary">Saved plan #{savedPlanId}</Badge> : null}

                {savedPlanId ? (
                  <Button
                    variant="outline-danger"
                    size="sm"
                    className="btn-soft-sm"
                    onClick={() => deleteSaved(savedPlanId)}
                    disabled={deletingId === savedPlanId}
                  >
                    {deletingId === savedPlanId ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        Deleting...
                      </>
                    ) : (
                      "Delete this plan"
                    )}
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="planner-weekbar mt-3">
              <div className="text-muted small">
                {totalWeeks ? `Week ${weekIndex + 1} of ${totalWeeks}` : "No weeks"}
              </div>

              <div className="d-flex gap-2">
                <Button
                  variant="outline-light"
                  size="sm"
                  className="btn-soft-sm"
                  onClick={prevWeek}
                  disabled={!totalWeeks || weekIndex === 0}
                >
                  Prev
                </Button>
                <Button
                  variant="outline-light"
                  size="sm"
                  className="btn-soft-sm"
                  onClick={nextWeek}
                  disabled={!totalWeeks || weekIndex >= totalWeeks - 1}
                >
                  Next
                </Button>
              </div>
            </div>

            <div className="mt-3">
              {currentWeek ? (
                <Card>
                  <Card.Body>
                    <div className="planner-weektitle">{currentWeek.title}</div>

                    {currentWeek.items.length ? (
                      <Table responsive hover className="mb-0">
                        <thead>
                          <tr>
                            <th>Skill</th>
                            <th>Status</th>
                            <th>Tasks</th>
                            <th>Evidence</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentWeek.items.map((it) => (
                            <tr key={it.skill_id}>
                              <td className="planner-skill">{it.name}</td>
                              <td>
                                <Badge
                                  bg={it.status === "missing" ? "danger" : "warning"}
                                  text={it.status === "partial" ? "dark" : undefined}
                                >
                                  {it.status}
                                </Badge>
                              </td>
                              <td>
                                <ul className="planner-tasklist">
                                  {it.suggested_tasks.map((t) => (
                                    <li key={t}>{t}</li>
                                  ))}
                                </ul>
                              </td>
                              <td className="text-muted planner-evidence">
                                {it.suggested_evidence}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    ) : (
                      <div className="text-muted small">Light week. Focus on review and evidence.</div>
                    )}
                  </Card.Body>
                </Card>
              ) : null}
            </div>
          </Card.Body>
        </Card>
      ) : null}

      <Card className="mt-3">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div className="planner-section-title">Saved plans</div>
            {loadingSaved ? (
              <div className="text-muted small">
                <Spinner size="sm" /> Loading...
              </div>
            ) : null}
          </div>

          {!savedPlans.length ? (
            <div className="text-muted mt-2 small">
              No saved plans yet. Generate one to store it.
            </div>
          ) : (
            <Table responsive hover className="mt-2 mb-0">
              <thead>
                <tr>
                  <th>Role</th>
                  <th style={{ width: 90 }}>Weeks</th>
                  <th style={{ width: 110 }}>Progress</th>
                  <th style={{ width: 200 }}>Created</th>
                  <th style={{ width: 220 }}></th>
                </tr>
              </thead>
              <tbody>
                {savedPlans.map((p) => (
                  <tr key={p.id}>
                    <td className="planner-skill">{p.role_title || "Unknown role"}</td>
                    <td>{p.weeks || "-"}</td>
                    <td>{Number.isFinite(Number(p.progress_pct)) ? `${p.progress_pct}%` : "-"}</td>
                    <td className="text-muted planner-meta">
                      {p.created_at ? new Date(p.created_at).toLocaleString() : "-"}
                    </td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-2">
                        <Button
                          variant="outline-light"
                          size="sm"
                          className="btn-soft-sm"
                          onClick={() => openSaved(p.id)}
                        >
                          Open
                        </Button>

                        <Button
                          variant="outline-danger"
                          size="sm"
                          className="btn-soft-sm"
                          onClick={() => deleteSaved(p.id)}
                          disabled={deletingId === p.id}
                        >
                          {deletingId === p.id ? (
                            <>
                              <Spinner size="sm" className="me-2" />
                              Deleting...
                            </>
                          ) : (
                            "Delete"
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}

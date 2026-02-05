import { useEffect, useState } from "react";
import { Card, Alert, Button, Spinner, Table, Badge } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import RoleRecommendationsTable from "../components/RoleRecommendationsTable.jsx";

export default function RecommendationHistory() {
  const navigate = useNavigate();

  const [err, setErr] = useState("");
  const [loadingRuns, setLoadingRuns] = useState(true);
  const [loadingRun, setLoadingRun] = useState(false);

  const [runs, setRuns] = useState([]);
  const [activeRun, setActiveRun] = useState(null); // {run, items}

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

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setErr("");
        setLoadingRuns(true);
        const data = await api("/api/recommendations/runs");
        if (cancelled) return;
        setRuns(Array.isArray(data) ? data : []);
      } catch (e) {
        if (cancelled) return;
        if (e.status === 401) navigate("/login");
        else setErr(e.message);
      } finally {
        if (!cancelled) setLoadingRuns(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="page-animate">
      <Card className="shadow-sm">
        <Card.Body>
          <div className="d-flex align-items-start justify-content-between flex-wrap gap-2">
            <div>
              <h3 className="page-title">Recommendation history</h3>
              <div className="page-subtitle">
                View previous recommendation runs and open results later.
              </div>
            </div>

            <div className="d-flex gap-2">
              <Button variant="outline-light" onClick={() => navigate("/recommendations")}>
                Back to recommendations
              </Button>
              <Button className="btn-primary" onClick={loadRuns} disabled={loadingRuns}>
                {loadingRuns ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Refreshing...
                  </>
                ) : (
                  "Refresh"
                )}
              </Button>
            </div>
          </div>

          {err ? <Alert variant="danger" className="mt-3">{err}</Alert> : null}

          <div className="mt-3">
            {loadingRuns ? (
              <div className="d-flex align-items-center gap-2 text-muted" style={{ fontSize: 13 }}>
                <Spinner size="sm" /> Loading runs...
              </div>
            ) : runs.length === 0 ? (
              <div className="text-muted" style={{ fontSize: 13 }}>
                No runs yet. Go run recommendations first.
              </div>
            ) : (
              <Table responsive hover className="mb-0">
                <thead>
                  <tr>
                    <th style={{ width: 140 }}>Created</th>
                    <th style={{ width: 160 }}>Algorithm</th>
                    <th>Input hash</th>
                    <th style={{ width: 120 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((r) => (
                    <tr key={r.id}>
                      <td className="text-muted" style={{ fontSize: 13 }}>
                        {new Date(r.created_at).toLocaleString()}
                      </td>
                      <td>
                        <Badge bg="secondary">{r.algo_version}</Badge>
                      </td>
                      <td className="text-muted" style={{ fontSize: 13 }}>
                        {r.input_hash}
                      </td>
                      <td className="text-end">
                        <Button
                          variant="outline-light"
                          size="sm"
                          onClick={() => openRun(r.id)}
                          disabled={loadingRun}
                        >
                          Open
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </div>

          <div className="mt-4">
            {loadingRun ? (
              <div className="d-flex align-items-center gap-2 text-muted" style={{ fontSize: 13 }}>
                <Spinner size="sm" /> Loading run details...
              </div>
            ) : activeRun?.run ? (
              <>
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <div className="text-muted" style={{ fontSize: 13 }}>
                    Opened run: {new Date(activeRun.run.created_at).toLocaleString()}
                  </div>
                </div>

                <RoleRecommendationsTable
                  items={activeRun.items || []}
                  emptyText="No items found for this run."
                />
              </>
            ) : null}
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}

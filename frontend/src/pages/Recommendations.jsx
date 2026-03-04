import { useState } from "react";
import { Card, Button, Alert, Spinner, ButtonGroup } from "react-bootstrap";
import { api } from "../api/client";
import { useNavigate } from "react-router-dom";
import RoleRecommendationsTable from "../components/RoleRecommendationsTable";

export default function Recommendations() {
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const [run, setRun] = useState(null);
  const [views, setViews] = useState(null);
  const [viewMode, setViewMode] = useState("final");
  const [executedAt, setExecutedAt] = useState(null);

  const navigate = useNavigate();

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
    } catch (e) {
      if (e.status === 401) navigate("/login");
      else setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  const getRecommendationsList = () => {
    if (viewMode === "skills") return views?.best_fit || [];
    if (viewMode === "preferred") return views?.preferred_roles_alignment || [];
    return views?.best_fit_plus_preferences || [];
  };

  const list = getRecommendationsList();

  const subtitle =
    viewMode === "skills"
      ? "Best fit based on your current skills (competency only)."
      : viewMode === "preferred"
        ? "Your preferred roles and how close you are based on current skills."
        : "Best fit with preferences applied as a small tie-breaker.";

  const emptyText =
    viewMode === "preferred" && views
      ? "No preferred roles found. Add some in Profile, then run recommendations again."
      : "No results yet. Click “Run recommendations”.";

  return (
    <div className="page-animate">
      <Card className="shadow-sm">
        <Card.Body>
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
            <h3 className="page-title mb-0">Recommendations</h3>

            <div className="d-flex gap-2 align-items-center flex-wrap flex-shrink-0">
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

              <Button variant="outline-light" onClick={() => navigate("/recommendations/history")}>
                History
              </Button>
            </div>
          </div>

          <div className="page-subtitle mt-1">{subtitle}</div>


          {err ? <Alert variant="danger" className="mt-3">{err}</Alert> : null}

          {run ? (
            <div className="mt-3 text-muted" style={{ fontSize: 12 }}>
              Last run: {new Date(executedAt || run.created_at).toLocaleString()}
            </div>
          ) : null}

          <RoleRecommendationsTable
            key={`${run?.id || "none"}-${viewMode}`}
            items={list}
            emptyText={emptyText}
          />
        </Card.Body>
      </Card>
    </div>
  );
}

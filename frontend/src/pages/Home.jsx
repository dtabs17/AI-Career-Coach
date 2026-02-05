import { useEffect, useMemo, useState } from "react";
import { Card, Button, Row, Col, Badge, ProgressBar, Spinner } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { api } from "../api/client";

function fmt(ts) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return "";
  }
}

export default function Home() {
  const { isAuthed, firstName } = useAuth();

  const [profileCompletion] = useState(65);
  const [skillsAdded] = useState(12);
  const [skillsWithEvidence] = useState(6);

  const nextSteps = useMemo(
    () => [
      { label: "Add evidence for 3 skills", to: "/my-skills" },
      { label: "Set preferred roles in your profile", to: "/profile" },
      { label: "Run recommendations", to: "/recommendations" },
    ],
    []
  );

  const [loadingChats, setLoadingChats] = useState(false);
  const [recentChats, setRecentChats] = useState([]);

  useEffect(() => {
    let mounted = true;

    async function loadChats() {
      if (!isAuthed) return;

      setLoadingChats(true);
      try {
        const list = await api("/api/chat/sessions");
        const arr = Array.isArray(list) ? list : [];
        const top = arr.slice(0, 3).map((s) => ({
          id: s.id,
          title: s.title || "New Chat",
          when: fmt(s.last_message_at || s.created_at),
        }));

        if (mounted) setRecentChats(top);
      } catch {
        if (mounted) setRecentChats([]);
      } finally {
        if (mounted) setLoadingChats(false);
      }
    }

    loadChats();
    return () => {
      mounted = false;
    };
  }, [isAuthed]);

if (!isAuthed) {
  return (
    <div className="page-animate public-home">
      <Card className="public-home-hero">
        <Card.Body>
          <div>
            <h1 className="page-title">Welcome</h1>
            <p className="page-subtitle">
              Browse the skills library without an account. Create an account to save skills, build your profile,
              generate role recommendations, and use coach chat.
            </p>
          </div>

          <Row className="g-3 mt-2">
            <Col md={4}>
              <Card className="h-100 public-home-action">
                <Card.Body className="d-flex flex-column">
                  <Card.Title className="mb-2">Skills Library</Card.Title>
                  <div className="text-muted mb-3 flex-grow-1" style={{ fontSize: 13 }}>
                    Browse skills and see what you can add later.
                  </div>
                  <Button as={Link} to="/skills" className="btn-primary w-100 mt-auto">
                    View skills
                  </Button>
                </Card.Body>
              </Card>
            </Col>

            <Col md={4}>
              <Card className="h-100 public-home-action">
                <Card.Body className="d-flex flex-column">
                  <Card.Title className="mb-2">Login</Card.Title>
                  <div className="text-muted mb-3 flex-grow-1" style={{ fontSize: 13 }}>
                    Access your dashboard, skills, recommendations, and chat.
                  </div>
                  <Button as={Link} to="/login" className="btn-primary w-100 mt-auto">
                    Login
                  </Button>
                </Card.Body>
              </Card>
            </Col>

            <Col md={4}>
              <Card className="h-100 public-home-action">
                <Card.Body className="d-flex flex-column">
                  <Card.Title className="mb-2">Register</Card.Title>
                  <div className="text-muted mb-3 flex-grow-1" style={{ fontSize: 13 }}>
                    Create an account to unlock profile, recommendations, and coach chat.
                  </div>
                  <Button as={Link} to="/register" className="btn-primary w-100 mt-auto">
                    Create account
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Row className="g-3 mt-3">
        <Col lg={7}>
          <Card className="public-home-panel">
            <Card.Body>
              <div className="d-flex align-items-center justify-content-between">
                <div style={{ fontWeight: 750 }}>What you can do now</div>
                <Badge className="pill-badge pill-badge-open">Open</Badge>
              </div>

              <div className="mt-3 public-home-list">
                <div className="public-home-list-item">
                  <div className="public-home-bullet" />
                  <div>
                    <div className="public-home-list-title">Browse all skills</div>
                    <div className="public-home-list-sub">Explore the library and categories.</div>
                  </div>
                </div>

                <div className="public-home-list-item">
                  <div className="public-home-bullet" />
                  <div>
                    <div className="public-home-list-title">See how the system works</div>
                    <div className="public-home-list-sub">Create an account when you’re ready to save progress.</div>
                  </div>
                </div>

                <div className="public-home-list-item">
                  <div className="public-home-bullet" />
                  <div>
                    <div className="public-home-list-title">Login or register anytime</div>
                    <div className="public-home-list-sub">Your dashboard is available right after signup.</div>
                  </div>
                </div>
              </div>

              <div className="mt-3 d-flex gap-2 flex-wrap">
                <Button as={Link} to="/skills" variant="outline-light" className="btn-outline-pill">
                  Browse skills
                </Button>
                <Button as={Link} to="/register" variant="outline-light" className="btn-outline-pill">
                  Create account
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={5}>
          <Card className="public-home-panel">
            <Card.Body>
              <div style={{ fontWeight: 750 }}>Next steps</div>
              <div className="text-muted" style={{ fontSize: 13, marginTop: 6 }}>
                Create an account to unlock recommendations and coach chat.
              </div>

              <div className="mt-3" style={{ display: "grid", gap: 10 }}>
                <Button as={Link} to="/register" variant="outline-light" className="public-home-step">
                  Create your account
                </Button>
                <Button as={Link} to="/login" variant="outline-light" className="public-home-step">
                  Login to your dashboard
                </Button>
                <Button as={Link} to="/skills" variant="outline-light" className="public-home-step">
                  Browse skills library
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

  return (
    <div className="page-animate">
      <Card>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
            <div>
              <h1 className="page-title">{`Welcome, ${firstName || ""}`}</h1>
              <p className="page-subtitle">
                Track your skills, get role recommendations, and improve your interview performance.
              </p>
            </div>
          </div>

          <Row className="g-3 mt-2">
            <Col md={4}>
              <Card className="h-100">
                <Card.Body className="d-flex flex-column">
                  <Card.Title className="mb-2">Skills Library</Card.Title>
                  <div className="text-muted mb-3 flex-grow-1" style={{ fontSize: 13 }}>
                    Browse skills and build your profile.
                  </div>
                  <Button as={Link} to="/skills" className="btn-primary w-100 mt-auto">
                    View skills
                  </Button>
                </Card.Body>
              </Card>
            </Col>

            <Col md={4}>
              <Card className="h-100">
                <Card.Body className="d-flex flex-column">
                  <Card.Title className="mb-2">My Skills</Card.Title>
                  <div className="text-muted mb-3 flex-grow-1" style={{ fontSize: 13 }}>
                    Add skill levels and evidence.
                  </div>
                  <Button as={Link} to="/my-skills" className="btn-primary w-100 mt-auto">
                    Manage my skills
                  </Button>
                </Card.Body>
              </Card>
            </Col>

            <Col md={4}>
              <Card className="h-100">
                <Card.Body className="d-flex flex-column">
                  <Card.Title className="mb-2">Profile</Card.Title>
                  <div className="text-muted mb-3 flex-grow-1" style={{ fontSize: 13 }}>
                    Set interests, preferred roles, and technologies.
                  </div>
                  <Button as={Link} to="/profile" className="btn-primary w-100 mt-auto">
                    Edit profile
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Row className="g-3 mt-3">
        <Col lg={7}>
          <Card className="mb-3">
            <Card.Body>
              <div className="d-flex align-items-center justify-content-between">
                <div style={{ fontWeight: 750 }}>Your progress</div>
                <Badge bg="secondary" style={{ background: "rgba(255,255,255,0.08)" }}>
                  This week
                </Badge>
              </div>

              <div className="mt-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="text-muted" style={{ fontSize: 13 }}>
                    Profile completion
                  </div>
                  <div style={{ fontWeight: 700 }}>{profileCompletion}%</div>
                </div>
                <ProgressBar now={profileCompletion} style={{ height: 10, borderRadius: 999, marginTop: 8 }} />
              </div>

              <Row className="g-2 mt-3">
                <Col sm={6}>
                  <div
                    style={{
                      border: "1px solid rgba(255,255,255,0.06)",
                      background: "rgba(18,17,26,0.35)",
                      borderRadius: 14,
                      padding: 12,
                    }}
                  >
                    <div className="text-muted" style={{ fontSize: 12 }}>
                      Skills added
                    </div>
                    <div style={{ fontWeight: 850, fontSize: 26 }}>{skillsAdded}</div>
                  </div>
                </Col>
                <Col sm={6}>
                  <div
                    style={{
                      border: "1px solid rgba(255,255,255,0.06)",
                      background: "rgba(18,17,26,0.35)",
                      borderRadius: 14,
                      padding: 12,
                    }}
                  >
                    <div className="text-muted" style={{ fontSize: 12 }}>
                      Skills with evidence
                    </div>
                    <div style={{ fontWeight: 850, fontSize: 26 }}>{skillsWithEvidence}</div>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card>
            <Card.Body>
              <div className="d-flex align-items-center justify-content-between">
                <div style={{ fontWeight: 750 }}>Recent chats</div>
                <Button as={Link} to="/chat" variant="outline-light" style={{ borderRadius: 12 }}>
                  Open chat
                </Button>
              </div>

              <div className="mt-3" style={{ display: "grid", gap: 10 }}>
                {loadingChats ? (
                  <div className="text-muted" style={{ fontSize: 13 }}>
                    <Spinner size="sm" className="me-2" />
                    Loading...
                  </div>
                ) : recentChats.length === 0 ? (
                  <div className="text-muted" style={{ fontSize: 13 }}>
                    No chats yet.
                  </div>
                ) : (
                  recentChats.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        border: "1px solid rgba(255,255,255,0.06)",
                        background: "rgba(18,17,26,0.35)",
                        borderRadius: 14,
                        padding: 12,
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis" }}>
                          {c.title}
                        </div>
                        <div className="text-muted" style={{ fontSize: 12 }}>
                          {c.when}
                        </div>
                      </div>

                      <Button
                        as={Link}
                        to="/chat"
                        variant="outline-light"
                        style={{ borderRadius: 12, whiteSpace: "nowrap" }}
                      >
                        View
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={5}>
          <Card className="mb-3">
            <Card.Body>
              <div style={{ fontWeight: 750 }}>Next steps</div>
              <div className="text-muted" style={{ fontSize: 13, marginTop: 6 }}>
                Do these to improve recommendation quality.
              </div>

              <div className="mt-3" style={{ display: "grid", gap: 10 }}>
                {nextSteps.map((s) => (
                  <Button
                    key={s.label}
                    as={Link}
                    to={s.to}
                    variant="outline-light"
                    style={{ borderRadius: 14, textAlign: "left", padding: "12px 12px" }}
                  >
                    {s.label}
                  </Button>
                ))}
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Body>
              <div className="d-flex align-items-center justify-content-between">
                <div style={{ fontWeight: 750 }}>Recommendations</div>
                <Badge bg="secondary" style={{ background: "rgba(255,255,255,0.08)" }}>
                  Insights
                </Badge>
              </div>

              <div className="text-muted" style={{ fontSize: 13, marginTop: 6 }}>
                Run a fresh recommendation to see your top matched roles.
              </div>

              <div className="mt-3 d-flex gap-2">
                <Button as={Link} to="/recommendations" className="btn-primary flex-grow-1">
                  Generate
                </Button>
                <Button as={Link} to="/recommendations/history" variant="outline-light" style={{ borderRadius: 12 }}>
                  History
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

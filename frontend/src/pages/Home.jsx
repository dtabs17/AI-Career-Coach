import { Card, Button, Row, Col, Badge } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Home() {
  const { isAuthed, firstName } = useAuth();

  return (
    <div className="page-animate">
      <Card className="shadow-sm">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
            <div>
              <h1 className="page-title">
                {isAuthed ? `Welcome, ${firstName || ""}` : "Welcome"}
              </h1>
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
    </div>
  );
}

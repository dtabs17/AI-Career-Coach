import { useEffect, useState } from "react";
import { Card, Form, Button, Alert, Row, Col } from "react-bootstrap";
import { api } from "../api/client";

function toTagArray(text) {
  return text
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function toTagText(value) {
  if (!value) return "";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

export default function Profile() {
  const [err, setErr] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const [fullName, setFullName] = useState("");
  const [yearOfStudy, setYearOfStudy] = useState("");
  const [course, setCourse] = useState("");
  const [interests, setInterests] = useState("");
  const [academicFocus, setAcademicFocus] = useState("");
  const [preferredTech, setPreferredTech] = useState("");
  const [preferredRoles, setPreferredRoles] = useState("");

  async function load() {
    setErr("");
    setSaved(false);
    setLoading(true);
    try {
      const p = await api("/api/profile");
      if (p) {
        setFullName(p.full_name || "");
        setYearOfStudy(p.year_of_study || "");
        setCourse(p.course || "");
        setInterests(p.interests || "");
        setAcademicFocus(p.academic_focus || "");
        setPreferredTech(toTagText(p.preferred_technologies));
        setPreferredRoles(toTagText(p.preferred_roles));
      }
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save(e) {
    e.preventDefault();
    setErr("");
    setSaved(false);

    try {
      await api("/api/profile", {
        method: "PUT",
        body: JSON.stringify({
          full_name: fullName || null,
          year_of_study: yearOfStudy || null,
          course: course || null,
          interests: interests || null,
          academic_focus: academicFocus || null,

          preferred_technologies: preferredTech ? toTagArray(preferredTech) : null,
          preferred_roles: preferredRoles ? toTagArray(preferredRoles) : null,
        }),
      });

      setSaved(true);
    } catch (e2) {
      setErr(e2.message);
    }
  }

  return (
    <Card className="shadow-sm">
      <Card.Body>
        <div className="d-flex align-items-start justify-content-between mb-2">
          <div>
            <h3 className="page-title">Profile</h3>
            <div className="page-subtitle">Tell the coach what you are aiming for.</div>
          </div>
        </div>

        {err ? <Alert variant="danger">{err}</Alert> : null}
        {saved ? <Alert variant="success">Saved.</Alert> : null}

        <Form onSubmit={save}>
          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Full name</Form.Label>
                <Form.Control
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Any Name..."
                  disabled={loading}
                />
              </Form.Group>
            </Col>

            <Col md={3}>
              <Form.Group>
                <Form.Label>Year of study</Form.Label>
                <Form.Control
                  value={yearOfStudy}
                  onChange={(e) => setYearOfStudy(e.target.value)}
                  placeholder="4"
                  disabled={loading}
                />
              </Form.Group>
            </Col>

            <Col md={3}>
              <Form.Group>
                <Form.Label>Course</Form.Label>
                <Form.Control
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  placeholder="Software Development"
                  disabled={loading}
                />
              </Form.Group>
            </Col>

            <Col md={12}>
              <Form.Group>
                <Form.Label>Academic focus</Form.Label>
                <Form.Control
                  value={academicFocus}
                  onChange={(e) => setAcademicFocus(e.target.value)}
                  placeholder="Backend, cloud, AI systems..."
                  disabled={loading}
                />
              </Form.Group>
            </Col>

            <Col md={12}>
              <Form.Group>
                <Form.Label>Interests</Form.Label>
                <Form.Control
                  as="textarea"
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  placeholder="What do you enjoy building? What kind of roles do you like?"
                  disabled={loading}
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label>Preferred technologies</Form.Label>
                <Form.Control
                  value={preferredTech}
                  onChange={(e) => setPreferredTech(e.target.value)}
                  placeholder="React, Node.js, PostgreSQL"
                  disabled={loading}
                />
                <div className="text-muted mt-1" style={{ fontSize: 12 }}>
                  Comma-separated.
                </div>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label>Preferred roles</Form.Label>
                <Form.Control
                  value={preferredRoles}
                  onChange={(e) => setPreferredRoles(e.target.value)}
                  placeholder="Backend Developer, Full Stack Developer"
                  disabled={loading}
                />
                <div className="text-muted mt-1" style={{ fontSize: 12 }}>
                  Comma-separated.
                </div>
              </Form.Group>
            </Col>

            <Col md={12} className="d-flex gap-2">
              <Button type="submit" className="btn-primary" disabled={loading}>
                Save profile
              </Button>
              <Button variant="outline-light" onClick={load} disabled={loading}>
                Reload
              </Button>
            </Col>
          </Row>
        </Form>
      </Card.Body>
    </Card>
  );
}

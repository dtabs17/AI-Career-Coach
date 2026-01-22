import { useEffect, useMemo, useState } from "react";
import { Card, Form, Button, Table, Alert, Row, Col } from "react-bootstrap";
import { api } from "../api/client";
import { useNavigate } from "react-router-dom";

export default function MySkills() {
  const [skills, setSkills] = useState([]);
  const [mySkills, setMySkills] = useState([]);
  const [err, setErr] = useState("");

  const [skillId, setSkillId] = useState("");
  const [level, setLevel] = useState(3);
  const [evidence, setEvidence] = useState("");

  const navigate = useNavigate();

  const skillOptions = useMemo(() => {
    return skills.slice().sort((a, b) => a.name.localeCompare(b.name));
  }, [skills]);

  async function refresh() {
    try {
      const [allSkills, userSkills] = await Promise.all([
        api("/api/skills"),
        api("/api/user-skills"),
      ]);
      setSkills(allSkills);
      setMySkills(userSkills);
      setErr("");
    } catch (e) {
      if (e.status === 401) navigate("/login");
      else setErr(e.message);
    }
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [allSkills, userSkills] = await Promise.all([
          api("/api/skills"),
          api("/api/user-skills"),
        ]);

        if (cancelled) return;

        setSkills(allSkills);
        setMySkills(userSkills);
        setErr("");
      } catch (e) {
        if (cancelled) return;

        if (e.status === 401) navigate("/login");
        else setErr(e.message);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  async function addSkill(e) {
    e.preventDefault();
    setErr("");

    try {
      await api("/api/user-skills", {
        method: "POST",
        body: JSON.stringify({
          skill_id: Number(skillId),
          proficiency_level: Number(level),
          evidence: evidence || null,
        }),
      });

      setSkillId("");
      setLevel(3);
      setEvidence("");
      await refresh();
    } catch (e) {
      if (e.status === 401) navigate("/login");
      else setErr(e.message);
    }
  }

  async function removeSkill(id) {
    setErr("");

    try {
      await api(`/api/user-skills/${id}`, { method: "DELETE" });
      await refresh();
    } catch (e) {
      if (e.status === 401) navigate("/login");
      else setErr(e.message);
    }
  }

  return (
    <div className="page-animate">
      <div className="page-header">
        <h1 className="page-title">My Skills</h1>
        <p className="page-subtitle">
          Add skills with a level and optional evidence so the system can personalise recommendations.
        </p>
      </div>

      <Card className="mb-4">
        <Card.Body>
          {err ? <Alert variant="danger" className="mb-3">{err}</Alert> : null}

          <Form onSubmit={addSkill} className="mb-4">
            <Row className="g-3 align-items-end">
              <Col md={5}>
                <Form.Group>
                  <Form.Label className="text-muted small">Skill</Form.Label>
                  <Form.Select
                    value={skillId}
                    onChange={(e) => setSkillId(e.target.value)}
                    required
                  >
                    <option value="">Select a skill...</option>
                    {skillOptions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.category ? `(${s.category})` : ""}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={2}>
                <Form.Group>
                  <Form.Label className="text-muted small">Level (1 to 5)</Form.Label>
                  <Form.Control
                    type="number"
                    min={1}
                    max={5}
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>

              <Col md={3}>
                <Form.Group>
                  <Form.Label className="text-muted small">Evidence</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    className="evidence-textarea"
                    placeholder="Evidence (optional) e.g. GitHub link, project name, module, or short proof"
                    value={evidence}
                    onChange={(e) => setEvidence(e.target.value)}
                  />
                </Form.Group>
              </Col>

              <Col md={2}>
                <Button type="submit" className="w-100" disabled={!skillId}>
                  Add
                </Button>
              </Col>
            </Row>
          </Form>

          <Table hover responsive className="mb-0">
            <thead>
              <tr>
                <th>Skill</th>
                <th>Category</th>
                <th>Level</th>
                <th>Evidence</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {mySkills.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-muted py-4">
                    No skills added yet.
                  </td>
                </tr>
              ) : (
                mySkills.map((s) => (
                  <tr key={s.skill_id}>
                    <td>{s.name}</td>
                    <td>{s.category || "-"}</td>
                    <td>{s.proficiency_level}</td>
                    <td>{s.evidence || "-"}</td>
                    <td className="text-end">
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => removeSkill(s.skill_id)}
                      >
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
}

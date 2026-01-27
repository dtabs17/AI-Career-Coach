import { useEffect, useMemo, useState } from "react";
import { Card, Form, Button, Alert, Row, Col, Badge } from "react-bootstrap";
import { api } from "../api/client";

function uniq(arr) {
  const out = [];
  const seen = new Set();
  for (const x of arr || []) {
    const v = String(x || "").trim();
    if (!v) continue;
    const key = v.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out;
}

function asArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return uniq(value);
  return [];
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

  // Options
  const [roleOptions, setRoleOptions] = useState([]); // [{id,title}]
  const [skillOptions, setSkillOptions] = useState([]); // [{id,name,category}]

  // Selected values (stored as arrays in json)
  const [preferredTech, setPreferredTech] = useState([]); // array of skill names
  const [preferredRoles, setPreferredRoles] = useState([]); // array of role titles

  // Picker state
  const [techSearch, setTechSearch] = useState("");
  const [roleSearch, setRoleSearch] = useState("");
  const [techPick, setTechPick] = useState("");
  const [rolePick, setRolePick] = useState("");

  const filteredTechOptions = useMemo(() => {
    const q = techSearch.trim().toLowerCase();
    const base = skillOptions.map((s) => s.name);
    const unique = uniq(base);
    if (!q) return unique.slice(0, 120);
    return unique.filter((n) => n.toLowerCase().includes(q)).slice(0, 120);
  }, [skillOptions, techSearch]);

  const filteredRoleOptions = useMemo(() => {
    const q = roleSearch.trim().toLowerCase();
    const base = roleOptions.map((r) => r.title);
    const unique = uniq(base);
    if (!q) return unique.slice(0, 80);
    return unique.filter((t) => t.toLowerCase().includes(q)).slice(0, 80);
  }, [roleOptions, roleSearch]);

  async function load() {
    setErr("");
    setSaved(false);
    setLoading(true);

    try {
      const [p, skills, roles] = await Promise.all([
        api("/api/profile"),
        api("/api/skills"),
        api("/api/roles"),
      ]);

      setSkillOptions(skills || []);
      setRoleOptions(roles || []);

      if (p) {
        setFullName(p.full_name || "");
        setYearOfStudy(p.year_of_study || "");
        setCourse(p.course || "");
        setInterests(p.interests || "");
        setAcademicFocus(p.academic_focus || "");

        setPreferredTech(asArray(p.preferred_technologies));
        setPreferredRoles(asArray(p.preferred_roles));
      } else {
        setPreferredTech([]);
        setPreferredRoles([]);
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

  function addTech(name) {
    const v = String(name || "").trim();
    if (!v) return;
    setPreferredTech((prev) => uniq([...(prev || []), v]));
  }

  function removeTech(name) {
    const key = String(name || "").toLowerCase();
    setPreferredTech((prev) => (prev || []).filter((x) => String(x).toLowerCase() !== key));
  }

  function addRole(title) {
    const v = String(title || "").trim();
    if (!v) return;
    setPreferredRoles((prev) => uniq([...(prev || []), v]));
  }

  function removeRole(title) {
    const key = String(title || "").toLowerCase();
    setPreferredRoles((prev) => (prev || []).filter((x) => String(x).toLowerCase() !== key));
  }

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
          preferred_technologies: preferredTech.length ? preferredTech : null,
          preferred_roles: preferredRoles.length ? preferredRoles : null,
        }),
      });

      setSaved(true);
    } catch (e2) {
      setErr(e2.message);
    }
  }

  return (
    <Card className="shadow-sm page-animate">
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

            {/* Preferred technologies picker */}
            <Col md={6}>
              <Form.Group>
                <Form.Label>Preferred technologies</Form.Label>

                <Form.Control
                  value={techSearch}
                  onChange={(e) => setTechSearch(e.target.value)}
                  placeholder="Search technologies..."
                  disabled={loading}
                />

                <div className="d-flex gap-2 mt-2">
                  <Form.Select
                    value={techPick}
                    onChange={(e) => setTechPick(e.target.value)}
                    disabled={loading}
                  >
                    <option value="">Select a technology...</option>
                    {filteredTechOptions.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </Form.Select>

                  <Button
                    type="button"
                    variant="outline-light"
                    onClick={() => {
                      addTech(techPick);
                      setTechPick("");
                    }}
                    disabled={loading || !techPick}
                  >
                    Add
                  </Button>
                </div>

                <div className="mt-2 d-flex gap-2 flex-wrap">
                  {preferredTech.length ? preferredTech.map((t) => (
                    <Badge
                      key={t}
                      bg="info"
                      style={{ cursor: "pointer" }}
                      onClick={() => removeTech(t)}
                      title="Click to remove"
                    >
                      {t}
                    </Badge>
                  )) : (
                    <div className="text-muted" style={{ fontSize: 12 }}>
                      No technologies selected.
                    </div>
                  )}
                </div>

                <div className="text-muted mt-1" style={{ fontSize: 12 }}>
                  Pick from your skills list. Click a chip to remove.
                </div>
              </Form.Group>
            </Col>

            {/* Preferred roles picker */}
            <Col md={6}>
              <Form.Group>
                <Form.Label>Preferred roles</Form.Label>

                <Form.Control
                  value={roleSearch}
                  onChange={(e) => setRoleSearch(e.target.value)}
                  placeholder="Search roles..."
                  disabled={loading}
                />

                <div className="d-flex gap-2 mt-2">
                  <Form.Select
                    value={rolePick}
                    onChange={(e) => setRolePick(e.target.value)}
                    disabled={loading}
                  >
                    <option value="">Select a role...</option>
                    {filteredRoleOptions.map((title) => (
                      <option key={title} value={title}>{title}</option>
                    ))}
                  </Form.Select>

                  <Button
                    type="button"
                    variant="outline-light"
                    onClick={() => {
                      addRole(rolePick);
                      setRolePick("");
                    }}
                    disabled={loading || !rolePick}
                  >
                    Add
                  </Button>
                </div>

                <div className="mt-2 d-flex gap-2 flex-wrap">
                  {preferredRoles.length ? preferredRoles.map((r) => (
                    <Badge
                      key={r}
                      bg="success"
                      style={{ cursor: "pointer" }}
                      onClick={() => removeRole(r)}
                      title="Click to remove"
                    >
                      {r}
                    </Badge>
                  )) : (
                    <div className="text-muted" style={{ fontSize: 12 }}>
                      No roles selected.
                    </div>
                  )}
                </div>

                <div className="text-muted mt-1" style={{ fontSize: 12 }}>
                  Pick from your role library. Click a chip to remove.
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

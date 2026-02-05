import { useEffect, useState } from "react";
import { Card, Table, Badge, Alert, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";

export default function Skills() {
  const { isAuthed } = useAuth();

  const [skills, setSkills] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await api("/api/skills");
        setSkills(Array.isArray(data) ? data : []);
      } catch (e) {
        setErr(e.message || "Failed to load skills.");
      }
    })();
  }, []);

  return (
    <div className="page-animate">
      <Card>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
            <div>
              <h1 className="page-title" style={{ fontSize: 24 }}>
                Skills Library
              </h1>
              <p className="page-subtitle">
                Browse skills by name and category. {isAuthed ? "Add them from My Skills." : "Create an account to save them."}
              </p>
            </div>

            {!isAuthed && (
              <Button as={Link} to="/register" className="btn-primary" style={{ height: 44, borderRadius: 14 }}>
                Create account
              </Button>
            )}
          </div>

          {err ? <Alert variant="danger" className="mt-3">{err}</Alert> : null}

          <div className="skills-table-wrap mt-3">
            <Table hover responsive className="mb-0">
              <thead>
                <tr>
                  <th style={{ width: "60%" }}>Name</th>
                  <th>Category</th>
                </tr>
              </thead>
              <tbody>
                {skills.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 650 }}>{s.name}</td>
                    <td>
                      {s.category ? (
                        <Badge className="pill-badge">{s.category}</Badge>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}

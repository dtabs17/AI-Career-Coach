import { useEffect, useState } from "react";
import { Card, Table, Badge, Alert } from "react-bootstrap";
import { api } from "../api/client";

export default function Skills() {
  const [skills, setSkills] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await api("/api/skills");
        setSkills(data);
      } catch (e) {
        setErr(e.message);
      }
    })();
  }, []);

  return (
    <div className="page-animate">
      <Card className="shadow-sm">
        <Card.Body>
          <Card.Title>Skills</Card.Title>
          {err ? <Alert variant="danger">{err}</Alert> : null}

          <Table hover responsive className="mb-0">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
              </tr>
            </thead>
            <tbody>
              {skills.map((s) => (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td>{s.category ? <Badge bg="secondary">{s.category}</Badge> : "-"}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
}

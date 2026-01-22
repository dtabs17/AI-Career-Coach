import { useState } from "react";
import { Card, Form, Button, Alert } from "react-bootstrap";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-animate">
      <Card className="shadow-sm">
        <Card.Body>
          <div className="mb-4">
            <h3 className="mb-1" style={{ fontWeight: 650, letterSpacing: "-0.02em" }}>
              Login
            </h3>
          </div>
          {err ? <Alert variant="danger">{err}</Alert> : null}

          <Form onSubmit={onSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
            </Form.Group>

            <Button type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Login"}
            </Button>

            <div className="mt-3">
              No account? <Link to="/register">Register</Link>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}

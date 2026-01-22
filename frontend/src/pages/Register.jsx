import { useState } from "react";
import { Card, Form, Button, Alert } from "react-bootstrap";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { register } = useAuth();

  const passwordsMatch = password === confirmPassword;

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");

    if (!passwordsMatch) {
      setErr("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await register(email, password);
      navigate("/");
    } catch (e2) {
      setErr(e2.message);
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
              Create account
            </h3>
          </div>
          
          {err ? <Alert variant="danger">{err}</Alert> : null}

          <Form onSubmit={onSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                autoComplete="email"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                autoComplete="new-password"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Confirm password</Form.Label>
              <Form.Control
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                type="password"
                autoComplete="new-password"
                required
                isInvalid={confirmPassword.length > 0 && !passwordsMatch}
              />
              <Form.Control.Feedback type="invalid">
                Passwords do not match.
              </Form.Control.Feedback>
            </Form.Group>

            <Button type="submit" disabled={loading || !passwordsMatch}>
              {loading ? "Creating..." : "Register"}
            </Button>

            <div className="mt-3">
              Already have an account? <Link to="/login">Login</Link>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}

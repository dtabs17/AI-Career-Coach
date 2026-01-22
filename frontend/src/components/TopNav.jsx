import { Navbar, Nav, Container } from "react-bootstrap";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { FaWandMagicSparkles } from "react-icons/fa6";
import { useAuth } from "../auth/AuthContext";

export default function TopNav() {
  const navigate = useNavigate();
  const { isAuthed, logout } = useAuth();

  async function onLogout() {
    try {
      await logout();
      navigate("/login");
    } catch {
      navigate("/login");
    }
  }

  return (
    <Navbar expand="lg" className="app-navbar" variant="dark">
      <Container fluid className="px-4">
        <Navbar.Brand as={Link} to="/" className="me-4">
          <FaWandMagicSparkles style={{ marginRight: 10, opacity: 0.9 }} />
          AI Career Coach
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="nav" />
        <Navbar.Collapse id="nav">
          <Nav className="me-auto">
            <Nav.Link as={NavLink} to="/">Home</Nav.Link>
            <Nav.Link as={NavLink} to="/skills">Skills</Nav.Link>
            <Nav.Link as={NavLink} to="/my-skills">My Skills</Nav.Link>
            <Nav.Link as={NavLink} to="/profile">Profile</Nav.Link>
          </Nav>

          <Nav className="ms-auto">
            {!isAuthed ? (
              <>
                <Nav.Link as={NavLink} to="/login">Login</Nav.Link>
                <Nav.Link as={NavLink} to="/register">Register</Nav.Link>
              </>
            ) : (
              <Nav.Link onClick={onLogout}>Logout</Nav.Link>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

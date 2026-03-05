import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import {
  Box, Paper, Typography, TextField, Button,
  Alert, CircularProgress,
} from "@mui/material";

export default function Login() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr]           = useState("");
  const [loading, setLoading]   = useState(false);

  const navigate    = useNavigate();
  const { login }   = useAuth();

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      px: 2,
    }}>
      <Paper sx={{
        width: "100%",
        maxWidth: 420,
        p: { xs: 3, sm: 4 },
        
        "&:hover": { transform: "none" },
      }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3.5 }}>
          <Box sx={{
            width: 34, height: 34, borderRadius: "10px",
            display: "grid", placeItems: "center", fontSize: "16px",
            background: "linear-gradient(135deg, rgba(245,158,11,0.88), rgba(251,113,133,0.65))",
            boxShadow: "0 6px 20px rgba(0,0,0,0.28)",
            flexShrink: 0,
          }}>
            ✨
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 750, fontSize: "0.875rem", color: "#f1f0ff", lineHeight: 1.2 }}>
              AI Career Coach
            </Typography>
            <Typography sx={{ fontSize: "0.70rem", color: "rgba(241,240,255,0.40)" }}>
              Student dashboard
            </Typography>
          </Box>
        </Box>

        <Typography variant="h5" sx={{ mb: 0.5 }}>Welcome back</Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
          Sign in to your account to continue.
        </Typography>

        {err && <Alert severity="error" sx={{ mb: 2.5 }}>{err}</Alert>}

        <Box component="form" onSubmit={onSubmit} noValidate>
          <TextField
            label="Email"
            type="email"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            sx={{ mb: 2 }}
          />

          <TextField
            label="Password"
            type="password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            sx={{ mb: 3 }}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
            startIcon={loading ? <CircularProgress size={15} sx={{ color: "rgba(255,255,255,0.65)" }} /> : null}
          >
            {loading ? "Signing in..." : "Login"}
          </Button>
        </Box>

        <Typography variant="body2" sx={{ mt: 2.5, textAlign: "center", color: "text.secondary" }}>
          No account?{" "}
          <Box
            component={Link}
            to="/register"
            sx={{
              color: "#f59e0b",
              textDecoration: "none",
              fontWeight: 650,
              "&:hover": { textDecoration: "underline" },
            }}
          >
            Register
          </Box>
        </Typography>
      </Paper>
    </Box>
  );
}
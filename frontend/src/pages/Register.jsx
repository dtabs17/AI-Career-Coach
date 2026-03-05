import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import {
  Box, Paper, Typography, TextField, Button,
  Alert, CircularProgress,
} from "@mui/material";

export default function Register() {
  const [email, setEmail]                     = useState("");
  const [password, setPassword]               = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [err, setErr]                         = useState("");
  const [loading, setLoading]                 = useState(false);

  const navigate       = useNavigate();
  const { register }   = useAuth();

  const passwordsMatch = password === confirmPassword;
  const confirmTouched = confirmPassword.length > 0;

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    if (!passwordsMatch) { setErr("Passwords do not match."); return; }
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

        <Typography variant="h5" sx={{ mb: 0.5 }}>Create account</Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
          Get started with your free student account.
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
            autoComplete="new-password"
            required
            sx={{ mb: 2 }}
          />

          <TextField
            label="Confirm password"
            type="password"
            fullWidth
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            required
            error={confirmTouched && !passwordsMatch}
            helperText={confirmTouched && !passwordsMatch ? "Passwords do not match." : ""}
            sx={{ mb: 3 }}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading || (confirmTouched && !passwordsMatch)}
            startIcon={loading ? <CircularProgress size={15} sx={{ color: "rgba(255,255,255,0.65)" }} /> : null}
          >
            {loading ? "Creating..." : "Register"}
          </Button>
        </Box>

        <Typography variant="body2" sx={{ mt: 2.5, textAlign: "center", color: "text.secondary" }}>
          Already have an account?{" "}
          <Box
            component={Link}
            to="/login"
            sx={{
              color: "#f59e0b",
              textDecoration: "none",
              fontWeight: 650,
              "&:hover": { textDecoration: "underline" },
            }}
          >
            Login
          </Box>
        </Typography>
      </Paper>
    </Box>
  );
}
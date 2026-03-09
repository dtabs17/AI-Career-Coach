import AppIcon from "../components/AppIcon";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import {
  Typography, TextField, Button,
  Alert, CircularProgress, IconButton, InputAdornment,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";

export default function Login() {
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]   = useState(false);
  const [err, setErr]         = useState("");
  const [loading, setLoading] = useState(false);

  const navigate  = useNavigate();
  const { login } = useAuth();

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
    <div className="auth-page">
      <div className="auth-glow auth-glow-amber" style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 520, height: 320 }} />
      <div className="auth-glow auth-glow-purple" style={{ bottom: "5%", right: "15%", width: 300, height: 300 }} />

      <div className="auth-card">
        <div className="auth-brand-mark">
          <AppIcon size={44} />
        </div>

        <Typography sx={{ fontSize: "1.375rem", fontWeight: 760, letterSpacing: "-0.025em", textAlign: "center", mb: 0.5 }}>
          Welcome back
        </Typography>
        <Typography sx={{ fontSize: "0.8125rem", color: "rgba(241,240,255,0.42)", textAlign: "center", mb: 3.5 }}>
          Sign in to your account to continue.
        </Typography>

        {err && <Alert severity="error" sx={{ mb: 2.5, borderRadius: "10px" }}>{err}</Alert>}

        <form className="auth-form" onSubmit={onSubmit} noValidate>
          <TextField
            label="Email" type="email" fullWidth
            value={email} onChange={(e) => setEmail(e.target.value)}
            autoComplete="email" required
          />
          <TextField
            label="Password" type={showPw ? "text" : "password"} fullWidth
            value={password} onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password" required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPw((v) => !v)} edge="end" size="small" tabIndex={-1} className="auth-pw-toggle">
                    {showPw ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button
            type="submit" variant="contained" fullWidth disabled={loading}
            sx={{ mt: 0.75, height: 46, borderRadius: "11px", fontSize: "0.9rem", fontWeight: 650 }}
            startIcon={loading ? <CircularProgress size={14} sx={{ color: "rgba(0,0,0,0.50)" }} /> : null}
          >
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <p className="auth-footer">
          No account?{" "}
          <Link to="/register" className="auth-link">Create one for free</Link>
        </p>
      </div>
    </div>
  );
}
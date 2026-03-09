import AppIcon from "../components/AppIcon";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import {
  Typography, TextField, Button,
  Alert, CircularProgress, IconButton, InputAdornment,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";

export default function Register() {
  const [email, setEmail]                     = useState("");
  const [password, setPassword]               = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw]                   = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [err, setErr]                         = useState("");
  const [loading, setLoading]                 = useState(false);

  const navigate     = useNavigate();
  const { register } = useAuth();

  const confirmTouched = confirmPassword.length > 0;
  const passwordsMatch = password === confirmPassword;

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
    <div className="auth-page">
      <div className="auth-glow auth-glow-amber" style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 560, height: 340 }} />
      <div className="auth-glow auth-glow-purple" style={{ bottom: "0%", left: "10%", width: 320, height: 280 }} />

      <div className="auth-card">
        <div className="auth-brand-mark">
          <AppIcon size={44} />
        </div>

        <Typography sx={{ fontSize: "1.375rem", fontWeight: 760, letterSpacing: "-0.025em", textAlign: "center", mb: 0.5 }}>
          Create your account
        </Typography>
        <Typography sx={{ fontSize: "0.8125rem", color: "rgba(241,240,255,0.42)", textAlign: "center", mb: 3.5 }}>
          Free for IT students. No credit card needed.
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
            autoComplete="new-password" required
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
          <TextField
            label="Confirm password" type={showConfirm ? "text" : "password"} fullWidth
            value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password" required
            error={confirmTouched && !passwordsMatch}
            helperText={confirmTouched && !passwordsMatch ? "Passwords do not match." : ""}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowConfirm((v) => !v)} edge="end" size="small" tabIndex={-1} className="auth-pw-toggle">
                    {showConfirm ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button
            type="submit" variant="contained" fullWidth
            disabled={loading || (confirmTouched && !passwordsMatch)}
            sx={{ mt: 0.75, height: 46, borderRadius: "11px", fontSize: "0.9rem", fontWeight: 650 }}
            startIcon={loading ? <CircularProgress size={14} sx={{ color: "rgba(0,0,0,0.50)" }} /> : null}
          >
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <p className="auth-footer">
          Already have an account?{" "}
          <Link to="/login" className="auth-link">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
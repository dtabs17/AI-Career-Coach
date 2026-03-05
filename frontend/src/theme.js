import { createTheme } from "@mui/material/styles";

const appTheme = createTheme({
  palette: {
    mode: "dark",
    primary:    { main: "#f59e0b" },
    secondary:  { main: "#a78bfa" },
    success:    { main: "#22c55e" },
    error:      { main: "#ef4444" },
    warning:    { main: "#f59e0b" },
    info:       { main: "#3b82f6" },
    background: { default: "#0c0b0f", paper: "rgba(18,17,26,0.78)" },
    text:       { primary: "#f1f0ff", secondary: "rgba(241,240,255,0.62)" },
    divider:    "rgba(255,255,255,0.08)",
  },
  typography: {
    fontFamily: "Manrope, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
    h4: { fontWeight: 750, letterSpacing: "-0.02em" },
    h5: { fontWeight: 700, letterSpacing: "-0.01em" },
    h6: { fontWeight: 650, letterSpacing: "-0.01em" },
  },
  shape: { borderRadius: 14 },
  components: {
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "rgba(18,17,26,0.78)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 18,
          backdropFilter: "blur(14px)",
          boxShadow: "0 14px 50px rgba(0,0,0,0.32)",
          transition: "transform 140ms ease, box-shadow 140ms ease",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: "0 18px 65px rgba(0,0,0,0.38)",
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: "none",
          fontWeight: 650,
          fontFamily: "Manrope, system-ui, sans-serif",
        },
        containedPrimary: {
          background: "linear-gradient(135deg, rgba(245,158,11,0.95), rgba(251,113,133,0.80))",
          border: 0,
          height: 44,
          color: "#fff",
          boxShadow: "none",
          "&:hover": {
            filter: "brightness(1.08)",
            transform: "translateY(-1px)",
            background: "linear-gradient(135deg, rgba(245,158,11,0.95), rgba(251,113,133,0.80))",
            boxShadow: "0 8px 28px rgba(245,158,11,0.25)",
          },
          "&:active": { transform: "translateY(0) scale(0.99)" },
          "&.Mui-disabled": {
            opacity: 0.4,
            color: "#fff",
            background: "linear-gradient(135deg, rgba(245,158,11,0.95), rgba(251,113,133,0.80))",
          },
        },
        outlinedSecondary: {
          borderColor: "rgba(255,255,255,0.14)",
          color: "rgba(241,240,255,0.88)",
          "&:hover": {
            borderColor: "rgba(255,255,255,0.24)",
            background: "rgba(255,255,255,0.04)",
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(18,17,26,0.45)",
          color: "rgba(241,240,255,0.85)",
          transition: "all 140ms ease",
          "&:hover": {
            background: "rgba(255,255,255,0.06)",
            color: "rgba(241,240,255,0.95)",
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 12,
            backgroundColor: "rgba(23,21,40,0.65)",
            fontFamily: "Manrope, system-ui, sans-serif",
            "& fieldset":             { borderColor: "rgba(255,255,255,0.08)" },
            "&:hover fieldset":       { borderColor: "rgba(255,255,255,0.18)" },
            "&.Mui-focused fieldset": { borderColor: "rgba(245,158,11,0.55)" },
            "&.Mui-focused":          { boxShadow: "0 0 0 3px rgba(245,158,11,0.10)" },
            "&.Mui-disabled .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(255,255,255,0.05)",
            },
          },
          "& .MuiInputBase-input":              { color: "#f1f0ff" },
          "& .MuiInputBase-input::placeholder": { color: "rgba(241,240,255,0.38)", opacity: 1 },
          "& .MuiInputBase-input.Mui-disabled": {
            WebkitTextFillColor: "rgba(241,240,255,0.4)",
            opacity: 1,
          },
          "& .MuiInputLabel-root":             { color: "rgba(241,240,255,0.62)", fontFamily: "Manrope, system-ui, sans-serif" },
          "& .MuiInputLabel-root.Mui-focused": { color: "rgba(245,158,11,0.85)" },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: "rgba(23,21,40,0.65)",
          color: "#f1f0ff",
          fontFamily: "Manrope, system-ui, sans-serif",
          "& .MuiOutlinedInput-notchedOutline":             { borderColor: "rgba(255,255,255,0.08)" },
          "&:hover .MuiOutlinedInput-notchedOutline":       { borderColor: "rgba(255,255,255,0.18)" },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(245,158,11,0.55)" },
        },
        icon: { color: "rgba(241,240,255,0.45)" },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontFamily: "Manrope, system-ui, sans-serif",
          color: "#f1f0ff",
          fontSize: "0.88rem",
          "&:hover":              { background: "rgba(255,255,255,0.06)" },
          "&.Mui-selected":       { background: "rgba(245,158,11,0.10)" },
          "&.Mui-selected:hover": { background: "rgba(245,158,11,0.15)" },
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: "rgba(14,13,21,0.98)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 14,
          backdropFilter: "blur(20px)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.55)",
          "&:hover": {
            transform: "none !important",
            boxShadow: "0 20px 60px rgba(0,0,0,0.55) !important",
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: "rgba(241,240,255,0.55)",
          fontFamily: "Manrope, system-ui, sans-serif",
          "&.Mui-focused": { color: "rgba(245,158,11,0.85)" },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 650,
          fontFamily: "Manrope, system-ui, sans-serif",
          fontSize: "0.78rem",
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          backgroundColor: "rgba(255,255,255,0.07)",
          height: 6,
        },
        bar: {
          borderRadius: 999,
          background: "linear-gradient(90deg, rgba(245,158,11,0.95), rgba(251,113,133,0.80))",
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root:          { borderRadius: 12, fontFamily: "Manrope, system-ui, sans-serif" },
        standardError: {
          background: "rgba(220,38,38,0.10)",
          border: "1px solid rgba(220,38,38,0.20)",
          color: "rgba(255,190,190,0.95)",
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: "rgba(14,13,21,0.97)",
          border: "1px solid rgba(255,255,255,0.10)",
          color: "#f1f0ff",
          fontSize: 12,
          borderRadius: 8,
          fontFamily: "Manrope, system-ui, sans-serif",
          boxShadow: "0 8px 28px rgba(0,0,0,0.4)",
        },
        arrow: { color: "rgba(14,13,21,0.97)" },
      },
    },
    MuiRadio: {
      styleOverrides: {
        root: {
          color: "rgba(241,240,255,0.3)",
          "&.Mui-checked": { color: "#f59e0b" },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: "rgba(255,255,255,0.07)" },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        root: { color: "#f59e0b" },
      },
    },
  },
});

export default appTheme;
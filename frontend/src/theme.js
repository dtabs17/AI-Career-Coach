/**
 * Shared Material UI theme for the public pages and authenticated dashboard.
 */
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
    background: { default: "#0c0b0f", paper: "rgba(15,14,22,0.95)" },
    text:       { primary: "#f1f0ff", secondary: "rgba(241,240,255,0.52)" },
    divider:    "rgba(255,255,255,0.07)",
  },
  typography: {
    fontFamily: "Manrope, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
    h4: { fontWeight: 780, letterSpacing: "-0.03em", fontSize: "1.6rem" },
    h5: { fontWeight: 720, letterSpacing: "-0.02em" },
    h6: { fontWeight: 680, letterSpacing: "-0.015em" },
    body1: { fontSize: "0.9rem", lineHeight: 1.65 },
    body2: { fontSize: "0.8375rem", lineHeight: 1.6 },
  },
  shape: { borderRadius: 8 },
  components: {
    // Keep base surfaces flat so emphasis comes from spacing, borders, and
    // content hierarchy instead of default MUI elevation.
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "rgba(15,14,22,0.95)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 10,
          backdropFilter: "blur(8px)",
          boxShadow: "none",
          transition: "border-color 120ms ease",
          "&:hover": {
            transform: "none",
            boxShadow: "none",
            borderColor: "rgba(255,255,255,0.10)",
          },
        },
      },
    },

    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          textTransform: "none",
          fontWeight: 620,
          fontFamily: "Manrope, system-ui, sans-serif",
          fontSize: "0.85rem",
          letterSpacing: "-0.01em",
          height: 36,
          transition: "all 120ms ease",
        },
        containedPrimary: {
          background: "linear-gradient(135deg, #f59e0b, #fb923c)",
          border: 0,
          color: "#0c0b0f",
          fontWeight: 700,
          boxShadow: "none",
          "&:hover": {
            filter: "brightness(1.08)",
            background: "linear-gradient(135deg, #f59e0b, #fb923c)",
            boxShadow: "0 0 0 3px rgba(245,158,11,0.18)",
            transform: "none",
          },
          "&:active": { filter: "brightness(0.96)" },
          "&.Mui-disabled": {
            opacity: 0.38,
            color: "#0c0b0f",
            background: "linear-gradient(135deg, #f59e0b, #fb923c)",
          },
        },
        outlinedSecondary: {
          borderColor: "rgba(255,255,255,0.12)",
          color: "rgba(241,240,255,0.78)",
          "&:hover": {
            borderColor: "rgba(255,255,255,0.22)",
            background: "rgba(255,255,255,0.04)",
          },
        },
        outlinedPrimary: {
          borderColor: "rgba(245,158,11,0.35)",
          color: "#f59e0b",
          "&:hover": {
            borderColor: "rgba(245,158,11,0.55)",
            background: "rgba(245,158,11,0.06)",
          },
        },
      },
    },

    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 7,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.03)",
          color: "rgba(241,240,255,0.70)",
          transition: "all 120ms ease",
          "&:hover": {
            background: "rgba(255,255,255,0.07)",
            color: "rgba(241,240,255,0.95)",
            borderColor: "rgba(255,255,255,0.14)",
          },
        },
      },
    },

    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 8,
            backgroundColor: "rgba(255,255,255,0.03)",
            fontFamily: "Manrope, system-ui, sans-serif",
            "& fieldset":             { borderColor: "rgba(255,255,255,0.09)" },
            "&:hover fieldset":       { borderColor: "rgba(255,255,255,0.16)" },
            "&.Mui-focused fieldset": { borderColor: "rgba(245,158,11,0.50)" },
            "&.Mui-focused":          { boxShadow: "0 0 0 3px rgba(245,158,11,0.08)" },
            "&.Mui-disabled .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(255,255,255,0.05)",
            },
          },
          "& .MuiInputBase-input":              { color: "#f1f0ff", fontSize: "0.875rem" },
          "& .MuiInputBase-input::placeholder": { color: "rgba(241,240,255,0.32)", opacity: 1 },
          // Overrides Chrome's autofill background using box-shadow inset, the only
          // property that wins against the browser injection without killing autofill suggestions.
          "& .MuiInputBase-input:-webkit-autofill": {
            WebkitBoxShadow: "0 0 0 100px #13121e inset",
            WebkitTextFillColor: "#f1f0ff",
            caretColor: "#f1f0ff",
          },
          "& .MuiInputBase-input.Mui-disabled": {
            WebkitTextFillColor: "rgba(241,240,255,0.35)",
            opacity: 1,
          },
          "& .MuiInputLabel-root":             { color: "rgba(241,240,255,0.52)", fontFamily: "Manrope, system-ui, sans-serif", fontSize: "0.875rem" },
          "& .MuiInputLabel-root.Mui-focused": { color: "rgba(245,158,11,0.90)" },
        },
      },
    },

    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: "rgba(255,255,255,0.03)",
          color: "#f1f0ff",
          fontSize: "0.875rem",
          fontFamily: "Manrope, system-ui, sans-serif",
          "& .MuiOutlinedInput-notchedOutline":             { borderColor: "rgba(255,255,255,0.09)" },
          "&:hover .MuiOutlinedInput-notchedOutline":       { borderColor: "rgba(255,255,255,0.16)" },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(245,158,11,0.50)" },
        },
        icon: { color: "rgba(241,240,255,0.38)" },
      },
    },

    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontFamily: "Manrope, system-ui, sans-serif",
          color: "#f1f0ff",
          fontSize: "0.875rem",
          borderRadius: 6,
          "&:hover":              { background: "rgba(255,255,255,0.05)" },
          "&.Mui-selected":       { background: "rgba(245,158,11,0.10)" },
          "&.Mui-selected:hover": { background: "rgba(245,158,11,0.15)" },
        },
      },
    },

    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: "rgba(12,11,18,0.99)",
          border: "1px solid rgba(255,255,255,0.09)",
          borderRadius: 10,
          backdropFilter: "blur(20px)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.50)",
          "&:hover": {
            transform: "none !important",
            boxShadow: "0 8px 32px rgba(0,0,0,0.50) !important",
          },
        },
      },
    },

    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: "rgba(241,240,255,0.45)",
          fontFamily: "Manrope, system-ui, sans-serif",
          fontSize: "0.875rem",
          "&.Mui-focused": { color: "rgba(245,158,11,0.90)" },
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 5,
          fontWeight: 620,
          fontFamily: "Manrope, system-ui, sans-serif",
          fontSize: "0.75rem",
          height: 24,
        },
      },
    },

    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          backgroundColor: "rgba(255,255,255,0.06)",
          height: 4,
        },
        bar: {
          borderRadius: 999,
          background: "linear-gradient(90deg, #f59e0b, #fb923c)",
        },
      },
    },

    MuiAlert: {
      styleOverrides: {
        root:          { borderRadius: 8, fontFamily: "Manrope, system-ui, sans-serif", fontSize: "0.875rem" },
        standardError: {
          background: "rgba(220,38,38,0.08)",
          border: "1px solid rgba(220,38,38,0.18)",
          color: "rgba(255,190,190,0.95)",
        },
      },
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: "rgba(10,9,16,0.98)",
          border: "1px solid rgba(255,255,255,0.10)",
          color: "#f1f0ff",
          fontSize: "0.78rem",
          borderRadius: 6,
          fontFamily: "Manrope, system-ui, sans-serif",
          boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
          padding: "5px 10px",
        },
        arrow: { color: "rgba(10,9,16,0.98)" },
      },
    },

    MuiRadio: {
      styleOverrides: {
        root: {
          color: "rgba(241,240,255,0.25)",
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

    MuiCollapse: {
      styleOverrides: {
        root: { overflow: "visible" },
      },
    },
  },
});

export default appTheme;
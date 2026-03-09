import { useState, useCallback } from "react";
import { Snackbar, Alert } from "@mui/material";
import { ToastContext } from "./ToastContext";

export default function ToastProvider({ children }) {
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });

  const showToast = useCallback((message, severity = "success") => {
    setToast({ open: true, message, severity });
  }, []);

  function handleClose(_, reason) {
    if (reason === "clickaway") return;
    setToast((prev) => ({ ...prev, open: false }));
  }

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleClose}
          severity={toast.severity}
          variant="filled"
          sx={{
            fontFamily: "Manrope, system-ui, sans-serif",
            fontWeight: 600,
            fontSize: "0.875rem",
            borderRadius: "8px",
          }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
}
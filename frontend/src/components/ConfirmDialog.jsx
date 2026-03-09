import {
  Dialog, DialogTitle, DialogContent, DialogContentText,
  DialogActions, Button,
} from "@mui/material";

export default function ConfirmDialog({ open, title, message, confirmLabel = "Delete", onConfirm, onCancel }) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      PaperProps={{
        sx: {
          bgcolor: "rgba(15,14,22,0.98)",
          border: "1px solid rgba(255,255,255,0.09)",
          borderRadius: "12px",
          minWidth: 340,
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 700, fontSize: "1rem", pb: 1 }}>
        {title}
      </DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ color: "text.secondary", fontSize: "0.875rem" }}>
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button
          variant="outlined"
          color="secondary"
          size="small"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          variant="outlined"
          size="small"
          onClick={onConfirm}
          sx={{
            borderColor: "rgba(239,68,68,0.40)",
            color: "#fca5a5",
            "&:hover": {
              borderColor: "rgba(239,68,68,0.65)",
              bgcolor: "rgba(239,68,68,0.08)",
            },
          }}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
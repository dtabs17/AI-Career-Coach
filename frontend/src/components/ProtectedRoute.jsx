import { Navigate } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import { useAuth } from "../auth/AuthContext";

export default function ProtectedRoute({ children }) {
  const { isReady, isAuthed } = useAuth();

  if (!isReady) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          py: 5,
        }}
      >
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (!isAuthed) return <Navigate to="/login" replace />;
  return children;
}
import { Link } from "react-router-dom";
import { Box, Typography, Button } from "@mui/material";
import { HomeOutlined } from "@mui/icons-material";

export default function NotFound() {
  return (
    <Box
      className="page-animate"
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        textAlign: "center",
        px: 3,
      }}
    >
      <Typography
        sx={{
          fontSize: "5rem",
          fontWeight: 800,
          lineHeight: 1,
          letterSpacing: "-0.05em",
          color: "rgba(241,240,255,0.08)",
          mb: 2,
          userSelect: "none",
        }}
      >
        404
      </Typography>
      <Typography
        variant="h5"
        sx={{ fontWeight: 700, mb: 1, letterSpacing: "-0.02em" }}
      >
        Page not found
      </Typography>
      <Typography
        sx={{
          color: "text.secondary",
          mb: 3.5,
          maxWidth: 340,
          lineHeight: 1.65,
        }}
      >
        The page you're looking for doesn't exist or has been moved.
      </Typography>
      <Button
        variant="contained"
        component={Link}
        to="/"
        startIcon={<HomeOutlined />}
      >
        Back to home
      </Button>
    </Box>
  );
}
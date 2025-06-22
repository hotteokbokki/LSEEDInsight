import React, { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Button,
  Typography,
  TextField,
  Alert,
  Snackbar,
  useTheme,
} from "@mui/material";
import { tokens } from "../../theme";
import Header from "../../components/Header";

const PasswordReset = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setMessage("");
      setSnackbarOpen(true);
      return;
    }

    try {
      const res = await axios.post(
        "http://localhost:4000/auth/reset-password",
        {
          token,
          newPassword: password,
        }
      );
      setMessage(res.data.message);
      setError("");
      setSnackbarOpen(true);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
      setMessage("");
      setSnackbarOpen(true);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Header title="Reset Password" subtitle="Choose a new password" />
      </Box>

      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        gap={4}
        mt={4}
      >
        <Box
          width="50%"
          bgcolor="white"
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          padding={4}
          gap={2}
        >
          <Box bgcolor="#1E4D2B" p={2} width="100%" textAlign="center">
            <Typography variant="h6" color="#fff" fontWeight="bold">
              Please enter your new password below
            </Typography>
          </Box>

          <form onSubmit={handleSubmit} style={{ width: "100%" }}>
            <TextField
              type="password"
              label="New Password"
              fullWidth
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{ style: { color: "#000" } }}
              InputLabelProps={{ style: { color: "#000" } }}
              sx={{
                mb: 2,
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "#000" },
                  "&:hover fieldset": { borderColor: "#000" },
                  "&.Mui-focused fieldset": { borderColor: "#000" },
                },
              }}
            />

            <TextField
              type="password"
              label="Confirm New Password"
              fullWidth
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              InputProps={{ style: { color: "#000" } }}
              InputLabelProps={{ style: { color: "#000" } }}
              sx={{
                mb: 2,
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "#000" },
                  "&:hover fieldset": { borderColor: "#000" },
                  "&.Mui-focused fieldset": { borderColor: "#000" },
                },
              }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{
                backgroundColor: "#1E4D2B",
                color: "#fff",
                fontWeight: "bold",
                "&:hover": { backgroundColor: "#145A32" },
              }}
            >
              Reset Password
            </Button>
          </form>

          <Typography mt={2}>
            <Link
              to="/"
              style={{ color: "#1E4D2B", textDecoration: "underline" }}
            >
              Go back to Home
            </Link>
          </Typography>
        </Box>
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        {message ? (
          <Alert
            severity="success"
            onClose={handleCloseSnackbar}
            sx={{ width: "100%" }}
          >
            {message}
          </Alert>
        ) : error ? (
          <Alert
            severity="error"
            onClose={handleCloseSnackbar}
            sx={{ width: "100%" }}
          >
            {error}
          </Alert>
        ) : null}
      </Snackbar>
    </Box>
  );
};

export default PasswordReset;

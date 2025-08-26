"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BackgroundBox from "@/components/BackgroundBox";
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
} from "@mui/material";
import { BACKGROUND, SECONDARY, GREY, RED } from "@/styles/colors";
import { useBackend } from "@/contexts/BackendContext";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { apiURL } = useBackend();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const resetToken = searchParams.get("token");
    if (!resetToken) {
      setMessage({
        type: "error",
        text: "Invalid reset link. Missing reset token.",
      });
      return;
    }
    setToken(resetToken);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setMessage({ type: "error", text: "Reset token is missing." });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({
        type: "error",
        text: "Password must be at least 6 characters long.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match." });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch(
        apiURL("auth/reset-password", "reset-password"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: token,
            new_password: newPassword,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: "Password has been reset successfully! Redirecting to login...",
        });
        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        setMessage({
          type: "error",
          text: data.msg || "Failed to reset password. Please try again.",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "An error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <BackgroundBox sx={{ backgroundColor: BACKGROUND }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "calc(100vh - 80px)",
            padding: "20px",
          }}
        >
          <Paper
            elevation={3}
            sx={{
              padding: "40px",
              maxWidth: "500px",
              width: "100%",
              textAlign: "center",
            }}
          >
            <Typography variant="h5" sx={{ marginBottom: "20px", color: RED }}>
              Invalid Reset Link
            </Typography>
            <Typography variant="body1" sx={{ marginBottom: "30px" }}>
              The password reset link is invalid or has expired. Please request
              a new password reset.
            </Typography>
            <Button
              variant="contained"
              color="secondary"
              onClick={() => router.push("/login")}
            >
              Go to Login
            </Button>
          </Paper>
        </Box>
      </BackgroundBox>
    );
  }

  return (
    <BackgroundBox sx={{ backgroundColor: BACKGROUND }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "calc(100vh - 80px)",
          padding: "20px",
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: "40px",
            maxWidth: "500px",
            width: "100%",
          }}
        >
          <Typography
            variant="h4"
            sx={{ marginBottom: "10px", textAlign: "center" }}
          >
            Reset Password
          </Typography>
          <Typography
            variant="body1"
            sx={{ marginBottom: "30px", textAlign: "center", color: GREY }}
          >
            Enter your new password below
          </Typography>

          {message && (
            <Alert
              severity={
                message.type === "success"
                  ? "success"
                  : message.type === "error"
                  ? "error"
                  : "info"
              }
              sx={{ marginBottom: "20px" }}
            >
              {message.text}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              sx={{ marginBottom: "20px" }}
              disabled={isLoading}
              required
            />

            <TextField
              fullWidth
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              sx={{ marginBottom: "30px" }}
              disabled={isLoading}
              required
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="secondary"
              disabled={isLoading || !newPassword || !confirmPassword}
              sx={{
                height: "48px",
                fontSize: "16px",
              }}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Change Password"
              )}
            </Button>
          </form>

          <Box sx={{ textAlign: "center", marginTop: "20px" }}>
            <Button
              variant="text"
              onClick={() => router.push("/login")}
              sx={{ color: SECONDARY }}
            >
              Back to Login
            </Button>
          </Box>
        </Paper>
      </Box>
    </BackgroundBox>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="100vh"
        >
          <CircularProgress />
        </Box>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}

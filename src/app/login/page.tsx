"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  CircularProgress,
} from "@mui/material";
import BackgroundBox from "@/components/BackgroundBox";
import constants from "@/styles/constants";
import * as colors from "@/styles/colors";
import SnackView from "@/components/SnackView";
import { AlertColor } from "@mui/material";

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [infoMessage, setInfoMessage] = useState<{
    type: AlertColor;
    message: string;
  } | null>(null);

  const router = useRouter();

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      // ✅ Call Flask backend (nginx proxies /api/*)
      const API_BASE = "http://34.58.37.44";
      const res = await fetch(`${API_BASE}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: email, password }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Login failed");
      }

      const data = await res.json();

      // Save JWT + user info from Flask
      localStorage.setItem("access_token", data.token);
      localStorage.setItem(
        "user_info",
        JSON.stringify({
          email: data.email,
          role: data.role,
          name: data.name,
        })
      );

      // Mark login for middleware
      document.cookie = "auth=true; path=/";

      router.push("/dashboard");
    } catch (error: any) {
      setInfoMessage({
        type: "error",
        message: error.message || "Login failed",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BackgroundBox sx={{ justifyContent: "center", alignItems: "center" }}>
      <Paper
        elevation={4}
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          overflow: "hidden",
          width: "400px",
          minHeight: "400px",
        }}
      >
        {/* Header */}
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          padding={constants.spacing.EDGES}
          minHeight={100}
          sx={{
            background: colors.PURPLE_GRADIENT,
            width: "100%",
          }}
        >
          <Typography
            variant="h6"
            fontWeight="600"
            color="white"
            textAlign="center"
          >
            LOGIN
          </Typography>
        </Box>

        {/* Form */}
        <Box
          p={constants.spacing.EDGES}
          width="100%"
          display="flex"
          flexDirection="column"
          justifyContent="center"
          flexGrow={1}
        >
          <TextField
            label="Email"
            variant="outlined"
            fullWidth
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <TextField
            label="Password"
            type="password"
            variant="outlined"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleLogin}
            disabled={isLoading}
            sx={{
              marginTop: 3,
              background: colors.PURPLE_GRADIENT,
              color: "white",
              fontSize: "1.2rem",
              fontWeight: "bold",
              height: "50px",
            }}
          >
            {isLoading ? <CircularProgress size={24} color="inherit" /> : "Login"}
          </Button>
        </Box>
      </Paper>

      <SnackView
        snackMessage={infoMessage?.message || ""}
        setSnackMessage={setInfoMessage}
        type={infoMessage?.type}
      />
    </BackgroundBox>
  );
};

export default LoginPage;

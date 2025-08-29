"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
// NOTE: intentionally not importing useAuth to avoid any internal network calls
import BackgroundBox from "@/components/BackgroundBox";
import constants from "@/styles/constants";
import * as colors from "@/styles/colors";
import { ArrowBack } from "@mui/icons-material";
import CircularProgress from "@mui/material/CircularProgress";
import { getCurrentHourHash } from "@/utils/helpers"; // email validation not needed anymore
import SnackView from "@/components/SnackView";
import { AlertColor } from "@mui/material";

import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Collapse,
  IconButton,
} from "@mui/material";
import Grid from "@mui/material/Grid";

// Helper: base64url encode
function b64url(input: string) {
  if (typeof window !== "undefined" && typeof window.btoa === "function") {
    return window
      .btoa(input)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }
  return Buffer.from(input, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// Helper: create a mock JWT-like token (not signed)
function createMockToken(email: string, role = "admin", name = "Admin User") {
  const header = { alg: "none", typ: "JWT" };
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 60 * 60; // 1 hour
  const payload = { sub: email, email, role, name, iat, exp };
  return `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}.`;
}

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState(""); // kept for UI only; not used to authenticate
  const [password, setPassword] = useState(""); // kept for UI only
  const [repeatPassword, setRepeatPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [redirectEmail, setRedirectEmail] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<{
    type: AlertColor;
    message: string;
  } | null>(null);
  const [flowState, setFlowState] = useState<"login" | "register" | "reset">(
    "login"
  );

  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Handle back button
      window.history.pushState(null, "", window.location.href);
      window.onpopstate = function () {
        window.history.pushState(null, "", window.location.href);
      };

      const queryParams = new URLSearchParams(window.location.search);
      const userParam = queryParams.get("redirect");

      if (userParam && userParam !== "") {
        setRedirectEmail(userParam.toLowerCase());
        const hourHash = getCurrentHourHash();
        const url = `https://sandbox-dot-wiboxus.uc.r.appspot.com/redirect?user=${userParam.toLowerCase()}&hash=${hourHash}`;
        // const url = `https://sentinelnext2.com/redirect?user=${userParam.toLowerCase()}&hash=${hourHash}`;
        window.location.href = url;
      }
    }
  }, []);

  // --- UNUSED (kept to avoid breaking other flows visually) ---
  const handleRegister = async () => {
    setInfoMessage({
      type: "info",
      message: "Register is disabled in mock mode.",
    });
  };
  const handleResetPassword = async () => {
    setInfoMessage({
      type: "info",
      message: "Password reset is disabled in mock mode.",
    });
  };
  // ------------------------------------------------------------

  const handleAction = async () => {
    if (flowState === "login") {
      await handleLogin();
    } else if (flowState === "register") {
      await handleRegister();
    } else if (flowState === "reset") {
      await handleResetPassword();
    }
  };

  // MOCK LOGIN ONLY: no network, force admin@example.com
  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const hardcodedEmail = "admin@example.com";
      const access_token = createMockToken(hardcodedEmail, "admin", "Admin User");
      const refresh_token = `mock_refresh_${hardcodedEmail}_${Date.now()}`;

      // Persist minimal auth state (no server calls)
      localStorage.setItem("access_token", access_token);
      localStorage.setItem("refresh_token", refresh_token);
      localStorage.setItem("user_email", hardcodedEmail);
      localStorage.setItem(
        "user_info",
        JSON.stringify({ email: hardcodedEmail, role: "admin", name: "Admin User" })
      );
      document.cookie = "auth=true; path=/";

      // Optional: expose a flag for your app
      (window as any).__MOCK_AUTH__ = true;

      // Go straight to dashboard
      router.push("/dashboard");
    } catch (error) {
      setInfoMessage({
        type: "error",
        message: (error as any)?.message || "Mock login failed",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BackgroundBox sx={{ justifyContent: "center", alignItems: "center" }}>
      {redirectEmail && redirectEmail.length > 0 ? (
        <CircularProgress />
      ) : (
        <>
          <Paper
            elevation={4}
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <Box
              display="flex"
              flexDirection="column"
              justifyContent="flex-end"
              alignItems="flex-start"
              padding={constants.spacing.EDGES}
              minHeight={120}
              sx={{
                background: colors.PURPLE_GRADIENT,
                width: "100%",
              }}
            >
              {flowState !== "login" ? (
                <IconButton
                  onClick={() => {
                    setPassword("");
                    setRepeatPassword("");
                    setFlowState("login");
                  }}
                  style={{ color: "white", marginLeft: "-10px" }}
                >
                  <ArrowBack />
                </IconButton>
              ) : null}

              {/* HEADER */}
              <Box>
                <Button>
                  <Typography
                    variant="h6"
                    fontWeight={"600"}
                    color="white"
                    marginBottom={-1}
                    onClick={() => {
                      if (flowState !== "login") setFlowState("login");
                    }}
                  >
                    {flowState === "login"
                      ? "LOGIN"
                      : flowState === "register"
                      ? "REGISTER"
                      : "FORGOT YOUR PASSWORD?"}
                  </Typography>
                </Button>
                {process.env.NEXT_PUBLIC_CAN_REGISTER === "true" &&
                flowState === "login" ? (
                  <Button>
                    <Typography
                      variant="h6"
                      fontWeight={"600"}
                      color="white"
                      marginBottom={-1}
                      onClick={() => setFlowState("register")}
                    >
                      REGISTER
                    </Typography>
                  </Button>
                ) : null}
              </Box>
            </Box>

            {/* USERNAME (UI only) */}
            <Grid container p={constants.spacing.EDGES} width="400px">
              <Grid sx={{ width: "100%", marginBottom: "20px" }}>
                <TextField
                  id="email"
                  label="Username or Email"
                  variant="outlined"
                  fullWidth
                  value={email}
                  autoComplete="off"
                  onChange={(e) => setEmail(e.target.value)}
                
                />
              </Grid>

              {/* PASSWORD (UI only) */}
              <Grid sx={{ width: "100%", marginBottom: "20px" }}>
                <Collapse in={flowState !== "reset"} style={{ width: "100%" }}>
                  <TextField
                    id="password"
                    label="Password"
                    type="password"
                    variant="outlined"
                    autoComplete="new-password"
                    fullWidth
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    
                  />
                </Collapse>
              </Grid>

              {/* REPEAT PASSWORD (UI only) */}
              <Grid sx={{ width: "100%", marginBottom: "20px" }}>
                <Collapse
                  in={flowState === "register"}
                  style={{ width: "100%" }}
                >
                  <TextField
                    id="repeat-password"
                    label="Repeat Password"
                    type="password"
                    variant="outlined"
                    autoComplete="new-password"
                    fullWidth
                    value={repeatPassword}
                    onChange={(e) => setRepeatPassword(e.target.value)}
                    helperText="Mock mode: register disabled"
                  />
                </Collapse>
              </Grid>

              {/* CALL TO ACTION */}
              <Grid sx={{ width: "100%", marginBottom: "20px" }}>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={handleAction}
                  disableElevation
                  disabled={isLoading}
                  style={{
                    color: "white",
                    fontSize: "1.2rem",
                    fontWeight: "bold",
                    height: "50px",
                    background: colors.PURPLE_GRADIENT,
                  }}
                >
                  {isLoading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : flowState === "reset" ? (
                    "RESET PASSWORD"
                  ) : flowState === "register" ? (
                    "REGISTER"
                  ) : (
                    "LOGIN"
                  )}
                </Button>
              </Grid>

              {/* FORGOT PASSWORD */}
              <Grid sx={{ width: "100%", marginBottom: "20px" }}>
                <Collapse in={flowState === "login"} style={{ width: "100%" }}>
                  <Button
                    fullWidth
                    size="small"
                    onClick={() => setFlowState("reset")}
                    style={{ color: "black", marginTop: "-10px" }}
                  >
                    Forgot your password?
                  </Button>
                </Collapse>
              </Grid>
            </Grid>
          </Paper>
          <SnackView
            snackMessage={infoMessage?.message || ""}
            setSnackMessage={setInfoMessage}
            type={infoMessage?.type}
          />
        </>
      )}
    </BackgroundBox>
  );
};

export default LoginPage;

"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import BackgroundBox from "@/components/BackgroundBox";
import constants from "@/styles/constants";
import * as colors from "@/styles/colors";
import { ArrowBack } from "@mui/icons-material";
import CircularProgress from "@mui/material/CircularProgress";
import { emailIsValid, getCurrentHourHash } from "@/utils/helpers";
import SnackView from "@/components/SnackView";
import { AlertColor } from "@mui/material";

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

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

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  const { login } = useAuth();
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

  const handleRegister = async () => {
    if (
      email.length === 0 ||
      password.length === 0 ||
      repeatPassword.length === 0
    ) {
      setInfoMessage({
        type: "warning",
        message: "Please enter a valid email and password",
      });
      return;
    }

    if (password !== repeatPassword) {
      setInfoMessage({ type: "warning", message: "Passwords do not match" });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${backendUrl}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok && data?.access_token) {
        setInfoMessage({ type: "success", message: "Registration successful" });
        setTimeout(() => {
          setIsLoading(false);
          login(data?.access_token, data?.refresh_token, email);
          document.cookie = "auth=true; path=/";
          router.push("/dashboard");
        }, 2000);
      } else {
        setInfoMessage({
          type: "error",
          message: data?.msg || "Registration failed",
        });
        setIsLoading(false);
      }
    } catch (error) {
      setIsLoading(false);
      setInfoMessage({
        type: "error",
        message: (error as any)?.message || "Registration failed",
      });
    }
  };

  const handleResetPassword = async () => {
    if (email.length === 0 || !emailIsValid(email)) {
      setInfoMessage({
        type: "warning",
        message: "Please enter a valid email",
      });
      return;
    }

    setIsLoading(true);

    try {
      // FIX: removed trailing space from the endpoint path
      const response = await fetch(`${backendUrl}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (response.ok) {
        if (data?.msg) {
          setInfoMessage({
            type: "info",
            message: data?.msg,
          });
        } else if (data?.reset_token) {
          setInfoMessage({
            type: "info",
            message: "Password reset email sent",
          });
        } else {
          setInfoMessage({
            type: "error",
            message: "Password reset process failed",
          });
        }
      } else {
        setInfoMessage({
          type: "error",
          message: data?.msg || "Password reset process failed",
        });
      }
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      setInfoMessage({
        type: "error",
        message: (error as any)?.message || "Error during password reset",
      });
    }
  };

  const handleAction = async () => {
    if (flowState === "login") {
      await handleLogin();
    } else if (flowState === "register") {
      await handleRegister();
    } else if (flowState === "reset") {
      await handleResetPassword();
    }
  };

  // MOCK LOGIN: no network call; generate tokens and redirect
  const handleLogin = async () => {
    if (email.length === 0 || password.length === 0) {
      setInfoMessage({
        type: "warning",
        message: "Please enter a valid email and password",
      });
      return;
    }

    if (!emailIsValid(email)) {
      setInfoMessage({
        type: "warning",
        message: "Please enter a valid email",
      });
      return;
    }

    setIsLoading(true);
    try {
      const now = Date.now();
      const access_token = `mock_access_token_${email}_${now}`;
      const refresh_token = `mock_refresh_token_${email}_${now}`;

      // store in your auth context as usual
      login(access_token, refresh_token, email);
      document.cookie = "auth=true; path=/";

      // go straight to dashboard
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
                      if (flowState !== "login") {
                        setFlowState("login");
                      }
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
                      onClick={() => {
                        setFlowState("register");
                      }}
                    >
                      REGISTER
                    </Typography>
                  </Button>
                ) : null}
              </Box>
            </Box>

            {/* USERNAME */}
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

              {/* PASSWORD */}
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

              {/* REPEAT PASSWORD */}
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

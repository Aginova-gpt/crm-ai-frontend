import {
  AlertColor,
  Box,
  TextField,
  Button,
  CircularProgress,
  Badge,
} from "@mui/material";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useBackend } from "@/contexts/BackendContext";

import { GREY_TEXT, SECONDARY } from "@/styles/colors";
import SnackView from "../SnackView";
import { useApi } from "@/utils/api";
import { SensorData } from "@/utils/sensorHelpers";

export default function SigningBar(props: {
  selectedSensors: SensorData[];
  setSelectedSensors: (sensors: SensorData[]) => void;
}) {
  const { apiURL } = useBackend();
  const { fetchWithAuth } = useApi();
  const [note, setNote] = useState("");
  const [snackMessage, setSnackMessage] = useState<{
    type: AlertColor;
    message: string;
  } | null>(null);

  const signingMutation = useMutation({
    mutationFn: async () => {
      const response = await fetchWithAuth(
        apiURL("sensors/sign", "sensors/sign", true),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sensorIds: props.selectedSensors.map((sensor) => sensor.sensor_id),
            note,
          }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new (Error as any)(data.error || "Failed to sign sensors");
      }
      return data;
    },
    onSuccess: (data: { message: string }) => {
      setSnackMessage({
        type: "success",
        message: data.message || "Sensors signed successfully",
      });
      props.setSelectedSensors([]);
      setNote("");
    },
    onError: (error: Error) => {
      setSnackMessage({
        type: "error",
        message: error.message || "Failed to sign sensors",
      });
    },
  });

  const isFormValid = props.selectedSensors.length > 0;

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "80px",
        backgroundColor: "white",
        borderTop: "2px solid #e0e0e0",
        boxShadow: "0px -4px 10px rgba(0, 0, 0, 0.1)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        padding: "0 24px",
      }}
    >
      <Box
        sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%" }}
      >
        <TextField
          label="Note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          size="small"
          sx={{
            flex: 1,
            minWidth: 0,
            "& .MuiOutlinedInput-root": {
              height: "38px",
            },
          }}
        />

        <Button
          variant="contained"
          disabled={!isFormValid || signingMutation.isPending}
          onClick={() => signingMutation.mutate()}
          sx={{
            paddingLeft: "40px",
            paddingRight: "40px",
            color:
              !isFormValid || signingMutation.isPending ? GREY_TEXT : "white",
            borderColor:
              !isFormValid || signingMutation.isPending ? GREY_TEXT : SECONDARY,
            flexShrink: 0,
          }}
        >
          {signingMutation.isPending ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            "Sign sensors"
          )}
          {props.selectedSensors.length > 0 && (
            <Badge
              badgeContent={props.selectedSensors.length}
              color="error"
              sx={{
                position: "absolute",
                top: 5,
                right: 0,
              }}
            />
          )}
        </Button>
      </Box>
      <SnackView
        snackMessage={snackMessage}
        setSnackMessage={setSnackMessage}
      />
    </Box>
  );
}

import {
  AlertColor,
  Autocomplete,
  Box,
  TextField,
  Button,
  CircularProgress,
  Badge,
} from "@mui/material";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { AlarmObject } from "../Alarms/Alarms";
import { useBackend } from "@/contexts/BackendContext";

import { GREY_TEXT, SECONDARY } from "@/styles/colors";
import SnackView from "../SnackView";
import { useApi } from "@/utils/api";

const predefinedComments = [
  "Door left opened",
  "Power failure",
  "HVAC Cycle",
  "Controller",
  "Exhaust Fan",
  "Evap/Condensor",
  "Compressor",
  "Testing",
  "Other",
];

const cedarReasons = [
  "Door left ajar, will monitor closely.",
  "Inventory in progress",
  "Back in range. Products not relocated.",
  "Heavy usage. Normal daily pattern. Minimum deviance.",
  "Equipment out of service. Products have been relocated.",
  "Testing in progress.",
  "Sensor calibration in progress.",
  "Alarm testing in progress.",
  "Temporary Power Loss, AC power restored",
  "Initial Install",
  "Battery Mode testing",
  "Network Outage testing",
  "Temperature too cold will monitor.",
  "Temporary Loss of Connection. Restored.",
  "Temperature too hot. Will monitor closely.",
  "QC within range, patient testing not affected, okay to report results.",
  "Within range",
  "Unit damaged",
  "Unit being cleaned",
  "Unit out of service",
  "Lost power",
  "See additional comment",
  "Will investigate",
  "Work order submitted",
  "Unit in service",
  "Released for general use",
  "Defrost Cycle",
  "Door Being Opened too Frequently",
  "Added DI water to pan.",
  "Will recalibrate incubator temperature.",
  "Will recalibrate incubator CO2.",
  "Door opened for extended amount of time.",
  "Heavy usage. Normal daily pattern. Minimum deviance. Document any additional details, if necessary.",
  "Humidity is out of range. All instruments checked and are functioning properly. No corrective action necessary at this time.",
  "Melted paraffin in the paraffin dispenser is almost empty. Will add more paraffin pellets. Normal daily pattern.",
  "Paraffin chamber in the embedding center is empty. Need to refill melted paraffin. Normal daily pattern.",
  "Added fresh paraffin pellets in the dispenser. Normal daily pattern.",
  "Inventory in progress.",
  "Equipment out of service. Products have been relocated. Document any additional details, if necessary.",
  "Door found ajar. Door closed and will monitor closely. Document any additional details, if necessary.",
  "Cetani sensor malfunctioning. Replacement has been ordered. Please record temperature manually until sensor is replaced. Document any additional details, if necessary.",
  "Freezer being thawed",
  "01TM. Investigating the cause of alarm.  Comment and/or corrective action to follow.",
  "02TM. Door/Lid found ajar.  Closed and monitoring digital/internal temperature (fill-in temperature).",
  "03TM. Heavy use unit where door/lid is opened and closed frequently.  Monitoring digital/internal temperature (fill-in temperature).",
  "04TM. Checking or moving inventory.  Monitoring digital/internal thermometer (fill-in temperature).",
  "05TM. Warm plasma (freshly thawed or recovered) added.  Monitoring temperature as it cools to acceptable range.",
  "06TM. Recovering temperature (fill-in temperature).",
  "07TM. Other reason (fill-in reason).",
  "08TM. Notified BDS (CL, TA, BDF) personnel to follow up with corrective action and/or comments.",
  "09TM. Notified (fill-in) for further investigation.",
  "10TM. Moving products to another storage unit (fill-in BB#).  Notified Vendor/Team Leaders/Manager.",
  "11TM. No products being stored in affected unit. Will continue to monitor.",
  "12TM. Equipment not in use/Out of service.",
  "13TM. Maintenance service being performed.",
  "14TM. BioFridge left unplugged. Plugged-in to recharge the battery. Will continue to monitor.",
  "15TM. Temperatures recorded every 4 hours (manually or automatically).",
  "16TM. Used for OR run (fill-in temperature).",
  "17TM. ROOM TEMP:  No blood products being processed and daily QCs acceptable for critical reagents/supplies.",
  "18TM. ROOM TEMP:  Products being processed are acceptable temperature and daily QCs acceptable for critical reagents/supplies.",
  "19TM. HUMIDITY:  No evidence of equipment malfunction and operating as expected.  No further corrective action needed.",
  "20TM. HUMIDITY:  Malfunctioning equipment evident. Repeated Vision QCs and verified acceptable prior to patient testing.",
  "21TM. HUMIDITY:  Malfunctioning equipment evident. Followed Equipment Malfunction SOP PTT91991 and removed equipment (fill-in equipment) from service.",
  "22TM. OXYGEN:  No staff in room. Will continue to monitor.",
  "23TM. OXYGEN:  Staff in room instructed to leave immediately or continue working in room with the door opened.  Will continue to monitor.",
  "24TM. OXYGEN:  Self-decompression of an LN2 freezer, LN2 tank, or CRF.  Will continue to monitor.",
  "25TM. OXYGEN:  Manual or automatic refilling of the LN2 freezers.  Will continue to monitor.",
];

const comments = [...predefinedComments, ...cedarReasons];

export default function AcknowledgeBar(props: {
  selectedAlarms: AlarmObject[];
  setSelectedAlarms: (alarms: AlarmObject[]) => void;
  refetchAlarms: () => void;
}) {
  const { apiURL } = useBackend();
  const { fetchWithAuth } = useApi();
  const [comment, setComment] = useState("");
  const [note, setNote] = useState("");
  const [snackMessage, setSnackMessage] = useState<{
    type: AlertColor;
    message: string;
  } | null>(null);

  const acknowledgeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetchWithAuth(
        apiURL("alarms/acknowledge", "alarms/acknowledge"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            alarm_ids: props.selectedAlarms.map((alarm) => alarm.id),
            ack_comment: comment,
            ack_note: note,
          }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new (Error as any)(data.error || "Failed to acknowledge alarms");
      }
      return data;
    },
    onSuccess: (data: { message: string }) => {
      setSnackMessage({
        type: "success",
        message: data.message || "Alarms acknowledged successfully",
      });
      props.setSelectedAlarms([]);
      props.refetchAlarms();
      setNote("");
      setComment("");
    },
    onError: (error: Error) => {
      setSnackMessage({
        type: "error",
        message: error.message || "Failed to acknowledge alarms",
      });
    },
  });

  const isFormValid = comment.length > 0 && props.selectedAlarms.length > 0;

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
        <Autocomplete
          disablePortal
          options={comments}
          value={comment}
          onChange={(_, newValue) => setComment(newValue || "")}
          sx={{
            minWidth: "400px",
            flexShrink: 0,
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Select Comment"
              sx={{
                flex: 1,
                minWidth: 0,
                "& .MuiOutlinedInput-root": {
                  height: "38px",
                },
                "& .MuiInputLabel-root": {
                  transform: "translate(14px, 8px) scale(1)",
                  "&.Mui-focused, &.MuiFormLabel-filled": {
                    transform: "translate(14px, -9px) scale(0.75)",
                  },
                },
              }}
            />
          )}
        />

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
          disabled={!isFormValid || acknowledgeMutation.isPending}
          onClick={() => acknowledgeMutation.mutate()}
          sx={{
            paddingLeft: "40px",
            paddingRight: "40px",
            color:
              !isFormValid || acknowledgeMutation.isPending
                ? GREY_TEXT
                : "white",
            borderColor:
              !isFormValid || acknowledgeMutation.isPending
                ? GREY_TEXT
                : SECONDARY,
            flexShrink: 0,
          }}
        >
          {acknowledgeMutation.isPending ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            "Acknowledge"
          )}
          {props.selectedAlarms.length > 0 && (
            <Badge
              badgeContent={props.selectedAlarms.length}
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

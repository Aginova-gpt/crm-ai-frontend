import {
  Box,
  CircularProgress,
  Typography,
  Paper,
  IconButton,
  Button,
  TextField,
  Menu,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { SxProps, Theme } from "@mui/system";
import { useMutation } from "@tanstack/react-query";
import { styles } from "./AcknowledgeAlarm.styles";
import { useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import SnackView from "../SnackView";
import { AlertColor } from "@mui/material";
import { useBackend } from "@/contexts/BackendContext";
import { useApi } from "@/utils/api";
import { AlarmObject } from "../Alarms/Alarms";

interface AcknowledgeAlarmProps {
  sx?: SxProps<Theme>;
  alarms: AlarmObject[];
  onClose: (withRefresh?: boolean) => void;
}

const predefinedComments = [
  "False alarm",
  "Issue resolved",
  "Maintenance completed",
  "System check completed",
  "Other",
];

export default function AcknowledgeAlarm({
  sx,
  alarms,
  onClose,
}: AcknowledgeAlarmProps) {
  const { apiURL } = useBackend();
  const { fetchWithAuth } = useApi();
  const [comment, setComment] = useState("");
  const [note, setNote] = useState("");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [snackMessage, setSnackMessage] = useState<{
    type: AlertColor;
    message: string;
  } | null>(null);

  const acknowledgeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetchWithAuth(
        apiURL("alarms/acknowledge", "alarms/acknowledge", true),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            alarmIds: alarms.map((alarm) => alarm.id),
            comment,
            note,
          }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to acknowledge alarms");
      }
      return data;
    },
    onSuccess: (data) => {
      setSnackMessage({
        type: "success",
        message: data.message || "Alarms acknowledged successfully",
      });
      setTimeout(() => {
        onClose(true);
      }, 2000);
    },
    onError: (error: Error) => {
      setSnackMessage({
        type: "error",
        message: error.message || "Failed to acknowledge alarms",
      });
    },
  });

  const handleCommentClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCommentClose = () => {
    setAnchorEl(null);
  };

  const handleCommentSelect = (selectedComment: string) => {
    setComment(selectedComment);
    handleCommentClose();
  };

  const isFormValid = comment.length > 0;

  return (
    <Box sx={[styles.overlay, ...(Array.isArray(sx) ? sx : [sx])]}>
      <Paper sx={styles.modal}>
        <Box sx={styles.header}>
          <Typography variant="h6">Acknowledge Alarms</Typography>
          <IconButton onClick={() => onClose(false)} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <Box sx={styles.content}>
          <Box sx={styles.formContainer}>
            <Box sx={styles.commentContainer}>
              <Button
                variant="outlined"
                onClick={handleCommentClick}
                endIcon={<ArrowDropDownIcon />}
                sx={styles.commentButton}
              >
                {comment || "Select Comment"}
              </Button>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleCommentClose}
              >
                {predefinedComments.map((comment) => (
                  <MenuItem
                    key={comment}
                    onClick={() => handleCommentSelect(comment)}
                  >
                    {comment}
                  </MenuItem>
                ))}
              </Menu>

              <Button
                variant="contained"
                disabled={!isFormValid || acknowledgeMutation.isPending}
                onClick={() => acknowledgeMutation.mutate()}
                sx={styles.acknowledgeButton}
              >
                {acknowledgeMutation.isPending ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Acknowledge"
                )}
              </Button>
            </Box>

            <TextField
              label="Note"
              multiline
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              sx={styles.noteField}
            />

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Alarm Title</TableCell>
                    <TableCell>Message</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {alarms.map((alarm) => (
                    <TableRow key={alarm.id}>
                      <TableCell>{alarm.sensor_name}</TableCell>
                      <TableCell>{alarm.alarm_condition}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Box>
      </Paper>
      <SnackView
        snackMessage={snackMessage}
        setSnackMessage={setSnackMessage}
      />
    </Box>
  );
}

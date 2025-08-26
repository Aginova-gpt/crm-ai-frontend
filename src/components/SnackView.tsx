import { Alert, AlertColor } from "@mui/material";
import Snackbar, { SnackbarCloseReason } from "@mui/material/Snackbar";
import Slide, { SlideProps } from "@mui/material/Slide";

function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="left" />;
}

interface InfoMessage {
  type: AlertColor;
  message: string;
}

const SnackView = ({
  snackMessage,
  setSnackMessage,
  type,
}: {
  snackMessage: string | InfoMessage | null;
  setSnackMessage: (message: InfoMessage | null) => void;
  type?: AlertColor;
}) => {
  const handleSnackClose = (
    event: React.SyntheticEvent | Event,
    reason?: SnackbarCloseReason
  ) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackMessage(null);
  };

  const message = typeof snackMessage === 'string' ? snackMessage : snackMessage?.message;
  const severity = type || (typeof snackMessage === 'object' ? snackMessage?.type : 'error');

  return (
    <Snackbar
      open={!!message}
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
      TransitionComponent={SlideTransition}
      autoHideDuration={3000}
      onClose={handleSnackClose}
    >
      <Alert
        onClose={handleSnackClose}
        severity={severity}
        variant="filled"
        sx={{ width: "100%" }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default SnackView;

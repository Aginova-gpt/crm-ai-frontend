import { SxProps, Theme } from "@mui/system";

export const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    flexDirection: "column",
    width: "100%",
    minHeight: "calc(100vh - 80px)",
    paddingTop: "20px",
  },
  progressContainer: {
    marginLeft: "15%",
    marginRight: "15%",
    marginTop: "20px",
  },
  paper: {
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    margin: "15px",
    borderWidth: "1px",
    borderColor: "divider",
    borderStyle: "solid",
    paddingTop: "20px",
    flex: 1,
  },
  buttonContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingLeft: "20px",
    paddingRight: "20px",
    marginBottom: "20px",
  },
  button: {
    height: "38px",
    padding: "10px 20px",
    fontSize: "14px",
  },
  sensorsSelector: {} as SxProps<Theme>,
  stepTitle: {
    fontSize: "22px",
    fontWeight: "bold",
  },
  nextButtonContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
  },
  // ProfileThresholdsSetup styles
  mainContainer: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    marginBottom: "10px",
  },
  measurementsContainer: {
    display: "flex",
    flexWrap: "wrap",
    marginTop: "14px",
    width: "100%",
  },
  thresholdBox: {
    borderRadius: "8px",
    margin: "8px",
    width: "30%",
    marginRight: "25px",
  },
  thresholdBoxContent: {
    display: "flex",
    flexDirection: "column",
    marginTop: "4px",
  },
  thresholdRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  thresholdLabel: {
    fontSize: "14px",
    minWidth: "80px",
  },
  thresholdInput: {
    flex: 1,
    "& .MuiInputBase-root": {
      height: "24px",
    },
    "& .MuiInputBase-input": {
      fontSize: "14px",
    },
  },
} as const;

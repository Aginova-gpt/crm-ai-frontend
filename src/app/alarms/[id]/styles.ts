import { DARK_GREY, GREEN, LIGHT_GREY, PRIMARY_LIGHT, RED } from "@/styles/colors";
import { SxProps, Theme } from "@mui/material";

export const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    flexDirection: "column",
    width: "100%",
    height: "100%",
  } as SxProps<Theme>,

  paper: {
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    margin: "15px",
    marginBottom: "0px",
    borderWidth: "1px",
    borderColor: "divider",
    borderStyle: "solid",
  } as SxProps<Theme>,

  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "200px",
  } as SxProps<Theme>,
  header: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    marginTop: "10px",
  } as SxProps<Theme>,
  goBackContainer: {
    marginBottom: "10px",
    marginLeft: "10px",
    marginTop: "30px",
  } as SxProps<Theme>,
  sensorIndicator: (inMaintenance: boolean, hasAlarms: boolean) =>
    ({
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      width: "60px",
      height: "60px",
      borderRadius: "50%",
      backgroundColor: inMaintenance === true ? GREEN : hasAlarms ? RED : GREEN,
      marginRight: "8px",
      padding: "5px",
      marginTop: "15px",
    } as SxProps<Theme>),
  sensorNameCell: {
    display: "flex",
    flex: 1,
    alignItems: "center",
    flexDirection: "row",
  } as SxProps<Theme>,
  sensorNameContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
  } as SxProps<Theme>,
  sensorNameLabel: {
    fontSize: "18px",
    fontWeight: 400,
    color: "text.primary",
    marginRight: "10px",
  },
  sensorNameText: {
    fontSize: "18px",
    fontWeight: 700,
    color: "text.primary",
  } as SxProps<Theme>,
  sensorCoalitionText: {
    marginLeft: "4px",
    fontSize: "14px",
    fontWeight: 700,
    color: DARK_GREY,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    maxWidth: "200px",
  } as SxProps<Theme>,
  sensorCoalitionLabel: {
    fontSize: "14px",
    fontWeight: 400,
    color: DARK_GREY,
  },
  probeTypeContainer: (isOpen: boolean) => ({
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    backgroundColor: isOpen ? PRIMARY_LIGHT : LIGHT_GREY,
    padding: "10px",
  }),
  alarmFilterNameContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "center",
    marginLeft: "10px",
  },
  alarmFilterName: {
    fontSize: "24px",
    fontWeight: 700,
  },
  alarmProbeType: {
    fontSize: "16px",
    fontWeight: 400,
  },
  tableCell: {
    padding: "8px 12px",
  } as SxProps<Theme>,
} as const;

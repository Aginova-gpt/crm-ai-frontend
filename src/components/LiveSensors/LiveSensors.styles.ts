import { SxProps, Theme } from "@mui/system";
import { GREY_TEXT, RED, GREEN, SECONDARY, ORANGE, GREY } from "@/styles/colors";

export const styles = {
  container: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    height: "100%",
  } as SxProps<Theme>,

  toolbar: {
    display: "flex",
    flexDirection: {
      sm: "column",
      md: "row",
    },
    justifyContent: "space-between",
  } as SxProps<Theme>,

  toolbarInner: {
    display: "flex",
    borderTop: 1,
    borderColor: "divider",
    height: "100%",
    width: "100%",
    marginBottom: "12px",
  } as SxProps<Theme>,

  toolbarContent: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    flex: 1,
  } as SxProps<Theme>,

  searchContainer: {
    display: "flex",
    justifyContent: "center",
    flexDirection: "column",
    flex: 1,
    marginRight: "50px",
    marginTop: "15px",
    marginBottom: "18px",
  } as SxProps<Theme>,

  iconsContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
  } as SxProps<Theme>,

  iconBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    cursor: "pointer",
    marginLeft: "24px",
    padding: "6px",
  } as SxProps<Theme>,

  iconText: {
    fontSize: "14px",
    fontWeight: 400,
    color: "text.primary",
  } as SxProps<Theme>,

  tableContainer: {
    display: "flex",
    flexDirection: "column",
  } as SxProps<Theme>,

  tableRow: {
    cursor: "pointer",
    backgroundColor: "transparent",
    "&:last-child td, &:last-child th": { border: 0 },
    "& td": {
      borderBottom: "1px solid rgba(224, 224, 224, 1)",
    },
  } as SxProps<Theme>,

  iconImageContainer: {
    width: "50px",
    height: "50px",
    padding: "2px",
    position: "relative",
  } as SxProps<Theme>,

  badgeContainer: {
    position: "absolute",
    top: "8px",
    right: "8px",
  } as SxProps<Theme>,
  filtersContainer: {
    marginTop: {
      sm: "10px",
      md: "-35px",
    },
    marginBottom: {
      sm: "35px",
      md: "0px",
    },
  } as SxProps<Theme>,
  sensorIndicator: (hasAlarms: boolean, isMaintenanceActive: boolean = false, isInactive: boolean = false) =>
    ({
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      width: "36px",
      height: "36px",
      borderRadius: "50%",
      backgroundColor: isInactive ? GREY : isMaintenanceActive ? ORANGE : hasAlarms ? RED : GREEN,
      marginRight: "8px",
      padding: "5px",
    } as SxProps<Theme>),
  sensorNameCell: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
  } as SxProps<Theme>,
  sensorNameText: {
    fontSize: "14px",
    fontWeight: 400,
    color: "text.primary",
  } as SxProps<Theme>,
  sensorCoalitionText: {
    fontSize: "12px",
    fontWeight: 400,
    color: GREY_TEXT,
  } as SxProps<Theme>,
  tableCell: {
    padding: "8px 12px",
  } as SxProps<Theme>,
  sensorProbeCell: {
    display: "flex",
    flexDirection: "row",
  } as SxProps<Theme>,
  sensorProbeText: {
    fontSize: "14px",
    fontWeight: 400,
  } as SxProps<Theme>,
  sensorProbeTextContainer: {
    marginLeft: "5px",
    marginTop: "2px",
  } as SxProps<Theme>,
  sensorProbeAverageText: {
    fontSize: "13px",
    fontWeight: 400,
  } as SxProps<Theme>,
  sensorAlarmsCell: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
  } as SxProps<Theme>,
  selectedIconBox: {
    boxShadow: `inset 0 0 0 2px ${SECONDARY}`,
    borderRadius: "8px",
    position: "relative",
    "&:hover::before": {
      content: '""',
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      borderRadius: "8px",
      zIndex: 1,
    },
    "&:hover::after": {
      content: '"✕"',
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      fontSize: "24px",
      fontWeight: "bold",
      color: "white",
      zIndex: 2,
    },
  } as SxProps<Theme>,
} as const;

import {
  GREEN,
  RED,
  DARK_GREY,
  BLUE,
  CARD_BACKGROUND,
  ORANGE,
  GREY,
} from "@/styles/colors";
import { SxProps, Theme } from "@mui/material";

export const styles = {
  container: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    padding: "10px",
  } as SxProps<Theme>,

  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "200px",
  } as SxProps<Theme>,

  errorContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "200px",
  } as SxProps<Theme>,

  header: {
    display: "flex",
    flexDirection: "row",
    marginTop: "20px",
  } as SxProps<Theme>,
  goBackContainer: {
    marginBottom: "10px",
    marginLeft: "-10px",
    marginTop: "30px",
  } as SxProps<Theme>,
  sensorIndicator: (isMaintenanceActive: boolean, hasAlarms: boolean = false, isInactive: boolean = false) =>
    ({
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      width: "60px",
      height: "60px",
      borderRadius: "50%",
      backgroundColor: isInactive ? GREY : isMaintenanceActive ? ORANGE : hasAlarms ? RED : GREEN,
      marginRight: "8px",
      padding: "5px",
      marginTop: "15px",
    } as SxProps<Theme>),
  sensorNameCell: {
    display: "flex",
    flex: 1,
    flexDirection: "row",
    borderBottom: "1px solid #E0E0E0",
    paddingBottom: "25px",
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
  detailsContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    height: "24px",
    borderRadius: "4px",
    backgroundColor: CARD_BACKGROUND,
    padding: "0 10px",
  } as SxProps<Theme>,
  detailsLabel: {
    fontSize: "14px",
    fontWeight: 400,
  } as SxProps<Theme>,
  detailsValue: {
    fontSize: "14px",
    fontWeight: 700,
    marginLeft: "5px",
  } as SxProps<Theme>,
  cardsContainer: {
    display: "flex",
    flexDirection: "row",
    marginLeft: "25px",
    flexWrap: "wrap",
    gap: "10px",
  } as SxProps<Theme>,
  measurementCard: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    width: "215px",
    height: "146px",
    marginRight: "14px",
    padding: "12px",
    backgroundColor: CARD_BACKGROUND,
    borderRadius: "4px",
  } as SxProps<Theme>,
  measurementName: {
    fontSize: "18px",
    fontWeight: 400,
    color: "text.primary",
  } as SxProps<Theme>,
  measurementValueContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
  } as SxProps<Theme>,
  measurementValue: {
    fontSize: "44px",
    fontWeight: 700,
    color: "text.primary",
    marginLeft: "5px",
  } as SxProps<Theme>,
  measurementUnit: {
    fontSize: "27px",
    fontWeight: 700,
    marginTop: "5px",
  } as SxProps<Theme>,
  measurementThresholdsContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  } as SxProps<Theme>,
  measurementLowerThreshold: {
    fontSize: "16px",
    fontWeight: 700,
    color: BLUE,
  } as SxProps<Theme>,
  measurementUpperThreshold: {
    fontSize: "16px",
    fontWeight: 700,
    color: RED,
  } as SxProps<Theme>,
  measurementThresholdValueContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  } as SxProps<Theme>,
  button: {
    height: "32px",
    padding: "10px 20px",
    fontSize: "14px",
  } as SxProps<Theme>,
} as const;

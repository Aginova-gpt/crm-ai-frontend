import { SxProps, Theme } from "@mui/system";
import {
  RED_GRADIENT,
  GREEN_GRADIENT,
  SECONDARY,
  GREEN,
} from "@/styles/colors";

export const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  } as SxProps<Theme>,

  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    marginTop: "40px",
  } as SxProps<Theme>,

  searchContainer: {
    marginTop: "20px",
    width: "30%",
  } as SxProps<Theme>,

  sensorsContainer: {
    display: "flex",
    width: "100%",
    flexDirection: "column",
    alignItems: "center",
  } as SxProps<Theme>,

  tablesContainer: {
    display: "flex",
    flexDirection: "row",
    width: "100%",
    justifyContent: "center",
  } as SxProps<Theme>,

  tableContainer: {
    marginTop: "10px",
    display: "flex",
    flexDirection: "column",
  } as SxProps<Theme>,

  tableTitle: {
    fontSize: "18px",
    fontWeight: "400",
  } as SxProps<Theme>,

  tableCell: {
    padding: "2px 8px",
  } as SxProps<Theme>,

  tableTitleContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  } as SxProps<Theme>,

  toAssignTableContainer: {
    maxHeight: "530px",
    marginTop: "15px",
    overflowY: "scroll",
    overflowX: "hidden",
    "&::-webkit-scrollbar": {
      width: "8px",
    },
    "&::-webkit-scrollbar-track": {
      backgroundColor: "#f1f1f1",
    },
    "&::-webkit-scrollbar-thumb": {
      backgroundColor: "#888",
      borderRadius: "4px",
    },
    "&::-webkit-scrollbar-thumb:hover": {
      backgroundColor: "#555",
    },
  } as SxProps<Theme>,

  sensorIconBox: {
    width: "30px",
    height: "30px",
    backgroundColor: GREEN,
    borderRadius: "50%",
    marginRight: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  } as SxProps<Theme>,
};

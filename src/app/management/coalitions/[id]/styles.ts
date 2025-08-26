import { SxProps, Theme } from "@mui/material";
import { PRIMARY_LIGHT, LIGHT_GREY } from "@/styles/colors";

export const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    flexDirection: "column",
    width: "100%",
    height: "calc(100vh - 64px)", // Subtract navbar height
    padding: "10px",
  } as SxProps<Theme>,

  paper: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    height: "100%",
    borderWidth: "1px",
    borderColor: "divider",
    borderStyle: "solid",
    overflow: "hidden",
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
    marginTop: "10px",
    alignItems: "center",
    borderBottom: "1px solid #E0E0E0",
    paddingBottom: "15px",
    flexShrink: 0,
  } as SxProps<Theme>,

  goBackContainer: {
    marginLeft: "-10px",
  } as SxProps<Theme>,

  coalitionNameContainer: {
    display: "flex",
    flexDirection: "column",
  } as SxProps<Theme>,

  coalitionNameLabel: {
    fontSize: "16px",
    fontWeight: "700",
  } as SxProps<Theme>,

  coalitionName: {
    fontSize: "24px",
    fontWeight: "400",
  } as SxProps<Theme>,

  button: {
    height: "38px",
    padding: "10px 20px",
    fontSize: "14px",
  } as SxProps<Theme>,

  tableCell: {
    padding: "8px 12px",
  } as SxProps<Theme>,

  tableRow: {
    cursor: "pointer",
    backgroundColor: "transparent",
    "&:last-child td, &:last-child th": { border: 0 },
    "& td": {
      borderBottom: "1px solid rgba(224, 224, 224, 1)",
    },
  } as SxProps<Theme>,

  userNameText: {
    fontSize: "14px",
    fontWeight: 400,
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
} as const;

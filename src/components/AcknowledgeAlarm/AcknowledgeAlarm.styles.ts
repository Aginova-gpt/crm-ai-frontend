import { SECONDARY } from "@/styles/colors";
import { SxProps, Theme } from "@mui/system";

export const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1300,
  } as SxProps<Theme>,

  modal: {
    width: "800px",
    maxWidth: "90vw",
    maxHeight: "80vh",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "background.paper",
    borderRadius: "8px",
    boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.15)",
  } as SxProps<Theme>,

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 24px",
    borderBottom: "1px solid",
    borderColor: "divider",
  } as SxProps<Theme>,

  content: {
    padding: "24px",
    overflowY: "auto",
    flex: 1,
  } as SxProps<Theme>,

  formContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  } as SxProps<Theme>,

  commentButton: {
    width: "100%",
    justifyContent: "space-between",
    textTransform: "none",
    color: SECONDARY,
    borderColor: SECONDARY,
  } as SxProps<Theme>,

  noteField: {
    width: "100%",
  } as SxProps<Theme>,

  acknowledgeButton: {
    alignSelf: "flex-end",
    marginLeft: "20px",
    color: "white",
    paddingLeft: "20px",
    paddingRight: "20px",
    backgroundColor: SECONDARY,
  } as SxProps<Theme>,

  alarmItem: {
    padding: "12px 0",
    borderBottom: "1px solid",
    borderColor: "divider",
    "&:last-child": {
      borderBottom: "none",
    },
  } as SxProps<Theme>,
  commentContainer: {
    display: "flex",
    flexDirection: "row",
  } as SxProps<Theme>,
} as const;

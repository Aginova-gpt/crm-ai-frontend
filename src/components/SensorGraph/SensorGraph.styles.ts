import { GREEN, RED, DARK_GREY, BLUE, CARD_BACKGROUND } from "@/styles/colors";
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
} as const;

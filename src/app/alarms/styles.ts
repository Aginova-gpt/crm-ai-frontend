import { SxProps, Theme } from "@mui/material";
import { GREY_TEXT } from "@/styles/colors";

export const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    flexDirection: {
      xs: "column",
      md: "row",
    },
    width: "100%",
    height: "100%",
  } as SxProps<Theme>,

  paper: {
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    width: "100%",
    margin: "15px",
    borderWidth: "1px",
    borderColor: "divider",
    borderStyle: "solid",
  } as SxProps<Theme>,
} as const;

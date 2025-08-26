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
    borderWidth: "1px",
    borderColor: "divider",
    borderStyle: "solid",
  } as SxProps<Theme>,
} as const;

import { SxProps, Theme } from "@mui/system";

export const styles = {
  bubble: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    height: "24px",
    paddingLeft: "8px",
    paddingRight: "8px",
    borderRadius: "4px",
  } as SxProps<Theme>,

  iconContainer: {
    width: "24px",
    height: "24px",
    marginRight: "8px",
  } as SxProps<Theme>,

  label: {
    fontSize: "14px",
    fontWeight: "400",
    color: "black",
  } as SxProps<Theme>,
};

import { SxProps, Theme } from "@mui/system";
import {
  BACKGROUND,
  RED_GRADIENT,
  GREEN_GRADIENT,
  PRIMARY,
  SECONDARY,
} from "@/styles/colors";

export const styles = {
  container: {
    width: "100%",
    display: "flex",
    flexDirection: "row",
    height: "100px",
    justifyContent: "flex-end",
  } as SxProps<Theme>,

  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  } as SxProps<Theme>,

  filtersContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "flex-end",
    flex: 1,
    marginLeft: "20px",
    marginRight: "10px",
  } as SxProps<Theme>,

  filterBox: (
    isSelected: boolean,
    filteredCount: number,
  ) =>
  ({
      width: "25%",
      maxWidth: "193px",
      height: "115px",
      marginRight: "9px",
      borderRadius: "8px",
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      padding: "12px",
      background: filteredCount > 0 ? RED_GRADIENT : GREEN_GRADIENT,
      cursor: "pointer",
      transition: "all 0.3s ease",
      transform: isSelected ? "scale(0.9)" : "scale(1)",
      boxShadow: isSelected
        ? `inset 0 0 0 3px ${SECONDARY}, 0 0 10px rgba(255,255,255,0.3)`
        : "none",
      "&:hover": {
        opacity: 0.9,
        transform: "scale(0.9)",
      },
    } as SxProps<Theme>),

  filterTitle: {
    color: "white",
    fontSize: "18px",
    fontWeight: 400,
    zIndex: 1,
  } as SxProps<Theme>,

  filterCount: {
    color: "white",
    fontWeight: 700,
    zIndex: 1,
    fontSize: "22px",
    marginTop: "-5px",
  } as SxProps<Theme>,

  iconContainer: (isSelected: boolean) =>
    ({
      opacity: isSelected ? 0.7 : 0.35,
      alignItems: "center",
      justifyContent: "center",
      transition: "opacity 0.3s ease",
    } as SxProps<Theme>),
};

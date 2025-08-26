import { createTheme } from "@mui/material/styles";
import * as colors from "./colors";
import "@fontsource/roboto";

const theme = createTheme({
  typography: {
    fontFamily: "Roboto, Arial, sans-serif",
  },
  palette: {
    primary: {
      main: colors.PRIMARY,
      light: colors.PRIMARY_LIGHT,
    },
    secondary: {
      main: colors.SECONDARY,
    },
    error: {
      main: colors.RED,
    },
    background: {
      default: colors.BACKGROUND,
    },
    divider: colors.BORDER,
    text: {
      primary: "#000000",
      secondary: "#000000",
    },
  },
  components: {
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: colors.PRIMARY_LIGHT,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          height: "34px",
          fontSize: "14px",
          fontWeight: "700",
          padding: "8px 16px",
        },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        root: {
          color: colors.SECONDARY,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          "& .MuiCircularProgress-root": {
            color: "white",
          },
        },
      },
    },
  },
});

export default theme;

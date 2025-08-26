import {
  GREY_TEXT,
  LIGHT_GREY,
  PRIMARY_LIGHT,
  SECONDARY,
} from "@/styles/colors";
import { SxProps, Theme } from "@mui/system";

export const styles = {
  container: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
  },
  tableHeaderCell: {
    padding: "4px 4px",
    fontWeight: "bold",
  },
  tableCell: {
    padding: "8px 4px",
  },
  tableRow: {
    "&:last-child td, &:last-child th": { border: 0 },
    "& td": {
      borderBottom: "1px solid rgba(224, 224, 224, 1)",
    },
  },
  tableBox: {
    display: "flex",
    alignItems: "center",
  },
  compactCheckbox: {
    marginLeft: "-10px",
    padding: 0,
    margin: 0,
    marginRight: "4px",
    "& .MuiSvgIcon-root": {
      fontSize: "16px",
    },
  },
} as const;

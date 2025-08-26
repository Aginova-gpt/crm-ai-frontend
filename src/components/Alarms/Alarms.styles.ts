import {
  GREY_TEXT,
  LIGHT_GREY,
  PRIMARY_LIGHT,
  SECONDARY,
} from "@/styles/colors";
import { SxProps, Theme } from "@mui/system";

export const styles = {
  container: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingRight: "25px",
    paddingBottom: "15px",
    marginTop: "-30px",
  },
  filterButton: {
    textTransform: "none",
  },
  tableRow: {
    "&:last-child td, &:last-child th": { border: 0 },
    "& td": {
      borderBottom: "1px solid rgba(224, 224, 224, 1)",
    },
  },
  tableCell: {
    padding: "8px 12px",
  } as SxProps<Theme>,
  tableHeader: {
    minWidth: "300px",
  },
  dateHeader: {
    minWidth: "120px",
  },
  statusHeader: {
    minWidth: "80px",
  },
  alarmTitleText: {
    fontSize: "14px",
    fontWeight: 400,
    color: "text.primary",
  } as SxProps<Theme>,
  alarmMessageText: {
    fontSize: "13px",
    fontWeight: 400,
    color: GREY_TEXT,
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
    marginBottom: "20px",
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
    marginTop: "15px",
    marginBottom: "18px",
    marginRight: "14px",
  } as SxProps<Theme>,

  filtersContainer: {
    marginTop: {
      sm: "10px",
      md: "-35px",
    },
    marginBottom: {
      sm: "35px",
      md: "0px",
    },
  } as SxProps<Theme>,
  probeTypeContainer: (isOpen: boolean) => ({
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    backgroundColor: isOpen ? PRIMARY_LIGHT : LIGHT_GREY,
    padding: "10px",
  }),
  alarmFilterNameContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "center",
    marginLeft: "10px",
  },
  alarmFilterName: {
    fontSize: "16px",
    fontWeight: 700,
  },
  alarmProbeType: {
    fontSize: "16px",
    fontWeight: 400,
  },
  alarmCondition: {
    maxWidth: "200px",
    overflow: "hidden",
  },
  infoCell: {
    fontSize: "14px",
    fontWeight: 400,
  },
  commentContainer: {
    display: "flex",
    flexDirection: "row",
    flex: 1,
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
    height: "40px",
    marginLeft: "20px",
  } as SxProps<Theme>,

  acknowledgeButton: {
    alignSelf: "flex-end",
    marginLeft: "20px",
    color: "white",
    paddingLeft: "20px",
    paddingRight: "20px",
    backgroundColor: SECONDARY,
  } as SxProps<Theme>,
} as const;

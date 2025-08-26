import { SxProps, Theme } from "@mui/system";
import { PRIMARY_LIGHT, LIGHT_GREY } from "@/styles/colors";

export const styles = {
  container: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    height: "100%",
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

  iconsContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
  } as SxProps<Theme>,

  iconBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    cursor: "pointer",
    marginLeft: "24px",
    padding: "6px",
  } as SxProps<Theme>,

  iconText: {
    fontSize: "14px",
    fontWeight: 400,
    color: "text.primary",
  } as SxProps<Theme>,

  tableContainer: {
    display: "flex",
    flexDirection: "column",
  } as SxProps<Theme>,

  tableRow: {
    cursor: "pointer",
    backgroundColor: "transparent",
    "&:last-child td, &:last-child th": { border: 0 },
    "& td": {
      borderBottom: "1px solid rgba(224, 224, 224, 1)",
    },
  } as SxProps<Theme>,

  iconImageContainer: {
    width: "50px",
    height: "50px",
    padding: "2px",
    position: "relative",
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

  userNameCell: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
  } as SxProps<Theme>,

  userNameText: {
    fontSize: "14px",
    fontWeight: 400,
  },
  tableCell: {
    padding: "8px 12px",
  } as SxProps<Theme>,
  avatarTypeContainer: (isActive: boolean) => ({
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    backgroundColor: isActive ? PRIMARY_LIGHT : LIGHT_GREY,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginRight: "8px",
  }),
} as const;

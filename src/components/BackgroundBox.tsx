import { Box } from "@mui/material";
import { BACKGROUND } from "@/styles/colors";
import { SxProps, Theme } from "@mui/system";

interface BackgroundBoxProps {
  children: React.ReactNode;
  sx?: SxProps<Theme>;
}

export default function BackgroundBox({ children, sx }: BackgroundBoxProps) {
  return (
    <Box
      sx={[
        {
          backgroundColor: "BACKGROUND",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        },
        ...(Array.isArray(sx) ? sx : [sx]),
        ,
      ]}
    >
      {children}
    </Box>
  );
}

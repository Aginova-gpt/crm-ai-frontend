import { Box, Typography } from "@mui/material";
import { SxProps, Theme } from "@mui/system";
import { styles } from "./ReceiverBubble.styles";
import {
  Receiver,
  iconForReceiverType,
  colorForReceiverType,
  emptyString,
} from "@/utils/helpers";

interface ReceiverBubbleProps {
  sx?: SxProps<Theme>;
  receiver: Receiver | { group_name: string; can_write: boolean };
  maxWidth?: string;
}

export default function ReceiverBubble({
  sx,
  receiver,
  maxWidth,
}: ReceiverBubbleProps) {
  const renderLabel = () => {
    if ("receiver_type" in receiver) {
      if (receiver.receiver_type === "list") {
        return (
          <>
            <Typography
              component="span"
              sx={{ ...styles.label, fontWeight: "bold" }}
            >
              {receiver.count}
            </Typography>
            <Typography
              component="span"
              sx={{
                ...styles.label,
                maxWidth: maxWidth,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {`${emptyString}-${emptyString}`}
              {receiver.label}
            </Typography>
          </>
        );
      }
      return (
        <Typography
          sx={{
            ...styles.label,
            maxWidth: maxWidth,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {receiver.label}
        </Typography>
      );
    } else {
      const suffix = receiver.can_write
        ? `${emptyString}- Write`
        : `${emptyString}- Read`;

      return (
        <Box sx={{ display: "flex", alignItems: "center", flexWrap: "nowrap" }}>
          <Typography
            sx={{
              ...styles.label,
              maxWidth: "80px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={receiver.group_name}
          >
            {receiver.group_name}
          </Typography>
          <Typography sx={{ ...styles.label, whiteSpace: "nowrap" }}>
            {suffix}
          </Typography>
        </Box>
      );
    }
  };

  return (
    <Box
      sx={[
        styles.bubble,
        ...(Array.isArray(sx) ? sx : [sx]),
        {
          backgroundColor: `${colorForReceiverType(
            "receiver_type" in receiver ? receiver.receiver_type : "group"
          )}20`,
        },
      ]}
    >
      <Box sx={styles.iconContainer}>
        {iconForReceiverType(
          "receiver_type" in receiver ? receiver.receiver_type : "group"
        )}
      </Box>
      {renderLabel()}
    </Box>
  );
}

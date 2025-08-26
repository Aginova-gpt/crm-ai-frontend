"use client";
import { useEffect, useState } from "react";
import BackgroundBox from "@/components/BackgroundBox";
import Navbar from "@/components/Navbar";
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  TableCell,
  Table,
  TableContainer,
  Typography,
  TableHead,
  TableRow,
  TableBody,
  Chip,
  TableSortLabel,
} from "@mui/material";
import {
  BACKGROUND,
  CARD_BACKGROUND,
  GREY_TEXT,
  LIGHT_GREY,
  RED,
  BLUE,
} from "@/styles/colors";
import { styles } from "./styles";
import { useParams, useRouter } from "next/navigation";
import { useApi } from "@/utils/api";
import { useBackend } from "@/contexts/BackendContext";
import { useQuery } from "@tanstack/react-query";
import { AlarmObject } from "@/components/Alarms/Alarms";
import SensorGraph from "@/components/SensorGraph/SensorGraph";
import AcknowledgeBar from "@/components/AcknowledgeBar/AcknowledgeBar";
import { useAlarmContext } from "@/contexts/AlarmContext";
import { ArrowBack, Build, DeviceThermostat } from "@mui/icons-material";
import {
  alarmIconSmall,
  alarmFilterName,
  getMaintenanceStatus,
} from "@/utils/sensorHelpers";
import { formatReadingDate, ReceiverType } from "@/utils/helpers";
import { SensorDetailsData } from "@/components/SensorDetails/SensorDetails";
import { useProfile } from "@/contexts/ProfileContext";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import AlarmOnOutlinedIcon from "@mui/icons-material/AlarmOnOutlined";
import WarningOutlinedIcon from "@mui/icons-material/WarningOutlined";
import EmailIcon from "@mui/icons-material/Email";
import SmsIcon from "@mui/icons-material/Sms";
import CallIcon from "@mui/icons-material/Call";
import AlternateEmailIcon from "@mui/icons-material/AlternateEmail";
import { SortDirection } from "@/utils/sensorHelpers";

type AlertObject = {
  id: number;
  alert_channel: "email" | "sms" | "call" | "email_to_text";
  receiver_list_id: number;
  receiver_scope: string;
  receiver_type: string;
  repetition: number;
  sensor_id: string;
  sent_at: string;
  user_email: string;
  escalation_level: number;
  user_contact: {
    alert_sms: string | null;
    alert_email: string | null;
    alert_call: string | null;
    alert_email_to_text: string | null;
  };
};

type NotificationSortKey = "sent_at" | "escalation_level";

export default function AlarmPage() {
  const params = useParams();
  const alarmId = params.id as string;
  const router = useRouter();
  const { fetchWithAuth } = useApi();
  const { apiURL } = useBackend();
  const { sharedAlarm, clearSharedAlarm } = useAlarmContext();
  const { isAdmin } = useProfile();
  const [sortKey, setSortKey] = useState<NotificationSortKey>("sent_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const {
    data: alarm,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["alarm", alarmId],
    queryFn: async () => {
      const response = await fetchWithAuth(
        apiURL(`alarms/details?id=${alarmId}`, `alarms/details/${alarmId}`)
      );
      if (!response.ok) {
        throw new Error("Failed to fetch sensor data");
      }
      return response.json() as Promise<AlarmObject>;
    },
    // Use shared alarm data if available, otherwise fetch from API
    initialData: sharedAlarm,
    // Only fetch if we don't have shared alarm data
    enabled: !sharedAlarm,
  });

  const { data: sensor, isLoading: sensorIsLoading } = useQuery({
    queryKey: ["sensor", sharedAlarm?.sensor_id],
    queryFn: async () => {
      const sensorId = sharedAlarm?.sensor_id || alarm?.sensor_id;
      const response = await fetchWithAuth(
        apiURL(
          `sensors/details?sensor_id=${sensorId}`,
          `sensors/details/${sensorId}`
        )
      );
      if (!response.ok) {
        throw new Error("Failed to fetch sensor data");
      }
      return response.json() as Promise<SensorDetailsData>;
    },
    enabled: !!(sharedAlarm || alarm),
  });

  const { data: notifications, isLoading: notificationsLoading } = useQuery({
    queryKey: ["alarm-notifications", alarmId],
    queryFn: async () => {
      const response = await fetchWithAuth(
        apiURL(
          `alarms/alerts?alarm_id=${alarmId}`,
          `alarms/notifications/${alarmId}`
        )
      );
      if (!response.ok) {
        throw new Error("Failed to fetch alarm notifications");
      }
      return response.json() as Promise<{ data: AlertObject[] }>;
    },
  });

  // Use shared alarm data if available, otherwise use fetched data
  const finalAlarm = sharedAlarm || alarm;
  const finalIsLoading = !sharedAlarm && isLoading;

  // Clear shared alarm data when component unmounts
  useEffect(() => {
    return () => {
      clearSharedAlarm();
    };
  }, [clearSharedAlarm]);

  const handleSort = (key: NotificationSortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const sensorNameCell = (
    sensorName: string,
    sensorGroup: string,
    sensorLocation: string,
    sensorCoalition: string
  ) => {
    const maintenanceStatus = sensor
      ? getMaintenanceStatus(sensor.in_maintenance)
      : null;
    return (
      <Box sx={styles.sensorNameCell}>
        <Box
          sx={styles.sensorIndicator(
            maintenanceStatus?.isActive || false,
            (sensor?.open_alarms || 0) > 0
          )}
        >
          {sensorIsLoading ? (
            <CircularProgress size={24} sx={{ color: "white" }} />
          ) : (
            <DeviceThermostat
              sx={{ width: "100%", height: "100%", color: "white" }}
            />
          )}
        </Box>
        <Box style={{ marginLeft: "10px" }}>
          <Box sx={styles.sensorNameContainer}>
            <Typography sx={styles.sensorNameLabel}>Name:</Typography>
            <Typography
              sx={styles.sensorNameText}
            >{`${sensorName} (${alarm?.sensor_id})`}</Typography>
          </Box>
          <Box sx={styles.sensorNameContainer}>
            <Typography sx={styles.sensorCoalitionLabel}>Group:</Typography>
            <Typography sx={styles.sensorCoalitionText}>
              {sensorGroup}
            </Typography>

            <Typography
              sx={{ ...styles.sensorCoalitionLabel, marginLeft: "20px" }}
            >
              {isAdmin ? "Coalition:" : "Location:"}
            </Typography>
            <Typography sx={styles.sensorCoalitionText}>
              {isAdmin ? sensorCoalition : sensorLocation}
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  };

  const alarmStatus = (alarm: AlarmObject | null) => {
    if (!alarm) {
      return null;
    }
    const isOpen = alarm.status === "open";
    return (
      <Chip
        icon={
          isOpen ? <NotificationsActiveOutlinedIcon /> : <AlarmOnOutlinedIcon />
        }
        label={isOpen ? "Open Alarm" : "Closed Alarm"}
        sx={{
          backgroundColor: isOpen ? CARD_BACKGROUND : LIGHT_GREY,
          color: "black",
          marginLeft: "10px",
          fontSize: "18px",
          height: "32px",
          marginTop: "2px",
          borderRadius: "4px",
          "& .MuiChip-icon": {
            color: isOpen ? "#64ADF0" : GREY_TEXT,
            fontSize: "22px",
          },
        }}
      />
    );
  };

  const acknowledgeIndicator = () => {
    return (
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <Chip
          icon={<WarningOutlinedIcon />}
          label={"Needs to be acknowledged!"}
          sx={{
            backgroundColor: "transparent",
            color: RED,
            marginLeft: "10px",
            fontSize: "18px",
            height: "32px",
            marginTop: "2px",
            "& .MuiChip-icon": {
              color: RED,
              fontSize: "22px",
            },
          }}
        />
      </Box>
    );
  };

  const alarmType = (alarm: AlarmObject | null) => {
    if (!alarm) {
      return null;
    }

    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          minWidth: 0, // Allow flex items to shrink below their content size
        }}
      >
        <Box
          sx={{
            ...styles.probeTypeContainer(alarm.status === "open"),
            flexShrink: 0,
          }}
        >
          <img
            src={alarmIconSmall(alarm.type)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              filter:
                alarm.status === "open"
                  ? "brightness(0) saturate(100%) invert(48%) sepia(79%) saturate(2476%) hue-rotate(199deg) brightness(118%) contrast(119%)"
                  : "brightness(0) saturate(100%) invert(60%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(90%) contrast(90%)",
            }}
          />
        </Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "center",
            flex: 1,
            minWidth: 0, // Allow this container to shrink
            overflow: "hidden", // Prevent overflow
          }}
        >
          <Box sx={styles.alarmFilterNameContainer}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Typography sx={styles.alarmFilterName}>
                {alarmFilterName(alarm.type)}
              </Typography>

              <>
                {alarmStatus(alarm)}
                {alarm.status === "open" && acknowledgeIndicator()}
              </>
            </Box>
            {alarm.type === "threshold" && (
              <Typography sx={styles.alarmProbeType}>
                {alarm.measurement_name}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              marginLeft: "10px",
            }}
          >
            <Typography sx={{ fontSize: 18 }}>
              <Box component="span" sx={{ fontWeight: 700 }}>
                Alarm Profile:{" "}
              </Box>
              <Box component="span" sx={{ fontWeight: 400 }}>
                {alarm.alarm_profile_name}
              </Box>
            </Typography>
          </Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              marginLeft: "10px",
              maxWidth: "600px",
              flexShrink: 1,
            }}
          >
            <Typography
              sx={{
                fontSize: 18,
                wordWrap: "break-word",
                overflowWrap: "break-word",
              }}
            >
              <Box component="span" sx={{ fontWeight: 700 }}>
                Alarm Condition:{" "}
              </Box>
              <Box component="span" sx={{ fontWeight: 400 }}>
                {alarm.alarm_condition}
              </Box>
            </Typography>
          </Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              marginLeft: "10px",
            }}
          >
            <Typography sx={{ fontSize: 18 }}>
              <Box component="span" sx={{ fontWeight: 700 }}>
                Alarm Time:{" "}
              </Box>
              <Box component="span" sx={{ fontWeight: 400 }}>
                {formatReadingDate(alarm.alarm_time)}
              </Box>
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  };

  const closedAlarmDetails = (alarm: AlarmObject | null) => {
    if (!alarm) {
      return null;
    }
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          maxWidth: "600px",
        }}
      >
        <Typography sx={{ fontSize: 18 }}>
          <Box component="span" sx={{ fontWeight: 700 }}>
            Acknowledged time:{" "}
          </Box>
          <Box component="span" sx={{ fontWeight: 400 }}>
            {alarm.acknowledge_date
              ? formatReadingDate(alarm.acknowledge_date)
              : "N/A"}
          </Box>
        </Typography>
        <Typography sx={{ fontSize: 18 }}>
          <Box component="span" sx={{ fontWeight: 700 }}>
            Acknowledged by:{" "}
          </Box>
          <Box component="span" sx={{ fontWeight: 400 }}>
            {alarm.acknowledged_by ? alarm.acknowledged_by : "N/A"}
          </Box>
        </Typography>
        <Typography sx={{ fontSize: 18 }}>
          <Box component="span" sx={{ fontWeight: 700 }}>
            Note:{" "}
          </Box>
          <Box component="span" sx={{ fontWeight: 400 }}>
            {alarm.acknowledgement_note ? alarm.acknowledgement_note : "N/A"}
          </Box>
        </Typography>
        <Typography sx={{ fontSize: 18 }}>
          <Box component="span" sx={{ fontWeight: 700 }}>
            Comment:{" "}
          </Box>
          <Box component="span" sx={{ fontWeight: 400 }}>
            {alarm.acknowledgement_comment
              ? alarm.acknowledgement_comment
              : "N/A"}
          </Box>
        </Typography>
      </Box>
    );
  };

  const alarmDetails = () => {
    return (
      <Paper elevation={0} sx={styles.paper}>
        <Box sx={styles.header}>
          <Box sx={styles.goBackContainer}>
            <Button
              variant="text"
              color="primary"
              onClick={() => router.push("/alarms?section=0")}
            >
              <ArrowBack sx={{ color: "black" }} />
            </Button>
          </Box>

          {finalAlarm &&
            sensorNameCell(
              finalAlarm?.sensor_name ?? "",
              finalAlarm?.group ?? "",
              finalAlarm?.location ?? "",
              finalAlarm?.coalition ?? ""
            )}
        </Box>
        <Box sx={{ display: "flex", flexDirection: "row" }}>
          <Box
            sx={{
              display: "flex",
              marginTop: "10px",
              marginLeft: "75px",
              marginBottom: "20px",
            }}
          >
            {alarmType(finalAlarm)}
          </Box>
          {finalAlarm && finalAlarm.status === "closed" && (
            <Box
              sx={{
                display: "flex",
                marginTop: "10px",
                marginLeft: "75px",
                marginBottom: "20px",
              }}
            >
              {closedAlarmDetails(finalAlarm)}
            </Box>
          )}
        </Box>
      </Paper>
    );
  };

  const tableHeader = () => {
    return (
      <TableHead>
        <TableRow>
          <TableCell
            sx={{ width: "250px", minWidth: "250px", maxWidth: "250px" }}
          >
            <TableSortLabel
              active={sortKey === "sent_at"}
              direction={sortKey === "sent_at" ? sortDirection : "asc"}
              onClick={() => handleSort("sent_at")}
            >
              Timeline
            </TableSortLabel>
          </TableCell>
                     <TableCell sx={{ width: "200px", minWidth: "200px" }}>Channel</TableCell>
           <TableCell sx={{ width: "100%" }}>
             <TableSortLabel
               active={sortKey === "escalation_level"}
               direction={sortKey === "escalation_level" ? sortDirection : "asc"}
               onClick={() => handleSort("escalation_level")}
             >
               Part of
             </TableSortLabel>
           </TableCell>
        </TableRow>
      </TableHead>
    );
  };

  const notificationRow = (notification: AlertObject, index: number) => {
    const formatDateTime = (dateString: string) => {
      return new Date(dateString).toLocaleString();
    };

    const iconForAlertChannel = (alertChannel: string) => {
      if (alertChannel === "email") {
        return <EmailIcon sx={{ color: BLUE, fontSize: "20px" }} />;
      } else if (alertChannel === "sms") {
        return <SmsIcon sx={{ color: BLUE, fontSize: "20px" }} />;
      } else if (alertChannel === "call") {
        return <CallIcon sx={{ color: BLUE, fontSize: "20px" }} />;
      } else {
        return <AlternateEmailIcon sx={{ color: BLUE, fontSize: "20px" }} />;
      }
    };

    const receiverText = (alertChannel: string) => {
      if (alertChannel === "email") {
        return notification.user_contact.alert_email;
      } else if (alertChannel === "sms") {
        return notification.user_contact.alert_sms;
      } else if (alertChannel === "call") {
        return notification.user_contact.alert_call;
      } else {
        return notification.user_contact.alert_email_to_text;
      }
    };

    return (
      <TableRow 
        key={index}
        sx={{
          backgroundColor: index % 2 === 0 ? "white" : "#f5f5f5",
          "&:hover": {
            backgroundColor: "#e3f2fd",
          },
        }}
      >
        <TableCell
          sx={{
            ...styles.tableCell,
            width: "250px",
            minWidth: "250px",
            maxWidth: "250px",
          }}
        >
          <Box
            sx={{ display: "flex", alignItems: "center", position: "relative" }}
          >
            <Box
              sx={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                backgroundColor: "white",
                border: "2px solid white",
                boxShadow: "0 0 0 2px #2196F3",
                marginRight: 2,
                zIndex: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {iconForAlertChannel(notification.alert_channel)}
            </Box>
            {index < (notifications?.data?.length || 0) - 1 && (
              <Box
                sx={{
                  position: "absolute",
                  left: 14,
                  top: 20,
                  width: 2,
                  height: 40,
                  backgroundColor: "#E0E0E0",
                  zIndex: 1,
                }}
              />
            )}
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {formatDateTime(notification.sent_at)}
            </Typography>
          </Box>
        </TableCell>
        <TableCell sx={{ ...styles.tableCell, width: "200px", minWidth: "200px" }}>
          <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
            {receiverText(notification.alert_channel)}
          </Typography>
        </TableCell>
        <TableCell sx={{ ...styles.tableCell, width: "100%" }}>
          <Typography variant="body2">
            Escalation: {notification.escalation_level}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Repeat: {notification.repetition} times
          </Typography>
        </TableCell>
      </TableRow>
    );
  };

  const alarmNotifications = () => {
    return (
      <Paper elevation={0} sx={{ ...styles.paper, marginBottom: "100px" }}>
        <Typography
          variant="h6"
          sx={{ padding: 2, borderBottom: "1px solid #e0e0e0" }}
        >
          Alarm Notifications
        </Typography>
        <TableContainer>
          <Table>
            {tableHeader()}
            <TableBody>
              {notificationsLoading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : notifications &&
                notifications.data &&
                notifications.data.length > 0 ? (
                notifications.data
                  .sort((a, b) => {
                    if (sortKey === "escalation_level") {
                      return sortDirection === "asc"
                        ? a.escalation_level - b.escalation_level
                        : b.escalation_level - a.escalation_level;
                    } else {
                      const aTime = new Date(a.sent_at).getTime();
                      const bTime = new Date(b.sent_at).getTime();
                      return sortDirection === "asc"
                        ? aTime - bTime
                        : bTime - aTime;
                    }
                  })
                  .map((notification: AlertObject, index: number) =>
                    notificationRow(notification, index)
                  )
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No notifications found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    );
  };

  return (
    <BackgroundBox sx={{ backgroundColor: BACKGROUND, minHeight: "100vh" }}>
      <Navbar />
      <Box sx={styles.container}>
        {finalIsLoading ? (
          <Box sx={styles.loadingContainer}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {alarmDetails()}
            <Paper elevation={0} sx={styles.paper}>
              {finalAlarm && (
                <SensorGraph
                  showControls={false}
                  sensor={{
                    id: finalAlarm.sensor_id,
                    upload_period: 86400,
                  }}
                  selectedProbe={finalAlarm.measurement_id}
                  alarm={finalAlarm}
                  heightFactor={0.6}
                />
              )}
              {finalAlarm && finalAlarm.status === "open" && (
                <AcknowledgeBar
                  selectedAlarms={[finalAlarm]}
                  setSelectedAlarms={() => {}}
                  refetchAlarms={refetch}
                />
              )}
            </Paper>
            {alarmNotifications()}
          </>
        )}
      </Box>
    </BackgroundBox>
  );
}

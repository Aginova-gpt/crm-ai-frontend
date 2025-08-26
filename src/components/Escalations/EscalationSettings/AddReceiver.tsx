import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  CircularProgress,
} from "@mui/material";
import { useState } from "react";
import { SxProps, Theme } from "@mui/system";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/utils/api";
import { useBackend } from "@/contexts/BackendContext";
import { useAlarmProfileContext } from "@/contexts/AlarmProfileContext";
import { EscalationReceiver } from "@/components/AlarmProfiles/AlarmProfiles";
import { ReceiverType } from "@/utils/helpers";

interface RelayReceiver {
  internal_code: string;
  name: string;
  sensor_id: string;
}

interface UserReceiver {
  communication: {
    call: string | null;
    email: string;
    sms: string | null;
    email_to_text: string | null;
  };
  email: string;
  enabled: boolean;
  id: number;
  role_level: number;
  username: string;
}

interface AddReceiverProps {
  sx?: SxProps<Theme>;
  currentTargets: EscalationReceiver[];
  newReceiversWereSaved: (receivers: EscalationReceiver[]) => void;
  selectedTargetType: ReceiverType;
}

export default function AddReceiver({
  sx,
  currentTargets,
  newReceiversWereSaved,
  selectedTargetType,
}: AddReceiverProps) {
  const { fetchWithAuth } = useApi();
  const { apiURL } = useBackend();
  const { group, coalition } = useAlarmProfileContext();
  const [selectedReceivers, setSelectedReceivers] = useState<
    EscalationReceiver[]
  >(currentTargets.filter((target) => target.type === selectedTargetType));

  const { data: users, isLoading } = useQuery({
    queryKey: ["users_by_group", group],
    queryFn: async () => {
      const response = await fetchWithAuth(
        apiURL(
          `users/by_group?group_id=${group?.id}`,
          `users/by_group/${group?.id}`
        )
      );
      if (!response.ok) {
        throw new Error("Failed to fetch sensor data");
      }
      return response.json() as Promise<UserReceiver[]>;
    },
    enabled: !!group?.id && selectedTargetType === "user",
  });

  const { data: relays, isLoading: isRelaysLoading } = useQuery({
    queryKey: ["relays_by_coalition", coalition],
    queryFn: async () => {
      const response = await fetchWithAuth(
        apiURL(
          `relays/by_coalition?coalition_id=${coalition?.id}`,
          `relays/by_coalition/${coalition?.id}`
        )
      );
      if (!response.ok) {
        throw new Error("Failed to fetch sensor data");
      }
      return response.json() as Promise<RelayReceiver[]>;
    },
    enabled: !!coalition?.id && selectedTargetType === "relay",
  });

  const receiversContains = (receiver: UserReceiver | RelayReceiver) => {
    if ("username" in receiver) {
      return selectedReceivers.some((r) => r.username === receiver.username);
    } else {
      return selectedReceivers.some((r) => r.sensor_id === receiver.sensor_id);
    }
  };

  const handleReceiverToggle = (receiver: UserReceiver | RelayReceiver) => {
    if (receiversContains(receiver)) {
      setSelectedReceivers((prev) => {
        return prev.filter(
          (id) =>
            ("username" in receiver && id.username !== receiver.username) ||
            ("sensor_id" in receiver && id.sensor_id !== receiver.sensor_id)
        );
      });
    } else {
      setSelectedReceivers((prev) => {
        let newReceiver: EscalationReceiver;
        if ("username" in receiver) {
          newReceiver = {
            type: "user",
            username: receiver.username,
            email_enabled: true,
            email: receiver.communication.email,
            phone: receiver.communication.call || undefined,
            sms: receiver.communication.sms || undefined,
            call_enabled:
              receiver.communication.call !== null &&
              receiver.communication.call !== undefined,
            sms_enabled:
              receiver.communication.sms !== null &&
              receiver.communication.sms !== undefined,
            email_to_text: receiver.communication.email_to_text || undefined,
            email_to_text_enabled:
              receiver.communication.email_to_text !== null &&
              receiver.communication.email_to_text !== undefined,
          };
        } else {
          newReceiver = {
            type: "relay",
            sensor_id: receiver.sensor_id,
            call_enabled: true,
            email_enabled: true,
            sms_enabled: true,
          };
        }
        return [...prev, newReceiver];
      });
    }
  };

  const handleDone = () => {
    newReceiversWereSaved(selectedReceivers);
  };

  const usersTableHeader = () => {
    return (
      <TableHead>
        <TableRow>
          <TableCell
            sx={{
              padding: "2px 2px",
            }}
          >
            Username
          </TableCell>
          <TableCell
            sx={{
              padding: "2px 2px",
            }}
          >
            Role
          </TableCell>
        </TableRow>
      </TableHead>
    );
  };

  const relaysTableHeader = () => {
    return (
      <TableHead>
        <TableRow>
          <TableCell
            sx={{
              padding: "2px 2px",
            }}
          >
            Sensor Id
          </TableCell>
          <TableCell
            sx={{
              padding: "2px 2px",
            }}
          >
            Sensor Name
          </TableCell>
        </TableRow>
      </TableHead>
    );
  };

  const usersTable = () => {
    return users?.map((user) => (
      <TableRow key={user.email}>
        <TableCell
          sx={{
            padding: "2px 2px",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Checkbox
              checked={receiversContains(user)}
              onChange={() => handleReceiverToggle(user)}
            />
            {user.email}
          </Box>
        </TableCell>
        <TableCell
          sx={{
            padding: "2px 2px",
          }}
        >
          {user.role_level === 1 ? "Owner" : "Standard"}
        </TableCell>
      </TableRow>
    ));
  };

  const relaysTable = () => {
    return relays?.map((relay) => (
      <TableRow key={relay.sensor_id}>
        <TableCell
          sx={{
            padding: "2px 2px",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Checkbox
              checked={receiversContains(relay)}
              onChange={() => handleReceiverToggle(relay)}
            />
            {relay.sensor_id}
          </Box>
        </TableCell>
        <TableCell
          sx={{
            padding: "2px 2px",
          }}
        >
          {relay.internal_code}
        </TableCell>
      </TableRow>
    ));
  };

  return (
    <Box sx={sx}>
      <Box sx={{ p: 2, border: "1px solid #e0e0e0", borderRadius: 1 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h6" component="h2">
            Add {selectedTargetType}s
          </Typography>
          <Button variant="contained" color="secondary" onClick={handleDone}>
            Save
          </Button>
        </Box>

        {isLoading || isRelaysLoading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              {selectedTargetType === "user"
                ? usersTableHeader()
                : relaysTableHeader()}
              <TableBody>
                {selectedTargetType === "user" ? usersTable() : relaysTable()}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Box>
  );
}

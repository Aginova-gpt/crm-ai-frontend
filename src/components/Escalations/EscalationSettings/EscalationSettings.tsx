import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  Typography,
  Dialog,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
} from "@mui/material";
import { SxProps, Theme } from "@mui/system";
import { styles } from "./EscalationSettings.styles";
import { EscalationSettingsObject } from "@/contexts/AlarmProfileContext";
import { useState } from "react";
import type { ChangeEvent, MouseEvent } from "react";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import Settings from "@mui/icons-material/Settings";
import { ACTION } from "@/styles/colors";
import AddReceiver from "./AddReceiver";
import ReceiverBubble from "@/components/ReceiverBubble/ReceiverBubble";
import { ReceiverType } from "@/utils/helpers";
import AddIndividual from "./AddIndividual";
import {
  EscalationReceiver,
  ScheduleType,
} from "@/components/AlarmProfiles/AlarmProfiles";
import DeleteOutline from "@mui/icons-material/DeleteOutline";
import CustomScheduleConfiguration from "./CustomScheduleConfiguration";

interface EscalationSettingsProps {
  sx?: SxProps<Theme>;
  escalation: EscalationSettingsObject;
  setEscalation: (escalation: EscalationSettingsObject) => void;
}

export default function EscalationSettings({
  sx,
  escalation,
  setEscalation,
}: EscalationSettingsProps) {
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const isMenuOpen = Boolean(menuAnchorEl);
  const [selectedTargetType, setSelectedTargetType] =
    useState<ReceiverType | null>(null);
  const [selectedTargetIndex, setSelectedTargetIndex] = useState<number | null>(
    null
  );

  const handleDelayChange = (event: ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;
    if (inputValue === "") {
      setEscalation({ ...escalation, delay_before_sending: 0 });
      return;
    }
    const numericValue = Math.max(0, Math.floor(Number(inputValue)));
    if (!Number.isNaN(numericValue)) {
      setEscalation({ ...escalation, delay_before_sending: numericValue });
    }
  };

  const handleOpenMenu = (event: MouseEvent<HTMLButtonElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setMenuAnchorEl(null);
  };

  const handleAddTarget = (type: ReceiverType) => {
    setSelectedTargetType(type);
    handleCloseMenu();
  };

  const handleCloseModal = () => {
    setSelectedTargetType(null);
  };

  const handleOpenScheduleModal = (targetIndex: number) => {
    setSelectedTargetIndex(targetIndex);
  };

  const handleCloseScheduleModal = () => {
    setSelectedTargetIndex(null);
  };

  const handleScheduleUpdate = (targetIndex: number, scheduleDays: any) => {
    const newTargets = [...escalation.targets];
    newTargets[targetIndex].schedule_days = scheduleDays;
    setEscalation({ ...escalation, targets: newTargets });
  };

  const checkboxCell = (
    type: ReceiverType,
    checked: boolean,
    text: string | null | undefined,
    targetIndex: number,
    key: keyof EscalationReceiver
  ) => {
    return (
      <Box sx={styles.tableBox}>
        <Checkbox
          disabled={type !== "user"}
          checked={checked && text !== null && text !== undefined}
          size="small"
          onChange={(e) => {
            e.stopPropagation();
            if (text === null || text === undefined) {
              return;
            }
            setEscalation({
              ...escalation,
              targets: escalation.targets.map((target, index) => {
                if (index === targetIndex) {
                  return { ...target, [key]: !checked };
                }
                return target;
              }),
            });
          }}
          sx={styles.compactCheckbox}
        />
        <span>{text || "N/A"}</span>
      </Box>
    );
  };

  return (
    <Box sx={[styles.container, ...(Array.isArray(sx) ? sx : [sx])]}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          mt: "20px",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <TextField
            id="delay-before-sending"
            label="Delay before sending (minutes)"
            type="number"
            value={escalation.delay_before_sending}
            onChange={handleDelayChange}
            inputProps={{ min: 0, step: 1 }}
            size="small"
            sx={{ maxWidth: 300, mt: 0 }}
            aria-describedby="delay-helper-text"
          />
          <Typography
            id="delay-helper-text"
            sx={{ color: "text.secondary", maxWidth: 500, fontSize: "12px" }}
          >
            The delay can vary between your entered value and the entered value
            plus the upload time, as the alarms are being managed everytime a
            new data point is being received by the server
          </Typography>
        </Box>
        <IconButton
          sx={{
            right: "20px",
          }}
          aria-controls={isMenuOpen ? "add-target-menu" : undefined}
          aria-haspopup="true"
          aria-expanded={isMenuOpen ? "true" : undefined}
          onClick={handleOpenMenu}
        >
          <GroupAddIcon sx={{ fontSize: "34px", color: ACTION }} />
        </IconButton>
        <Menu
          id="add-target-menu"
          anchorEl={menuAnchorEl}
          open={isMenuOpen}
          onClose={handleCloseMenu}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <MenuItem onClick={() => handleAddTarget("user")}>Add user</MenuItem>
          <MenuItem onClick={() => handleAddTarget("individual")}>
            Add individual
          </MenuItem>
          <MenuItem onClick={() => handleAddTarget("relay")}>
            Add relay
          </MenuItem>
          {/* <MenuItem onClick={() => handleAddTarget("list")}>
            Add receiver list
          </MenuItem> */}
        </Menu>
      </Box>

      <Box sx={{ flex: 1 }}>
        <Box sx={{ marginTop: "10px" }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={styles.tableHeaderCell}>Receivers</TableCell>
                  <TableCell sx={styles.tableHeaderCell}>Email</TableCell>
                  <TableCell sx={styles.tableHeaderCell}>Call</TableCell>
                  <TableCell sx={styles.tableHeaderCell}>SMS</TableCell>
                  <TableCell sx={styles.tableHeaderCell}>
                    Email to Text
                  </TableCell>
                  <TableCell sx={styles.tableHeaderCell}>Schedule</TableCell>
                  <TableCell sx={styles.tableHeaderCell}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {escalation.targets.length > 0 ? (
                  escalation.targets.map((target, index) => (
                    <TableRow
                      key={index}
                      sx={{
                        ...styles.tableRow,
                        "&:hover": {
                          backgroundColor: "#f0f0f0",
                        },
                      }}
                    >
                      <TableCell sx={styles.tableCell}>
                        <Box sx={styles.tableBox}>
                          <ReceiverBubble
                            receiver={{
                              label:
                                target.username ||
                                target.email ||
                                target.sensor_id ||
                                "User",
                              receiver_type: target.type as ReceiverType,
                              count: 1,
                            }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell sx={styles.tableCell}>
                        {target.type === "relay"
                          ? "-"
                          : checkboxCell(
                              target.type,
                              target.email_enabled,
                              target.email,
                              index,
                              "email_enabled"
                            )}
                      </TableCell>
                      <TableCell sx={styles.tableCell}>
                        {target.type === "relay"
                          ? "-"
                          : checkboxCell(
                              target.type,
                              target.call_enabled,
                              target.phone,
                              index,
                              "call_enabled"
                            )}
                      </TableCell>
                      <TableCell sx={styles.tableCell}>
                        {target.type === "relay"
                          ? "-"
                          : checkboxCell(
                              target.type,
                              target.sms_enabled,
                              target.sms,
                              index,
                              "sms_enabled"
                            )}
                      </TableCell>
                      <TableCell sx={styles.tableCell}>
                        {target.type === "relay"
                          ? "-"
                          : checkboxCell(
                              target.type,
                              target.email_to_text_enabled === true,
                              target.email_to_text,
                              index,
                              "email_to_text_enabled"
                            )}
                      </TableCell>
                      <TableCell sx={styles.tableCell}>
                        {target.type === "relay" ? (
                          "-"
                        ) : (
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <TextField
                              select
                              size="small"
                              value={target.schedule || "all_the_time"}
                              onChange={(e) => {
                                setEscalation({
                                  ...escalation,
                                  targets: escalation.targets.map((t, i) => {
                                    if (i === index) {
                                      return {
                                        ...t,
                                        schedule: e.target
                                          .value as ScheduleType,
                                      };
                                    }
                                    return t;
                                  }),
                                });
                              }}
                              sx={{
                                minWidth: 120,
                                "& .MuiInputBase-root": {
                                  height: "32px",
                                  fontSize: "14px",
                                },
                              }}
                            >
                              <MenuItem value="all_the_time">
                                All the time
                              </MenuItem>
                              <MenuItem value="custom">Custom</MenuItem>
                            </TextField>
                            {target.schedule === "custom" && (
                              <IconButton
                                size="small"
                                onClick={() => handleOpenScheduleModal(index)}
                                sx={{
                                  height: "24px",
                                  width: "24px",
                                  "& .MuiSvgIcon-root": {
                                    fontSize: "16px",
                                  },
                                }}
                              >
                                <Settings sx={{ fontSize: "16px" }} />
                              </IconButton>
                            )}
                          </Box>
                        )}
                      </TableCell>
                      <TableCell sx={styles.tableCell}>
                        <IconButton
                          onClick={() => {
                            setEscalation({
                              ...escalation,
                              targets: escalation.targets.filter(
                                (_, i) => i !== index
                              ),
                            });
                          }}
                        >
                          <DeleteOutline sx={{ color: "red" }} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      align="center"
                      sx={{ padding: "16px", color: "text.secondary" }}
                    >
                      No targets configured
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>

      {/* Add Target Modal */}
      <Dialog
        open={selectedTargetType !== null}
        onClose={handleCloseModal}
        maxWidth="sm"
        fullWidth
      >
        {selectedTargetType === "individual" ? (
          <AddIndividual
            newIndividualWasSaved={(individual) => {
              const newTargets = [...escalation.targets, individual];
              setEscalation({
                ...escalation,
                targets: newTargets,
              });
              handleCloseModal();
            }}
          />
        ) : (
          <AddReceiver
            selectedTargetType={selectedTargetType as ReceiverType}
            currentTargets={escalation.targets || []}
            newReceiversWereSaved={(receivers) => {
              const currentTargets = escalation.targets.filter(
                (target) => target.type !== selectedTargetType
              );
              const newTargets = [...currentTargets, ...receivers];

              setEscalation({
                ...escalation,
                targets: newTargets,
              });
              handleCloseModal();
            }}
          />
        )}
      </Dialog>

      <CustomScheduleConfiguration
        open={selectedTargetIndex !== null}
        onClose={handleCloseScheduleModal}
        target={
          selectedTargetIndex !== null
            ? escalation.targets[selectedTargetIndex]
            : ({} as EscalationReceiver)
        }
        targetIndex={selectedTargetIndex || 0}
        onScheduleUpdate={handleScheduleUpdate}
      />
    </Box>
  );
}

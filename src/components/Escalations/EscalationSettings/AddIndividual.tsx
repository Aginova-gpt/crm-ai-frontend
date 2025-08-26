import { Box, Typography, Button, Checkbox, TextField } from "@mui/material";
import { useState } from "react";
import { SxProps, Theme } from "@mui/system";
import { EscalationReceiver } from "@/components/AlarmProfiles/AlarmProfiles";

interface AddIndividualProps {
  sx?: SxProps<Theme>;
  newIndividualWasSaved: (individual: EscalationReceiver) => void;
}

export default function AddIndividual({
  sx,
  newIndividualWasSaved,
}: AddIndividualProps) {
  const [email, setEmail] = useState<string | null>(null);
  const [sms, setSms] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [emailToText, setEmailToText] = useState<string | null>(null);
  const [emailEnabled, setEmailEnabled] = useState<boolean>(false);
  const [smsEnabled, setSmsEnabled] = useState<boolean>(false);
  const [phoneEnabled, setPhoneEnabled] = useState<boolean>(false);
  const [emailToTextEnabled, setEmailToTextEnabled] = useState<boolean>(false);

  const handleDone = () => {
    newIndividualWasSaved({
      type: "individual",
      email: email || undefined,
      sms: sms || undefined,
      phone: phone || undefined,
      email_to_text: emailToText || undefined,
      email_to_text_enabled: emailToTextEnabled,
      email_enabled: emailEnabled,
      sms_enabled: smsEnabled,
      call_enabled: phoneEnabled,
    });
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
            Add Individual
          </Typography>
          <Button variant="contained" color="secondary" onClick={handleDone}>
            Save
          </Button>
        </Box>

        {/* Email Row */}
        <Box sx={{ display: "flex", alignItems: "center", mb: 2, gap: 2 }}>
          <Checkbox
            checked={emailEnabled}
            onChange={(e) => setEmailEnabled(e.target.checked)}
            size="small"
          />
          <TextField
            label="Email"
            type="email"
            value={email || ""}
            onChange={(e) => setEmail(e.target.value)}
            disabled={!emailEnabled}
            size="small"
            sx={{ flex: 1 }}
            placeholder="Enter email address"
          />
        </Box>

        {/* Phone Row */}
        <Box sx={{ display: "flex", alignItems: "center", mb: 2, gap: 2 }}>
          <Checkbox
            checked={phoneEnabled}
            onChange={(e) => setPhoneEnabled(e.target.checked)}
            size="small"
          />
          <TextField
            label="Phone"
            type="tel"
            value={phone || ""}
            onChange={(e) => setPhone(e.target.value)}
            disabled={!phoneEnabled}
            size="small"
            sx={{ flex: 1 }}
            placeholder="Enter phone number"
          />
        </Box>

        {/* SMS Row */}
        <Box sx={{ display: "flex", alignItems: "center", mb: 2, gap: 2 }}>
          <Checkbox
            checked={smsEnabled}
            onChange={(e) => setSmsEnabled(e.target.checked)}
            size="small"
          />
          <TextField
            label="SMS"
            type="tel"
            value={sms || ""}
            onChange={(e) => setSms(e.target.value)}
            disabled={!smsEnabled}
            size="small"
            sx={{ flex: 1 }}
            placeholder="Enter phone number for SMS"
          />
        </Box>

        {/* Email to Text Row */}
        <Box sx={{ display: "flex", alignItems: "center", mb: 2, gap: 2 }}>
          <Checkbox
            checked={emailToTextEnabled}
            onChange={(e) => setEmailToTextEnabled(e.target.checked)}
            size="small"
          />
          <TextField
            label="Email to Text"
            type="email"
            value={emailToText || ""}
            onChange={(e) => setEmailToText(e.target.value)}
            disabled={!emailToTextEnabled}
            size="small"
            sx={{ flex: 1 }}
            placeholder="Enter email address for text messages"
          />
        </Box>
      </Box>
    </Box>
  );
}

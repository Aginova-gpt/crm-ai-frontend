// app/(wherever)/AddVendorDialog.tsx
"use client";

import * as React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Stack,
  Typography,
  Divider,
  Alert,
} from "@mui/material";
import { useApi } from "@/utils/api";
import { useBackend } from "@/contexts/BackendContext";

type CreatedVendor = {
  vendor_id: number;
  global_vendor_id: number;
  display_name: string;
};

export interface AddVendorDialogProps {
  open: boolean;
  onClose: () => void;
  companyId: number;
  /** Optional: pass a friendly name if you have it handy */
  companyName?: string | null;
  /** Optional: notify parent so it can refresh any lists */
  onCreated?: (vendor: CreatedVendor) => void;
}

function trimOrNull(v?: string | null) {
  const s = (v ?? "").trim();
  return s.length ? s : null;
}

export default function AddVendorDialog({
  open,
  onClose,
  companyId,
  companyName,
  onCreated,
}: AddVendorDialogProps) {
  const { fetchWithAuth } = useApi();
  const { apiURL } = useBackend();

  // core vendor
  const [vendorName, setVendorName] = React.useState("");
  const [vendorCode, setVendorCode] = React.useState(""); // optional (backend will derive if empty)
  const [localVendorName, setLocalVendorName] = React.useState("");
  const [contactName, setContactName] = React.useState("");
  const [notes, setNotes] = React.useState("");

  // contact details
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [website, setWebsite] = React.useState("");

  // address (separate fields, per your schema)
  const [street, setStreet] = React.useState("");
  const [city, setCity] = React.useState("");
  const [state, setState] = React.useState("");
  const [postalCode, setPostalCode] = React.useState("");
  const [country, setCountry] = React.useState("");

  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const resetForm = React.useCallback(() => {
    setVendorName("");
    setVendorCode("");
    setLocalVendorName("");
    setContactName("");
    setNotes("");
    setPhone("");
    setEmail("");
    setWebsite("");
    setStreet("");
    setCity("");
    setState("");
    setPostalCode("");
    setCountry("");
    setError(null);
    setSubmitting(false);
  }, []);

  const handleClose = React.useCallback(() => {
    if (!submitting) {
      resetForm();
      onClose();
    }
  }, [onClose, resetForm, submitting]);

  const handleSubmit = React.useCallback(async () => {
    setError(null);

    if (!companyId) {
      setError("Company is required.");
      return;
    }
    if (!vendorName.trim()) {
      setError("Vendor name is required.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        company_id: companyId,
        vendor_name: vendorName.trim(),
        vendor_code: trimOrNull(vendorCode), // optional; backend derives if null
        local_vendor_name: trimOrNull(localVendorName),
        contact_name: trimOrNull(contactName),
        notes: trimOrNull(notes),

        // contact bits
        phone: trimOrNull(phone),
        email: trimOrNull(email),
        website: trimOrNull(website),

        // address in separate fields (backend builds full_address)
        street: trimOrNull(street),
        city: trimOrNull(city),
        state: trimOrNull(state),
        postal_code: trimOrNull(postalCode),
        country: trimOrNull(country),
      };

      const url = apiURL("vendors", "vendors");
      const res = await fetchWithAuth(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        requiresAuth: true,
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || `Request failed (${res.status})`);
      }

      const created: CreatedVendor | undefined = data?.vendor;
      if (onCreated && created) onCreated(created);

      resetForm();
      onClose();
    } catch (e: any) {
      setError(e?.message || "Failed to create vendor.");
    } finally {
      setSubmitting(false);
    }
  }, [
    apiURL,
    companyId,
    contactName,
    email,
    fetchWithAuth,
    localVendorName,
    notes,
    onClose,
    onCreated,
    phone,
    postalCode,
    state,
    street,
    vendorCode,
    vendorName,
    website,
    city,
    country,
    resetForm,
  ]);

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Add Vendor</DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2}>
          {/* Company context */}
          <Box>
            <Typography variant="body2" color="text.secondary">
              Company
            </Typography>
            <Typography variant="subtitle2">
              {companyName ? `${companyName} (ID: ${companyId})` : `ID: ${companyId}`}
            </Typography>
          </Box>

          {error && <Alert severity="error">{error}</Alert>}

          <Divider />

          {/* Core vendor */}
          <Stack spacing={1.5}>
            <TextField
              label="Vendor Name *"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              autoFocus
              fullWidth
              required
            />
            <TextField
              label="Vendor Code (optional)"
              value={vendorCode}
              onChange={(e) => setVendorCode(e.target.value)}
              helperText="Leave blank to auto-generate from name"
              fullWidth
            />
            <TextField
              label="Local Vendor Name"
              value={localVendorName}
              onChange={(e) => setLocalVendorName(e.target.value)}
              fullWidth
            />
            <TextField
              label="Contact Name"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              fullWidth
            />
            <TextField
              label="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              fullWidth
              multiline
              minRows={2}
            />
          </Stack>

          <Divider />

          {/* Contact bits */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <TextField
              label="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
            />
          </Stack>

          <TextField
            label="Website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            fullWidth
          />

          <Divider />

          {/* Address (separate fields) */}
          <Stack spacing={1.5}>
            <TextField
              label="Street"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              fullWidth
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <TextField
                label="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                fullWidth
              />
              <TextField
                label="State / Province"
                value={state}
                onChange={(e) => setState(e.target.value)}
                fullWidth
              />
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <TextField
                label="Postal Code"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                fullWidth
              />
              <TextField
                label="Country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                fullWidth
              />
            </Stack>
            <Typography variant="caption" color="text.secondary">
              The backend will build a full address string from these fields.
            </Typography>
          </Stack>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={submitting}
        >
          {submitting ? "Saving…" : "Save Vendor"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

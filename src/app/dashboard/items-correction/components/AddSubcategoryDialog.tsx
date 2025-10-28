"use client";

import * as React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Stack,
  Alert,
} from "@mui/material";
import { NAVBAR_GRADIENT } from "@/styles/colors";
import { useAuth } from "@/contexts/AuthContext";
import { useBackend } from "@/contexts/BackendContext";

type Mode = "existing" | "new";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Existing canonical category names (UPPER_SNAKE) */
  categories: string[];
  /**
   * Mapping of category -> array of subcategory names (UPPER_SNAKE)
   * Used for duplicate detection across/same categories.
   */
  subcategoriesByCategory: Record<string, string[]>;
  /** Called after a successful create so caller can refresh lookups. */
  onCreated?: () => Promise<void> | void;
};

const NAME_RE = /^[A-Z0-9_]+$/;

export default function AddSubcategoryDialog({
  open,
  onClose,
  categories,
  subcategoriesByCategory,
  onCreated,
}: Props) {
  const { token } = useAuth();              // ← same source as your Customers page
  const { apiURL } = useBackend();          // ← consistent URL builder

  const [mode, setMode] = React.useState<Mode>("existing");

  const [categoryName, setCategoryName] = React.useState("");
  const [categoryLabel, setCategoryLabel] = React.useState("");

  const [subName, setSubName] = React.useState("");
  const [subLabel, setSubLabel] = React.useState("");

  const [saving, setSaving] = React.useState(false);

  // validation messages
  const [catError, setCatError] = React.useState<string | null>(null);
  const [subError, setSubError] = React.useState<string | null>(null);
  const [globalInfo, setGlobalInfo] = React.useState<string | null>(null);

  const resetAll = () => {
    setMode("existing");
    setCategoryName("");
    setCategoryLabel("");
    setSubName("");
    setSubLabel("");
    setSaving(false);
    setCatError(null);
    setSubError(null);
    setGlobalInfo(null);
  };

  React.useEffect(() => {
    if (!open) resetAll();
  }, [open]);

  // normalize inputs to UPPERCASE + _
  const normalizeKey = (val: string) =>
    val.replace(/[^A-Za-z0-9_]/g, "_").toUpperCase();

  const handleModeChange = (_: any, v: string) => {
    setMode((v as Mode) || "existing");
    setCatError(null);
    setSubError(null);
    setGlobalInfo(null);
  };

  const handleCategoryNameChange = (v: string) => {
    const norm = normalizeKey(v);
    setCategoryName(norm);

    // validate category key format
    if (!norm) {
      setCatError("Category is required");
    } else if (!NAME_RE.test(norm)) {
      setCatError("Only A–Z, 0–9, and '_' are allowed");
    } else if (mode === "new" && categories.includes(norm)) {
      setCatError(`Category '${norm}' already exists`);
    } else {
      setCatError(null);
    }

    // revalidate subcategory against this category change
    validateSubcategory(norm, subName);
  };

  const handleSubNameChange = (v: string) => {
    const norm = normalizeKey(v);
    setSubName(norm);
    validateSubcategory(categoryName, norm);
  };

  const validateSubcategory = (catKey: string, subKey: string) => {
    setGlobalInfo(null);

    if (!subKey) {
      setSubError("Subcategory is required");
      return;
    }
    if (!NAME_RE.test(subKey)) {
      setSubError("Only A–Z, 0–9, and '_' are allowed");
      return;
    }

    // 1) Same-category duplicate?
    const sameCatSubs = subcategoriesByCategory[catKey] || [];
    if (sameCatSubs.includes(subKey)) {
      setSubError(
        `Subcategory '${subKey}' already exists under category '${catKey}'.`
      );
      return;
    }

    // 2) Cross-category duplicate?
    const whereExists: string[] = [];
    for (const [cat, subs] of Object.entries(subcategoriesByCategory)) {
      if (subs.includes(subKey)) whereExists.push(cat);
    }
    if (whereExists.length > 0) {
      setSubError(
        `Subcategory '${subKey}' already exists under ${whereExists.join(
          ", "
        )}. Please choose a different name.`
      );
      setGlobalInfo(
        `Heads-up: '${subKey}' exists in ${whereExists.join(
          ", "
        )}. Reusing identical names across categories is not allowed.`
      );
      return;
    }

    setSubError(null);
  };

  const canSubmit =
    !saving &&
    !catError &&
    !subError &&
    !!subName &&
    (mode === "existing" ? !!categoryName : !!categoryName && !!categoryLabel);

  const save = async () => {
    if (!canSubmit) return;

    // mimic Customers page: require token and send Authorization header
    if (!token) {
      setGlobalInfo("Unauthorized – please log in again.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        subcategory_name: subName,
        subcategory_label: subLabel || subName,
        category_mode: mode,
        category_name: categoryName,
        category_label: mode === "new" ? categoryLabel || categoryName : undefined,
      };

      const url = apiURL("item-corrections/lookups/subcategory", "item-corrections.json");

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,   // ← same auth string method
        },
        credentials: "include", // keep if you also use cookies
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `Save failed (${res.status})`);
      }

      await onCreated?.(); // refresh lookups on the caller
      onClose();
    } catch (err: any) {
      setGlobalInfo(err?.message || "Failed to create subcategory");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Subcategory</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Alert severity="info">
            Names must be UPPERCASE, digits, or "_" only. Duplicates are not allowed across or within categories.
          </Alert>

          <RadioGroup
            row
            value={mode}
            onChange={handleModeChange}
            sx={{ mb: 0.5 }}
            name="cat-mode"
          >
            <FormControlLabel value="existing" control={<Radio />} label="Use Existing Category" />
            <FormControlLabel value="new" control={<Radio />} label="Create New Category" />
          </RadioGroup>

          {mode === "existing" ? (
            <FormControl size="small" fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                label="Category"
                value={categoryName}
                onChange={(e) => handleCategoryNameChange(String(e.target.value))}
                error={!!catError}
              >
                {categories.map((c) => (
                  <MenuItem key={c} value={c}>
                    {c}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
            <Stack direction="row" spacing={2}>
              <TextField
                size="small"
                label="New Category (KEY)"
                value={categoryName}
                onChange={(e) => handleCategoryNameChange(e.target.value)}
                error={!!catError}
                helperText={catError || "UPPERCASE_A1_B2 style"}
                fullWidth
              />
              <TextField
                size="small"
                label="New Category (Label)"
                value={categoryLabel}
                onChange={(e) => setCategoryLabel(e.target.value)}
                fullWidth
              />
            </Stack>
          )}

          <Stack direction="row" spacing={2}>
            <TextField
              size="small"
              label="Subcategory (KEY)"
              value={subName}
              onChange={(e) => handleSubNameChange(e.target.value)}
              error={!!subError}
              helperText={subError || "UPPERCASE_A1_B2 style"}
              fullWidth
            />
            <TextField
              size="small"
              label="Subcategory (Label)"
              value={subLabel}
              onChange={(e) => setSubLabel(e.target.value)}
              fullWidth
            />
          </Stack>

          {globalInfo ? <Alert severity="warning">{globalInfo}</Alert> : null}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={save}
          disabled={!canSubmit}
          variant="contained"
          sx={{ backgroundImage: NAVBAR_GRADIENT, color: "#fff" }}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

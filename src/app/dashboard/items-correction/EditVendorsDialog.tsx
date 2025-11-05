"use client";

import * as React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Stack,
  TextField,
  Typography,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Chip,
  IconButton,
  CircularProgress,
  Paper,
  Tooltip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import { useBackend } from "@/contexts/BackendContext";
import { useApi } from "@/utils/api";

type LinkedChip = {
  vendor_id: number | null; // may be null if will be created
  global_vendor_id: number;
  display_name: string;
  local_vendor_name: string | null;
  vendor_part_no: string; // optional per-vendor PN
};

type SearchVendor = {
  vendor_id: number | null;
  global_vendor_id: number;
  display_name: string;
  global_vendor_name: string;
  local_vendor_name: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  companyId: string | number;
  itemId: string | number;
  itemCode?: string;
  /** optional: parent can pass to force a refetch after successful save */
  onSaved?: (summary?: {
    vendor_names?: string | null;
    vendor_count?: number;
    vendor_part_no?: string | null;
  }) => void;
};

export default function EditVendorsDialog({
  open,
  onClose,
  companyId,
  itemId,
  itemCode,
  onSaved,
}: Props) {
  const { apiURL } = useBackend();
  const { fetchWithAuth } = useApi();

  // Loading/Saving
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  // Chips = current list of links for this item
  const [chips, setChips] = React.useState<LinkedChip[]>([]);

  // Search + selection flow
  const [q, setQ] = React.useState("");
  const [results, setResults] = React.useState<SearchVendor[]>([]);
  const [searching, setSearching] = React.useState(false);
  const [selected, setSelected] = React.useState<SearchVendor | null>(null);
  const [selectedPN, setSelectedPN] = React.useState("");

  // mirror possibly unstable fns into refs so effect deps are simple
  const apiURLRef = React.useRef(apiURL);
  const fetchWithAuthRef = React.useRef(fetchWithAuth);
  React.useEffect(() => {
    apiURLRef.current = apiURL;
    fetchWithAuthRef.current = fetchWithAuth;
  }, [apiURL, fetchWithAuth]);

  // unique id per load to prevent stale commits
  const loadIdRef = React.useRef(0);

  // -------- reset some transient state when closed (do NOT clear chips here) --------
  React.useEffect(() => {
    if (!open) {
      setQ("");
      setResults([]);
      setSelected(null);
      setSelectedPN("");
      setSaving(false);
      setLoading(false);
      setSearching(false);
      setLoadError(null);
    }
  }, [open]);

  // -------- load vendors whenever dialog is open and ids change --------
  React.useEffect(() => {
    if (!open) return;

    const ac = new AbortController();
    const myLoadId = ++loadIdRef.current;

    setLoading(true);
    setLoadError(null);

    (async () => {
      try {
        const url = apiURLRef.current(
          `items/${encodeURIComponent(String(itemId))}/vendors?company_id=${encodeURIComponent(
            String(companyId)
          )}`,
          "items-vendors"
        );

        const res = await fetchWithAuthRef.current(url, {
          requiresAuth: true,
          signal: ac.signal as any,
        });

        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(`GET vendors failed (${res.status}) ${txt}`);
        }

        const data = await res.json();
        const links: LinkedChip[] = (data?.links ?? []).map((v: any) => ({
          vendor_id: v.vendor_id ?? null,
          global_vendor_id: v.global_vendor_id,
          display_name: v.display_name,
          local_vendor_name: v.local_vendor_name ?? null,
          vendor_part_no: v.vendor_part_no ?? "",
        }));

        if (loadIdRef.current === myLoadId) {
          setChips(links);
        }
      } catch (e: any) {
        if (e?.name !== "AbortError") {
          console.error("[EditVendorDialog] GET error:", e);
          if (loadIdRef.current === myLoadId)
            setLoadError(e?.message || "Failed to load vendors");
        }
      } finally {
        if (loadIdRef.current === myLoadId) setLoading(false);
      }
    })();

    return () => ac.abort();
  }, [open, companyId, itemId]);

  // ---------- search ----------
  const doSearch = React.useCallback(
    async (term: string) => {
      const query = term.trim();
      if (query.length < 2) {
        setResults([]);
        return;
      }
      setSearching(true);
      try {
        const url = apiURLRef.current(
          `vendor-lookups?company_id=${encodeURIComponent(
            String(companyId)
          )}&q=${encodeURIComponent(query)}`,
          "vendor-lookups"
        );
        const res = await fetchWithAuthRef.current(url, { requiresAuth: true });
        if (!res.ok) throw new Error(`Search failed (${res.status})`);
        const data = await res.json();
        const arr: SearchVendor[] = (data?.vendors ?? []).map((v: any) => ({
          vendor_id: v.vendor_id ?? null,
          global_vendor_id: v.global_vendor_id,
          display_name: v.display_name,
          global_vendor_name: v.global_vendor_name,
          local_vendor_name: v.local_vendor_name ?? null,
        }));
        setResults(arr);
      } catch (e) {
        console.error("[EditVendorDialog] search error:", e);
      } finally {
        setSearching(false);
      }
    },
    [companyId]
  );

  const handleSearchChange = (val: string) => {
    setQ(val);
    if (val.trim().length >= 2) {
      doSearch(val);
    } else {
      setResults([]);
    }
  };

  const onPick = (v: SearchVendor) => {
    setSelected(v);
    setSelectedPN("");
    setResults([]);
  };

  // Allow adding vendor with or without PN
  const onAdd = () => {
    if (!selected) return;
    const pn = (selectedPN || "").trim();
    setChips((prev) => {
      const filtered = prev.filter((c) => c.global_vendor_id !== selected.global_vendor_id);
      return [
        ...filtered,
        {
          vendor_id: selected.vendor_id ?? null,
          global_vendor_id: selected.global_vendor_id,
          display_name: selected.display_name,
          local_vendor_name: selected.local_vendor_name ?? null,
          vendor_part_no: pn,
        },
      ];
    });
    setSelected(null);
    setSelectedPN("");
    setQ("");
  };

  const removeChip = (gvid: number) => {
    setChips((prev) => prev.filter((c) => c.global_vendor_id !== gvid));
  };

  // ---------- save ----------
  const save = async () => {
    setSaving(true);
    try {
      // read current to compute unlinks (source of truth)
      const urlCurrent = apiURLRef.current(
        `items/${encodeURIComponent(String(itemId))}/vendors?company_id=${encodeURIComponent(
          String(companyId)
        )}`,
        "items-vendors"
      );
      const resCurrent = await fetchWithAuthRef.current(urlCurrent, { requiresAuth: true });
      const cur = resCurrent.ok ? await resCurrent.json() : { links: [] };

      // Build map global -> vendor_id (server)
      const currentByGlobal = new Map<number, number | null>();
      for (const v of cur.links ?? []) {
        const g = Number(v.global_vendor_id);
        currentByGlobal.set(g, v.vendor_id == null ? null : Number(v.vendor_id));
      }

      // Desired final set
      const desiredGlobals = new Set<number>(
        chips.map((c) => Number(c.global_vendor_id)).filter((n) => Number.isFinite(n))
      );

      // Compute unlink arrays
      const unlink_vendor_ids: number[] = [];
      const unlink_global_vendor_ids: number[] = [];
      for (const [g, vendorId] of currentByGlobal.entries()) {
        if (!desiredGlobals.has(g)) {
          unlink_global_vendor_ids.push(g);
          if (Number.isFinite(vendorId as number)) unlink_vendor_ids.push(Number(vendorId));
        }
      }

      const links = chips.map((c) => {
        const pn = (c.vendor_part_no || "").trim();
        return {
          global_vendor_id: c.global_vendor_id,
          vendor_id: c.vendor_id ?? undefined,
          local_vendor_name: undefined, // alias editing not in this UI
          vendor_part_no: pn === "" ? undefined : pn,
        };
      });

      const url = apiURLRef.current(
        `items/${encodeURIComponent(String(itemId))}/vendors`,
        "items-vendors"
      );

      const payload: any = {
        company_id: Number(companyId),
        links,
      };
      if (unlink_vendor_ids.length) payload.unlink_vendor_ids = unlink_vendor_ids;
      if (unlink_global_vendor_ids.length)
        payload.unlink_global_vendor_ids = unlink_global_vendor_ids;

      const res = await fetchWithAuthRef.current(url, {
        method: "POST",
        requiresAuth: true,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `Save failed (${res.status})`);
      }

      const summary = await res.json();
      onSaved?.({
        vendor_names: summary?.vendor_names ?? null,
        vendor_count: typeof summary?.vendor_count === "number" ? summary.vendor_count : undefined,
        vendor_part_no: summary?.vendor_part_no ?? null,
      });

      // optional: refresh links from server to reflect any normalization
      try {
        const refresh = await fetchWithAuthRef.current(urlCurrent, { requiresAuth: true });
        if (refresh.ok) {
          const data = await refresh.json();
          const linksRefetched: LinkedChip[] = (data?.links ?? []).map((v: any) => ({
            vendor_id: v.vendor_id ?? null,
            global_vendor_id: v.global_vendor_id,
            display_name: v.display_name,
            local_vendor_name: v.local_vendor_name ?? null,
            vendor_part_no: v.vendor_part_no ?? "",
          }));
          setChips(linksRefetched);
        }
      } catch {
        /* non-fatal */
      }

      onClose();
    } catch (e: any) {
      console.error("[EditVendorDialog] save error:", e);
      // surface a toast/snackbar if you have one
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Vendors{itemCode ? ` — ${itemCode}` : ""}</DialogTitle>

      <DialogContent dividers>
        {/* Linked vendors */}
        <Stack spacing={1.25} sx={{ mb: 2 }}>
          <Typography variant="subtitle2">Linked Vendors</Typography>

          {loading ? (
            <Stack direction="row" alignItems="center" spacing={1}>
              <CircularProgress size={18} />
              <Typography variant="body2">Loading…</Typography>
            </Stack>
          ) : loadError ? (
            <Typography variant="body2" color="error">
              {loadError}
            </Typography>
          ) : chips.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No vendors linked yet.
            </Typography>
          ) : (
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {chips.map((c) => (
                <Chip
                  key={c.global_vendor_id}
                  label={
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <span>{c.display_name}</span>
                      <Typography
                        component="span"
                        variant="caption"
                        sx={{ fontFamily: "monospace", opacity: 0.8 }}
                      >
                        {c.vendor_part_no ? c.vendor_part_no : "—"}
                      </Typography>
                    </Box>
                  }
                  onDelete={() => removeChip(c.global_vendor_id)}
                  deleteIcon={<CloseIcon />}
                  variant="outlined"
                />
              ))}
            </Box>
          )}
        </Stack>

        <Divider sx={{ my: 1.5 }} />

        {/* Search / add */}
        <Stack spacing={1}>
          <Typography variant="subtitle2">Add Vendor</Typography>

          <TextField
            size="small"
            fullWidth
            placeholder="Type at least 2 characters to search…"
            value={q}
            onChange={(e) => handleSearchChange(e.target.value)}
            InputProps={{
              endAdornment: searching ? <CircularProgress size={16} /> : null,
            }}
          />

          {results.length > 0 && (
            <Paper variant="outlined" sx={{ mt: 0.5, maxHeight: 220, overflow: "auto" }}>
              <List dense disablePadding>
                {results.map((r) => (
                  <ListItemButton
                    key={`${r.global_vendor_id}-${r.vendor_id ?? "new"}`}
                    onClick={() => onPick(r)}
                  >
                    <ListItemText
                      primary={r.display_name}
                      secondary={
                        <Typography component="span" variant="caption">
                          Global: {r.global_vendor_name}
                          {r.local_vendor_name ? ` • Alias: ${r.local_vendor_name}` : ""}
                        </Typography>
                      }
                    />
                  </ListItemButton>
                ))}
              </List>
            </Paper>
          )}

          {selected && (
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              alignItems="center"
              sx={{ mt: 1 }}
            >
              <Box sx={{ flex: 1, minWidth: 240 }}>
                <Typography variant="body2">
                  <strong>Selected:</strong> {selected.display_name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  global_vendor_id: {selected.global_vendor_id}
                  {selected.vendor_id ? ` • vendor_id: ${selected.vendor_id}` : " • will be created"}
                </Typography>
              </Box>

              <TextField
                size="small"
                label="Vendor Part # (optional)"
                placeholder="Enter PN for this vendor…"
                value={selectedPN}
                onChange={(e) => setSelectedPN(e.target.value)}
                sx={{ flex: 1 }}
                inputProps={{ style: { fontFamily: "monospace" } }}
              />

              <Tooltip title="Add this vendor (PN optional)">
                <span>
                  <IconButton color="primary" onClick={onAdd} disabled={!selected}>
                    <AddIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={save} variant="contained" disabled={saving || loading}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

"use client";

import * as React from "react";
import {
  Box,
  CircularProgress,
  Alert,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Backdrop,
} from "@mui/material";
import { useBackend } from "@/contexts/BackendContext";
import { useCompany } from "@/contexts/CompanyContext";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/utils/api";
import { ItemCorrectionRow } from "./types";

import ItemCorrectionToolbar, {
  TypeFilter,
  CorrectionFilter,
  EditedWindow,
} from "./components/ItemCorrectionToolbar";
import ItemCorrectionTablePlain from "./components/ItemCorrectionTablePlain";
import { useItemSave } from "./hooks/useItemSave";

function withinWindow(refIso: string | null | undefined, win: EditedWindow): boolean {
  if (!refIso) return false;
  if (win === "all") return true;
  const now = Date.now();
  const dt = Date.parse(refIso);
  if (Number.isNaN(dt)) return false;

  const ONE_DAY = 24 * 60 * 60 * 1000;
  const daysMap: Record<EditedWindow, number | null> = {
    "24h": 1,
    "3d": 3,
    "7d": 7,
    "15d": 15,
    "30d": 30,
    "all": null,
  };
  const days = daysMap[win];
  if (days == null) return true;
  const threshold = now - days * ONE_DAY;
  return dt >= threshold;
}

export default function ItemCorrectionPage() {
  const { apiURL } = useBackend();
  const { selectedCompanyId, setSelectedCompanyId } = useCompany();
  const { fetchWithAuth } = useApi();
  const { saveBulk, isSaving } = useItemSave();

  const [typeFilter, setTypeFilter] = React.useState<TypeFilter>("ALL");
  const [correctionFilter, setCorrectionFilter] = React.useState<CorrectionFilter>("ALL");
  const [editedWindow, setEditedWindow] = React.useState<EditedWindow>("all");

  const [workingRows, setWorkingRows] = React.useState<ItemCorrectionRow[]>([]);
  const [baselineById, setBaselineById] = React.useState<Record<string | number, ItemCorrectionRow>>(
    {}
  );

  // company-switch confirmation
  const [pendingCompany, setPendingCompany] = React.useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  // save-success dialog
  const [saveDialogOpen, setSaveDialogOpen] = React.useState(false);
  const [lastSavedCount, setLastSavedCount] = React.useState(0);
  const [lastSavedCodes, setLastSavedCodes] = React.useState<string[]>([]);

  const { data, isLoading, error, refetch } = useQuery<{ items: ItemCorrectionRow[] }, Error>({
    queryKey: ["item-corrections", String(selectedCompanyId ?? "none")],
    enabled: !!selectedCompanyId && selectedCompanyId !== "all",
    queryFn: async () => {
      if (!selectedCompanyId || selectedCompanyId === "all") return { items: [] };

      const params = new URLSearchParams({
        company_id: String(selectedCompanyId),
      }).toString();

      const path = `item-corrections?${params}`;
      const mockPath = "item-corrections.json";
      const url = apiURL(path, mockPath);

      const res = await fetchWithAuth(url, { requiresAuth: true });
      if (!res.ok) throw new Error(`Failed to fetch items (${res.status})`);
      return (await res.json()) as { items: ItemCorrectionRow[] };
    },
  });

  // Normalize in_reference to boolean ONCE when data arrives
  React.useEffect(() => {
    if (data?.items) {
      const normalized = data.items.map((r) => ({
        ...r,
        in_reference: !!(r as any).in_reference,
      }));
      setWorkingRows(normalized);

      const map: Record<string | number, ItemCorrectionRow> = {};
      for (const r of normalized) map[r.item_id] = { ...r };
      setBaselineById(map);
    }
  }, [data?.items]);

  // Filtering: type → edited state → edited window
  const filteredItems = React.useMemo(() => {
    let items = workingRows;

    if (typeFilter === "PRODUCT" || typeFilter === "PART") {
      items = items.filter((i) => i.item_type === typeFilter);
    } else if (typeFilter === "BOTH") {
      const typesByCode = new Map<string, Set<"PRODUCT" | "PART">>();
      for (const r of items) {
        if (r.item_type !== "PRODUCT" && r.item_type !== "PART") continue;
        const set = typesByCode.get(r.item_code) ?? new Set<"PRODUCT" | "PART">();
        set.add(r.item_type);
        typesByCode.set(r.item_code, set);
      }
      const codesWithBoth = new Set(
        Array.from(typesByCode.entries())
          .filter(([, set]) => set.has("PRODUCT") && set.has("PART"))
          .map(([code]) => code)
      );
      items = items.filter((r) => codesWithBoth.has(r.item_code));
    }

    if (correctionFilter === "EDITED") {
      items = items.filter((r) => r.in_reference === true);
      items = items.filter((r) => withinWindow(r.ref_updated_at, editedWindow));
    } else if (correctionFilter === "NOT_EDITED") {
      items = items.filter((r) => !r.in_reference);
    }

    return items;
  }, [workingRows, typeFilter, correctionFilter, editedWindow]);

  const dirtyCount = React.useMemo(
    () => workingRows.filter((r) => r.dirty).length,
    [workingRows]
  );

  // 👉 Optimistic update after save so blue dot shows immediately
  const handleSave = React.useCallback(async () => {
    const dirty = workingRows.filter((r) => r.dirty);
    if (dirty.length === 0) return;

    // keep a list for the success dialog
    const codes = Array.from(new Set(dirty.map((d) => d.item_code))).slice(0, 10);

    await saveBulk(dirty);

    const nowIso = new Date().toISOString();

    // Optimistically mark saved items as in_reference + clear dirty + bump ref_updated_at
    setWorkingRows((prev) =>
      prev.map((r) =>
        r.dirty
          ? { ...r, in_reference: true, ref_updated_at: nowIso, dirty: false }
          : r
      )
    );

    // Update baseline so they won't re-appear as dirty
    setBaselineById((prev) => {
      const next = { ...prev };
      for (const r of dirty) {
        const updated: ItemCorrectionRow = {
          ...r,
          in_reference: true,
          ref_updated_at: nowIso,
          dirty: false,
        };
        next[r.item_id] = updated;
      }
      return next;
    });

    // Show success dialog
    setLastSavedCount(dirty.length);
    setLastSavedCodes(codes);
    setSaveDialogOpen(true);

    // Reconcile with backend (will also update timestamps if server differs)
    await refetch();
  }, [workingRows, saveBulk, refetch]);

  const actuallySwitchCompany = React.useCallback(
    async (newCompanyId: string | null) => {
      setWorkingRows([]);
      setBaselineById({});
      setTypeFilter("ALL");
      setCorrectionFilter("ALL");
      setEditedWindow("all");
      setSelectedCompanyId(newCompanyId);
      if (newCompanyId && newCompanyId !== "all") {
        await refetch();
      }
    },
    [refetch, setSelectedCompanyId]
  );

  const onToolbarCompanyChange = React.useCallback(
    (newCompanyId: string | null) => {
      if (!newCompanyId || newCompanyId === selectedCompanyId) return;
      if (dirtyCount > 0) {
        setPendingCompany(newCompanyId);
        setConfirmOpen(true);
      } else {
        actuallySwitchCompany(newCompanyId);
      }
    },
    [dirtyCount, selectedCompanyId, actuallySwitchCompany]
  );

  const confirmSaveAndSwitch = React.useCallback(async () => {
    setConfirmOpen(false);
    if (!pendingCompany) return;
    try {
      await handleSave();
    } finally {
      await actuallySwitchCompany(pendingCompany);
      setPendingCompany(null);
    }
  }, [pendingCompany, handleSave, actuallySwitchCompany]);

  const confirmDiscardAndSwitch = React.useCallback(async () => {
    setConfirmOpen(false);
    if (!pendingCompany) return;
    await actuallySwitchCompany(pendingCompany);
    setPendingCompany(null);
  }, [pendingCompany, actuallySwitchCompany]);

  const cancelCompanySwitch = React.useCallback(() => {
    setConfirmOpen(false);
    setPendingCompany(null);
  }, []);

  const handleRowsChange = React.useCallback((nextVisibleRows: ItemCorrectionRow[]) => {
    setWorkingRows((prev) => {
      const byId = new Map(prev.map((r) => [r.item_id, r]));
      for (const r of nextVisibleRows) byId.set(r.item_id, r);
      return Array.from(byId.values());
    });
  }, []);

  return (
    <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
      <ItemCorrectionToolbar
        onCompanyChange={onToolbarCompanyChange}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        correctionFilter={correctionFilter}
        setCorrectionFilter={setCorrectionFilter}
        editedWindow={editedWindow}
        setEditedWindow={setEditedWindow}
        dirtyCount={dirtyCount}
        onSave={handleSave}
        isSaving={isSaving}
      />

      {isLoading ? (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <CircularProgress size={20} />
          <Typography>Loading items…</Typography>
        </Box>
      ) : error ? (
        <Alert severity="error">
          {(error as Error).message || "Failed to load items"}
        </Alert>
      ) : !filteredItems.length ? (
        <Typography sx={{ color: "text.secondary" }}>
          No items found for this company.
        </Typography>
      ) : (
        <ItemCorrectionTablePlain
          data={filteredItems}
          originals={baselineById}
          onRowsChange={handleRowsChange}
          isSaving={isSaving}
        />
      )}

      {/* saving overlay */}
      <Backdrop
        open={!!isSaving}
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.modal + 1 }}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

      {/* unsaved changes dialog */}
      <Dialog open={confirmOpen} onClose={cancelCompanySwitch}>
        <DialogTitle>Unsaved changes</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You have {dirtyCount} pending change{dirtyCount > 1 ? "s" : ""}. Do you want to save them before switching the company?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={cancelCompanySwitch}>Cancel</Button>
          <Button onClick={confirmDiscardAndSwitch} color="warning">
            Discard & Switch
          </Button>
          <Button onClick={confirmSaveAndSwitch} variant="contained">
            Save & Switch
          </Button>
        </DialogActions>
      </Dialog>

      {/* save success dialog */}
      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)}>
        <DialogTitle>Save successful</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {lastSavedCount} item{lastSavedCount === 1 ? "" : "s"} updated and saved to the reference table.
            {lastSavedCodes.length > 0 ? (
              <>
                {" "}
                Example codes: {lastSavedCodes.join(", ")}
                {workingRows.length > 10 ? "…" : ""}
              </>
            ) : null}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)} autoFocus>
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

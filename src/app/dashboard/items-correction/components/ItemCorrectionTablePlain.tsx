"use client";

import * as React from "react";
import {
  Box,
  FormControlLabel,
  FormGroup,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  Checkbox,
  Tooltip,
  IconButton,
  Stack,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { ItemCorrectionRow, ItemStatusWide } from "../types";
import { NAVBAR_GRADIENT } from "@/styles/colors";

const STATUSES: Exclude<ItemStatusWide, null>[] = [
  "ACTIVE",
  "INACTIVE",
  "DEPLOYED",
  "END-OF-LIFE",
  "IN-DEV",
  "ON-HOLD",
  "PLANNED",
  "PRODUCTION",
  "PROPOSED",
  "NONE",
];

type ItemType = "PART" | "PRODUCT";

const FIELDS_TO_COMPARE: (keyof ItemCorrectionRow)[] = [
  "item_name",
  "item_type",
  "item_status",
  "category",
  "subcategory",
  "notes",
];

const norm = (v: unknown) => {
  if (v === undefined || v === null) return null;
  if (typeof v === "string") {
    const t = v.trim();
    return t === "" ? null : t;
  }
  return v;
};
const equalish = (a: unknown, b: unknown) => norm(a) === norm(b);

function isRowDirty(cur: ItemCorrectionRow, orig?: ItemCorrectionRow | undefined) {
  if (!orig) return false;
  for (const k of FIELDS_TO_COMPARE) if (!equalish(cur[k], orig[k])) return true;
  return false;
}

function buildSignature(arr: ItemCorrectionRow[]) {
  const parts: string[] = [String(arr.length)];
  for (const r of arr) {
    parts.push(
      String(r.item_id),
      r.item_code ?? "",
      r.item_type ?? "",
      r.in_reference ? "1" : "0",
      r.ref_updated_at ?? ""
    );
  }
  return parts.join("|");
}

export default function ItemCorrectionTablePlain({
  data = [],
  originals = {},
  onRowsChange,
  isSaving = false,
  onRequestAddSubcategory,
  plusDisabled = false,

  // ✅ lookups now come from parent; default safely
  categories = [],
  subcategoriesByCategory = {},
}: {
  data?: ItemCorrectionRow[];
  originals?: Record<string | number, ItemCorrectionRow>;
  onRowsChange?: (rows: ItemCorrectionRow[]) => void;
  isSaving?: boolean;
  /** Click handler for the ➕ on the Subcategory column header */
  onRequestAddSubcategory?: () => void;
  /** Disable the plus icon while lookups are loading */
  plusDisabled?: boolean;

  /** Lookup lists (optional in type, but defaulted above) */
  categories?: string[];
  subcategoriesByCategory?: Record<string, string[]>;
}) {
  const [rows, setRows] = React.useState<ItemCorrectionRow[]>(() => data);
  const syncingFromParentRef = React.useRef(false);
  const dataSigRef = React.useRef<string>(buildSignature(data));

  // ✅ always-use-safe vars when reading lookups
  const catList = Array.isArray(categories) ? categories : [];
  const subsByCat: Record<string, string[]> = subcategoriesByCategory || {};

  React.useEffect(() => {
    const nextSig = buildSignature(data);
    const shouldResync =
      rows.length !== data.length ||
      (rows.length === data.length && rows.some((r, i) => r.item_id !== data[i]?.item_id)) ||
      nextSig !== dataSigRef.current;

    if (shouldResync) {
      syncingFromParentRef.current = true;
      dataSigRef.current = nextSig;
      const next = data.map((r) => ({ ...r, dirty: isRowDirty(r, originals[r.item_id]) }));
      setRows(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, originals]);

  React.useEffect(() => {
    if (!onRowsChange) return;
    if (syncingFromParentRef.current) {
      syncingFromParentRef.current = false;
      return;
    }
    onRowsChange(rows);
  }, [rows, onRowsChange]);

  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(25);

  const normalizeType = (v: unknown): ItemType => (v === "PRODUCT" ? "PRODUCT" : "PART");

  const patchRow = (id: string | number, patch: Partial<ItemCorrectionRow>) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.item_id !== id) return r;
        const merged = { ...r, ...patch };
        const dirty = isRowDirty(merged, originals[id]);
        return { ...merged, dirty };
      })
    );
  };

  const setRowValue = <K extends keyof ItemCorrectionRow>(id: string | number, key: K, value: ItemCorrectionRow[K]) => {
    patchRow(id, { [key]: value } as Partial<ItemCorrectionRow>);
  };

  const setItemType = (id: string | number, next: ItemType) => setRowValue(id, "item_type", next);

  const setCategory = (id: string | number, cat: string) => {
    const list = Array.isArray(subsByCat[cat]) ? subsByCat[cat] : [];
    const firstSub = list.length ? list[0] : "UNCATEGORIZED";
    patchRow(id, { category: cat, subcategory: firstSub });
  };

  const typeRank = (t: ItemType) => (t === "PRODUCT" ? 0 : 1);

  const sortedRows = React.useMemo(() => {
    return [...rows].sort((a, b) => {
      const codeCmp = (a.item_code ?? "").localeCompare(b.item_code ?? "", undefined, {
        numeric: true,
        sensitivity: "base",
      });
      if (codeCmp !== 0) return codeCmp;

      const tCmp = typeRank(normalizeType(a.item_type as any)) - typeRank(normalizeType(b.item_type as any));
      if (tCmp !== 0) return tCmp;

      const nameCmp = (a.item_name ?? "").localeCompare(b.item_name ?? "", undefined, {
        numeric: true,
        sensitivity: "base",
      });
      if (nameCmp !== 0) return nameCmp;

      return String(a.item_id).localeCompare(String(b.item_id));
    });
  }, [rows]);

  const start = page * rowsPerPage;
  const end = start + rowsPerPage;
  const pageRows = sortedRows.slice(start, end);

  return (
    <Box sx={{ width: "100%" }}>
      <Paper variant="outlined" sx={{ width: "100%", overflow: "hidden" }}>
        <TableContainer sx={{ maxHeight: 680 }}>
          <Table stickyHeader size="small" aria-label="Items correction table">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox" sx={{ width: 40 }} />
                <TableCell sx={{ width: 60 }}>#</TableCell>
                <TableCell sx={{ minWidth: 140 }}>Item Code</TableCell>
                <TableCell sx={{ minWidth: 220 }}>Item Name</TableCell>
                <TableCell sx={{ minWidth: 220 }}>Type</TableCell>
                <TableCell sx={{ minWidth: 200 }}>Status</TableCell>
                <TableCell sx={{ minWidth: 180 }}>Category</TableCell>
                <TableCell sx={{ minWidth: 180 }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <span>Subcategory</span>
                    <Tooltip title="Add subcategory">
                      <span>
                        <IconButton
                          size="small"
                          onClick={onRequestAddSubcategory}
                          disabled={isSaving || plusDisabled}
                          sx={{
                            width: 24,
                            height: 24,
                            p: 0,
                            borderRadius: "4px",
                            backgroundImage: NAVBAR_GRADIENT,
                            color: "#fff",
                            "&:disabled": {
                              opacity: 0.5,
                              backgroundImage: "none",
                              backgroundColor: (t) => t.palette.action.disabledBackground,
                              color: (t) => t.palette.action.disabled,
                            },
                          }}
                        >
                          <AddIcon fontSize="inherit" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Stack>
                </TableCell>
                <TableCell sx={{ minWidth: 160 }}>Legacy Status</TableCell>
                <TableCell sx={{ minWidth: 160 }}>Legacy Category</TableCell>
                <TableCell sx={{ minWidth: 260 }}>Notes</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {pageRows.map((row, idx) => {
                const serial = start + idx + 1;
                const vType = (row.item_type === "PRODUCT" ? "PRODUCT" : "PART") as ItemType;
                const availableSubs =
                  row.category && Array.isArray(subsByCat[row.category]) && subsByCat[row.category].length
                    ? subsByCat[row.category]
                    : ["UNCATEGORIZED"];
                const isDirty = !!row.dirty;
                const inRef = row.in_reference === true;

                return (
                  <TableRow
                    key={row.item_id}
                    hover
                    sx={{
                      cursor: isSaving ? "not-allowed" : "default",
                      opacity: isSaving ? 0.6 : 1,
                      ...(isDirty && {
                        backgroundColor: "#fffbe6",
                        "&:hover": { backgroundColor: "#fff5cc" },
                        borderLeft: "3px solid #f6c343",
                      }),
                    }}
                  >
                    {/* saved-to-reference marker */}
                    <TableCell padding="checkbox" sx={{ width: 40, verticalAlign: "middle" }}>
                      {inRef ? (
                        <Tooltip
                          title={
                            row.ref_updated_at
                              ? `Saved to Reference • ${new Date(row.ref_updated_at).toLocaleString()}`
                              : "Saved to Reference"
                          }
                        >
                          <Box
                            sx={{
                              width: 10,
                              height: 10,
                              borderRadius: "50%",
                              bgcolor: "#2563eb",
                              mx: "auto",
                            }}
                          />
                        </Tooltip>
                      ) : null}
                    </TableCell>

                    <TableCell sx={{ width: 60, fontFamily: "monospace" }}>{serial}</TableCell>

                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                        {row.item_code}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <TextField
                        size="small"
                        fullWidth
                        disabled={isSaving}
                        value={row.item_name ?? ""}
                        onChange={(e) => setRowValue(row.item_id, "item_name", e.target.value)}
                      />
                    </TableCell>

                    <TableCell>
                      <FormGroup row>
                        <FormControlLabel
                          control={
                            <Checkbox
                              size="small"
                              disabled={isSaving}
                              checked={vType === "PART"}
                              onChange={(_, checked) => setItemType(row.item_id, checked ? "PART" : "PRODUCT")}
                            />
                          }
                          label="PART"
                        />
                        <FormControlLabel
                          control={
                            <Checkbox
                              size="small"
                              disabled={isSaving}
                              checked={vType === "PRODUCT"}
                              onChange={(_, checked) => setItemType(row.item_id, checked ? "PRODUCT" : "PART")}
                            />
                          }
                          label="PRODUCT"
                        />
                      </FormGroup>
                    </TableCell>

                    <TableCell>
                      <Select
                        size="small"
                        fullWidth
                        disabled={isSaving}
                        value={(row.item_status ?? "") as string}
                        onChange={(e: SelectChangeEvent<string>) =>
                          setRowValue(row.item_id, "item_status", (e.target.value || null) as ItemStatusWide)
                        }
                        renderValue={(v) => (v && (v as string).length ? (v as string) : "—")}
                      >
                        {STATUSES.map((s) => (
                          <MenuItem key={s} value={s}>
                            {s}
                          </MenuItem>
                        ))}
                      </Select>
                    </TableCell>

                    <TableCell>
                      <Select
                        size="small"
                        fullWidth
                        disabled={isSaving}
                        value={row.category ?? ""}
                        onChange={(e) => setCategory(row.item_id, e.target.value as string)}
                        renderValue={(v) => (v && (v as string).length ? (v as string) : "—")}
                      >
                        {catList.map((c) => (
                          <MenuItem key={c} value={c}>
                            {c}
                          </MenuItem>
                        ))}
                      </Select>
                    </TableCell>

                    <TableCell>
                      <Select
                        size="small"
                        fullWidth
                        disabled={isSaving}
                        value={row.subcategory ?? ""}
                        onChange={(e) => setRowValue(row.item_id, "subcategory", e.target.value)}
                        renderValue={(v) => (v && (v as string).length ? (v as string) : "—")}
                      >
                        {availableSubs.map((sc) => (
                          <MenuItem key={sc} value={sc}>
                            {sc}
                          </MenuItem>
                        ))}
                      </Select>
                    </TableCell>

                    <TableCell>{row.legacy_status ?? ""}</TableCell>
                    <TableCell>{row.legacy_category ?? ""}</TableCell>

                    <TableCell>
                      <TextField
                        size="small"
                        fullWidth
                        disabled={isSaving}
                        value={row.notes ?? ""}
                        onChange={(e) => setRowValue(row.item_id, "notes", e.target.value)}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={sortedRows.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      </Paper>
    </Box>
  );
}

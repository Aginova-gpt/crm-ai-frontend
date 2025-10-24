// src/app/dashboard/items-correction/hooks/useItemSave.ts
"use client";

import { useMutation } from "@tanstack/react-query";
import { useApi } from "@/utils/api";
import { useBackend } from "@/contexts/BackendContext";
import toast from "react-hot-toast";
import { ItemCorrectionRow } from "../types";

export function useItemSave() {
  const { fetchWithAuth } = useApi();
  const { apiURL } = useBackend();

  const saveItem = async (item: ItemCorrectionRow) => {
    const res = await fetchWithAuth(
      apiURL("items-correction/save", "items-correction/save"),
      {
        method: "POST",
        body: JSON.stringify(item),
      }
    );
    if (!res.ok) throw new Error("Save failed");
    toast.success(`Saved ${item.item_code}`);
  };

  const saveBulkFn = async (items: ItemCorrectionRow[]) => {
    const res = await fetchWithAuth(
      apiURL("items-correction/save-bulk", "items-correction/save-bulk"),
      {
        method: "POST",
        body: JSON.stringify({ items }),
      }
    );
    if (!res.ok) throw new Error("Bulk save failed");
    const json = await res.json().catch(() => ({}));
    const updated = typeof json?.updated === "number" ? json.updated : items.length;
    toast.success(`Saved ${updated} item${updated === 1 ? "" : "s"}`);
    return json;
  };

  const {
    mutateAsync: saveSingle,
    isPending: isSavingSingle,
  } = useMutation({ mutationFn: saveItem });

  const {
    mutateAsync: saveBulk,
    isPending: isSavingBulk,
  } = useMutation({ mutationFn: saveBulkFn });

  return {
    saveItem: saveSingle,
    saveBulk,                               // <— use this in page.tsx
    isSaving: isSavingSingle || isSavingBulk // <— true during bulk saves too
  };
}

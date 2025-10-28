export type ItemStatusWide =
  | "ACTIVE" | "INACTIVE" | "END-OF-LIFE" | "DEPLOYED" | "IN-DEV"
  | "ON-HOLD" | "PLANNED" | "PRODUCTION" | "PROPOSED" | "NONE" | null;

export type ItemCorrectionRow = {
  item_id: string | number;
  item_code: string;
  item_name: string | null;

  // current values (from CRMAI_V3)
  item_type?: "PRODUCT" | "PART" | null;
  item_status?: ItemStatusWide;
  category?: string | null;
  subcategory?: string | null;

  // corrected values (from reference DB)
  correct_item_type?: "PRODUCT" | "PART" | null;
  correct_item_status?: ItemStatusWide;
  correct_category?: string | null;
  correct_subcategory?: string | null;

  // legacy (read-only reference from your API)
  legacy_id?: string | number | null;
  legacy_status?: string | null;
  legacy_category?: string | null;

  // reference flags
  in_reference?: boolean;          // already saved to reference?
  ref_updated_at?: string | null;  // ISO datetime of last update in reference

  notes?: string | null;

  // UI helper
  dirty?: boolean;
};

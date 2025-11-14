"use client";

import React, { useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Typography,
  TextField,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  MenuItem,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { MdAdd, MdEdit, MdDelete } from "react-icons/md";
import { useRouter } from "next/navigation";
import { useApi } from "../../../../utils/api";
import { useAuth } from "../../../../contexts/AuthContext";
import { useCompany } from "../../../../contexts/CompanyContext";
import { useProfile } from "../../../../contexts/ProfileContext";
import { useProducts } from "@/app/dashboard/products/hooks/useProducts";

// ===== Types =====

type PriceItem = {
  id: string;
  priceTypeId: string;
  priceTypeLabel: string;
  price: number;
  date: string; // ISO string
};

type PriceFormState = {
  priceTypeId: string;
  priceTypeLabel: string;
  price: string;
  date: string;
};

type CategoryOption = {
  value: string;
  label: string;
  subCategories: { value: string; label: string }[];
};

type PriceTypeOption = {
  value: string;
  label: string;
};

type StatusOption = {
  value: string;
  label: string;
};

type GlobalItemOption = {
  id: number;
  code: string;
};

type DimensionUnitOption = {
  id: number;
  value: string; // abbreviation (MM, CM, etc.)
  label: string;
};

type WeightUnitOption = {
  id: number;
  value: string; // abbreviation (KG, LB, etc.)
  label: string;
};

type RawPropertyName = {
  item_property_name_id: number;
  item_property_name: string;
};

type PropertyNamesByCompany = Record<
  string,
  {
    company_name?: string;
    properties?: RawPropertyName[];
  }
>;

// "Core" properties we render with numeric + unit controls
type CorePropertyNameIds = {
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  bundle?: number;
};

type ExtraPropertyField = {
  id: number;
  name: string;
  label: string;
};

type CompanyProductOption = {
  productId: number;
  globalItemId?: number;
  code: string;
  name: string;
};

type BundleItem = {
  id: number;
  productId: number;
  globalItemId?: number;
  productCode: string;
  productName: string;
  quantity: number;
};

// Payload we send to backend for each property
type PropertyPayload = {
  item_property_name_id: number;
  property_value: string;
  unit_id: number | null;
  unit_type: "weight" | "dimension" | null;
};


type ProductLookupResponse = {
  selections?: {
    categories?: Array<{
      item_category_id: number;
      item_category_label?: string;
      item_category_name?: string;
      subcategories?: Array<{
        item_subcategory_id: number;
        item_subcategory_label?: string;
        item_subcategory_name?: string;
      }>;
    }>;
    item_statuses?: Array<{
      item_status_id: number;
      item_status_name?: string;
    }>;
    global_items?: Array<{
      id: number;
      code?: string;
    }>;
    dimension_units?: Array<{
      dimension_unit_id?: number | string;
      unit_abbreviation?: string;
      unit_name?: string;
    }>;
    weight_units?: Array<{
      weight_unit_id?: number | string;
      unit_abbreviation?: string;
      unit_name?: string;
    }>;
    property_names_by_company?: PropertyNamesByCompany;
    pricing_types_by_company?: Record<
      string,
      {
        company_name?: string;
        pricing_types?: Array<{
          pricing_type_id?: number;
          pricing_type_name?: string;
          description?: string | null;
        }>;
      }
    >;
  };
};

const PRODUCT_LOOKUP_URL = "http://34.58.37.44/api/get-product-lookups";
const PRODUCT_SAVE_URL = "http://34.58.37.44/api/add-product";
const ITEM_BY_CODE_URL = "http://34.58.37.44/api/items/by-code";

const PRODUCT_CODE_MAX_LENGTH = 255;
const PRODUCT_CODE_ALLOWED_REGEX = /^[A-Z0-9-]*$/;
const PRODUCT_NAME_MAX_LENGTH = 255;

const NUMERIC_INPUT_PROPS = {
  inputMode: "decimal",
  step: "0.01",
  min: 0,
} as const;
const NUMERIC_INPUT_SX = {
  "& input[type=number]": {
    MozAppearance: "textfield",
  },
  "& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button":
    {
      WebkitAppearance: "none",
      margin: 0,
    },
} as const;

const initialPrices: PriceItem[] = [];

// Helpers
const normalizeNumericId = (value: unknown): number | null => {
  if (value == null) return null;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const numeric = Number(trimmed);
    if (!Number.isNaN(numeric)) return numeric;
  }
  return null;
};

const toIdString = (value: unknown): string | null => {
  if (value == null) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return null;
};

export default function AddProductPage() {
  const router = useRouter();
  const { fetchWithAuth } = useApi();
  const { token } = useAuth();
  const { selectedCompanyId, selectedCompanyName, userCompanyId } = useCompany();
  const { isAdmin } = useProfile();

  // Price list state
  const [priceList, setPriceList] = useState<PriceItem[]>(initialPrices);
  const [priceDialogOpen, setPriceDialogOpen] = useState(false);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);

  // Lookups
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [statusOptions, setStatusOptions] = useState<StatusOption[]>([]);
  const [globalItemOptions, setGlobalItemOptions] = useState<GlobalItemOption[]>([]);
  const [priceTypeOptions, setPriceTypeOptions] = useState<PriceTypeOption[]>([]);
  const [weightUnitOptions, setWeightUnitOptions] = useState<WeightUnitOption[]>([]);
  const [dimensionUnitOptions, setDimensionUnitOptions] = useState<DimensionUnitOption[]>([]);

  // Property metadata (from property_names_by_company)
  const [corePropertyNameIds, setCorePropertyNameIds] = useState<CorePropertyNameIds>({});
  const [extraPropertyFields, setExtraPropertyFields] = useState<ExtraPropertyField[]>([]);

  // Selected units
  const [weightUnit, setWeightUnit] = useState<string>("");
  const [dimensionUnit, setDimensionUnit] = useState<string>("");
  const [isBundle, setIsBundle] = useState(false);

  // Bundle state
  const [bundleItems, setBundleItems] = useState<BundleItem[]>([]);
  const [selectedBundleProduct, setSelectedBundleProduct] = useState<CompanyProductOption | null>(
    null
  );
  const [bundleQuantity, setBundleQuantity] = useState<string>("1");

  // Lookup loading
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  // Product form state
  const [productCode, setProductCode] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [productStatus, setProductStatus] = useState("");

  // Product code validation
  const [productCodeError, setProductCodeError] = useState<string | null>(null);
  const [productCodeCompanyError, setProductCodeCompanyError] = useState<string | null>(null);
  const [productCodeExists, setProductCodeExists] = useState(false); // internal

  // Submission state
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const todayIso = React.useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [priceForm, setPriceForm] = useState<PriceFormState>({
    priceTypeId: "",
    priceTypeLabel: "",
    price: "",
    date: todayIso,
  });

  const totalPrices = useMemo(() => priceList.length, [priceList]);

  const availableSubCategories = useMemo(
    () =>
      categoryOptions.find((option) => option.value === productCategory)?.subCategories || [],
    [categoryOptions, productCategory]
  );

  const productCodeOptions = useMemo(
    () => globalItemOptions.map((item) => item.code),
    [globalItemOptions]
  );

  const globalItemLookupByCode = useMemo(() => {
    const map = new Map<string, GlobalItemOption>();
    for (const item of globalItemOptions) {
      map.set(item.code.toLowerCase(), item);
    }
    return map;
  }, [globalItemOptions]);

  const matchedGlobalItem = useMemo(() => {
    const normalized = productCode.trim().toLowerCase();
    if (!normalized) return null;
    return globalItemLookupByCode.get(normalized) ?? null;
  }, [productCode, globalItemLookupByCode]);

  // Keep productCodeExists & basic format error in sync
  React.useEffect(() => {
    const normalized = productCode.trim().toLowerCase();
    if (!normalized) {
      setProductCodeExists(false);
      setProductCodeError(null);
      return;
    }

    setProductCodeExists(Boolean(matchedGlobalItem));
    setProductCodeError((prev) =>
      prev && !PRODUCT_CODE_ALLOWED_REGEX.test(productCode) ? prev : null
    );
  }, [productCode, matchedGlobalItem]);

  // Decode JWT
  const decodedToken = useMemo(() => {
    if (!token) return null;
    try {
      const parts = token.split(".");
      if (parts.length < 2) return null;
      const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const json =
        typeof window !== "undefined"
          ? atob(base64)
          : Buffer.from(base64, "base64").toString("utf-8");
      return JSON.parse(json);
    } catch {
      return null;
    }
  }, [token]);

  // Effective company id: same idea as products list page
  const effectiveCompanyId = useMemo(() => {
    const tokenCompanyId =
      decodedToken?.company_id != null ? String(decodedToken.company_id).trim() : null;

    if (isAdmin) {
      // Admin can choose company from dropdown; avoid "all"
      if (selectedCompanyId && selectedCompanyId !== "all") {
        return selectedCompanyId;
      }
      if (tokenCompanyId) return tokenCompanyId;
      if (userCompanyId) return userCompanyId;
      return null;
    }

    // Non-admin: always fixed to their own company
    if (tokenCompanyId) return tokenCompanyId;
    if (userCompanyId) return userCompanyId;
    return null;
  }, [decodedToken, isAdmin, selectedCompanyId, userCompanyId]);

  const resolvedAssignedUserId = useMemo(() => {
    if (!decodedToken) return null;
    return (
      decodedToken.user_id ??
      decodedToken.userId ??
      decodedToken.userID ??
      decodedToken.sub ??
      decodedToken.id ??
      null
    );
  }, [decodedToken]);

  // ===== Reuse products query for bundle options (ACTIVE products only) =====
  const {
    data: productsData,
    isLoading: companyProductsLoading,
    error: companyProductsErrorRaw,
  } = useProducts(effectiveCompanyId ?? null, "products");

  const companyProducts: CompanyProductOption[] = useMemo(() => {
    if (!productsData) return [];

    const collected: CompanyProductOption[] = [];

    const pushProduct = (p: any) => {
      const productId = Number(p.item_id ?? p.product_id ?? p.id);
      if (!Number.isFinite(productId)) return;

      const code = String(
        p.product_number ?? p.product_code ?? p.item_code ?? p.code ?? ""
      );
      const name = String(
        p.product_name ?? p.item_name ?? p.internal_name ?? ""
      );

      collected.push({
        productId,
        globalItemId: p.global_item_id ? Number(p.global_item_id) : undefined,
        code,
        name,
      });
    };

    // Shape A: { products: [...] }
    if (Array.isArray(productsData.products)) {
      for (const p of productsData.products) pushProduct(p);
    }
    // Shape B: { data: [{ products: [...] }, ...] }
    else if (Array.isArray(productsData.data)) {
      for (const group of productsData.data) {
        for (const p of group.products || []) pushProduct(p);
      }
    }
    // Shape C: plain array
    else if (Array.isArray(productsData)) {
      for (const p of productsData) pushProduct(p);
    }

    // 🧹 De-duplicate by productId
    const byId = new Map<number, CompanyProductOption>();
    for (const opt of collected) {
      if (!byId.has(opt.productId)) {
        byId.set(opt.productId, opt);
      }
    }
    return Array.from(byId.values());
  }, [productsData]);

  const companyProductsError =
    companyProductsErrorRaw && companyProductsErrorRaw instanceof Error
      ? companyProductsErrorRaw.message
      : null;

  // Product code -> company-specific item check
  React.useEffect(() => {
    setProductCodeCompanyError(null);

    const normalizedCode = productCode.trim().toUpperCase();
    if (!normalizedCode) return;

    if (!PRODUCT_CODE_ALLOWED_REGEX.test(normalizedCode)) return;
    if (!matchedGlobalItem) return;

    const numericCompanyId = normalizeNumericId(effectiveCompanyId);
    if (numericCompanyId == null) return;

    const controller = new AbortController();

    (async () => {
      try {
        const url = new URL(ITEM_BY_CODE_URL);
        url.searchParams.set("code", normalizedCode);
        url.searchParams.set("company_id", String(numericCompanyId));

        const res = await fetch(url.toString(), { signal: controller.signal });

        if (res.status === 404) {
          // No product yet for this company
          return;
        }

        if (!res.ok) {
          console.error("items/by-code failed", res.status);
          return;
        }

        const data = await res.json();
        const itemTypeId = data?.item?.item_type_id;

        if (itemTypeId === 1) {
          setProductCodeCompanyError(
            "A product with this code already exists for this company."
          );
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("items/by-code error", err);
        }
      }
    })();

    return () => controller.abort();
  }, [productCode, matchedGlobalItem, effectiveCompanyId]);

  // Product code input handlers
  const handleProductCodeInputChange = (_: unknown, newInputValue: string) => {
    const upperCased = newInputValue.toUpperCase();
    const sanitized = upperCased.replace(/[^A-Z0-9-]/g, "");
    const truncated = sanitized.slice(0, PRODUCT_CODE_MAX_LENGTH);

    let message: string | null = null;

    if (upperCased.length > PRODUCT_CODE_MAX_LENGTH) {
      message = `Maximum length is ${PRODUCT_CODE_MAX_LENGTH} characters.`;
    } else if (!PRODUCT_CODE_ALLOWED_REGEX.test(upperCased)) {
      message = "Only uppercase letters, numbers, and hyphens are allowed.";
    }

    setProductCodeError(message);
    setProductCode(truncated);
  };

  const handleProductCodeSelect = (_: unknown, newValue: string | null) => {
    const value = (newValue ?? "")
      .toUpperCase()
      .replace(/[^A-Z0-9-]/g, "")
      .slice(0, PRODUCT_CODE_MAX_LENGTH);
    setProductCodeError(null);
    setProductCode(value);
  };

  // Numeric key guard: no minus sign, digits + one decimal point
  const allowOnlyNumericKeys: React.KeyboardEventHandler<HTMLInputElement> = (
    event
  ) => {
    const allowedControlKeys = [
      "Backspace",
      "Delete",
      "ArrowLeft",
      "ArrowRight",
      "Tab",
      "Home",
      "End",
      "Enter",
    ];

    if (
      allowedControlKeys.includes(event.key) ||
      (event.key === "a" && event.ctrlKey) ||
      (event.key === "c" && event.ctrlKey) ||
      (event.key === "v" && event.ctrlKey) ||
      (event.key === "x" && event.ctrlKey)
    ) {
      return;
    }

    const decimalKeys = [".", "Decimal", "NumpadDecimal"];
    if (decimalKeys.includes(event.key)) {
      const input = event.currentTarget as HTMLInputElement | null;
      if (!input) return;
      const value = input.value ?? "";
      const selectionStart = input.selectionStart ?? 0;
      const selectionEnd = input.selectionEnd ?? 0;
      const selectedText = value.slice(selectionStart, selectionEnd);
      if (value.includes(".") && selectedText !== ".") {
        event.preventDefault();
        return;
      }
      return;
    }

    if (/[0-9]/.test(event.key)) return;

    event.preventDefault();
  };

  // Reset subcategory when category changes
  React.useEffect(() => {
    setSubCategory("");
  }, [productCategory]);

  // Ensure status value remains valid
  React.useEffect(() => {
    if (!statusOptions.some((item) => item.value === productStatus)) {
      setProductStatus("");
    }
  }, [statusOptions, productStatus]);

  // Ensure unit selections align with options
  React.useEffect(() => {
    if (!weightUnitOptions.length) {
      setWeightUnit("");
      return;
    }
    if (!weightUnitOptions.some((opt) => opt.value === weightUnit)) {
      const defaultOpt =
        weightUnitOptions.find((opt) => opt.value === "KG") ?? weightUnitOptions[0];
      setWeightUnit(defaultOpt.value);
    }
  }, [weightUnitOptions, weightUnit]);

  React.useEffect(() => {
    if (!dimensionUnitOptions.length) {
      setDimensionUnit("");
      return;
    }
    if (!dimensionUnitOptions.some((opt) => opt.value === dimensionUnit)) {
      const defaultOpt = dimensionUnitOptions[0];
      setDimensionUnit(defaultOpt.value);
    }
  }, [dimensionUnitOptions, dimensionUnit]);

  // Fetch lookups (categories, statuses, units, property names, price types)
  React.useEffect(() => {
    const controller = new AbortController();

    const fetchLookups = async () => {
      setCategoryLoading(true);
      setCategoryError(null);

      try {
        const resolvedCompanyIdString =
          toIdString(normalizeNumericId(effectiveCompanyId)) ??
          toIdString(effectiveCompanyId);

        const lookupUrl = (() => {
          try {
            const url = new URL(PRODUCT_LOOKUP_URL);
            if (resolvedCompanyIdString) {
              url.searchParams.set("company_id", resolvedCompanyIdString);
            }
            return url.toString();
          } catch {
            return PRODUCT_LOOKUP_URL;
          }
        })();

        const response = await fetch(lookupUrl, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const data: ProductLookupResponse = await response.json();

        // === Categories ===
        const mappedCategories =
          data.selections?.categories?.map((category) => ({
            value: String(category.item_category_id),
            label:
              category.item_category_label ??
              category.item_category_name ??
              `Category ${category.item_category_id}`,
            subCategories:
              category.subcategories?.map((sub) => ({
                value: String(sub.item_subcategory_id),
                label:
                  sub.item_subcategory_label ??
                  sub.item_subcategory_name ??
                  `Subcategory ${sub.item_subcategory_id}`,
              })) ?? [],
          })) ?? [];
        setCategoryOptions(mappedCategories);

        // === Global Items (product codes) ===
        const mappedGlobalItems =
          data.selections?.global_items?.map((item) => ({
            id: item.id,
            code: item.code ?? `Item ${item.id}`,
          })) ?? [];
        setGlobalItemOptions(mappedGlobalItems);

        // === Weight units ===
        const mappedWeightUnits: WeightUnitOption[] =
          data.selections?.weight_units
            ?.map((u) => {
              const idNum = normalizeNumericId(u.weight_unit_id);
              const abbr = u.unit_abbreviation?.trim();
              const name = u.unit_name?.trim();
              if (idNum == null || !abbr) return null;
              return {
                id: idNum,
                value: abbr.toUpperCase(),
                label: name ? `${name} (${abbr})` : abbr,
              };
            })
            .filter((x): x is WeightUnitOption => x !== null) ?? [];
        setWeightUnitOptions(mappedWeightUnits);

        // === Dimension units ===
        const mappedDimensionUnits: DimensionUnitOption[] =
          data.selections?.dimension_units
            ?.map((u) => {
              const idNum = normalizeNumericId(u.dimension_unit_id);
              const abbr = u.unit_abbreviation?.trim();
              const name = u.unit_name?.trim();
              if (idNum == null || !abbr) return null;
              return {
                id: idNum,
                value: abbr.toUpperCase(),
                label: name ? `${name} (${abbr})` : abbr,
              };
            })
            .filter((x): x is DimensionUnitOption => x !== null) ?? [];
        setDimensionUnitOptions(mappedDimensionUnits);

        // === Statuses ===
        const mappedStatuses =
          data.selections?.item_statuses?.map((status) => ({
            value: String(status.item_status_id),
            label: status.item_status_name ?? `Status ${status.item_status_id}`,
          })) ?? [];
        setStatusOptions(mappedStatuses);

        // === Price Types for company ===
        const rawPricingByCompany = data.selections?.pricing_types_by_company;
        let companyPricingTypes: any[] = [];
        if (rawPricingByCompany) {
          const keyFromToken = resolvedCompanyIdString ?? "";
          if (keyFromToken) {
            companyPricingTypes = rawPricingByCompany[keyFromToken]?.pricing_types ?? [];
          } else {
            const firstKey = Object.keys(rawPricingByCompany)[0];
            if (firstKey && rawPricingByCompany[firstKey]) {
              companyPricingTypes =
                rawPricingByCompany[firstKey]?.pricing_types ?? [];
            }
          }
        }

        const priceTypeOptionsForCompany: PriceTypeOption[] =
          companyPricingTypes
            ?.map((pt: any) => {
              const id =
                pt.pricing_type_id ??
                pt.price_type_id ??
                pt.priceTypeId ??
                pt.id;
              if (id == null) return null;
              const rawLabel =
                pt.pricing_type_name ??
                pt.price_type_label ??
                pt.price_type_name ??
                pt.label ??
                pt.name ??
                null;
              const label =
                typeof rawLabel === "string"
                  ? rawLabel.trim()
                  : rawLabel != null
                  ? String(rawLabel).trim()
                  : "";
              return {
                value: String(id),
                label: label || `Price Type ${id}`,
              };
            })
            .filter((opt: PriceTypeOption | null): opt is PriceTypeOption => opt !== null) ?? [];
        setPriceTypeOptions(priceTypeOptionsForCompany);

        // === Property names by company (dynamic properties) ===
        const rawPropsByCompany = data.selections?.property_names_by_company;
        if (rawPropsByCompany) {
          const keyForCompany =
            resolvedCompanyIdString &&
            rawPropsByCompany[resolvedCompanyIdString]
              ? resolvedCompanyIdString
              : Object.keys(rawPropsByCompany)[0] ?? null;

          const propsForCompany: RawPropertyName[] =
            (keyForCompany && rawPropsByCompany[keyForCompany]?.properties) || [];

          const nextCoreIds: CorePropertyNameIds = {};
          const nextExtraFields: ExtraPropertyField[] = [];

          const toLabelText = (name: string) =>
            name
              .replace(/_/g, " ")
              .replace(/\b\w/g, (c) => c.toUpperCase());

          for (const prop of propsForCompany) {
            const rawName = (prop.item_property_name || "").trim();
            if (!rawName) continue;
            const lower = rawName.toLowerCase();

            if (lower === "weight") {
              nextCoreIds.weight = prop.item_property_name_id;
              continue;
            }
            if (lower === "length") {
              nextCoreIds.length = prop.item_property_name_id;
              continue;
            }
            if (lower === "width") {
              nextCoreIds.width = prop.item_property_name_id;
              continue;
            }
            if (lower === "height") {
              nextCoreIds.height = prop.item_property_name_id;
              continue;
            }
            if (lower === "bundle") {
              nextCoreIds.bundle = prop.item_property_name_id;
              continue;
            }

            // Extra / company-specific props (class, nmfc, label_*...)
            nextExtraFields.push({
              id: prop.item_property_name_id,
              name: rawName,
              label: toLabelText(rawName),
            });
          }

          setCorePropertyNameIds(nextCoreIds);
          setExtraPropertyFields(nextExtraFields);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Failed to load product lookups", error);
          setCategoryError("Unable to load lookups. Please try again.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setCategoryLoading(false);
        }
      }
    };

    fetchLookups();

    return () => {
      controller.abort();
    };
  }, [effectiveCompanyId]);

  // Price dialog helpers
  const resetPriceForm = () => {
    setPriceForm({
      priceTypeId: "",
      priceTypeLabel: "",
      price: "",
      date: todayIso,
    });
    setEditingPriceId(null);
  };

  const openAddPriceDialog = () => {
    resetPriceForm();
    setPriceDialogOpen(true);
  };

  const openEditPriceDialog = (item: PriceItem) => {
    setPriceForm({
      priceTypeId: item.priceTypeId,
      priceTypeLabel: item.priceTypeLabel,
      price: item.price.toString(),
      date: item.date,
    });
    setEditingPriceId(item.id);
    setPriceDialogOpen(true);
  };

  const closePriceDialog = () => {
    setPriceDialogOpen(false);
    resetPriceForm();
  };

  const upsertPrice = () => {
    const numericPrice = Number(priceForm.price);
    const priceTypeId = priceForm.priceTypeId.trim();
    const selectedPriceType = priceTypeOptions.find(
      (option) => option.value === priceTypeId
    );
    const computedLabel = selectedPriceType?.label ?? priceForm.priceTypeLabel;
    const trimmedLabel = computedLabel ? computedLabel.trim() : "";
    const isValid =
      priceTypeId.length > 0 &&
      trimmedLabel.length > 0 &&
      !Number.isNaN(numericPrice) &&
      priceForm.date;

    if (!isValid) {
      return;
    }

    if (editingPriceId) {
      setPriceList((prev) =>
        prev.map((item) =>
          item.id === editingPriceId
            ? {
                ...item,
                priceTypeId,
                priceTypeLabel: trimmedLabel,
                price: numericPrice,
                date: priceForm.date,
              }
            : item
        )
      );
    } else {
      setPriceList((prev) => [
        ...prev,
        {
          id: `price-${Date.now()}`,
          priceTypeId,
          priceTypeLabel: trimmedLabel,
          price: numericPrice,
          date: priceForm.date,
        },
      ]);
    }

    closePriceDialog();
  };

  const removePrice = (id: string) => {
    setPriceList((prev) => prev.filter((item) => item.id !== id));
  };

  const displayDate = (date: string) => {
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return date;
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const day = String(parsed.getDate()).padStart(2, "0");
    const year = String(parsed.getFullYear()).slice(-2);
    return `${month}.${day}.${year}`;
  };

  // Bundle handlers
  const handleAddBundleItem = () => {
    if (!selectedBundleProduct) return;
    const q = Number(bundleQuantity);
    if (!Number.isFinite(q) || q <= 0) return;

    setBundleItems((prev) => {
      const existingIndex = prev.findIndex(
        (b) => b.productId === selectedBundleProduct.productId
      );
      if (existingIndex >= 0) {
        const copy = [...prev];
        copy[existingIndex] = {
          ...copy[existingIndex],
          quantity: copy[existingIndex].quantity + q,
        };
        return copy;
      }
      return [
        ...prev,
        {
          id: Date.now(),
          productId: selectedBundleProduct.productId,
          globalItemId: selectedBundleProduct.globalItemId,
          productCode: selectedBundleProduct.code,
          productName: selectedBundleProduct.name,
          quantity: q,
        },
      ];
    });

    setSelectedBundleProduct(null);
    setBundleQuantity("1");
  };

  const handleRemoveBundleItem = (id: number) => {
    setBundleItems((prev) => prev.filter((b) => b.id !== id));
  };

  // ===== Submit =====
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitLoading) return;

    setSubmitError(null);
    setSubmitSuccess(false);

    // Block submission if company-specific product code error is set
    if (productCodeCompanyError) {
      setSubmitError(productCodeCompanyError);
      return;
    }

    if (isBundle && bundleItems.length === 0) {
      setSubmitError("Please add at least one product to the bundle.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const getTextValue = (name: string) => {
      const value = formData.get(name);
      return typeof value === "string" ? value.trim() : "";
    };
    const getNumberValue = (name: string) => {
      const value = getTextValue(name);
      if (!value) return null;
      const numeric = Number(value);
      return Number.isFinite(numeric) ? numeric : null;
    };

    const parseIdValue = (value: string) => {
      if (!value) return null;
      const numeric = Number(value);
      return Number.isFinite(numeric) ? numeric : null;
    };

    const weightValue = getNumberValue("weight");
    const heightValue = getNumberValue("height");
    const widthValue = getNumberValue("width");
    const lengthValue = getNumberValue("length");

    const productName = getTextValue("productName");

    // Block negative weight / dimensions (even if pasted)
    if (
      (weightValue != null && weightValue < 0) ||
      (heightValue != null && heightValue < 0) ||
      (widthValue != null && widthValue < 0) ||
      (lengthValue != null && lengthValue < 0)
    ) {
      setSubmitError("Weight and dimensions cannot be negative.");
      return;
    }

    const selectedWeightUnit = weightUnitOptions.find(
      (u) => u.value === weightUnit
    );
    const selectedDimensionUnit = dimensionUnitOptions.find(
      (u) => u.value === dimensionUnit
    );

    // Build properties from core + extra fields
    const properties: PropertyPayload[] = [];

    if (weightValue != null && corePropertyNameIds.weight) {
      properties.push({
        item_property_name_id: corePropertyNameIds.weight,
        property_value: weightValue.toString(),
        unit_id: selectedWeightUnit?.id ?? null,
        unit_type: "weight",
      });
    }
    
    // Dimensions: length, width, height
    if (lengthValue != null && corePropertyNameIds.length) {
      properties.push({
        item_property_name_id: corePropertyNameIds.length,
        property_value: lengthValue.toString(),
        unit_id: selectedDimensionUnit?.id ?? null,
        unit_type: "dimension",
      });
    }
    
    if (widthValue != null && corePropertyNameIds.width) {
      properties.push({
        item_property_name_id: corePropertyNameIds.width,
        property_value: widthValue.toString(),
        unit_id: selectedDimensionUnit?.id ?? null,
        unit_type: "dimension",
      });
    }
    
    if (heightValue != null && corePropertyNameIds.height) {
      properties.push({
        item_property_name_id: corePropertyNameIds.height,
        property_value: heightValue.toString(),
        unit_id: selectedDimensionUnit?.id ?? null,
        unit_type: "dimension",
      });
    }
    
    // Bundle flag property (unit-less)
    if (isBundle && corePropertyNameIds.bundle) {
      properties.push({
        item_property_name_id: corePropertyNameIds.bundle,
        property_value: "1",
        unit_id: null,
        unit_type: null,
      });
    }
    
    // Extra company-specific properties (class, nmfc, labels, ... – all unit-less)
    for (const prop of extraPropertyFields) {
      const value = getTextValue(`prop_${prop.id}`);
      if (!value) continue;
      properties.push({
        item_property_name_id: prop.id,
        property_value: value,
        unit_id: null,
        unit_type: null,
      });
    }

    // Extra company-specific properties (class, nmfc, labels, ...)
    for (const prop of extraPropertyFields) {
      const value = getTextValue(`prop_${prop.id}`);
      if (!value) continue;
      properties.push({
        item_property_name_id: prop.id,
        property_value: value,
        unit_id: null,
        unit_type: null,
      });
    }

    const payload: any = {
      item_name: productName,
      item_status_id: parseIdValue(productStatus),
      item_category_id: parseIdValue(productCategory),
      item_subcategory_id: parseIdValue(subCategory),
      description: getTextValue("productDescription") || null,
      calibration: getTextValue("calibration") || null,
      global_item: productCode.trim().toUpperCase(), // use code; backend will link/insert global item
      item_type_id: 1,
      company_id: normalizeNumericId(effectiveCompanyId) ?? 0,
      created_by: normalizeNumericId(resolvedAssignedUserId) ?? 0,
      modified_by: normalizeNumericId(resolvedAssignedUserId) ?? 0,
      properties,
      prices: priceList.map(({ priceTypeLabel, price, date, priceTypeId }) => {
        const base = {
          name: priceTypeLabel,
          price,
          date,
        };
        const numericPriceTypeId = Number(priceTypeId);
        if (Number.isFinite(numericPriceTypeId)) {
          return {
            ...base,
            price_type_id: numericPriceTypeId,
          };
        }
        return base;
      }),
      // 🔗 Bundle payload
      is_bundle: isBundle ? 1 : 0,
      bundle_items: isBundle
        ? bundleItems.map((b) => ({
            product_id: b.productId,
            quantity: b.quantity,
          }))
        : [],
    };

    // ✅ Validate against actual fields (not payload.product_code / product_name)
    if (!productCode.trim() || !productName) {
      setSubmitError("Product code and name are required.");
      return;
    }

    if (!productStatus || !productCategory || !subCategory) {
      setSubmitError("Status, category, and sub category are required.");
      return;
    }

    try {
      setSubmitLoading(true);
      const response = await fetchWithAuth(PRODUCT_SAVE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        requiresAuth: true,
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      let data: any = null;
      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch {
          data = responseText;
        }
      }

      if (!response.ok || (data && typeof data === "object" && data.ok === false)) {
        const errorMessage =
          (typeof data === "object" &&
            data !== null &&
            (data.error || data.message)) ||
          (typeof data === "string"
            ? data
            : `Request failed (${response.status})`);
        throw new Error(errorMessage);
      }

      setSubmitSuccess(true);
      router.push("/dashboard/products");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save product.";
      setSubmitError(message);
    } finally {
      setSubmitLoading(false);
    }
  };

  // ===== Render =====
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 3,
        p: 2,
        bgcolor: "#FAFAFD",
        minHeight: "100%",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          bgcolor: "#FFF",
          p: 3,
          borderRadius: 1,
          width: { xs: "100%", lg: "70%" },
          mx: "auto",
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 500 }}>
            Add New Product
            {selectedCompanyName ? ` For ${selectedCompanyName}` : ""}
          </Typography>
        </Box>

        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            onClick={() => router.push("/dashboard/products")}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            type="submit"
            form="product-form"
            disabled={submitLoading}
          >
            {submitLoading ? "Saving..." : "Add Product"}
          </Button>
        </Stack>
      </Box>

      {/* Form */}
      <Box
        component="form"
        id="product-form"
        onSubmit={handleSubmit}
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 3,
          width: { xs: "100%", lg: "70%" },
          mx: "auto",
        }}
      >
        {(submitError || submitSuccess) && (
          <Alert
            severity={submitError ? "error" : "success"}
            onClose={() => {
              if (submitError) {
                setSubmitError(null);
              } else {
                setSubmitSuccess(false);
              }
            }}
          >
            {submitError ?? "Product saved successfully."}
          </Alert>
        )}

        {/* Main box */}
        <Box
          sx={{
            bgcolor: "#FFF",
            borderRadius: 2,
            p: 3,
            display: "flex",
            flexDirection: "column",
            gap: 3,
          }}
        >
          <Box>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 700,
                color: "#0B5FFF",
                textDecoration: "underline",
                textDecorationThickness: "2px",
                cursor: "default",
                display: "inline-flex",
                mb: 2,
              }}
            />

            <Box
              sx={{
                display: "grid",
                gap: 3,
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              }}
            >
              {/* Left column */}
              <Stack spacing={2}>
                {/* Product Code */}
                <Autocomplete
                  freeSolo
                  options={productCodeOptions}
                  value={productCode}
                  onChange={handleProductCodeSelect}
                  inputValue={productCode}
                  onInputChange={handleProductCodeInputChange}
                  loading={categoryLoading}
                  loadingText="Loading product codes..."
                  noOptionsText={
                    categoryLoading
                      ? "Loading product codes..."
                      : categoryError
                      ? categoryError
                      : "No product codes found"
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      inputProps={{
                        ...params.inputProps,
                        name: "productCode",
                      }}
                      label="Product Code"
                      fullWidth
                      size="small"
                      required
                      InputLabelProps={{ shrink: true }}
                      placeholder={
                        categoryLoading
                          ? "Loading product codes..."
                          : "Search product code"
                      }
                      error={Boolean(
                        productCodeError || productCodeCompanyError
                      )}
                      helperText={
                        productCodeError ?? productCodeCompanyError ?? undefined
                      }
                      FormHelperTextProps={
                        productCodeError || productCodeCompanyError
                          ? {
                              sx: { color: "error.main" },
                            }
                          : undefined
                      }
                    />
                  )}
                />

                {/* Product Name */}
                <TextField
                  label="Product Name"
                  fullWidth
                  size="small"
                  required
                  name="productName"
                  inputProps={{ maxLength: PRODUCT_NAME_MAX_LENGTH }}
                />

                {/* Status */}
                <TextField
                  select
                  label="Status"
                  fullWidth
                  size="small"
                  name="status"
                  value={productStatus}
                  onChange={(event) => setProductStatus(event.target.value)}
                  required
                  InputLabelProps={{ shrink: true }}
                  SelectProps={{
                    displayEmpty: true,
                    renderValue: (selected: unknown): React.ReactNode => {
                      const value = selected as string;
                      if (!value) {
                        return "Select Status";
                      }
                      const option = statusOptions.find(
                        (item) => item.value === value
                      );
                      return option?.label ?? value;
                    },
                  }}
                >
                  <MenuItem value="" disabled>
                    Select Status
                  </MenuItem>
                  {categoryLoading && (
                    <MenuItem value="" disabled>
                      Loading statuses...
                    </MenuItem>
                  )}
                  {categoryError &&
                    !categoryLoading &&
                    statusOptions.length === 0 && (
                      <MenuItem value="" disabled>
                        {categoryError}
                      </MenuItem>
                    )}
                  {!categoryLoading &&
                    !categoryError &&
                    statusOptions.length === 0 && (
                      <MenuItem value="" disabled>
                        No statuses available
                      </MenuItem>
                    )}
                  {statusOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>

                {/* Description */}
                <TextField
                  label="Product Description"
                  fullWidth
                  size="small"
                  multiline
                  minRows={6}
                  name="productDescription"
                />
              </Stack>

              {/* Right column */}
              <Stack spacing={2}>
                {/* Category */}
                <TextField
                  select
                  label="Product Category"
                  fullWidth
                  size="small"
                  name="category"
                  value={productCategory}
                  onChange={(event) => setProductCategory(event.target.value)}
                  InputLabelProps={{ shrink: true }}
                  SelectProps={{
                    displayEmpty: true,
                    renderValue: (selected: unknown): React.ReactNode => {
                      const value = selected as string;
                      if (!value) {
                        return "Select Category";
                      }
                      const option = categoryOptions.find(
                        (item) => item.value === value
                      );
                      return option?.label ?? value;
                    },
                  }}
                  required
                >
                  <MenuItem value="" disabled>
                    Select Category
                  </MenuItem>
                  {categoryLoading && (
                    <MenuItem value="" disabled>
                      Loading categories...
                    </MenuItem>
                  )}
                  {categoryError &&
                    !categoryLoading &&
                    categoryOptions.length === 0 && (
                      <MenuItem value="" disabled>
                        {categoryError}
                      </MenuItem>
                    )}
                  {categoryOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>

                {/* Sub Category */}
                <TextField
                  select
                  label="Sub Category"
                  fullWidth
                  size="small"
                  name="subCategory"
                  value={subCategory}
                  onChange={(event) => setSubCategory(event.target.value)}
                  disabled={!productCategory}
                  InputLabelProps={{ shrink: true }}
                  SelectProps={{
                    displayEmpty: true,
                    renderValue: (selected: unknown): React.ReactNode => {
                      const value = selected as string;
                      if (!value) {
                        return productCategory
                          ? "Select Sub Category"
                          : "Choose a category first";
                      }
                      const option = availableSubCategories.find(
                        (item) => item.value === value
                      );
                      return option?.label ?? value;
                    },
                  }}
                  required
                >
                  <MenuItem value="" disabled>
                    {productCategory
                      ? "Select Sub Category"
                      : "Choose a category first"}
                  </MenuItem>
                  {categoryLoading && productCategory && (
                    <MenuItem value="" disabled>
                      Loading subcategories...
                    </MenuItem>
                  )}
                  {categoryError &&
                    productCategory &&
                    availableSubCategories.length === 0 &&
                    !categoryLoading && (
                      <MenuItem value="" disabled>
                        {categoryError}
                      </MenuItem>
                    )}
                  {availableSubCategories.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>

                {/* Calibration + Bundle */}
                <Stack
                  spacing={2}
                  direction={{ xs: "column", md: "row" }}
                  alignItems="center"
                >
                  <TextField
                    select
                    label="Calibration"
                    size="small"
                    defaultValue="no"
                    sx={{ width: { xs: "100%", md: "50%" } }}
                    name="calibration"
                  >
                    <MenuItem value="yes">Yes</MenuItem>
                    <MenuItem value="no">No</MenuItem>
                  </TextField>

                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={isBundle}
                        onChange={(e) => setIsBundle(e.target.checked)}
                        name="bundle"
                      />
                    }
                    label="Bundle"
                  />
                </Stack>

                {/* Properties (core + extra) */}
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Properties
                  </Typography>

                  {/* Units */}
                  <Stack spacing={2} direction={{ xs: "column", md: "row" }}>
                    <TextField
                      select
                      label="Weight Unit"
                      size="small"
                      fullWidth
                      name="weightUnit"
                      value={weightUnit}
                      onChange={(e) => setWeightUnit(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      SelectProps={{
                        displayEmpty: true,
                        renderValue: (selected: unknown): React.ReactNode => {
                          const value = selected as string;
                          if (!value) {
                            return weightUnitOptions.length
                              ? "Select Weight Unit"
                              : "No weight units available";
                          }
                          const option = weightUnitOptions.find(
                            (item) => item.value === value
                          );
                          return option?.label ?? value;
                        },
                      }}
                    >
                      <MenuItem value="" disabled>
                        {weightUnitOptions.length
                          ? "Select Weight Unit"
                          : "No weight units available"}
                      </MenuItem>
                      {weightUnitOptions.map((option) => (
                        <MenuItem key={option.id} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>

                    <TextField
                      select
                      label="Dimension Unit"
                      size="small"
                      fullWidth
                      name="dimensionUnit"
                      value={dimensionUnit}
                      onChange={(event) =>
                        setDimensionUnit(event.target.value)
                      }
                      InputLabelProps={{ shrink: true }}
                      SelectProps={{
                        displayEmpty: true,
                        renderValue: (selected: unknown): React.ReactNode => {
                          const value = selected as string;
                          if (!value) {
                            return dimensionUnitOptions.length
                              ? "Select Dimension Unit"
                              : "No dimension units available";
                          }
                          const option = dimensionUnitOptions.find(
                            (item) => item.value === value
                          );
                          return option?.label ?? value;
                        },
                      }}
                    >
                      <MenuItem value="" disabled>
                        {dimensionUnitOptions.length
                          ? "Select Dimension Unit"
                          : "No dimension units available"}
                      </MenuItem>
                      {dimensionUnitOptions.map((option) => (
                        <MenuItem key={option.id} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Stack>

                  {/* Weight + Height */}
                  <Stack spacing={2} direction={{ xs: "column", md: "row" }}>
                    <TextField
                      label="Weight"
                      size="small"
                      fullWidth
                      type="number"
                      name="weight"
                      onKeyDown={allowOnlyNumericKeys}
                      inputProps={NUMERIC_INPUT_PROPS}
                      sx={NUMERIC_INPUT_SX}
                    />
                    <TextField
                      label="Height"
                      size="small"
                      fullWidth
                      type="number"
                      name="height"
                      onKeyDown={allowOnlyNumericKeys}
                      inputProps={NUMERIC_INPUT_PROPS}
                      sx={NUMERIC_INPUT_SX}
                    />
                  </Stack>

                  {/* Width + Length */}
                  <Stack spacing={2} direction={{ xs: "column", md: "row" }}>
                    <TextField
                      label="Width"
                      size="small"
                      fullWidth
                      type="number"
                      name="width"
                      onKeyDown={allowOnlyNumericKeys}
                      inputProps={NUMERIC_INPUT_PROPS}
                      sx={NUMERIC_INPUT_SX}
                    />
                    <TextField
                      label="Length"
                      size="small"
                      fullWidth
                      type="number"
                      name="length"
                      onKeyDown={allowOnlyNumericKeys}
                      inputProps={NUMERIC_INPUT_PROPS}
                      sx={NUMERIC_INPUT_SX}
                    />
                  </Stack>

                  {/* Extra company-specific properties (4-column grid) */}
                  {extraPropertyFields.length > 0 && (
                    <>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 600, mt: 1 }}
                      >
                        Additional Properties
                      </Typography>
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: {
                            xs: "1fr",
                            md: "repeat(2, 1fr)",
                            lg: "repeat(4, 1fr)",
                          },
                          gap: 2,
                        }}
                      >
                        {extraPropertyFields.map((field) => (
                          <TextField
                            key={field.id}
                            label={field.label}
                            size="small"
                            fullWidth
                            name={`prop_${field.id}`}
                          />
                        ))}
                      </Box>
                    </>
                  )}
                </Box>
              </Stack>
            </Box>
          </Box>
        </Box>

        {/* Bundle Section */}
        {isBundle && (
          <Box
            sx={{
              bgcolor: "#FFF",
              borderRadius: 2,
              p: 3,
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              alignItems={{ xs: "stretch", md: "center" }}
            >
              <Autocomplete
                fullWidth
                size="small"
                options={companyProducts}
                loading={companyProductsLoading}
                isOptionEqualToValue={(option, value) =>
                  option.productId === value.productId
                }
                getOptionLabel={(option) =>
                  option
                    ? `${option.code || "—"} — ${
                        option.name || "Unnamed product"
                      }`
                    : ""
                }
                value={selectedBundleProduct}
                onChange={(_, value) => setSelectedBundleProduct(value)}
                // 🔑 Ensure unique, stable keys for each option
                renderOption={(props, option) => (
                  <li {...props} key={option.productId}>
                    {option.code
                      ? `${option.code} — ${
                          option.name || "Unnamed product"
                        }`
                      : option.name || "Unnamed product"}
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Product in bundle"
                    placeholder={
                      companyProductsLoading
                        ? "Loading products..."
                        : companyProductsError ||
                          "Search by product code or name"
                    }
                    error={!!companyProductsError}
                    helperText={companyProductsError || undefined}
                  />
                )}
              />

              <TextField
                label="Quantity"
                size="small"
                type="number"
                sx={{ width: { xs: "100%", md: 120 } }}
                value={bundleQuantity}
                onChange={(e) => setBundleQuantity(e.target.value)}
                inputProps={{ min: 1, step: 1 }}
              />

              <Button
                variant="outlined"
                startIcon={<MdAdd />}
                onClick={handleAddBundleItem}
                sx={{ whiteSpace: "nowrap" }}
              >
                Add To Bundle
              </Button>
            </Stack>

            <Table
              sx={{
                mt: 1,
                "& th": { bgcolor: "#EAF5FF", fontWeight: 600, fontSize: 13 },
                "& td": { fontSize: 13 },
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 60 }}>#</TableCell>
                  <TableCell>Product Code</TableCell>
                  <TableCell>Product Name</TableCell>
                  <TableCell sx={{ width: 120 }}>Quantity</TableCell>
                  <TableCell align="right" sx={{ width: 80 }}>
                    Action
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bundleItems.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      align="center"
                      sx={{ py: 3, color: "text.secondary" }}
                    >
                      No bundle items yet. Search and add products above.
                    </TableCell>
                  </TableRow>
                )}
                {bundleItems.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{item.productCode || "—"}</TableCell>
                    <TableCell>{item.productName || "—"}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveBundleItem(item.id)}
                      >
                        <MdDelete size={18} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Typography variant="caption" color="text.secondary">
              {bundleItems.length} bundle item
              {bundleItems.length === 1 ? "" : "s"} configured
            </Typography>
          </Box>
        )}

        {/* Price List */}
        <Box
          sx={{
            bgcolor: "#FFF",
            borderRadius: 2,
            p: 3,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Price List
            </Typography>
            <Button startIcon={<MdAdd />} onClick={openAddPriceDialog}>
              Add Price
            </Button>
          </Stack>

          <Table
            sx={{
              "& th": { bgcolor: "#EAF5FF", fontWeight: 600, fontSize: 13 },
              "& td": { fontSize: 13 },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 60 }}>#</TableCell>
                <TableCell>Price Type</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {priceList.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    align="center"
                    sx={{ py: 4, color: "text.secondary" }}
                  >
                    No prices yet. Click &ldquo;Add Price&rdquo; to
                    create one.
                  </TableCell>
                </TableRow>
              )}
              {priceList.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{item.priceTypeLabel}</TableCell>
                  <TableCell>{`$${item.price.toFixed(0)}`}</TableCell>
                  <TableCell>{displayDate(item.date)}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => openEditPriceDialog(item)}
                    >
                      <MdEdit size={18} />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => removePrice(item.id)}
                    >
                      <MdDelete size={18} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Typography variant="caption" color="text.secondary">
            {totalPrices} price{totalPrices === 1 ? "" : "s"} configured
          </Typography>
        </Box>
      </Box>

      {/* Price Dialog */}
      <Dialog
        open={priceDialogOpen}
        onClose={closePriceDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          {editingPriceId ? "Edit Price" : "Add Price"}
        </DialogTitle>
        <DialogContent
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            pt: 2,
          }}
        >
          <TextField
            select
            label="Price Type"
            value={priceForm.priceTypeId}
            size="small"
            onChange={(event) => {
              const value = event.target.value;
              const option = priceTypeOptions.find(
                (item) => item.value === value
              );
              setPriceForm((prev) => ({
                ...prev,
                priceTypeId: value,
                priceTypeLabel:
                  option?.label?.trim() ?? prev.priceTypeLabel,
              }));
            }}
            InputLabelProps={{ shrink: true }}
            SelectProps={{
              displayEmpty: true,
              renderValue: (selected: unknown): React.ReactNode => {
                const value = selected as string;
                if (!value) {
                  return "Select Price Type";
                }
                const option = priceTypeOptions.find(
                  (item) => item.value === value
                );
                return (
                  option?.label ?? (priceForm.priceTypeLabel || value)
                );
              },
            }}
          >
            <MenuItem value="" disabled>
              Select Price Type
            </MenuItem>
            {categoryLoading && (
              <MenuItem value="" disabled>
                Loading price types...
              </MenuItem>
            )}
            {categoryError &&
              !categoryLoading &&
              priceTypeOptions.length === 0 && (
                <MenuItem value="" disabled>
                  {categoryError}
                </MenuItem>
              )}
            {!categoryLoading &&
              !categoryError &&
              priceTypeOptions.length === 0 && (
                <MenuItem value="" disabled>
                  No price types available
                </MenuItem>
              )}
            {priceTypeOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Price"
            value={priceForm.price}
            size="small"
            type="number"
            inputProps={{ min: 0 }}
            onChange={(event) =>
              setPriceForm((prev) => ({
                ...prev,
                price: event.target.value,
              }))
            }
          />
          <TextField
            label="Date"
            value={priceForm.date}
            size="small"
            type="date"
            onChange={(event) =>
              setPriceForm((prev) => ({
                ...prev,
                date: event.target.value,
              }))
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closePriceDialog}>Cancel</Button>
          <Button onClick={upsertPrice} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

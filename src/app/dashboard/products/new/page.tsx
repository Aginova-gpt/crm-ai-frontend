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
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  MenuItem,
} from "@mui/material";
import { MdAdd, MdEdit, MdDelete } from "react-icons/md";
import { useRouter } from "next/navigation";
import { useApi } from "../../../../utils/api";
import { useAuth } from "../../../../contexts/AuthContext";
import { useCompany } from "../../../../contexts/CompanyContext";

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
      dimension_unit_label?: string;
      dimension_unit_name?: string;
      dimension_unit_abbreviation?: string;
    }>;
    price_types?: Array<{
      price_type_id: number;
      price_type_label?: string;
      price_type_name?: string;
    }>;
    pricing_types_by_company?: unknown;
  };
};

const PRODUCT_LOOKUP_URL = "http://34.58.37.44/api/get-product-lookups";
const PRODUCT_SAVE_URL = "http://34.58.37.44/api/add-product";

type GlobalItemOption = {
  id: number;
  code: string;
};

const PRODUCT_CODE_MAX_LENGTH = 255;
const PRODUCT_CODE_ALLOWED_REGEX = /^[A-Z0-9-]*$/;
const PRODUCT_NAME_MAX_LENGTH = 255;
const NUMERIC_INPUT_PROPS = { inputMode: "decimal", step: "0.01" } as const;
const NUMERIC_INPUT_SX = {
  "& input[type=number]": {
    MozAppearance: "textfield",
  },
  "& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button": {
    WebkitAppearance: "none",
    margin: 0,
  },
} as const;

type StatusOption = {
  value: string;
  label: string;
};

type DimensionUnitOption = {
  value: string;
  label: string;
};

type PropertyPayload = {
  item_property_name_id: number;
  property_value: string;
  unit_code: string | undefined;
  unit_type: string;
};
const DIMENSION_UNIT_OPTIONS: DimensionUnitOption[] = [
  { value: "cm", label: "Centimeter (cm)" },
  { value: "mm", label: "Millimeter (mm)" },
  { value: "in", label: "Inch (in)" },
  { value: "ft", label: "Foot (ft)" },
];

const initialPrices: PriceItem[] = [];

const mergePriceTypeOptions = (base: PriceTypeOption[], extras: PriceTypeOption[]): PriceTypeOption[] => {
  const merged: PriceTypeOption[] = [];
  const seen = new Map<string, number>();

  const addOption = (option: PriceTypeOption | null | undefined) => {
    if (!option) return;
    const rawValue = option.value;
    if (rawValue == null) return;
    const value = typeof rawValue === "string" ? rawValue.trim() : String(rawValue);
    if (!value) return;
    const rawLabel = option.label;
    const label =
      typeof rawLabel === "string"
        ? rawLabel.trim()
        : rawLabel != null
          ? String(rawLabel).trim()
          : "";

    if (seen.has(value)) {
      const existingIndex = seen.get(value)!;
      if (!merged[existingIndex].label && label) {
        merged[existingIndex] = { value, label };
      }
      return;
    }

    merged.push({
      value,
      label: label || `Price Type ${value}`,
    });
    seen.set(value, merged.length - 1);
  };

  base.forEach(addOption);
  extras.forEach(addOption);

  return merged;
};

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

export default function AddProductPage() {
  const router = useRouter();
  const { fetchWithAuth } = useApi();
  const { token } = useAuth();
  const { selectedCompanyId } = useCompany();
  const [priceList, setPriceList] = useState<PriceItem[]>(initialPrices);
  const [priceDialogOpen, setPriceDialogOpen] = useState(false);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [statusOptions, setStatusOptions] = useState<StatusOption[]>([]);
  const [globalItemOptions, setGlobalItemOptions] = useState<GlobalItemOption[]>([]);
  const [priceTypeOptions, setPriceTypeOptions] = useState<PriceTypeOption[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [productCode, setProductCode] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [productStatus, setProductStatus] = useState("");
  const [dimensionUnit, setDimensionUnit] = useState("");
  const [productCodeExists, setProductCodeExists] = useState(false);
  const [productCodeError, setProductCodeError] = useState<string | null>(null);
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

  const availableSubCategories = useMemo(() => {
    return categoryOptions.find((option) => option.value === productCategory)?.subCategories || [];
  }, [categoryOptions, productCategory]);

  const productCodeOptions = useMemo(() => globalItemOptions.map((item) => item.code), [globalItemOptions]);
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

  React.useEffect(() => {
    const normalized = productCode.trim().toLowerCase();
    if (!normalized) {
      setProductCodeExists(false);
      setProductCodeError(null);
      return;
    }

    setProductCodeExists(Boolean(matchedGlobalItem));
    setProductCodeError((prev) => (prev && !PRODUCT_CODE_ALLOWED_REGEX.test(productCode) ? prev : null));
  }, [productCode, matchedGlobalItem]);

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
    const value = (newValue ?? "").toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, PRODUCT_CODE_MAX_LENGTH);
    setProductCodeError(null);
    setProductCode(value);
  };

  const allowOnlyNumericKeys: React.KeyboardEventHandler<HTMLInputElement> = (event) => {
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

    if (event.key === "-" ) {
      return;
    }

    const decimalKeys = ["." , "Decimal", "NumpadDecimal"];
    if (decimalKeys.includes(event.key)) {
      const input = event.currentTarget as HTMLInputElement | null;
      if (!input) {
        return;
      }
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

    if (/[0-9]/.test(event.key)) {
      return;
    }

    event.preventDefault();
  };

  React.useEffect(() => {
    setSubCategory("");
  }, [productCategory]);

  React.useEffect(() => {
    if (!statusOptions.some((item) => item.value === productStatus)) {
      setProductStatus("");
    }
  }, [statusOptions, productStatus]);

  React.useEffect(() => {
    if (!DIMENSION_UNIT_OPTIONS.some((item) => item.value === dimensionUnit)) {
      setDimensionUnit("");
    }
  }, [dimensionUnit]);

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

  const resolveCompanyId = useMemo(() => {
    const fromToken =
      decodedToken?.company_id ??
      decodedToken?.companyId ??
      decodedToken?.companyID ??
      null;
    if (fromToken != null && String(fromToken).trim() !== "") {
      return fromToken;
    }
    if (selectedCompanyId && selectedCompanyId !== "all") {
      return selectedCompanyId;
    }
    return null;
  }, [decodedToken, selectedCompanyId]);

  React.useEffect(() => {
    const controller = new AbortController();

    const fetchCategories = async () => {
      setCategoryLoading(true);
      setCategoryError(null);

      try {
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

        const resolvedCompanyIdString =
          toIdString(normalizeNumericId(resolveCompanyId)) ?? toIdString(resolveCompanyId);

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
                label: sub.item_subcategory_label ?? sub.item_subcategory_name ?? `Subcategory ${sub.item_subcategory_id}`,
              })) ?? [],
          })) ?? [];

        setCategoryOptions(mappedCategories);
        const mappedGlobalItems =
          data.selections?.global_items?.map((item) => ({
            id: item.id,
            code: item.code ?? `Item ${item.id}`,
          })) ?? [];
        setGlobalItemOptions(mappedGlobalItems);
        const mappedPriceTypes =
          data.selections?.price_types?.map((priceType) => ({
            value: String(priceType.price_type_id),
            label:
              priceType.price_type_label ??
              priceType.price_type_name ??
              `Price Type ${priceType.price_type_id}`,
          })) ?? [];

        const collectPricingEntries = (
          input: unknown,
          inheritedCompanyId: string | null = null
        ): Array<Record<string, unknown>> => {
          const results: Array<Record<string, unknown>> = [];

          const process = (value: unknown, parentCompanyId: string | null) => {
            if (value == null) {
              return;
            }

            if (Array.isArray(value)) {
              value.forEach((item) => process(item, parentCompanyId));
              return;
            }

            if (typeof value !== "object") {
              return;
            }

            const record = value as Record<string, unknown>;

            if ("pricing_types" in record && record.pricing_types != null) {
              const nextCompanyId =
                toIdString(
                  record.company_id ??
                    record.companyId ??
                    record.companyID ??
                    record.company ??
                    parentCompanyId
                ) ?? parentCompanyId;
              process(record.pricing_types, nextCompanyId);
              return;
            }

            if ("price_types" in record && record.price_types != null) {
              const nextCompanyId =
                toIdString(
                  record.company_id ??
                    record.companyId ??
                    record.companyID ??
                    record.company ??
                    parentCompanyId
                ) ?? parentCompanyId;
              process(record.price_types, nextCompanyId);
              return;
            }

            const maybePriceTypeId =
              record.price_type_id ??
              record.priceTypeId ??
              record.price_type ??
              record.id ??
              null;

            if (maybePriceTypeId == null) {
              const entries = Object.entries(record);
              if (entries.length === 0) {
                return;
              }
              entries.forEach(([key, item]) => {
                const isNumericKey = /^[0-9]+$/.test(key);
                const nextCompanyId = isNumericKey
                  ? key
                  : toIdString(
                      record.company_id ??
                        record.companyId ??
                        record.companyID ??
                        record.company ??
                        parentCompanyId
                    ) ?? parentCompanyId;
                process(item, nextCompanyId);
              });
              return;
            }

            results.push({
              ...record,
              company_id:
                toIdString(
                  record.company_id ??
                    record.companyId ??
                    record.companyID ??
                    record.company ??
                    parentCompanyId
                ) ?? parentCompanyId,
            });
          };

          process(input, inheritedCompanyId);

          return results;
        };

        const pricingEntries = collectPricingEntries(
          data.selections?.pricing_types_by_company,
          resolvedCompanyIdString
        );

        const filteredPricingEntries =
          resolvedCompanyIdString != null
            ? pricingEntries.filter((entry) => {
                const companyIdValue =
                  entry.company_id ??
                  entry.companyId ??
                  entry.companyID ??
                  entry.company ??
                  null;
                const candidate = toIdString(companyIdValue);
                return candidate === resolvedCompanyIdString;
              })
            : pricingEntries;

        const mappedCompanyPriceList = filteredPricingEntries
          .map((entry, index) => {
            const priceTypeIdSource =
              entry.price_type_id ??
              entry.priceTypeId ??
              entry.price_type ??
              entry.id ??
              null;
            const priceTypeId = toIdString(priceTypeIdSource);
            if (!priceTypeId) {
              return null;
            }

            const rawLabel =
              entry.price_type_label ??
              entry.price_type_name ??
              entry.label ??
              entry.name ??
              null;
            const priceTypeLabel =
              typeof rawLabel === "string"
                ? rawLabel.trim()
                : rawLabel != null
                  ? String(rawLabel).trim()
                  : "";
            if (!priceTypeLabel) {
              return null;
            }

            const rawPrice =
              entry.price ??
              entry.amount ??
              entry.value ??
              entry.rate ??
              entry.default_price ??
              entry.price_amount ??
              null;
            let numericPrice: number | null = null;
            if (typeof rawPrice === "number") {
              numericPrice = Number.isFinite(rawPrice) ? rawPrice : null;
            } else if (typeof rawPrice === "string") {
              const parsed = Number(rawPrice);
              numericPrice = Number.isFinite(parsed) ? parsed : null;
            }

            const rawDate =
              entry.date ??
              entry.effective_date ??
              entry.start_date ??
              entry.startDate ??
              entry.price_date ??
              entry.effectiveDate ??
              null;
            const date =
              typeof rawDate === "string" && rawDate.trim()
                ? rawDate.trim().slice(0, 10)
                : todayIso;

            return {
              id: `company-price-${priceTypeId}-${index}`,
              priceTypeId,
              priceTypeLabel,
              price: numericPrice ?? 0,
              date,
            } satisfies PriceItem;
          })
          .filter((item): item is PriceItem => item !== null);

        if (mappedCompanyPriceList.length > 0) {
          setPriceList(mappedCompanyPriceList);
        } else {
          setPriceList([]);
        }

        const mappedStatuses =
          data.selections?.item_statuses?.map((status) => ({
            value: String(status.item_status_id),
            label: status.item_status_name ?? `Status ${status.item_status_id}`,
          })) ?? [];

        const priceTypesFromCompany = mappedCompanyPriceList.map((item) => ({
          value: item.priceTypeId,
          label: item.priceTypeLabel,
        }));

        setPriceTypeOptions(mergePriceTypeOptions(mappedPriceTypes, priceTypesFromCompany));
        setStatusOptions(mappedStatuses);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Failed to load product categories", error);
          setCategoryError("Unable to load lookups. Please try again.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setCategoryLoading(false);
        }
      }
    };

    fetchCategories();

    return () => {
      controller.abort();
    };
  }, [resolveCompanyId, todayIso]);

  React.useEffect(() => {
    setSubCategory("");
  }, [productCategory]);

  React.useEffect(() => {
    if (!statusOptions.some((item) => item.value === productStatus)) {
      setProductStatus("");
    }
  }, [statusOptions, productStatus]);

  React.useEffect(() => {
    if (!DIMENSION_UNIT_OPTIONS.some((item) => item.value === dimensionUnit)) {
      setDimensionUnit("");
    }
  }, [dimensionUnit]);

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
    const selectedPriceType = priceTypeOptions.find((option) => option.value === priceTypeId);
    const computedLabel = selectedPriceType?.label ?? priceForm.priceTypeLabel;
    const trimmedLabel = computedLabel ? computedLabel.trim() : "";
    const isValid =
      priceTypeId.length > 0 && trimmedLabel.length > 0 && !Number.isNaN(numericPrice) && priceForm.date;

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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitLoading) {
      return;
    }

    setSubmitError(null);
    setSubmitSuccess(false);

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
    const weightUnitValue = getTextValue("weightUnit");

    const properties: Array<PropertyPayload | null> = [
      weightValue != null
        ? ({
            item_property_name_id: 1001,
            property_value: weightValue.toString(),
            unit_code: weightUnitValue ? weightUnitValue.toUpperCase() : "KG",
            unit_type: "weight",
          } satisfies PropertyPayload)
        : null,
      lengthValue != null
        ? ({
            item_property_name_id: 1002,
            property_value: lengthValue.toString(),
            unit_code: dimensionUnit ? dimensionUnit.toUpperCase() : undefined,
            unit_type: "length",
          } satisfies PropertyPayload)
        : null,
      widthValue != null
        ? ({
            item_property_name_id: 1003,
            property_value: widthValue.toString(),
            unit_code: dimensionUnit ? dimensionUnit.toUpperCase() : undefined,
            unit_type: "width",
          } satisfies PropertyPayload)
        : null,
      heightValue != null
        ? ({
            item_property_name_id: 1004,
            property_value: heightValue.toString(),
            unit_code: dimensionUnit ? dimensionUnit.toUpperCase() : undefined,
            unit_type: "height",
          } satisfies PropertyPayload)
        : null,
    ].filter((property): property is PropertyPayload => property !== null);

    const payload = {
      product_code: productCode.trim(),
      product_name: getTextValue("productName"),
      item_name: getTextValue("productName"),
      item_status_id: parseIdValue(productStatus),
      //status_value: productStatus || null,
      //status_label: statusOptions.find((item) => item.value === productStatus)?.label ?? null,
      item_category_id: parseIdValue(productCategory),
      //category_value: productCategory || null,
      //category_label: categoryOptions.find((item) => item.value === productCategory)?.label ?? null,
      item_subcategory_id: parseIdValue(subCategory),
      //subcategory_value: subCategory || null,
      //subcategory_label: availableSubCategories.find((item) => item.value === subCategory)?.label ?? null,
      description: getTextValue("productDescription") || null,
      calibration: getTextValue("calibration") || null,
      //weight_unit: getTextValue("weightUnit") || null,
      //dimension_unit: dimensionUnit || getTextValue("dimensionUnit") || null,
     // weight: weightValue,
      //height: heightValue,
      //width: widthValue,
      //length: lengthValue,
      //global_item: normalizeNumericId(matchedGlobalItem?.id) ?? null,
global_item:  productCode,
      item_type_id: 1,
      company_id: normalizeNumericId(resolveCompanyId) ?? 0,
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
    };

    if (!payload.product_code || !payload.product_name) {
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
      console.log(payload);
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
          (typeof data === "object" && data !== null && (data.error || data.message)) ||
          (typeof data === "string" ? data : `Request failed (${response.status})`);
        throw new Error(errorMessage);
      }

      setSubmitSuccess(true);
      router.push("/dashboard/products");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save product.";
      setSubmitError(message);
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, p: 2, bgcolor: "#FAFAFD", minHeight: "100%" }}>
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
          </Typography>
          
        </Box>

        <Stack direction="row" spacing={2}>
          <Button variant="outlined" onClick={() => router.push("/dashboard/products")}>
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
        <Box sx={{ bgcolor: "#FFF", borderRadius: 2, p: 3, display: "flex", flexDirection: "column", gap: 3 }}>
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
            >
              
            </Typography>

            <Box
              sx={{
                display: "grid",
                gap: 3,
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              }}
            >
              <Stack spacing={2}>
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
                      placeholder={categoryLoading ? "Loading product codes..." : "Search product code"}
                      error={Boolean(productCodeError || productCodeExists)}
                      helperText={
                        productCodeError ??
                        (productCodeExists ? "Note: This product code already exists. Please Enter Unique one." : undefined)
                      }
                      FormHelperTextProps={
                        productCodeError
                          ? {
                              sx: { color: "error.main" },
                            }
                          : productCodeExists
                          ? {
                              sx: { color: "warning.main" },
                            }
                          : undefined
                      }
                    />
                  )}
                />
                <TextField
                  label="Product Name"
                  fullWidth
                  size="small"
                  required
                  name="productName"
                  inputProps={{ maxLength: PRODUCT_NAME_MAX_LENGTH }}
                />
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
                      const option = statusOptions.find((item) => item.value === value);
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
                  {categoryError && !categoryLoading && statusOptions.length === 0 && (
                    <MenuItem value="" disabled>
                      {categoryError}
                    </MenuItem>
                  )}
                  {!categoryLoading && !categoryError && statusOptions.length === 0 && (
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
                <TextField
                  label="Product Description"
                  fullWidth
                  size="small"
                  multiline
                  minRows={6}
                  name="productDescription"
                />
              </Stack>
              <Stack spacing={2}>
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
                      const option = categoryOptions.find((item) => item.value === value);
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
                  {categoryError && !categoryLoading && categoryOptions.length === 0 && (
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
                        return productCategory ? "Select Sub Category" : "Choose a category first";
                      }
                      const option = availableSubCategories.find((item) => item.value === value);
                      return option?.label ?? value;
                    },
                  }}
                  required
                >
                  <MenuItem value="" disabled>
                    {productCategory ? "Select Sub Category" : "Choose a category first"}
                  </MenuItem>
                  {categoryLoading && productCategory && (
                    <MenuItem value="" disabled>
                      Loading subcategories...
                    </MenuItem>
                  )}
                  {categoryError && productCategory && availableSubCategories.length === 0 && !categoryLoading && (
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
                <TextField
                  select
                  label="Calibration"
                  size="small"
                  defaultValue="yes"
                  sx={{ width: { xs: "100%", md: "50%" } }}
                  name="calibration"
                >
                  <MenuItem value="yes">Yes</MenuItem>
                  <MenuItem value="no">No</MenuItem>
                </TextField>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Properties
                  </Typography>
                  <Stack spacing={2} direction={{ xs: "column", md: "row" }}>
                    <TextField
                      select
                      label="Weight Unit"
                      size="small"
                      fullWidth
                      name="weightUnit"
                      defaultValue="kg"
                    >
                      <MenuItem value="kg">Kilogram (kg)</MenuItem>
                      <MenuItem value="g">Gram (g)</MenuItem>
                      <MenuItem value="lb">Pound (lb)</MenuItem>
                    </TextField>
                    <TextField
                      select
                      label="Dimension Unit"
                      size="small"
                      fullWidth
                      name="dimensionUnit"
                      value={dimensionUnit}
                      onChange={(event) => setDimensionUnit(event.target.value)}
                      InputLabelProps={{ shrink: true }}
                      SelectProps={{
                        displayEmpty: true,
                        renderValue: (selected: unknown): React.ReactNode => {
                          const value = selected as string;
                          if (!value) {
                            return "Select Dimension Unit";
                          }
                          const option = DIMENSION_UNIT_OPTIONS.find((item) => item.value === value);
                          return option?.label ?? value;
                        },
                      }}
                    >
                      <MenuItem value="" disabled>
                        {DIMENSION_UNIT_OPTIONS.length ? "Select Dimension Unit" : "No dimension units available"}
                      </MenuItem>
                      {DIMENSION_UNIT_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Stack>
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
                </Box>
              </Stack>
            </Box>
          </Box>
        </Box>

        <Box sx={{ bgcolor: "#FFF", borderRadius: 2, p: 3, display: "flex", flexDirection: "column", gap: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
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
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: "text.secondary" }}>
                    No prices yet. Click &ldquo;Add Price&rdquo; to create one.
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
                    <IconButton size="small" color="primary" onClick={() => openEditPriceDialog(item)}>
                      <MdEdit size={18} />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => removePrice(item.id)}>
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

      <Dialog open={priceDialogOpen} onClose={closePriceDialog} maxWidth="xs" fullWidth>
        <DialogTitle>{editingPriceId ? "Edit Price" : "Add Price"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
          <TextField
            select
            label="Price Type"
            value={priceForm.priceTypeId}
            size="small"
            onChange={(event) => {
              const value = event.target.value;
              const option = priceTypeOptions.find((item) => item.value === value);
              setPriceForm((prev) => ({
                ...prev,
                priceTypeId: value,
                priceTypeLabel: option?.label?.trim() ?? prev.priceTypeLabel,
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
                const option = priceTypeOptions.find((item) => item.value === value);
                return option?.label ?? (priceForm.priceTypeLabel || value);
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
            {categoryError && !categoryLoading && priceTypeOptions.length === 0 && (
              <MenuItem value="" disabled>
                {categoryError}
              </MenuItem>
            )}
            {!categoryLoading && !categoryError && priceTypeOptions.length === 0 && (
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
            onChange={(event) => setPriceForm((prev) => ({ ...prev, price: event.target.value }))}
          />
          <TextField
            label="Date"
            value={priceForm.date}
            size="small"
            type="date"
            onChange={(event) => setPriceForm((prev) => ({ ...prev, date: event.target.value }))}
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


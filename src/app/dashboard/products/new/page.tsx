"use client";

import React, { useMemo, useState } from "react";
import {
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

type PriceItem = {
  id: string;
  name: string;
  price: number;
  date: string; // ISO string
};

type PriceFormState = {
  name: string;
  price: string;
  date: string;
};

type CategoryOption = {
  value: string;
  label: string;
  subCategories: { value: string; label: string }[];
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
  };
};

const PRODUCT_LOOKUP_URL = "http://34.58.37.44/api/get-product-lookups";

type GlobalItemOption = {
  id: number;
  code: string;
};

const PRODUCT_CODE_MAX_LENGTH = 255;
const PRODUCT_CODE_ALLOWED_REGEX = /^[A-Z0-9-]*$/;

type StatusOption = {
  value: string;
  label: string;
};

type DimensionUnitOption = {
  value: string;
  label: string;
};

const DIMENSION_UNIT_OPTIONS: DimensionUnitOption[] = [
  { value: "cm", label: "Centimeter (cm)" },
  { value: "mm", label: "Millimeter (mm)" },
  { value: "in", label: "Inch (in)" },
  { value: "ft", label: "Foot (ft)" },
];

const initialPrices: PriceItem[] = [
  { id: "price-1", name: "Sonitor", price: 200, date: "2025-10-10" },
  { id: "price-2", name: "Aegis", price: 210, date: "2025-10-10" },
];

export default function AddProductPage() {
  const router = useRouter();
  const [priceList, setPriceList] = useState<PriceItem[]>(initialPrices);
  const [priceDialogOpen, setPriceDialogOpen] = useState(false);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [statusOptions, setStatusOptions] = useState<StatusOption[]>([]);
  const [globalItemOptions, setGlobalItemOptions] = useState<GlobalItemOption[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [productCode, setProductCode] = useState("");
  const [productCodeExists, setProductCodeExists] = useState(false);
  const [productCodeError, setProductCodeError] = useState<string | null>(null);
  const [productCategory, setProductCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [productStatus, setProductStatus] = useState("");
  const [dimensionUnit, setDimensionUnit] = useState("");
  const todayIso = React.useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [priceForm, setPriceForm] = useState<PriceFormState>({
    name: "",
    price: "",
    date: todayIso,
  });

  const totalPrices = useMemo(() => priceList.length, [priceList]);

  const availableSubCategories = useMemo(() => {
    return categoryOptions.find((option) => option.value === productCategory)?.subCategories || [];
  }, [categoryOptions, productCategory]);

  const productCodeOptions = useMemo(() => globalItemOptions.map((item) => item.code), [globalItemOptions]);
  const normalizedGlobalItemCodes = useMemo(
    () => new Set(globalItemOptions.map((item) => item.code.toLowerCase())),
    [globalItemOptions]
  );

  React.useEffect(() => {
    const normalized = productCode.trim().toLowerCase();
    if (!normalized) {
      setProductCodeExists(false);
      setProductCodeError(null);
      return;
    }

    setProductCodeExists(normalizedGlobalItemCodes.has(normalized));
    setProductCodeError((prev) => (prev && !PRODUCT_CODE_ALLOWED_REGEX.test(productCode) ? prev : null));
  }, [productCode, normalizedGlobalItemCodes]);

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

  React.useEffect(() => {
    const controller = new AbortController();

    const fetchCategories = async () => {
      setCategoryLoading(true);
      setCategoryError(null);

      try {
        const response = await fetch(PRODUCT_LOOKUP_URL, { signal: controller.signal });
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
        const mappedStatuses =
          data.selections?.item_statuses?.map((status) => ({
            value: String(status.item_status_id),
            label: status.item_status_name ?? `Status ${status.item_status_id}`,
          })) ?? [];
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
  }, []);

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

  const resetPriceForm = () => {
    setPriceForm({
      name: "",
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
      name: item.name,
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
    const trimmedName = priceForm.name.trim();
    const numericPrice = Number(priceForm.price);
    const isValid =
      trimmedName.length > 0 && !Number.isNaN(numericPrice) && priceForm.date;

    if (!isValid) {
      return;
    }

    if (editingPriceId) {
      setPriceList((prev) =>
        prev.map((item) =>
          item.id === editingPriceId
            ? { ...item, name: trimmedName, price: numericPrice, date: priceForm.date }
            : item
        )
      );
    } else {
      setPriceList((prev) => [
        ...prev,
        {
          id: `price-${Date.now()}`,
          name: trimmedName,
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

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log("Submitting product form");
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
          <Button variant="contained" color="primary" type="submit" form="product-form">
            Add Product
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
                <TextField label="Product Name" fullWidth size="small" required />
                <TextField
                  select
                  label="Status"
                  fullWidth
                  size="small"
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
                <TextField label="Product Description" fullWidth size="small" multiline minRows={6} />
              </Stack>
              <Stack spacing={2}>
                <TextField
                  select
                  label="Product Category"
                  fullWidth
                  size="small"
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
                <TextField select label="Calibration" size="small" defaultValue="yes" sx={{ width: { xs: "100%", md: "50%" } }}>
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
                    <TextField label="Weight" size="small" fullWidth />
                    <TextField label="Height" size="small" fullWidth />
                  </Stack>
                  <Stack spacing={2} direction={{ xs: "column", md: "row" }}>
                    <TextField label="Width" size="small" fullWidth />
                    <TextField label="Length" size="small" fullWidth />
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
                <TableCell>Name</TableCell>
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
                  <TableCell>{item.name}</TableCell>
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
            label="Name"
            value={priceForm.name}
            size="small"
            onChange={(event) => setPriceForm((prev) => ({ ...prev, name: event.target.value }))}
          />
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


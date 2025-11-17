"use client";

import * as React from "react";
import {
    Box,
    Typography,
    TextField,
    Divider,
    Button,
    Tabs,
    Tab,
    Card,
    CardContent,
    IconButton,
    Tooltip,
    InputAdornment,
    Checkbox,
    FormControlLabel,
    RadioGroup,
    Radio,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Paper,
    Chip,
    Stack,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from "@mui/material";
import { MdSearch } from "react-icons/md";
import { DeleteOutline, CloudUpload, Visibility, VisibilityOff, ExpandMore, ExpandLess } from "@mui/icons-material";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import type { SelectChangeEvent } from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { useRouter, useSearchParams } from "next/navigation";
import Autocomplete from "@mui/material/Autocomplete";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../../../contexts/AuthContext";
import { useBackend } from "../../../../contexts/BackendContext";
import { useCompany } from "../../../../contexts/CompanyContext";
import { useProfile } from "../../../../contexts/ProfileContext";
import { useProducts } from "../../products/hooks/useProducts";

type Sensor = {
    id: string;
    name: string;
    type: string;
};

type ContactOption = {
    id: string;
    name: string;
    phone?: string;
    email?: string;
};

type CustomerOption = {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    billingAddress?: string;
    shippingAddress?: string;
    companyId?: string;
    contacts?: ContactOption[];
    raw?: any;
};

type ProductOption = {
    id: string;
    name: string;
    productNumber?: string;
    description?: string;
    listPrice?: number;
    oemPrice?: number;
    resellerPrice?: number;
    hostingPrice?: number;
    raw?: any;
};

type PriceType = "listPrice" | "oemPrice" | "resellerPrice" | "hostingPrice";

type ProductRow = {
    id: string;
    product: ProductOption | null;
    productCode: string;
    productDescription: string;
    productNotes: string;
    priceType: PriceType;
    productPrice: string;
    productQuantity: string;
    productTotal: string;
};

function useCustomerDirectory() {
    const { token, isLoggedIn } = useAuth();
    const { apiURL } = useBackend();

    return useQuery({
        queryKey: ["customers", "for-order"],
        queryFn: async () => {
            const url = apiURL("accounts", "accounts.json");
            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                if (res.status === 401) throw new Error("Unauthorized – please log in again");
                throw new Error(`Request failed: ${res.status}`);
            }
            return res.json();
        },
        enabled: isLoggedIn && !!token,
        staleTime: 5 * 60 * 1000,
    });
}

function useProductDirectory(effectiveCompanyId: string | null) {
    return useProducts(effectiveCompanyId, "products");
}

function useCustomerDetail(customerId: string | null) {
    const { token, isLoggedIn } = useAuth();

    return useQuery({
        queryKey: ["customer-detail", customerId],
        queryFn: async () => {
            if (!customerId) return null;
            const res = await fetch(`http://34.58.37.44/api/get-account/${customerId}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            });
            if (!res.ok) {
                if (res.status === 401) throw new Error("Unauthorized – please log in again");
                throw new Error(`Failed to fetch customer detail: ${res.status}`);
            }
            return res.json();
        },
        enabled: isLoggedIn && !!token && !!customerId,
        staleTime: 0,
        refetchOnWindowFocus: false,
    });
}

function useProductDetail(productId: string | null) {
    const { token, isLoggedIn } = useAuth();

    return useQuery({
        queryKey: ["product-detail", productId],
        queryFn: async () => {
            if (!productId) return null;
            const res = await fetch(`http://34.58.37.44/api/get-product/${productId}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            });
            if (!res.ok) {
                if (res.status === 401) throw new Error("Unauthorized – please log in again");
                if (res.status === 404) return null; // Product not found, return null instead of throwing
                throw new Error(`Failed to fetch product detail: ${res.status}`);
            }
            return res.json();
        },
        enabled: isLoggedIn && !!token && !!productId,
        staleTime: 0,
        refetchOnWindowFocus: false,
    });
}

function formatAddress(address: any): string {
    if (!address) return "";
    if (typeof address === "string") return address;
    if (typeof address !== "object") return "";
    const candidates = [
        address.street ?? address.address ?? address.line1,
        address.city,
        address.state ?? address.region,
        address.postalcode ?? address.zip ?? address.postal_code,
        address.country,
    ];
    return candidates.filter((part) => typeof part === "string" && part.trim().length > 0).join(", ");
}

function parseAddress(address: any): {
    street: string;
    poBox: string;
    city: string;
    state: string;
    code: string;
    country: string;
} {
    if (!address) {
        return { street: "", poBox: "", city: "", state: "", code: "", country: "" };
    }
    if (typeof address === "string") {
        // If it's a formatted string, try to parse it or return as street
        return { street: address, poBox: "", city: "", state: "", code: "", country: "" };
    }
    if (typeof address !== "object") {
        return { street: "", poBox: "", city: "", state: "", code: "", country: "" };
    }
    return {
        street: address.street ?? address.address ?? address.line1 ?? "",
        poBox: address.poBox ?? address.po_box ?? address.poBoxNumber ?? "",
        city: address.city ?? "",
        state: address.state ?? address.region ?? "",
        code: address.postalcode ?? address.zip ?? address.postal_code ?? address.code ?? "",
        country: address.country ?? "",
    };
}

function mapContacts(rawContacts: any[]): ContactOption[] {
    if (!Array.isArray(rawContacts)) return [];
    return (
        rawContacts
        .map((contact, idx) => {
            if (!contact) return null;
            const id =
                contact?.id ??
                contact?.contact_id ??
                contact?.contactId ??
                contact?.contactID ??
                contact?.email ??
                `contact-${idx}`;
            const name = contact?.name ?? contact?.contact_name ?? contact?.full_name ?? contact?.username ?? "";
            if (!id || !name) return null;
            const mapped: ContactOption = {
                id: String(id),
                name: String(name),
                phone:
                    contact?.phone ??
                    contact?.contact_phone ??
                    contact?.mobile ??
                    contact?.primary_phone ??
                    contact?.work_phone,
                email:
                    contact?.email ??
                    contact?.contact_email ??
                    contact?.primary_email ??
                    contact?.work_email,
            };
            return mapped;
        })
        .filter((contact): contact is ContactOption => contact !== null)
    );
}

const mockShipments = [
    {
        id: "shipment-001",
        shippedOn: "20.01.2025",
        account: "Account 1",
        trackingId: "0093248771990000",
        sensors: Array.from({ length: 7 }).map((_, idx) => `Sensor_00023${idx}`),
    },
    {
        id: "shipment-002",
        shippedOn: "20.01.2025",
        account: "Account 1",
        trackingId: "0093248771990001",
        sensors: Array.from({ length: 6 }).map((_, idx) => `Sensor_00025${idx}`),
    },
];

const initialSensors: Sensor[] = Array.from({ length: 20 }).map((_, index) => ({
    id: `002305${index.toString().padStart(2, "0")}`,
    name: `Sensor_0023${index.toString().padStart(2, "0")}`,
    type: "Single Probe",
}));
const initialAssignedSensors = initialSensors.slice(0, 8);
const initialAvailableSensors = initialSensors.slice(8);

export default function CreateOrderPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const orderIdFromUrl =
        searchParams.get("orderId") ?? searchParams.get("orderID") ?? searchParams.get("orderid");
    const showAdvancedSections = Boolean(orderIdFromUrl);
    const { selectedCompanyId, userCompanyId } = useCompany();
    const { isAdmin } = useProfile();
    const effectiveCompanyId = React.useMemo(() => (isAdmin ? selectedCompanyId : userCompanyId), [
        isAdmin,
        selectedCompanyId,
        userCompanyId,
    ]);
    const { data: customersData, isLoading: customersLoading } = useCustomerDirectory();
    const { data: productsData, isLoading: productsLoading, error: productsError } = useProductDirectory(effectiveCompanyId);
    const [orderSubject, setOrderSubject] = React.useState("");
    const [orderSubjectError, setOrderSubjectError] = React.useState("");
    const [customerNameError, setCustomerNameError] = React.useState("");
    const [selectedCustomer, setSelectedCustomer] = React.useState<CustomerOption | null>(null);
    const [productRows, setProductRows] = React.useState<ProductRow[]>([
        {
            id: "1",
            product: null,
            productCode: "",
            productDescription: "",
            productNotes: "",
            priceType: "listPrice",
            productPrice: "",
            productQuantity: "",
            productTotal: "",
        },
    ]);
    const [globalPriceType, setGlobalPriceType] = React.useState<PriceType>("listPrice");
    const [expandedNotes, setExpandedNotes] = React.useState<Record<string, boolean>>({});
    const [discountType, setDiscountType] = React.useState<"zero" | "percentage" | "direct">("zero");
    const [discount, setDiscount] = React.useState("");
    const [discountDialogOpen, setDiscountDialogOpen] = React.useState(false);
    const selectedCustomerId = selectedCustomer?.id ?? null;
    const {
        data: customerDetail,
        isFetching: customerDetailLoading,
        error: customerDetailError,
    } = useCustomerDetail(selectedCustomerId);
    const [shipmentTab, setShipmentTab] = React.useState(0);
    const [availableSensors, setAvailableSensors] = React.useState<Sensor[]>(initialAvailableSensors);
    const [assignedSensors, setAssignedSensors] = React.useState<Sensor[]>(initialAssignedSensors);
    const [selectedAvailable, setSelectedAvailable] = React.useState<Set<string>>(new Set());
    const [selectedAssigned, setSelectedAssigned] = React.useState<Set<string>>(new Set());
    const [sensorSearch, setSensorSearch] = React.useState("");
    const [shippingMethod, setShippingMethod] = React.useState("FedEx Ground");
    const [orderStatus, setOrderStatus] = React.useState("Processing");
    const [orderPriority, setOrderPriority] = React.useState("");
    const [specialConditions, setSpecialConditions] = React.useState("");
    const [orderCategory, setOrderCategory] = React.useState("");
    const [shipmentStatus, setShipmentStatus] = React.useState("Approved");
    const [shipmentAccount, setShipmentAccount] = React.useState("Account 1");
    const [showWifiPassword, setShowWifiPassword] = React.useState(false);
    const [customerPhone, setCustomerPhone] = React.useState("");
    const [customerEmail, setCustomerEmail] = React.useState("");
    // Billing address fields
    const [billingAddress, setBillingAddress] = React.useState("");
    const [billingPOBox, setBillingPOBox] = React.useState("");
    const [billingCity, setBillingCity] = React.useState("");
    const [billingState, setBillingState] = React.useState("");
    const [billingCode, setBillingCode] = React.useState("");
    const [billingCountry, setBillingCountry] = React.useState("");
    // Shipping address fields
    const [shippingAddress, setShippingAddress] = React.useState("");
    const [shippingPOBox, setShippingPOBox] = React.useState("");
    const [shippingCity, setShippingCity] = React.useState("");
    const [shippingState, setShippingState] = React.useState("");
    const [shippingCode, setShippingCode] = React.useState("");
    const [shippingCountry, setShippingCountry] = React.useState("");
    const [customerContacts, setCustomerContacts] = React.useState<ContactOption[]>([]);
    const [selectedContact, setSelectedContact] = React.useState<ContactOption | null>(null);
    const [shippingComments, setShippingComments] = React.useState("");
    const [processingComments, setProcessingComments] = React.useState("");

    const shippingMethodOptions = ["FedEx Ground", "FedEx 2Day", "UPS Ground", "DHL Express"];
    const orderStatusOptions = ["Draft", "Processing", "Fulfilled", "Shipped", "Closed"];
    const orderPriorityOptions = ["Low", "Normal", "High", "Urgent"];
    const orderCategoryOptions = ["Standard", "Rush", "Replacement", "Maintenance"];
    const shipmentStatusOptions = ["Pending", "Approved", "In Transit", "Delivered", "Closed"];
    const shippingAccountOptions = ["Account 1", "Account 2", "Account 3"];

    const customerOptions = React.useMemo(() => {
        if (!customersData?.data) return [];
        return customersData.data
            .flatMap((company: any) => {
                const companyId = company?.company_id != null ? String(company.company_id) : undefined;
                const companyCustomers = Array.isArray(company?.data) ? company.data : [];
                return companyCustomers.map((acc: any, idx: number) => {
                    const phone =
                        acc?.phone ??
                        acc?.account_phone ??
                        acc?.primary_phone ??
                        acc?.contact_phone ??
                        "";
                    const email =
                        acc?.email ??
                        acc?.account_email ??
                        acc?.primary_email ??
                        acc?.contact_email ??
                        "";
                    const billingAddress =
                        formatAddress(acc?.billing_address) ??
                        formatAddress(acc?.accountAddress?.billingAddress) ??
                        formatAddress(acc?.billingAddress);
                    const contacts = mapContacts(acc?.contacts ?? []);

                    return {
                        id: String(acc?.id ?? acc?.account_id ?? acc?.accountId ?? `${companyId ?? "company"}-${idx}`),
                        name: String(acc?.name ?? acc?.account_name ?? "Unnamed Customer"),
                        phone,
                        email,
                        billingAddress,
                        shippingAddress:
                            formatAddress(acc?.shipping_address) ??
                            formatAddress(acc?.accountAddress?.shippingAddress) ??
                            formatAddress(acc?.shippingAddress),
                        companyId,
                        contacts: contacts.length ? contacts : undefined,
                        raw: acc,
                    } as CustomerOption;
                });
            })
            .filter((option: CustomerOption) => option.name.trim().length > 0);
    }, [customersData]);

    const filteredCustomerOptions = React.useMemo(() => {
        if (!selectedCompanyId || selectedCompanyId === "all") return customerOptions;
        return customerOptions.filter((option) => option.companyId === String(selectedCompanyId));
    }, [customerOptions, selectedCompanyId]);

    const productOptions = React.useMemo(() => {
        if (!productsData) return [];
        const options: ProductOption[] = [];
        const seenIds = new Set<string>();

        const pushProduct = (p: any) => {
            if (!p) return;
            const id = String(p.product_id ?? p.id ?? "");
            const name = p.internal_name ?? p.product_name ?? p.name ?? "";
            const productNumber = p.product_number ?? p.productNumber ?? "";
            const description = p.description ?? "";
            const listPrice = typeof p.list_price === "number" ? p.list_price : typeof p.listPrice === "number" ? p.listPrice : undefined;
            const oemPrice = typeof p.oem_price === "number" ? p.oem_price : typeof p.oemPrice === "number" ? p.oemPrice : undefined;
            const resellerPrice = typeof p.reseller_price === "number" ? p.reseller_price : typeof p.resellerPrice === "number" ? p.resellerPrice : undefined;
            const hostingPrice = typeof p.hosting_price === "number" ? p.hosting_price : typeof p.hostingPrice === "number" ? p.hostingPrice : undefined;

            // Skip if no id or name, or if we've already seen this id
            if (!id || !name || seenIds.has(id)) return;

            seenIds.add(id);
            options.push({
                id,
                name,
                productNumber,
                description,
                listPrice,
                oemPrice,
                resellerPrice,
                hostingPrice,
                raw: p,
            });
        };

        // Shape A: { products: [...] }
        if (productsData.products && Array.isArray(productsData.products)) {
            productsData.products.forEach(pushProduct);
        }
        // Shape B: { data: [{ company_id, company_name, products: [...] }, ...] }
        else if (productsData.data && Array.isArray(productsData.data)) {
            productsData.data.forEach((group: any) => {
                if (group && Array.isArray(group.products)) {
                    group.products.forEach(pushProduct);
                }
            });
        }
        // Shape C: direct array
        else if (Array.isArray(productsData)) {
            productsData.forEach(pushProduct);
        }

        return options;
    }, [productsData]);

    // Helper function to get price from product
    const getProductPrice = React.useCallback((product: ProductOption, type: PriceType): number | undefined => {
        let price: number | undefined = undefined;
        
        // Try from productOption first
        price = product[type];
        
        // If not found, try from raw data
        if ((price === undefined || price === null) && product.raw) {
            const raw = product.raw;
            switch (type) {
                case "listPrice":
                    price = raw.list_price ?? raw.listPrice ?? raw.listPrice_value ?? raw.price ?? undefined;
                    break;
                case "oemPrice":
                    price = raw.oem_price ?? raw.oemPrice ?? raw.oemPrice_value ?? undefined;
                    break;
                case "resellerPrice":
                    price = raw.reseller_price ?? raw.resellerPrice ?? raw.resellerPrice_value ?? undefined;
                    break;
                case "hostingPrice":
                    price = raw.hosting_price ?? raw.hostingPrice ?? raw.hostingPrice_value ?? undefined;
                    break;
            }
        }
        
        // Convert string prices to numbers if needed
        if (typeof price === "string") {
            const parsed = parseFloat(price);
            price = isNaN(parsed) ? undefined : parsed;
        }
        
        return price !== undefined && price !== null && typeof price === "number" && !isNaN(price) ? price : undefined;
    }, []);

    // Helper function to calculate total
    const calculateRowTotal = React.useCallback((price: string, quantity: string): string => {
        const priceNum = parseFloat(price) || 0;
        const quantityNum = parseFloat(quantity) || 0;
        const total = priceNum * quantityNum;
        return total > 0 ? total.toFixed(2) : "";
    }, []);

    // Update a specific product row
    const updateProductRow = React.useCallback((rowId: string, updates: Partial<ProductRow>) => {
        setProductRows((prevRows) =>
            prevRows.map((row) => {
                if (row.id === rowId) {
                    const updated = { ...row, ...updates };
                    // Auto-calculate total if price or quantity changes
                    if (updates.productPrice !== undefined || updates.productQuantity !== undefined) {
                        updated.productTotal = calculateRowTotal(updated.productPrice, updated.productQuantity);
                    }
                    return updated;
                }
                return row;
            })
        );
    }, [calculateRowTotal]);

    // Add a new product row
    const handleAddProductRow = React.useCallback(() => {
        const newId = String(Date.now());
        setProductRows((prevRows) => [
            ...prevRows,
            {
                id: newId,
                product: null,
                productCode: "",
                productDescription: "",
                productNotes: "",
                priceType: globalPriceType,
                productPrice: "",
                productQuantity: "",
                productTotal: "",
            },
        ]);
    }, [globalPriceType]);

    // Remove a product row
    const handleRemoveProductRow = React.useCallback((rowId: string) => {
        setProductRows((prevRows) => prevRows.filter((row) => row.id !== rowId));
    }, []);

    // Handle product selection for a specific row
    const handleProductSelect = React.useCallback(
        (rowId: string, _event: React.SyntheticEvent, newValue: ProductOption | null) => {
            if (newValue) {
                // Get price based on current price type for the row
                const row = productRows.find((r) => r.id === rowId);
                const priceType = row?.priceType ?? globalPriceType;
                const price = getProductPrice(newValue, priceType);
                
                updateProductRow(rowId, {
                    product: newValue,
                    productCode: newValue.productNumber ?? "",
                    productDescription: newValue.description ?? "",
                    productPrice: price !== undefined ? price.toFixed(2) : "",
                });
            } else {
                updateProductRow(rowId, {
                    product: null,
                    productCode: "",
                    productDescription: "",
                    productPrice: "",
                    productQuantity: "",
                    productTotal: "",
                });
            }
        },
        [productRows, globalPriceType, getProductPrice, updateProductRow]
    );

    // Handle price type change for a specific row
    const handlePriceTypeChange = React.useCallback(
        (rowId: string, event: SelectChangeEvent<PriceType>) => {
            const newPriceType = event.target.value as PriceType;
            const row = productRows.find((r) => r.id === rowId);
            if (row?.product) {
                const price = getProductPrice(row.product, newPriceType);
                updateProductRow(rowId, {
                    priceType: newPriceType,
                    productPrice: price !== undefined ? price.toFixed(2) : "",
                });
            } else {
                updateProductRow(rowId, { priceType: newPriceType });
            }
        },
        [productRows, getProductPrice, updateProductRow]
    );

    // Handle global price type change
    const handleGlobalPriceTypeChange = React.useCallback((event: SelectChangeEvent<PriceType>) => {
        const newPriceType = event.target.value as PriceType;
        setGlobalPriceType(newPriceType);
        
        // Update all rows that have a product selected
        setProductRows((prevRows) =>
            prevRows.map((row) => {
                if (row.product) {
                    const price = getProductPrice(row.product, newPriceType);
                    return {
                        ...row,
                        priceType: newPriceType,
                        productPrice: price !== undefined ? price.toFixed(2) : "",
                        productTotal: calculateRowTotal(
                            price !== undefined ? price.toFixed(2) : "",
                            row.productQuantity
                        ),
                    };
                }
                return { ...row, priceType: newPriceType };
            })
        );
    }, [getProductPrice, calculateRowTotal]);

    // Handle quantity change for a specific row
    const handleQuantityChange = React.useCallback(
        (rowId: string, event: React.ChangeEvent<HTMLInputElement>) => {
            const newQuantity = event.target.value;
            const row = productRows.find((r) => r.id === rowId);
            updateProductRow(rowId, {
                productQuantity: newQuantity,
                productTotal: calculateRowTotal(row?.productPrice ?? "", newQuantity),
            });
        },
        [productRows, updateProductRow, calculateRowTotal]
    );

    // Handle price change for a specific row
    const handlePriceChange = React.useCallback(
        (rowId: string, event: React.ChangeEvent<HTMLInputElement>) => {
            const newPrice = event.target.value;
            const row = productRows.find((r) => r.id === rowId);
            updateProductRow(rowId, {
                productPrice: newPrice,
                productTotal: calculateRowTotal(newPrice, row?.productQuantity ?? ""),
            });
        },
        [productRows, updateProductRow, calculateRowTotal]
    );

    // Handle notes change for a specific row
    const handleNotesChange = React.useCallback(
        (rowId: string, event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            updateProductRow(rowId, { productNotes: event.target.value });
        },
        [updateProductRow]
    );

    // Toggle notes field visibility for a specific row
    const toggleNotes = React.useCallback((rowId: string) => {
        setExpandedNotes((prev) => ({
            ...prev,
            [rowId]: !prev[rowId],
        }));
    }, []);

    // Calculate net total (sum of all product row totals)
    const netTotal = React.useMemo(() => {
        return productRows.reduce((sum, row) => {
            const total = parseFloat(row.productTotal) || 0;
            return sum + total;
        }, 0);
    }, [productRows]);

    // Calculate discount amount based on discount type
    const discountAmount = React.useMemo(() => {
        if (discountType === "zero" || !discount) return 0;
        const discountValue = parseFloat(discount) || 0;
        if (discountValue <= 0) return 0;
        
        if (discountType === "percentage") {
            // Percentage of price
            return (netTotal * discountValue) / 100;
        } else if (discountType === "direct") {
            // Direct price reduction (absolute amount)
            return discountValue;
        }
        return 0;
    }, [discountType, discount, netTotal]);

    // Calculate grand total
    const grandTotal = React.useMemo(() => {
        return netTotal - discountAmount;
    }, [netTotal, discountAmount]);

    const handleCustomerSelect = React.useCallback(
        (_event: React.SyntheticEvent, newValue: CustomerOption | null) => {
            setSelectedCustomer(newValue);
            const initialContacts = newValue?.contacts ?? [];
            setCustomerContacts(initialContacts);
            if (newValue) {
                setCustomerPhone(newValue.phone ?? "");
                setCustomerEmail(newValue.email ?? "");
                
                // Parse billing address
                const billingAddr = newValue.billingAddress 
                    ? (typeof newValue.billingAddress === "string" 
                        ? { street: newValue.billingAddress, poBox: "", city: "", state: "", code: "", country: "" }
                        : parseAddress(newValue.billingAddress))
                    : parseAddress(newValue.raw?.billing_address);
                setBillingAddress(billingAddr.street);
                setBillingPOBox(billingAddr.poBox);
                setBillingCity(billingAddr.city);
                setBillingState(billingAddr.state);
                setBillingCode(billingAddr.code);
                setBillingCountry(billingAddr.country);
                
                // Parse shipping address
                const shippingAddr = newValue.shippingAddress 
                    ? (typeof newValue.shippingAddress === "string" 
                        ? { street: newValue.shippingAddress, poBox: "", city: "", state: "", code: "", country: "" }
                        : parseAddress(newValue.shippingAddress))
                    : parseAddress(newValue.raw?.shipping_address);
                setShippingAddress(shippingAddr.street);
                setShippingPOBox(shippingAddr.poBox);
                setShippingCity(shippingAddr.city);
                setShippingState(shippingAddr.state);
                setShippingCode(shippingAddr.code);
                setShippingCountry(shippingAddr.country);
                
                const firstContact = initialContacts[0];
                setSelectedContact(firstContact ?? null);
            } else {
                setCustomerPhone("");
                setCustomerEmail("");
                setBillingAddress("");
                setBillingPOBox("");
                setBillingCity("");
                setBillingState("");
                setBillingCode("");
                setBillingCountry("");
                setShippingAddress("");
                setShippingPOBox("");
                setShippingCity("");
                setShippingState("");
                setShippingCode("");
                setShippingCountry("");
                setSelectedContact(null);
                setCustomerContacts([]);
            }
        },
        []
    );

    React.useEffect(() => {
        if (!selectedCustomer) return;
        const stillExists = filteredCustomerOptions.some((option) => option.id === selectedCustomer.id);
        if (!stillExists) {
            setSelectedCustomer(null);
            setCustomerPhone("");
            setCustomerEmail("");
            setBillingAddress("");
            setBillingPOBox("");
            setBillingCity("");
            setBillingState("");
            setBillingCode("");
            setBillingCountry("");
            setShippingAddress("");
            setShippingPOBox("");
            setShippingCity("");
            setShippingState("");
            setShippingCode("");
            setShippingCountry("");
            setSelectedContact(null);
            setCustomerContacts([]);
        }
    }, [filteredCustomerOptions, selectedCustomer]);

    React.useEffect(() => {
        if (!customerDetail) return;
        const phone =
            customerDetail.account_phone ??
            customerDetail.phone ??
            customerDetail.contact_phone ??
            customerDetail.primary_phone ??
            customerDetail.mobile ??
            "";
        const email =
            customerDetail.account_email ??
            customerDetail.email ??
            customerDetail.contact_email ??
            customerDetail.primary_email ??
            customerDetail.work_email ??
            "";
        const billingAddressData =
            customerDetail.billing_address ??
            customerDetail.accountAddress?.billingAddress ??
            customerDetail.billingAddress ??
            null;
        const shippingAddressData =
            customerDetail.shipping_address ??
            customerDetail.accountAddress?.shippingAddress ??
            customerDetail.shippingAddress ??
            null;

        setCustomerPhone(phone ?? "");
        setCustomerEmail(email ?? "");
        
        // Parse billing address fields
        const billingAddr = parseAddress(billingAddressData);
        setBillingAddress(billingAddr.street);
        setBillingPOBox(billingAddr.poBox);
        setBillingCity(billingAddr.city);
        setBillingState(billingAddr.state);
        setBillingCode(billingAddr.code);
        setBillingCountry(billingAddr.country);
        
        // Parse shipping address fields
        const shippingAddr = parseAddress(shippingAddressData);
        setShippingAddress(shippingAddr.street);
        setShippingPOBox(shippingAddr.poBox);
        setShippingCity(shippingAddr.city);
        setShippingState(shippingAddr.state);
        setShippingCode(shippingAddr.code);
        setShippingCountry(shippingAddr.country);

        const detailContacts = mapContacts(customerDetail.contacts ?? []);
        setCustomerContacts(detailContacts);
        setSelectedContact((prev) => {
            if (detailContacts.length === 0) return null;
            if (!prev) return detailContacts[0];
            const existing = detailContacts.find((contact) => contact.id === prev.id);
            return existing ?? detailContacts[0];
        });
    }, [customerDetail]);

    const handleCancel = React.useCallback(() => {
        router.push("/dashboard/orders");
    }, [router]);

    const handleSave = React.useCallback(() => {
        // Validate required fields
        let hasErrors = false;
        setOrderSubjectError("");
        setCustomerNameError("");

        if (!orderSubject.trim()) {
            setOrderSubjectError("Order Subject is required");
            hasErrors = true;
        }

        if (!selectedCustomer) {
            setCustomerNameError("Customer Name is required");
            hasErrors = true;
        }

        if (hasErrors) {
            return;
        }

        const payload = {
            orderSubject,
            shippingMethod,
            orderStatus,
            orderPriority,
            specialConditions,
            orderCategory,
            shipmentStatus,
            shipmentAccount,
            assignedSensors,
            netTotal,
            discount: {
                type: discountType,
                value: discount,
                amount: discountAmount,
            },
            grandTotal,
            customer: {
                id: selectedCustomer?.id ?? null,
                name: selectedCustomer?.name ?? "",
                phone: customerPhone,
                email: customerEmail,
                billingAddress: {
                    street: billingAddress,
                    poBox: billingPOBox,
                    city: billingCity,
                    state: billingState,
                    code: billingCode,
                    country: billingCountry,
                },
                shippingAddress: {
                    street: shippingAddress,
                    poBox: shippingPOBox,
                    city: shippingCity,
                    state: shippingState,
                    code: shippingCode,
                    country: shippingCountry,
                },
                contact: selectedContact
                    ? {
                          id: selectedContact.id,
                          name: selectedContact.name,
                          phone: selectedContact.phone ?? "",
                          email: selectedContact.email ?? "",
                      }
                    : null,
            },
            notes: {
                shippingComments,
                processingComments,
            },
            productDetails: productRows.map((row) => ({
                id: row.id,
                productId: row.product?.id ?? null,
                productName: row.product?.name ?? "",
                productCode: row.productCode,
                productDescription: row.productDescription,
                productNotes: row.productNotes,
                priceType: row.priceType,
                price: row.productPrice ? parseFloat(row.productPrice) : 0,
                quantity: row.productQuantity ? parseFloat(row.productQuantity) : 0,
                total: row.productTotal ? parseFloat(row.productTotal) : 0,
            })),
        };
        console.log("Saving order draft:", payload);
        alert("Order saved successfully.");
        router.push("/dashboard/orders");
    }, [
        assignedSensors,
        billingAddress,
        billingPOBox,
        billingCity,
        billingState,
        billingCode,
        billingCountry,
        shippingAddress,
        shippingPOBox,
        shippingCity,
        shippingState,
        shippingCode,
        shippingCountry,
        customerEmail,
        customerPhone,
        orderStatus,
        orderPriority,
        orderSubject,
        router,
        selectedCustomer,
        selectedContact,
        shipmentAccount,
        shippingComments,
        processingComments,
        shipmentStatus,
        shippingMethod,
        specialConditions,
        orderCategory,
        discount,
        discountType,
        discountAmount,
        netTotal,
        grandTotal,
        productRows,
    ]);

    const toggleSelect = React.useCallback(
        (id: string, type: "available" | "assigned") => {
            const setter = type === "available" ? setSelectedAvailable : setSelectedAssigned;
            setter((prev) => {
                const next = new Set(prev);
                if (next.has(id)) next.delete(id);
                else next.add(id);
                return next;
            });
        },
        []
    );

    const handleAssign = React.useCallback(() => {
        if (selectedAvailable.size === 0) return;
        setAssignedSensors((prev) => [
            ...prev,
            ...availableSensors.filter((sensor) => selectedAvailable.has(sensor.id) && !prev.find((item) => item.id === sensor.id)),
        ]);
        setAvailableSensors((prev) => prev.filter((sensor) => !selectedAvailable.has(sensor.id)));
        setSelectedAvailable(new Set());
    }, [availableSensors, selectedAvailable]);

    const handleUnassign = React.useCallback(() => {
        if (selectedAssigned.size === 0) return;
        setAvailableSensors((prev) => [
            ...prev,
            ...assignedSensors.filter((sensor) => selectedAssigned.has(sensor.id) && !prev.find((item) => item.id === sensor.id)),
        ]);
        setAssignedSensors((prev) => prev.filter((sensor) => !selectedAssigned.has(sensor.id)));
        setSelectedAssigned(new Set());
    }, [assignedSensors, selectedAssigned]);

    const filteredAvailableSensors = React.useMemo(() => {
        if (!sensorSearch.trim()) return availableSensors;
        const query = sensorSearch.trim().toLowerCase();
        return availableSensors.filter(
            (sensor) =>
                sensor.name.toLowerCase().includes(query) ||
                sensor.id.toLowerCase().includes(query) ||
                sensor.type.toLowerCase().includes(query)
        );
    }, [availableSensors, sensorSearch]);

    const filteredAssignedSensors = React.useMemo(() => {
        if (!sensorSearch.trim()) return assignedSensors;
        const query = sensorSearch.trim().toLowerCase();
        return assignedSensors.filter(
            (sensor) =>
                sensor.name.toLowerCase().includes(query) ||
                sensor.id.toLowerCase().includes(query) ||
                sensor.type.toLowerCase().includes(query)
        );
    }, [assignedSensors, sensorSearch]);

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                bgcolor: "#F3F5F9",
                p: 2,
                minHeight: "100%",
            }}
        >
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    bgcolor: "#FFFFFF",
                    borderRadius: 1,
                    px: 2,
                    py: 1.5,
                    boxShadow: "0 1px 2px rgba(15, 23, 42, 0.08)",
                }}
            >
                <Typography variant="h5" fontWeight={600}>
                    Create Order
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                    <Button variant="outlined" onClick={handleCancel}>Cancel</Button>
                    <Button variant="contained" onClick={handleSave}>Save Order</Button>
                </Box>
            </Box>

            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", lg: "1.2fr 0.7fr" },
                    gap: 2,
                }}
            >
                <Paper
                    elevation={0}
                    sx={{
                        bgcolor: "#FFFFFF",
                        borderRadius: 1,
                        p: 3,
                        display: "flex",
                        flexDirection: "column",
                        gap: 3,
                        border: "1px solid",
                        borderColor: "divider",
                    }}
                >
                    <Box>
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "baseline",
                                mb: 2,
                            }}
                        >
                            <Typography variant="h6" fontWeight={600}>
                                Order Details
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                               
                            </Typography>
                        </Box>
                        <Divider />
                        <Box
                            sx={{
                                display: "grid",
                                gap: 2,
                                mt: 0.5,
                                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                            }}
                        >
                                <Box 
                                    sx={{ 
                                        display: "flex", 
                                        flexDirection: "column", 
                                        gap: 1.125, // 75% of 1.5
                                        "& .MuiInputBase-root": {
                                            fontSize: "0.75rem", // 75% of default
                                            height: "30px", // 75% of small size (40px)
                                        },
                                        "& .MuiInputBase-input": {
                                            fontSize: "0.75rem",
                                            padding: "6px 12px", // 75% of default padding
                                        },
                                        "& .MuiInputLabel-root": {
                                            fontSize: "0.75rem",
                                        },
                                        "& .MuiSelect-select": {
                                            padding: "6px 12px",
                                            fontSize: "0.75rem",
                                        },
                                        "& .MuiFormControl-root": {
                                            fontSize: "0.75rem",
                                        },
                                        "& .MuiTypography-root": {
                                            fontSize: "0.875rem", // 75% of subtitle2
                                        },
                                        "& .MuiAutocomplete-root": {
                                            fontSize: "0.75rem",
                                        },
                                    }}
                                >
                                    <Typography variant="subtitle2" sx={{ fontSize: "0.875rem" }}>Customer Details</Typography>
                                    <Stack spacing={1.125}>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            label="Order Subject"
                                            required
                                            value={orderSubject}
                                            onChange={(event) => {
                                                setOrderSubject(event.target.value);
                                                if (orderSubjectError) setOrderSubjectError("");
                                            }}
                                            error={!!orderSubjectError}
                                            helperText={orderSubjectError}
                                        />
                                        <Autocomplete
                                            size="small"
                                            options={filteredCustomerOptions}
                                            value={selectedCustomer}
                                            onChange={(event, newValue) => {
                                                handleCustomerSelect(event, newValue);
                                                if (customerNameError) setCustomerNameError("");
                                            }}
                                            loading={customersLoading}
                                            disableClearable={false}
                                            isOptionEqualToValue={(option, value) => option.id === value.id}
                                            getOptionLabel={(option) => option?.name ?? ""}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label="Customer Name"
                                                    required
                                                    size="small"
                                                    error={!!customerNameError}
                                                    helperText={customerNameError}
                                                    InputProps={{
                                                        ...params.InputProps,
                                                        endAdornment: (
                                                            <>
                                                                {customersLoading ? <CircularProgress color="inherit" size={16} /> : null}
                                                                {params.InputProps.endAdornment}
                                                            </>
                                                        ),
                                                    }}
                                                />
                                            )}
                                        />
                                        {customerDetailLoading && selectedCustomer ? (
                                            <Typography variant="caption" color="text.secondary">
                                                Loading latest customer details…
                                            </Typography>
                                        ) : null}
                                        {customerDetailError ? (
                                            <Typography variant="caption" color="error">
                                                Unable to refresh customer details. Using existing data.
                                            </Typography>
                                        ) : null}
                                        <TextField
                                            fullWidth
                                            size="small"
                                            label="Customer Phone"
                                            value={customerPhone}
                                            onChange={(event) => setCustomerPhone(event.target.value)}
                                            InputProps={{
                                                endAdornment: customerDetailLoading ? (
                                                    <InputAdornment position="end">
                                                        <CircularProgress size={16} />
                                                    </InputAdornment>
                                                ) : undefined,
                                            }}
                                        />
                                        <TextField
                                            fullWidth
                                            size="small"
                                            label="Customer Email"
                                            value={customerEmail}
                                            onChange={(event) => setCustomerEmail(event.target.value)}
                                            InputProps={{
                                                endAdornment: customerDetailLoading ? (
                                                    <InputAdornment position="end">
                                                        <CircularProgress size={16} />
                                                    </InputAdornment>
                                                ) : undefined,
                                            }}
                                        />
                                        {/* Billing Address Fields */}
                                        <Box sx={{ gridColumn: { xs: "span 1", sm: "span 2" } }}>
                                            <Typography variant="subtitle2" sx={{ mb: 0.75, fontSize: "0.875rem" }}>Billing Information</Typography>
                                            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.125 }}>
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    label="Billing Address"
                                                    value={billingAddress}
                                                    onChange={(event) => setBillingAddress(event.target.value)}
                                                    sx={{ gridColumn: { xs: "span 1", sm: "span 2" } }}
                                                    InputProps={{
                                                        endAdornment: customerDetailLoading ? (
                                                            <InputAdornment position="end">
                                                                <CircularProgress size={16} />
                                                            </InputAdornment>
                                                        ) : undefined,
                                                    }}
                                                />
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    label="Billing PO Box"
                                                    value={billingPOBox}
                                                    onChange={(event) => setBillingPOBox(event.target.value)}
                                                    sx={{ gridColumn: { xs: "span 1", sm: "span 2" } }}
                                                />
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    label="Billing City"
                                                    value={billingCity}
                                                    onChange={(event) => setBillingCity(event.target.value)}
                                                    sx={{ gridColumn: { xs: "span 1", sm: "span 2" } }}
                                                />
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    label="Billing State"
                                                    value={billingState}
                                                    onChange={(event) => setBillingState(event.target.value)}
                                                />
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    label="Code"
                                                    value={billingCode}
                                                    onChange={(event) => setBillingCode(event.target.value)}
                                                />
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    label="Billing Country"
                                                    value={billingCountry}
                                                    onChange={(event) => setBillingCountry(event.target.value)}
                                                    sx={{ gridColumn: { xs: "span 1", sm: "span 2" } }}
                                                />
                                            </Box>
                                        </Box>
                                        <Autocomplete
                                            size="small"
                                            options={customerContacts}
                                            value={selectedContact}
                                            onChange={(_, contact) => setSelectedContact(contact)}
                                            getOptionLabel={(option) => option?.name ?? ""}
                                            isOptionEqualToValue={(option, value) => option.id === value.id}
                                            renderInput={(params) => <TextField {...params} label="Contact Name" size="small" />}
                                            disabled={customerContacts.length === 0}
                                        />
                                        <TextField
                                            fullWidth
                                            size="small"
                                            label="Contact Phone"
                                            value={selectedContact?.phone ?? ""}
                                            InputProps={{ readOnly: true }}
                                        />
                                        <TextField
                                            fullWidth
                                            size="small"
                                            label="Contact Email"
                                            value={selectedContact?.email ?? ""}
                                            InputProps={{ readOnly: true }}
                                        />
                                    </Stack>
                            </Box>
                                <Box 
                                    sx={{ 
                                        display: "flex", 
                                        flexDirection: "column", 
                                        gap: 1.125, // 75% of 1.5
                                        "& .MuiInputBase-root": {
                                            fontSize: "0.75rem", // 75% of default
                                            height: "30px", // 75% of small size (40px)
                                        },
                                        "& .MuiInputBase-input": {
                                            fontSize: "0.75rem",
                                            padding: "6px 12px", // 75% of default padding
                                        },
                                        "& .MuiInputLabel-root": {
                                            fontSize: "0.75rem",
                                        },
                                        "& .MuiSelect-select": {
                                            padding: "6px 12px",
                                            fontSize: "0.75rem",
                                        },
                                        "& .MuiFormControl-root": {
                                            fontSize: "0.75rem",
                                        },
                                        "& .MuiTypography-root": {
                                            fontSize: "0.875rem", // 75% of subtitle2
                                        },
                                    }}
                                >
                                    <Typography variant="subtitle2" sx={{ fontSize: "0.875rem" }}>Order Details</Typography>
                                    <Box
                                        sx={{
                                            display: "grid",
                                            gap: 1.125, // 75% of 1.5
                                            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                                        }}
                                    >
                                        <TextField fullWidth size="small" label="Purchase Order" />
                                        <TextField fullWidth size="small" label="Quote Name" />
                                        <TextField
                                            fullWidth
                                            size="small"
                                            label="Shipping Account"
                                            value={shipmentAccount}
                                            onChange={(event) => setShipmentAccount(event.target.value)}
                                        />
                                        <FormControl fullWidth size="small">
                                            <InputLabel id="order-category-label">Order Category</InputLabel>
                                            <Select
                                                labelId="order-category-label"
                                                label="Order Category"
                                            value={orderCategory || ""}
                                                onChange={(event) => setOrderCategory(event.target.value as string)}
                                            >
                                                {orderCategoryOptions.map((option) => (
                                                    <MenuItem key={option} value={option}>
                                                        {option}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                        <TextField fullWidth size="small" label="Due Date" type="date" InputLabelProps={{ shrink: true }} />
                                        <FormControl fullWidth size="small">
                                            <InputLabel id="shipping-method-label">Shipping Method</InputLabel>
                                            <Select
                                                labelId="shipping-method-label"
                                                label="Shipping Method"
                                            value={shippingMethod || ""}
                                                onChange={(event) => setShippingMethod(event.target.value as string)}
                                            >
                                                {shippingMethodOptions.map((option) => (
                                                    <MenuItem key={option} value={option}>
                                                        {option}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                        <FormControl fullWidth size="small">
                                            <InputLabel id="order-status-label">Status</InputLabel>
                                            <Select
                                                labelId="order-status-label"
                                                label="Status"
                                            value={orderStatus || ""}
                                                onChange={(event) => setOrderStatus(event.target.value as string)}
                                            >
                                                {orderStatusOptions.map((option) => (
                                                    <MenuItem key={option} value={option}>
                                                        {option}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                        <FormControl fullWidth size="small">
                                            <InputLabel id="order-priority-label">Priority</InputLabel>
                                            <Select
                                                labelId="order-priority-label"
                                                label="Priority"
                                                value={orderPriority || ""}
                                                onChange={(event) => setOrderPriority(event.target.value as string)}
                                            >
                                                {orderPriorityOptions.map((option) => (
                                                    <MenuItem key={option} value={option}>
                                                        {option}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Box>
                                    {/* Shipping Address Fields */}
                                    <Box sx={{ gridColumn: { xs: "span 1", sm: "span 2" } }}>
                                        <Typography variant="subtitle2" sx={{ mb: 0.75, fontSize: "0.875rem" }}>Shipping Information</Typography>
                                        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.125 }}>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                label="Shipping Address"
                                                value={shippingAddress}
                                                onChange={(event) => setShippingAddress(event.target.value)}
                                                sx={{ gridColumn: { xs: "span 1", sm: "span 2" } }}
                                                InputProps={{
                                                    endAdornment: customerDetailLoading ? (
                                                        <InputAdornment position="end">
                                                            <CircularProgress size={16} />
                                                        </InputAdornment>
                                                    ) : undefined,
                                                }}
                                            />
                                            <TextField
                                                fullWidth
                                                size="small"
                                                label="Shipping PO Box"
                                                value={shippingPOBox}
                                                onChange={(event) => setShippingPOBox(event.target.value)}
                                                sx={{ gridColumn: { xs: "span 1", sm: "span 2" } }}
                                            />
                                            <TextField
                                                fullWidth
                                                size="small"
                                                label="Shipping City"
                                                value={shippingCity}
                                                onChange={(event) => setShippingCity(event.target.value)}
                                                sx={{ gridColumn: { xs: "span 1", sm: "span 2" } }}
                                            />
                                            <TextField
                                                fullWidth
                                                size="small"
                                                label="Shipping State"
                                                value={shippingState}
                                                onChange={(event) => setShippingState(event.target.value)}
                                            />
                                            <TextField
                                                fullWidth
                                                size="small"
                                                label="Code"
                                                value={shippingCode}
                                                onChange={(event) => setShippingCode(event.target.value)}
                                            />
                                            <TextField
                                                fullWidth
                                                size="small"
                                                label="Shipping Country"
                                                value={shippingCountry}
                                                onChange={(event) => setShippingCountry(event.target.value)}
                                                sx={{ gridColumn: { xs: "span 1", sm: "span 2" } }}
                                            />
                                        </Box>
                                    </Box>
                                    <Box
                                        sx={{
                                            display: "grid",
                                            gap: 1.125, // 75% of 1.5
                                            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                                        }}
                                    >
                                        <TextField
                                            fullWidth
                                            size="small"
                                            label="Special Conditions"
                                            multiline
                                            minRows={3}
                                            value={specialConditions}
                                            onChange={(event) => setSpecialConditions(event.target.value)}
                                            sx={{ 
                                                gridColumn: { xs: "span 1", sm: "span 2" },
                                                "& .MuiInputBase-root": {
                                                    fontSize: "0.75rem",
                                                    height: "auto",
                                                },
                                                "& .MuiInputBase-input": {
                                                    fontSize: "0.75rem",
                                                    padding: 0,
                                                },
                                                "& .MuiInputLabel-root": {
                                                    fontSize: "0.75rem",
                                                },
                                            }}
                                        />
                                        <TextField
                                            fullWidth
                                            size="small"
                                            label="Shipping Comments"
                                            multiline
                                            minRows={4}
                                            value={shippingComments}
                                            onChange={(event) => setShippingComments(event.target.value)}
                                            sx={{ 
                                                gridColumn: { xs: "span 1", sm: "span 2" },
                                                "& .MuiInputBase-root": {
                                                    fontSize: "0.75rem",
                                                    height: "auto",
                                                },
                                                "& .MuiInputBase-input": {
                                                    fontSize: "0.75rem",
                                                    padding: 0,
                                                },
                                                "& .MuiInputLabel-root": {
                                                    fontSize: "0.75rem",
                                                },
                                            }}
                                        />
                                        <TextField
                                            fullWidth
                                            size="small"
                                            label="Processing Comments"
                                            multiline
                                            minRows={4.5}
                                            value={processingComments}
                                            onChange={(event) => setProcessingComments(event.target.value)}
                                            sx={{ 
                                                gridColumn: { xs: "span 1", sm: "span 2" },
                                                "& .MuiInputBase-root": {
                                                    fontSize: "0.75rem",
                                                    height: "auto",
                                                },
                                                "& .MuiInputBase-input": {
                                                    fontSize: "0.75rem",
                                                    padding: 0,
                                                },
                                                "& .MuiInputLabel-root": {
                                                    fontSize: "0.75rem",
                                                },
                                            }}
                                        />
                                    </Box>
                                </Box>
                        </Box>
                    </Box>
  <Box sx={{  display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                            <Typography variant="subtitle1" fontWeight={600} >
                                Product Details
                            </Typography>
                            <Button size="small" variant="contained" onClick={handleAddProductRow}>
                                Add Product
                            </Button>
                        </Box>
                    <Box
                        sx={{
                           
                            "& .MuiTypography-root": { fontSize: "12px" },
                            "& .MuiInputBase-input": { fontSize: "12px", py: 0.5 },
                            "& .MuiInputLabel-root": { fontSize: "12px" },
                            "& .MuiButton-root": { fontSize: "12px", py: 0.25, px: 1 },
                            "& .MuiSvgIcon-root": { fontSize: "0.8rem" },
                        }}
                    >
                      
                        <Paper
                            variant="outlined"
                            sx={{
                                display: "grid",
                                gridTemplateColumns: "0.35fr 2.5fr 0.9fr 0.6fr 0.6fr 0.6fr 0.4fr",
                                alignItems: "stretch",
                                px: 2,
                                py: 1,
                                gap: 1,
                                mb: 1,
                                bgcolor: "#F9FAFB",
                                borderStyle: "dashed",
                            }}
                        >
                            <Typography variant="caption" fontWeight={600}>
                              #
                            </Typography>
                            <Box>
                                <Typography variant="caption" fontWeight={600} >
                                    Product Name
                                </Typography>
                                <Typography variant="caption" fontWeight={600} color="text.secondary" display="block">
                                    / Notes
                                </Typography>
                            </Box>
                            <Typography variant="caption" fontWeight={600}>
                                Product Code
                            </Typography>
                            <Typography variant="caption" fontWeight={600}>
                                Quantity
                            </Typography>
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                            <Typography variant="caption" fontWeight={600}>
                                Price
                            </Typography>
                                <FormControl size="small" fullWidth>
                                    <Select
                                        value={globalPriceType}
                                        onChange={handleGlobalPriceTypeChange}
                                        sx={{ 
                                            fontSize: "11px",
                                            height: "28px",
                                            "& .MuiSelect-select": { py: 0.5 }
                                        }}
                                    >
                                        <MenuItem value="listPrice" sx={{ fontSize: "11px" }}>List Price</MenuItem>
                                        <MenuItem value="oemPrice" sx={{ fontSize: "11px" }}>OEM Price</MenuItem>
                                        <MenuItem value="resellerPrice" sx={{ fontSize: "11px" }}>Reseller Price</MenuItem>
                                        <MenuItem value="hostingPrice" sx={{ fontSize: "11px" }}>Hosting Price</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                            <Typography variant="caption" fontWeight={600}>
                                Total
                            </Typography>
                            <Typography variant="caption" fontWeight={600}>
                                Actions
                            </Typography>
                        </Paper>
                        {productRows.map((row, index) => (
                        <Paper
                                key={row.id}
                            variant="outlined"
                            sx={{
                                display: "grid",
                                    gridTemplateColumns: "0.35fr 2.5fr 0.9fr 0.6fr 0.6fr 0.6fr 0.4fr",
                                alignItems: "stretch",
                                px: 2,
                                py: 1.5,
                                gap: 1,
                                    mb: 1,
                            }}
                        >
                                <Typography variant="body2">{index + 1}</Typography>
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                                    <Autocomplete
                                        size="small"
                                        fullWidth
                                        options={productOptions}
                                        value={row.product}
                                        onChange={(event, newValue) => handleProductSelect(row.id, event, newValue)}
                                        loading={productsLoading}
                                        disableClearable={false}
                                        isOptionEqualToValue={(option, value) => option.id === value.id}
                                        getOptionLabel={(option) => (typeof option === "string" ? option : option?.name ?? "")}
                                        renderOption={(props, option) => (
                                            <li {...props} key={option.id}>
                                                {option.name}
                                            </li>
                                        )}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                size="small"
                                                fullWidth
                                                placeholder="Product Name"
                                                error={!!productsError}
                                                helperText={productsError ? (productsError instanceof Error ? productsError.message : "Failed to load products") : undefined}
                                                InputProps={{
                                                    ...params.InputProps,
                                                    endAdornment: (
                                                        <>
                                                            {productsLoading ? <CircularProgress color="inherit" size={16} /> : null}
                                                            {params.InputProps.endAdornment}
                                                        </>
                                                    ),
                                                }}
                                            />
                                        )}
                                        noOptionsText={productsLoading ? "Loading..." : productsError ? "Error loading products" : "No products found"}
                                    />
                                    <Box sx={{ display: "flex", alignItems: expandedNotes[row.id] ? "flex-start" : "center", gap: 0.5 }}>
                                        {expandedNotes[row.id] && (
                                            <TextField
                                                size="small"
                                                value={row.productNotes}
                                                onChange={(event) => handleNotesChange(row.id, event)}
                                                multiline
                                                minRows={1}
                                                placeholder="Notes"
                                                sx={{ flex: 1 }}
                                            />
                                        )}
                                        <Tooltip title={expandedNotes[row.id] ? "Hide Notes" : "Show Notes"}>
                                            <IconButton
                                                size="small"
                                                onClick={() => toggleNotes(row.id)}
                                                sx={{ 
                                                    mt: expandedNotes[row.id] ? 0.5 : 0,
                                                    flexShrink: 0,
                                                }}
                                            >
                                                {expandedNotes[row.id] ? (
                                                    <ExpandLess fontSize="small" />
                                                ) : (
                                                    <ExpandMore fontSize="small" />
                                                )}
                                            </IconButton>
                                        </Tooltip>
                            </Box>
                                </Box>
                                <TextField
                                    size="small"
                                    value={row.productCode}
                                    placeholder="Product Code"
                                    InputProps={{ readOnly: true }}
                                />
                                <TextField
                                    size="small"
                                    type="number"
                                    value={row.productQuantity}
                                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleQuantityChange(row.id, event)}
                                    placeholder="Quantity"
                                    inputProps={{
                                        style: { MozAppearance: "textfield" },
                                    }}
                                    sx={{
                                        "& input[type=number]": {
                                            MozAppearance: "textfield",
                                        },
                                        "& input[type=number]::-webkit-outer-spin-button": {
                                            WebkitAppearance: "none",
                                            margin: 0,
                                        },
                                        "& input[type=number]::-webkit-inner-spin-button": {
                                            WebkitAppearance: "none",
                                            margin: 0,
                                        },
                                    }}
                                />
                                <TextField
                                    size="small"
                                    type="number"
                                    value={row.productPrice}
                                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => handlePriceChange(row.id, event)}
                                    placeholder="Price"
                                    inputProps={{
                                        step: "0.01",
                                        min: "0",
                                        style: { MozAppearance: "textfield" },
                                    }}
                                    sx={{
                                        "& input[type=number]": {
                                            MozAppearance: "textfield",
                                        },
                                        "& input[type=number]::-webkit-outer-spin-button": {
                                            WebkitAppearance: "none",
                                            margin: 0,
                                        },
                                        "& input[type=number]::-webkit-inner-spin-button": {
                                            WebkitAppearance: "none",
                                            margin: 0,
                                        },
                                    }}
                                />
                                <TextField
                                    size="small"
                                    value={row.productTotal}
                                    placeholder="Total"
                                    InputProps={{ readOnly: true }}
                                />
                             <Tooltip title="Remove">
                                    <IconButton
                                        size="small"
                                        color="error"
                                        sx={{ alignSelf: "flex-start" }}
                                        onClick={() => handleRemoveProductRow(row.id)}
                                    >
                                    <DeleteOutline fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Paper>
                        ))}
                        {/* Net Total, Discount, and Grand Total Rows */}
                        <Paper
                            variant="outlined"
                            sx={{
                                display: "grid",
                                gridTemplateColumns: "0.35fr 2.5fr 0.9fr 0.6fr 0.6fr 0.6fr 0.9fr",
                                alignItems: "stretch",
                                px: 2,
                                py: 1.5,
                                gap: 1,
                                mb: 1,
                                mt: 1,
                            }}
                        >
                            <Box sx={{ gridColumn: "span 5" }} />
                            <Typography variant="caption" fontWeight={600} sx={{ alignSelf: "center", textAlign: "right", pr: 1 }}>
                                Net Total:
                            </Typography>
                            <TextField
                                size="small"
                                value={netTotal > 0 ? netTotal.toFixed(2) : ""}
                                placeholder="0.00"
                                InputProps={{ readOnly: true }}
                                fullWidth
                            />
                        </Paper>
                        <Paper
                            variant="outlined"
                            sx={{
                                display: "grid",
                                gridTemplateColumns: "0.35fr 2.5fr 0.9fr 0.6fr 0.6fr 0.6fr 0.9fr",
                                alignItems: "stretch",
                                px: 2,
                                py: 1.5,
                                gap: 1,
                                mb: 1,
                            }}
                        >
                            <Box sx={{ gridColumn: "span 5" }} />
                            <Typography variant="caption" fontWeight={600} sx={{ alignSelf: "center", textAlign: "right", pr: 1 }}>
                                Discount:
                            </Typography>
                            <Button
                                size="small"
                                variant="outlined"
                                onClick={() => setDiscountDialogOpen(true)}
                                sx={{ 
                                    fontSize: "11px",
                                    textTransform: "none",
                                    minWidth: "60px",
                                    alignSelf: "center",
                                }}
                            >
                                {discountType === "zero" 
                                    ? "Zero Discount" 
                                    : discountType === "percentage" 
                                    ? `${discount || "0"}%` 
                                    : discountAmount > 0 
                                    ? discountAmount.toFixed(2) 
                                    : "Set Discount"}
                            </Button>
                        </Paper>
                        {/* Discount Dialog */}
                        <Dialog
                            open={discountDialogOpen}
                            onClose={() => setDiscountDialogOpen(false)}
                            maxWidth="sm"
                            fullWidth
                        >
                            <DialogTitle sx={{ fontSize: "14px", pb: 1 }}>Discount Details</DialogTitle>
                            <DialogContent>
                                <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
                                    <RadioGroup
                                        value={discountType}
                                        onChange={(event) => {
                                            const newType = event.target.value as "zero" | "percentage" | "direct";
                                            setDiscountType(newType);
                                            if (newType === "zero") {
                                                setDiscount("");
                                            }
                                        }}
                                    >
                                        <FormControlLabel
                                            value="zero"
                                            control={<Radio size="small" />}
                                            label="Zero Discount"
                                            sx={{ "& .MuiFormControlLabel-label": { fontSize: "12px" } }}
                                        />
                                        <FormControlLabel
                                            value="percentage"
                                            control={<Radio size="small" />}
                                            label="% of Price"
                                            sx={{ "& .MuiFormControlLabel-label": { fontSize: "12px" } }}
                                        />
                                        <FormControlLabel
                                            value="direct"
                                            control={<Radio size="small" />}
                                            label="Direct Price Reduction"
                                            sx={{ "& .MuiFormControlLabel-label": { fontSize: "12px" } }}
                                        />
                                    </RadioGroup>
                                    {(discountType === "percentage" || discountType === "direct") && (
                                        <TextField
                                            fullWidth
                                            size="small"
                                            type="number"
                                            label={discountType === "percentage" ? "Discount Percentage (%)" : "Discount Amount"}
                                            value={discount}
                                            onChange={(event) => setDiscount(event.target.value)}
                                            placeholder={discountType === "percentage" ? "Enter %" : "Enter amount"}
                                            inputProps={{
                                                step: "0.01",
                                                min: "0",
                                                max: discountType === "percentage" ? "100" : undefined,
                                                style: { MozAppearance: "textfield" },
                                            }}
                                            sx={{
                                                "& input[type=number]": {
                                                    MozAppearance: "textfield",
                                                },
                                                "& input[type=number]::-webkit-outer-spin-button": {
                                                    WebkitAppearance: "none",
                                                    margin: 0,
                                                },
                                                "& input[type=number]::-webkit-inner-spin-button": {
                                                    WebkitAppearance: "none",
                                                    margin: 0,
                                                },
                                            }}
                                        />
                                    )}
                                    {discountType !== "zero" && discountAmount > 0 && (
                                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: "12px", mt: 1 }}>
                                            Discount Amount: {discountAmount.toFixed(2)}
                                        </Typography>
                                    )}
                                </Box>
                            </DialogContent>
                            <DialogActions sx={{ px: 2, pb: 2 }}>
                                <Button size="small" onClick={() => setDiscountDialogOpen(false)}>
                                    Close
                                </Button>
                            </DialogActions>
                        </Dialog>
                        <Paper
                            variant="outlined"
                            sx={{
                                display: "grid",
                                gridTemplateColumns: "0.35fr 2.5fr 0.9fr 0.6fr 0.6fr 0.6fr 0.9fr",
                                alignItems: "stretch",
                                px: 2,
                                py: 1.5,
                                gap: 1,
                                mb: 1,
                                bgcolor: "#F9FAFB",
                                border: "2px solid",
                                borderColor: "primary.main",
                            }}
                        >
                            <Box sx={{ gridColumn: "span 5" }} />
                            <Typography variant="caption" fontWeight={700} sx={{ alignSelf: "center", fontSize: "13px", textAlign: "right", pr: 1 }}>
                                Grand Total:
                            </Typography>
                            <TextField
                                size="small"
                                value={grandTotal > 0 ? grandTotal.toFixed(2) : ""}
                                placeholder="0.00"
                                InputProps={{ readOnly: true }}
                                fullWidth
                                sx={{
                                    fontWeight: 600,
                                    "& .MuiInputBase-input": {
                                        fontWeight: 600,
                                        fontSize: "13px",
                                    },
                                }}
                            />
                        </Paper>
                    </Box>
                </Paper>

                {showAdvancedSections && (
                    <Paper
                        elevation={0}
                        sx={{
                            bgcolor: "#FFFFFF",
                            borderRadius: 1,
                            p: 3,
                            border: "1px solid",
                            borderColor: "divider",
                            display: "flex",
                            flexDirection: "column",
                            gap: 3,
                        }}
                    >
                    <Box
                        sx={{
                            "& .MuiInputBase-root": {
                                fontSize: "0.75rem",
                                height: "30px",
                            },
                            "& .MuiInputBase-input": {
                                fontSize: "0.75rem",
                                padding: "6px 12px",
                            },
                            "& .MuiInputLabel-root": {
                                fontSize: "0.75rem",
                            },
                            "& .MuiTypography-root": {
                                fontSize: "0.875rem",
                            },
                        }}
                    >
                        <Typography variant="h6" fontWeight={600} sx={{ fontSize: "1rem" }}>
                        Setup Network Information
                    </Typography>
                        <Stack spacing={2.25}>
                        <Box>
                                <Typography variant="subtitle2" sx={{ mb: 0.75, fontSize: "0.875rem" }}>
                                1. SSID of the WiFi network
                            </Typography>
                                <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
                                <TextField fullWidth size="small" label="SSID 1" />
                                <TextField fullWidth size="small" label="Channel" />
                                <TextField fullWidth size="small" label="SSID 2" />
                                <TextField fullWidth size="small" label="Channel" />
                            </Box>
                        </Box>
                        <Box>
                                <Typography variant="subtitle2" sx={{ mb: 0.75, fontSize: "0.875rem" }}>
                                2. Level of security used in the network
                            </Typography>
                            <RadioGroup row defaultValue="open">
                                    <FormControlLabel value="open" control={<Radio size="small" />} label="Open (None)" sx={{ "& .MuiFormControlLabel-label": { fontSize: "0.75rem" } }} />
                                    <FormControlLabel value="wpa2" control={<Radio size="small" />} label="WPA2-802.1x" sx={{ "& .MuiFormControlLabel-label": { fontSize: "0.75rem" } }} />
                                    <FormControlLabel value="psk" control={<Radio size="small" />} label="WPA2-PSK" sx={{ "& .MuiFormControlLabel-label": { fontSize: "0.75rem" } }} />
                                    <FormControlLabel value="others" control={<Radio size="small" />} label="Others" sx={{ "& .MuiFormControlLabel-label": { fontSize: "0.75rem" } }} />
                            </RadioGroup>
                            <Box
                                sx={{
                                    display: "grid",
                                        gap: 1.5,
                                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                                        mt: 0.75,
                                }}
                            >
                                <TextField fullWidth size="small" label="Username" />
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Password"
                                    type={showWifiPassword ? "text" : "password"}
                                    autoComplete="new-password"
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => setShowWifiPassword((prev) => !prev)}
                                                    onMouseDown={(event) => event.preventDefault()}
                                                >
                                                    {showWifiPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Box>
                        </Box>
                        <Box>
                                <Typography variant="subtitle2" sx={{ mb: 0.75, fontSize: "0.875rem" }}>
                                3. DHCP
                            </Typography>
                            <RadioGroup row defaultValue="yes">
                                    <FormControlLabel value="yes" control={<Radio size="small" />} label="Yes (Recommended)" sx={{ "& .MuiFormControlLabel-label": { fontSize: "0.75rem" } }} />
                                    <FormControlLabel value="no" control={<Radio size="small" />} label="No" sx={{ "& .MuiFormControlLabel-label": { fontSize: "0.75rem" } }} />
                            </RadioGroup>
                        </Box>
                        <Box>
                                <Typography variant="subtitle2" sx={{ mb: 0.75, fontSize: "0.875rem" }}>
                                4. Web Portal Server
                            </Typography>
                                <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
                                <TextField fullWidth size="small" label="IP Address" />
                                <TextField fullWidth size="small" label="Netmask" />
                            </Box>
                        </Box>
                        <Box>
                                <Typography variant="subtitle2" sx={{ mb: 0.75, fontSize: "0.875rem" }}>
                                5. Sensor IP
                            </Typography>
                                <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
                                <TextField fullWidth size="small" label="Starting IP" />
                                <TextField fullWidth size="small" label="Ending IP" />
                            </Box>
                        </Box>
                        <Box>
                                <Typography variant="subtitle2" sx={{ mb: 0.75, fontSize: "0.875rem" }}>
                                6. DNS
                            </Typography>
                                <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
                                <TextField fullWidth size="small" label="Primary DNS" />
                                <TextField fullWidth size="small" label="Secondary DNS" />
                            </Box>
                        </Box>
                        <Box>
                                <Typography variant="subtitle2" sx={{ mb: 0.75, fontSize: "0.875rem" }}>
                                7. Comments
                            </Typography>
                                <TextField fullWidth size="small" multiline minRows={2.25} placeholder="Add any additional comments" />
                        </Box>
                        <Box>
                                <Typography variant="subtitle2" sx={{ mb: 0.75, fontSize: "0.875rem" }}>
                                Upload Setup Document
                            </Typography>
                            <Button variant="outlined" component="label" startIcon={<CloudUpload />}>
                                Choose File
                                <input hidden type="file" />
                            </Button>
                        </Box>
                    </Stack>
                    </Box>
                    </Paper>
                )}

                {showAdvancedSections && (
                    <Paper
                        elevation={0}
                        sx={{
                            bgcolor: "#FFFFFF",
                            borderRadius: 1,
                            border: "1px solid",
                            borderColor: "divider",
                            overflow: "hidden",
                            display: "flex",
                            flexDirection: "column",
                        }}
                    >
                    <Box sx={{ px: 3, pt: 3, pb: 2 }}>
                        <Typography variant="h6" fontWeight={600}>
                            Processing and Shipping
                        </Typography>
                        <Tabs
                            value={shipmentTab}
                            onChange={(_, value) => setShipmentTab(value)}
                            sx={{ mt: 1.5, borderBottom: "1px solid", borderColor: "divider" }}
                        >
                            <Tab label="Sensors" />
                            <Tab label="Probes" />
                            <Tab label="Hosted" />
                            <Tab label="Shipping" />
                        </Tabs>
                    </Box>

                    <Divider />

                    {shipmentTab === 0 ? (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, p: 3 }}>
                            <Card variant="outlined">
                                <CardContent sx={{ p: 0 }}>
                                    <Box
                                        sx={{
                                            display: "grid",
                                            gridTemplateColumns: "repeat(4, minmax(0, 1fr)) 80px",
                                            bgcolor: "#F5F8FF",
                                            px: 2,
                                            py: 1,
                                            alignItems: "center",
                                            borderBottom: "1px solid",
                                            borderColor: "divider",
                                        }}
                                    >
                                        <Typography variant="caption" fontWeight={600}>
                                            Shipped On
                                        </Typography>
                                        <Typography variant="caption" fontWeight={600}>
                                            Shipping Account
                                        </Typography>
                                        <Typography variant="caption" fontWeight={600}>
                                            Tracking ID
                                        </Typography>
                                        <Typography variant="caption" fontWeight={600}>
                                            Sensors
                                        </Typography>
                                        <Typography variant="caption" fontWeight={600} textAlign="center">
                                            Actions
                                        </Typography>
                                    </Box>
                                    {mockShipments.map((shipment) => (
                                        <Box
                                            key={shipment.id}
                                            sx={{
                                                display: "grid",
                                                gridTemplateColumns: "repeat(4, minmax(0, 1fr)) 80px",
                                                px: 2,
                                                py: 1.5,
                                                alignItems: "start",
                                                borderBottom: "1px solid",
                                                borderColor: "divider",
                                                "&:last-of-type": { borderBottom: "none" },
                                            }}
                                        >
                                            <Typography variant="body2">{shipment.shippedOn}</Typography>
                                            <Typography variant="body2">{shipment.account}</Typography>
                                            <Typography variant="body2">{shipment.trackingId}</Typography>
                                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                                {shipment.sensors.map((sensor) => (
                                                    <Chip key={sensor} label={sensor} size="small" sx={{ bgcolor: "#EEF2FF" }} />
                                                ))}
                                            </Stack>
                                            <Box sx={{ display: "flex", justifyContent: "center" }}>
                                                <Tooltip title="Remove shipment">
                                                    <IconButton size="small" color="error">
                                                        <DeleteOutline fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </Box>
                                    ))}
                                </CardContent>
                            </Card>

                            <Card variant="outlined">
                                <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                    <Typography variant="subtitle1" fontWeight={600}>
                                        Add Shipment
                                    </Typography>
                                    <Box
                                        sx={{
                                            display: "grid",
                                            gap: 2,
                                            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                                        }}
                                    >
                                        <FormControl fullWidth size="small">
                                            <InputLabel id="shipment-status-label">Status</InputLabel>
                                            <Select
                                                labelId="shipment-status-label"
                                                label="Status"
                                                value={shipmentStatus}
                                                onChange={(event) => setShipmentStatus(event.target.value as string)}
                                            >
                                                {shipmentStatusOptions.map((option) => (
                                                    <MenuItem key={option} value={option}>
                                                        {option}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                        <TextField
                                            fullWidth
                                            label="Shipped On"
                                            size="small"
                                            type="date"
                                            InputLabelProps={{ shrink: true }}
                                            value="2025-07-28"
                                        />
                                        <FormControl fullWidth size="small">
                                            <InputLabel id="shipping-account-label">Shipping Account</InputLabel>
                                            <Select
                                                labelId="shipping-account-label"
                                                label="Shipping Account"
                                                value={shipmentAccount}
                                                onChange={(event) => setShipmentAccount(event.target.value as string)}
                                            >
                                                {shippingAccountOptions.map((option) => (
                                                    <MenuItem key={option} value={option}>
                                                        {option}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                        <TextField fullWidth label="Tracking ID" size="small" />
                                    </Box>
                                    <Divider />
                                    <Typography variant="subtitle2">Drag or select sensors from Sensors to Assign list</Typography>
                                    <TextField
                                        size="small"
                                        placeholder="Search sensors"
                                        value={sensorSearch}
                                        onChange={(event) => setSensorSearch(event.target.value)}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <MdSearch size={18} />
                                                </InputAdornment>
                                            ),
                                        }}
                                        sx={{ maxWidth: 280 }}
                                    />
                                    <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
                                        <Paper variant="outlined" sx={{ p: 2, minHeight: 320, display: "flex", flexDirection: "column" }}>
                                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                                                <Typography variant="subtitle2" fontWeight={600}>
                                                    {filteredAvailableSensors.length} Sensors to Assign
                                                </Typography>
                                                <Button size="small" onClick={() => setSelectedAvailable(new Set())}>
                                                    Clear
                                                </Button>
                                            </Box>
                                            <Divider sx={{ mb: 1 }} />
                                            <List dense sx={{ flex: 1, overflowY: "auto" }}>
                                                {filteredAvailableSensors.map((sensor) => (
                                                    <ListItem
                                                        key={sensor.id}
                                                        disableGutters
                                                        secondaryAction={
                                                            <Typography variant="caption" color="text.secondary">
                                                                {sensor.type}
                                                            </Typography>
                                                        }
                                                    >
                                                        <ListItemIcon sx={{ minWidth: 32 }}>
                                                            <Checkbox
                                                                size="small"
                                                                checked={selectedAvailable.has(sensor.id)}
                                                                onChange={() => toggleSelect(sensor.id, "available")}
                                                            />
                                                        </ListItemIcon>
                                                        <ListItemText primary={sensor.name} secondary={sensor.id} />
                                                    </ListItem>
                                                ))}
                                                {filteredAvailableSensors.length === 0 && (
                                                    <ListItem>
                                                        <ListItemText primary="No sensors available" />
                                                    </ListItem>
                                                )}
                                            </List>
                                            <Button
                                                variant="contained"
                                                size="small"
                                                sx={{ mt: 1 }}
                                                onClick={handleAssign}
                                                disabled={selectedAvailable.size === 0}
                                            >
                                                Assign Selected
                                            </Button>
                                        </Paper>
                                        <Paper variant="outlined" sx={{ p: 2, minHeight: 320, display: "flex", flexDirection: "column" }}>
                                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                                                <Typography variant="subtitle2" fontWeight={600}>
                                                    {filteredAssignedSensors.length} Assigned Sensors
                                                </Typography>
                                                <Button size="small" onClick={() => setSelectedAssigned(new Set())}>
                                                    Clear
                                                </Button>
                                            </Box>
                                            <Divider sx={{ mb: 1 }} />
                                            <List dense sx={{ flex: 1, overflowY: "auto" }}>
                                                {filteredAssignedSensors.map((sensor) => (
                                                    <ListItem
                                                        key={sensor.id}
                                                        disableGutters
                                                        secondaryAction={
                                                            <Typography variant="caption" color="text.secondary">
                                                                {sensor.type}
                                                            </Typography>
                                                        }
                                                    >
                                                        <ListItemIcon sx={{ minWidth: 32 }}>
                                                            <Checkbox
                                                                size="small"
                                                                checked={selectedAssigned.has(sensor.id)}
                                                                onChange={() => toggleSelect(sensor.id, "assigned")}
                                                            />
                                                        </ListItemIcon>
                                                        <ListItemText primary={sensor.name} secondary={sensor.id} />
                                                    </ListItem>
                                                ))}
                                                {filteredAssignedSensors.length === 0 && (
                                                    <ListItem>
                                                        <ListItemText primary="No sensors assigned" />
                                                    </ListItem>
                                                )}
                                            </List>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                sx={{ mt: 1 }}
                                                onClick={handleUnassign}
                                                disabled={selectedAssigned.size === 0}
                                            >
                                                Remove Selected
                                            </Button>
                                        </Paper>
                                    </Box>
                                    <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                                        <Button variant="contained" size="small" onClick={handleSave}>
                                            Submit
                                        </Button>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Box>
                    ) : (
                        <Box sx={{ p: 3, color: "text.secondary", flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Typography variant="body2">Content for this tab will be available soon.</Typography>
                        </Box>
                    )}
                    </Paper>
                )}
            </Box>
        </Box>
    );
}



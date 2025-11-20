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
    Alert,
} from "@mui/material";
import { Suspense } from "react";
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
    raw?: any;
};

type QuoteOption = {
    id: string; // Unique identifier for React keys and comparison
    name: string; // Display name (subject)
    subject: string; // Subject field to use as quote_id in payload
    raw?: any;
};

type ProductRow = {
    id: string;
    product: ProductOption | null;
    productCode: string;
    productDescription: string;
    productNotes: string;
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
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
        refetchOnWindowFocus: false, // Don't refetch on window focus for better performance
    });
}

function useProductDirectory(effectiveCompanyId: string | null) {
    return useProducts(effectiveCompanyId, "products");
}

function useCustomerDetail(customerId: string | null) {
    const { token, isLoggedIn } = useAuth();
    const { apiURL } = useBackend();

    return useQuery({
        queryKey: ["customer-detail", customerId],
        queryFn: async () => {
            if (!customerId) return null;
            const url = apiURL(`get-account/${customerId}`, `get-account-${customerId}.json`);
            const res = await fetch(url, {
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
    const { apiURL } = useBackend();

    return useQuery({
        queryKey: ["product-detail", productId],
        queryFn: async () => {
            if (!productId) return null;
            const url = apiURL(`get-product-details?item_id=${productId}`, `get-product-details-${productId}.json`);
            const res = await fetch(url, {
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

function useSalesOrderLookups() {
    const { token, isLoggedIn } = useAuth();
    const { apiURL } = useBackend();

    return useQuery({
        queryKey: ["salesorder-lookups"],
        queryFn: async () => {
            const url = apiURL("salesorders/lookups", "salesorders-lookups.json");
            const res = await fetch(url, {
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            });
            if (!res.ok) {
                if (res.status === 401) throw new Error("Unauthorized – please log in again");
                throw new Error(`Failed to fetch lookups: ${res.status}`);
            }
            return res.json();
        },
        enabled: isLoggedIn && !!token,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
}

function useQuotes() {
    const { token, isLoggedIn } = useAuth();
    const { apiURL } = useBackend();

    return useQuery({
        queryKey: ["quotes", "for-order"],
        queryFn: async () => {
            const url = apiURL("quotes", "quotes.json");
            const res = await fetch(url, {
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            });
            if (!res.ok) {
                if (res.status === 401) throw new Error("Unauthorized – please log in again");
                throw new Error(`Failed to fetch quotes: ${res.status}`);
            }
            return res.json();
        },
        enabled: isLoggedIn && !!token,
        staleTime: 5 * 60 * 1000,
    });
}

function useAccountQuotes(accountId: string | null, companyId: string | null) {
    const { token, isLoggedIn } = useAuth();
    const { apiURL } = useBackend();

    return useQuery({
        queryKey: ["account-quotes", accountId, companyId],
        queryFn: async () => {
            if (!accountId || !companyId) return null;
            const url = apiURL(
                `get-account-quotes?account_id=${accountId}&company_id=${companyId}`,
                `get-account-quotes-${accountId}-${companyId}.json`
            );
            const res = await fetch(url, {
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            });
            if (!res.ok) {
                if (res.status === 401) throw new Error("Unauthorized – please log in again");
                throw new Error(`Failed to fetch account quotes: ${res.status}`);
            }
            return res.json();
        },
        enabled: isLoggedIn && !!token && !!accountId && !!companyId,
        staleTime: 0,
        refetchOnWindowFocus: false,
    });
}

function useSalesOrderForEditing(salesorderId: string | null, companyId: string | null) {
    const { token, isLoggedIn } = useAuth();
    const { apiURL } = useBackend();

    return useQuery({
        queryKey: ["salesorder-for-editing", salesorderId, companyId],
        queryFn: async () => {
            if (!salesorderId || !companyId) return null;
            const url = apiURL(
                `get-salesorder-for-editing?salesorder_id=${encodeURIComponent(salesorderId)}&company_id=${encodeURIComponent(companyId)}`,
                `get-salesorder-for-editing-${salesorderId}-${companyId}.json`
            );
            const res = await fetch(url, {
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            });
            if (!res.ok) {
                if (res.status === 401) throw new Error("Unauthorized – please log in again");
                if (res.status === 404) throw new Error("Order not found");
                throw new Error(`Failed to fetch sales order: ${res.status}`);
            }
            const data = await res.json();
            const salesorder = data?.salesorder || null;
            
            // If no salesorder in response, order was not found
            if (!salesorder) {
                throw new Error("Order not found");
            }
            
            // Validate that the order's company_id matches the requested companyId
            if (salesorder && companyId) {
                const orderCompanyId = String(salesorder.company_id ?? "");
                const requestedCompanyId = String(companyId);
                
                if (orderCompanyId !== requestedCompanyId) {
                    throw new Error("Order not found");
                }
            }
            
            return salesorder;
        },
        enabled: isLoggedIn && !!token && !!salesorderId && !!companyId,
        staleTime: 0,
        refetchOnWindowFocus: false,
        retry: false, // Don't retry on error - if order not found, it won't be found on retry
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

// Memoize static sensor data to avoid recreating on every render
const createInitialSensors = (): Sensor[] => Array.from({ length: 20 }).map((_, index) => ({
    id: `002305${index.toString().padStart(2, "0")}`,
    name: `Sensor_0023${index.toString().padStart(2, "0")}`,
    type: "Single Probe",
}));

const initialSensors: Sensor[] = createInitialSensors();
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
    const { token, isLoggedIn } = useAuth();
    const { apiURL } = useBackend();
    const effectiveCompanyId = React.useMemo(() => (isAdmin ? selectedCompanyId : userCompanyId), [
        isAdmin,
        selectedCompanyId,
        userCompanyId,
    ]);
    const { data: customersData, isLoading: customersLoading } = useCustomerDirectory();
    const { data: productsData, isLoading: productsLoading, error: productsError } = useProductDirectory(effectiveCompanyId);
    const { data: lookupsData, isLoading: lookupsLoading } = useSalesOrderLookups();
    const { data: orderData, isLoading: orderLoading, error: orderError } = useSalesOrderForEditing(
        orderIdFromUrl,
        effectiveCompanyId ? String(effectiveCompanyId) : null
    );
    const [orderSubject, setOrderSubject] = React.useState("");
    const [orderSubjectError, setOrderSubjectError] = React.useState("");
    const [customerNameError, setCustomerNameError] = React.useState("");
    const [selectedCustomer, setSelectedCustomer] = React.useState<CustomerOption | null>(null);
    const selectedCustomerId = selectedCustomer?.id ?? null;
    // Only fetch quotes when customer is selected (defer non-critical API call)
    const { data: accountQuotesData, isLoading: accountQuotesLoading, error: accountQuotesError } = useAccountQuotes(
        selectedCustomerId,
        effectiveCompanyId ? String(effectiveCompanyId) : null
    );
    const [productRows, setProductRows] = React.useState<ProductRow[]>([
        {
            id: "1",
            product: null,
            productCode: "",
            productDescription: "",
            productNotes: "",
            productPrice: "",
            productQuantity: "",
            productTotal: "",
        },
    ]);
    const [expandedNotes, setExpandedNotes] = React.useState<Record<string, boolean>>({});
    // Only fetch customer detail when customer is selected (defer non-critical API call)
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
    const [shippingMethod, setShippingMethod] = React.useState<string>("");
    const [selectedCarrierId, setSelectedCarrierId] = React.useState<number | null>(null);
    const [orderStatus, setOrderStatus] = React.useState("Created");
    const [selectedStatusId, setSelectedStatusId] = React.useState<number | null>(null);
    const [orderPriority, setOrderPriority] = React.useState("");
    const [selectedPriorityId, setSelectedPriorityId] = React.useState<number | null>(null);
    const [certificateType, setCertificateType] = React.useState("");
    const [selectedCertificateTypeId, setSelectedCertificateTypeId] = React.useState<number | null>(null);
    const [specialConditions, setSpecialConditions] = React.useState("");
    const [orderCategory, setOrderCategory] = React.useState("");
    const [selectedTypeId, setSelectedTypeId] = React.useState<number | null>(null);
    const [shipmentStatus, setShipmentStatus] = React.useState("Created");
    const [shipmentAccount, setShipmentAccount] = React.useState("");
    const [poNumber, setPoNumber] = React.useState("");
    const [dueDate, setDueDate] = React.useState("");
    const [selectedQuote, setSelectedQuote] = React.useState<QuoteOption | null>(null);
    const [isSaving, setIsSaving] = React.useState(false);
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

    // Memoize static options to avoid recreating on every render
    const shipmentStatusOptions = React.useMemo(() => ["Pending", "Approved", "In Transit", "Delivered", "Closed"], []);
    const shippingAccountOptions = React.useMemo(() => ["Account 1", "Account 2", "Account 3"], []);

    const certificateTypeOptions = React.useMemo(() => {
        if (!lookupsData) return [];
        // Extract certificate_types from API response
        if (lookupsData?.certificate_types) {
            const types = lookupsData.certificate_types;
            if (Array.isArray(types)) {
                return types.map((item: any) => {
                    if (typeof item === "string") {
                        return { id: null, name: item };
                    }
                    return {
                        id: item?.id ?? item?.certificate_type_id ?? item?.certificateTypeId ?? null,
                        name: item?.name ?? item?.label ?? item?.value ?? String(item)
                    };
                });
            }
        }
        return [];
    }, [lookupsData]);

    const orderPriorityOptions = React.useMemo(() => {
        if (!lookupsData) return [];
        // Extract salesorder_priorities from API response
        if (lookupsData?.salesorder_priorities) {
            const priorities = lookupsData.salesorder_priorities;
            if (Array.isArray(priorities)) {
                return priorities.map((item: any) => {
                    if (typeof item === "string") {
                        return { id: null, name: item };
                    }
                    return {
                        id: item?.id ?? item?.salesorder_priority_id ?? item?.salesorderPriorityId ?? null,
                        name: item?.name ?? item?.label ?? item?.value ?? String(item)
                    };
                });
            }
        }
        return [];
    }, [lookupsData]);

    const orderStatusOptions = React.useMemo(() => {
        if (!lookupsData) return [];
        // Extract salesorder_statuses from API response
        if (lookupsData?.salesorder_statuses) {
            const statuses = lookupsData.salesorder_statuses;
            if (Array.isArray(statuses)) {
                return statuses.map((item: any) => {
                    if (typeof item === "string") {
                        return { id: null, name: item };
                    }
                    return {
                        id: item?.id ?? item?.salesorder_status_id ?? item?.salesorderStatusId ?? null,
                        name: item?.name ?? item?.label ?? item?.value ?? String(item)
                    };
                });
            }
        }
        return [];
    }, [lookupsData]);

    const orderCategoryOptions = React.useMemo(() => {
        if (!lookupsData) return [];
        // Extract salesorder_types from API response
        if (lookupsData?.salesorder_types) {
            const types = lookupsData.salesorder_types;
            if (Array.isArray(types)) {
                return types.map((item: any) => {
                    if (typeof item === "string") {
                        return { id: null, name: item };
                    }
                    return {
                        id: item?.id ?? item?.salesorder_type_id ?? item?.salesorderTypeId ?? null,
                        name: item?.name ?? item?.label ?? item?.value ?? String(item)
                    };
                });
            }
        }
        return [];
    }, [lookupsData]);

    const shippingMethodOptions = React.useMemo(() => {
        if (!lookupsData) return [];
        // Handle different possible response structures
        // Try carriers first (most likely structure)
        if (lookupsData?.carriers || lookupsData?.carrier || lookupsData?.shippingMethods || lookupsData?.shipping_method || lookupsData?.shippingMethod) {
            const carriers = lookupsData.carriers || lookupsData.carrier || lookupsData.shippingMethods || lookupsData.shipping_method || lookupsData.shippingMethod;
            if (Array.isArray(carriers)) {
                return carriers.map((item: any) => {
                    if (typeof item === "string") {
                        return { id: null, name: item };
                    }
                    return {
                        id: item?.id ?? item?.carrier_id ?? item?.carrierId ?? null,
                        name: item?.name ?? item?.label ?? item?.value ?? String(item)
                    };
                });
            }
        }
        // Handle array response
        if (Array.isArray(lookupsData)) {
            return lookupsData.map((item: any) => {
                if (typeof item === "string") {
                    return { id: null, name: item };
                }
                return {
                    id: item?.id ?? item?.carrier_id ?? item?.carrierId ?? null,
                    name: item?.name ?? item?.label ?? item?.value ?? String(item)
                };
            });
        }
        // If it's an object, try to extract values
        if (typeof lookupsData === "object") {
            const values = Object.values(lookupsData);
            if (values.length > 0 && Array.isArray(values[0])) {
                return values[0].map((item: any) => {
                    if (typeof item === "string") {
                        return { id: null, name: item };
                    }
                    return {
                        id: item?.id ?? item?.carrier_id ?? item?.carrierId ?? null,
                        name: item?.name ?? item?.label ?? item?.value ?? String(item)
                    };
                });
            }
        }
        return [];
    }, [lookupsData]);

    // Sync carrier ID when shipping method or options change
    React.useEffect(() => {
        if (shippingMethod && shippingMethodOptions.length > 0) {
            const selectedOption = shippingMethodOptions.find((opt) => opt.name === shippingMethod);
            if (selectedOption) {
                setSelectedCarrierId(selectedOption.id);
            }
        }
    }, [shippingMethod, shippingMethodOptions]);

    // Sync status ID when order status or options change
    React.useEffect(() => {
        if (orderStatus && orderStatusOptions.length > 0) {
            const selectedOption = orderStatusOptions.find((opt) => opt.name === orderStatus);
            if (selectedOption) {
                setSelectedStatusId(selectedOption.id);
            }
        }
    }, [orderStatus, orderStatusOptions]);

    // Sync priority ID when order priority or options change
    React.useEffect(() => {
        if (orderPriority && orderPriorityOptions.length > 0) {
            const selectedOption = orderPriorityOptions.find((opt) => opt.name === orderPriority);
            if (selectedOption) {
                setSelectedPriorityId(selectedOption.id);
            }
        }
    }, [orderPriority, orderPriorityOptions]);

    // Sync certificate type ID when certificate type or options change
    React.useEffect(() => {
        if (certificateType && certificateTypeOptions.length > 0) {
            const selectedOption = certificateTypeOptions.find((opt) => opt.name === certificateType);
            if (selectedOption) {
                setSelectedCertificateTypeId(selectedOption.id);
            }
        }
    }, [certificateType, certificateTypeOptions]);

    // Sync type ID when order category or options change
    React.useEffect(() => {
        if (orderCategory && orderCategoryOptions.length > 0) {
            const selectedOption = orderCategoryOptions.find((opt) => opt.name === orderCategory);
            if (selectedOption) {
                setSelectedTypeId(selectedOption.id);
            }
        }
    }, [orderCategory, orderCategoryOptions]);

    const quoteOptions = React.useMemo(() => {
        if (!accountQuotesData) return [];
        const seenIds = new Set<string>();
        const options: QuoteOption[] = [];

        const pushQuote = (q: any, index: number) => {
            if (!q) return;
            // Extract subject field as the quote name
            const subject = q.subject ?? q.name ?? q.quote_name ?? q.title ?? "";
            // Use a unique identifier (quote_id, id, quoteId, or fallback to index)
            const uniqueId = String(q.quote_id ?? q.id ?? q.quoteId ?? `quote-${index}`);

            // Skip if no subject or if we've already seen this unique id
            if (!subject || seenIds.has(uniqueId)) return;

            seenIds.add(uniqueId);
            options.push({
                id: uniqueId, // Unique identifier for React keys
                name: subject, // Display subject as the name
                subject: subject, // Store subject separately for quote_id in payload
                raw: q,
            });
        };

        // Handle different possible response structures
        // Shape A: { quotes: [...] }
        if (accountQuotesData.quotes && Array.isArray(accountQuotesData.quotes)) {
            accountQuotesData.quotes.forEach((q: any, index: number) => pushQuote(q, index));
        }
        // Shape B: { data: [...] }
        else if (accountQuotesData.data && Array.isArray(accountQuotesData.data)) {
            accountQuotesData.data.forEach((q: any, index: number) => pushQuote(q, index));
        }
        // Shape C: direct array
        else if (Array.isArray(accountQuotesData)) {
            accountQuotesData.forEach((q: any, index: number) => pushQuote(q, index));
        }

        return options;
    }, [accountQuotesData]);

    // Optimized customer options processing - reduce redundant formatAddress calls
    const customerOptions = React.useMemo(() => {
        if (!customersData?.data) return [];
        
        const options: CustomerOption[] = [];
        
        for (const company of customersData.data) {
            const companyId = company?.company_id != null ? String(company.company_id) : undefined;
            const companyCustomers = Array.isArray(company?.data) ? company.data : [];
            
            for (let idx = 0; idx < companyCustomers.length; idx++) {
                const acc = companyCustomers[idx];
                if (!acc) continue;
                
                // Optimize phone/email extraction with single pass
                const phone = acc?.phone ?? acc?.account_phone ?? acc?.primary_phone ?? acc?.contact_phone ?? "";
                const email = acc?.email ?? acc?.account_email ?? acc?.primary_email ?? acc?.contact_email ?? "";
                
                // Optimize address formatting - try each source once, stop at first success
                let billingAddress = "";
                const billingSources = [acc?.billing_address, acc?.accountAddress?.billingAddress];
                for (const source of billingSources) {
                    const formatted = formatAddress(source);
                    if (formatted) {
                        billingAddress = formatted;
                        break;
                    }
                }
                
                let shippingAddress = "";
                const shippingSources = [acc?.shipping_address, acc?.accountAddress?.shippingAddress];
                for (const source of shippingSources) {
                    const formatted = formatAddress(source);
                    if (formatted) {
                        shippingAddress = formatted;
                        break;
                    }
                }
                
                // Only map contacts if they exist
                const contacts = acc?.contacts ? mapContacts(acc.contacts) : [];
                
                const name = String(acc?.name ?? acc?.account_name ?? "Unnamed Customer");
                if (!name.trim()) continue; // Skip empty names early
                
                options.push({
                    id: String(acc?.id ?? acc?.account_id ?? acc?.accountId ?? `${companyId ?? "company"}-${idx}`),
                    name,
                    phone,
                    email,
                    billingAddress,
                    shippingAddress,
                    companyId,
                    contacts: contacts.length > 0 ? contacts : undefined,
                    raw: acc,
                });
            }
        }
        
        return options;
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
            // Skip if no id or name, or if we've already seen this id
            if (!id || !name || seenIds.has(id)) return;

            seenIds.add(id);
            options.push({
                id,
                name,
                productNumber,
                description,
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

    // Memoize product IDs from rows to optimize dependency tracking
    const productRowProductIds = React.useMemo(
        () => productRows.map(r => r.product?.id).filter(Boolean).join(','),
        [productRows]
    );
    
    // Combined product options including fallback products from current rows
    const combinedProductOptions = React.useMemo(() => {
        const combined = [...productOptions];
        const seenIds = new Set(productOptions.map(p => p.id));
        
        // Add any fallback products from current productRows that aren't already in productOptions
        productRows.forEach((row) => {
            if (row.product && !seenIds.has(row.product.id)) {
                combined.push(row.product);
                seenIds.add(row.product.id);
            }
        });
        
        return combined;
    }, [productOptions, productRowProductIds, productRows]);

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
                productPrice: "",
                productQuantity: "",
                productTotal: "",
            },
        ]);
    }, []);

    // Remove a product row
    const handleRemoveProductRow = React.useCallback((rowId: string) => {
        setProductRows((prevRows) => prevRows.filter((row) => row.id !== rowId));
    }, []);

    // Handle product selection for a specific row
    const handleProductSelect = React.useCallback(
        (rowId: string, _event: React.SyntheticEvent, newValue: ProductOption | null) => {
            if (newValue) {
                updateProductRow(rowId, {
                    product: newValue,
                    productCode: newValue.productNumber ?? "",
                    productDescription: newValue.description ?? "",
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
        [updateProductRow]
    );

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

    // Calculate grand total
    const grandTotal = React.useMemo(() => {
        return netTotal;
    }, [netTotal]);

    const handleCustomerSelect = React.useCallback(
        (_event: React.SyntheticEvent, newValue: CustomerOption | null) => {
            setSelectedCustomer(newValue);
            setSelectedQuote(null); // Clear quote when customer changes
            const initialContacts = newValue?.contacts ?? [];
            setCustomerContacts(initialContacts);
            if (newValue) {
                setCustomerPhone(newValue.phone ?? "");
                setCustomerEmail(newValue.email ?? "");
                
                // Only set addresses from customer if not in edit mode (orderIdFromUrl not present)
                // In edit mode, addresses should always come from orderData
                if (!orderIdFromUrl) {
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
                }
                
                const firstContact = initialContacts[0];
                setSelectedContact(firstContact ?? null);
            } else {
                setCustomerPhone("");
                setCustomerEmail("");
                // Only clear addresses if not in edit mode
                if (!orderIdFromUrl) {
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
                }
                setSelectedContact(null);
                setCustomerContacts([]);
            }
        },
        [orderIdFromUrl]
    );

    React.useEffect(() => {
        if (!selectedCustomer) return;
        const stillExists = filteredCustomerOptions.some((option) => option.id === selectedCustomer.id);
        if (!stillExists) {
            setSelectedCustomer(null);
            setSelectedQuote(null);
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
        
        // Only set addresses from customer detail if not in edit mode
        // In edit mode, addresses should always come from orderData
        if (!orderIdFromUrl) {
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
        }

        const detailContacts = mapContacts(customerDetail.contacts ?? []);
        setCustomerContacts(detailContacts);
        setSelectedContact((prev) => {
            if (detailContacts.length === 0) return null;
            if (!prev) return detailContacts[0];
            const existing = detailContacts.find((contact) => contact.id === prev.id);
            return existing ?? detailContacts[0];
        });
    }, [customerDetail, orderIdFromUrl]);

    // Load billing and shipping addresses immediately when orderData is available (edit mode)
    React.useEffect(() => {
        if (!orderData) return;

        // Set billing address - always load from orderData in edit mode
        if (orderData.billing_address) {
            const billingAddr = parseAddress(orderData.billing_address);
            setBillingAddress(billingAddr.street);
            setBillingPOBox(billingAddr.poBox);
            setBillingCity(billingAddr.city);
            setBillingState(billingAddr.state);
            setBillingCode(billingAddr.code);
            setBillingCountry(billingAddr.country);
        }

        // Set shipping address - always load from orderData in edit mode
        if (orderData.shipping_address) {
            const shippingAddr = parseAddress(orderData.shipping_address);
            setShippingAddress(shippingAddr.street);
            setShippingPOBox(shippingAddr.poBox);
            setShippingCity(shippingAddr.city);
            setShippingState(shippingAddr.state);
            setShippingCode(shippingAddr.code);
            setShippingCountry(shippingAddr.country);
        }
    }, [orderData]);

    // Populate form fields when order data is loaded for editing
    React.useEffect(() => {
        if (!orderData || !customersData || !lookupsData || !customerOptions.length) {
            return;
        }

        // Set order subject
        if (orderData.subject) {
            setOrderSubject(orderData.subject);
        }

        // Set customer
        const accountId = orderData.account_id ? String(orderData.account_id) : null;
        if (accountId && customerOptions.length > 0) {
            const foundCustomer = customerOptions.find((c) => c.id === accountId || c.raw?.id === orderData.account_id || c.raw?.account_id === orderData.account_id);
            if (foundCustomer) {
                setSelectedCustomer(foundCustomer);
                if (foundCustomer.contacts) {
                    setCustomerContacts(foundCustomer.contacts);
                }
            }
        }

        // Set contact (will be set after customer contacts load)
        const contactId = orderData.contact_id ? String(orderData.contact_id) : null;

        // Set IDs and related fields
        if (orderData.carrier_id) {
            setSelectedCarrierId(orderData.carrier_id);
            // Find carrier name from lookups
            const carriers = lookupsData.carriers || lookupsData.carrier || [];
            const carrier = Array.isArray(carriers) ? carriers.find((c: any) => (c?.id ?? c?.carrier_id) === orderData.carrier_id) : null;
            if (carrier) {
                setShippingMethod(carrier?.name ?? carrier?.label ?? "");
            }
        }

        if (orderData.salesorder_status_id) {
            setSelectedStatusId(orderData.salesorder_status_id);
            const statuses = lookupsData.salesorder_statuses || [];
            const status = Array.isArray(statuses) ? statuses.find((s: any) => (s?.id ?? s?.salesorder_status_id) === orderData.salesorder_status_id) : null;
            if (status) {
                setOrderStatus(status?.name ?? status?.label ?? "");
            }
        }

        if (orderData.salesorder_priority_id) {
            setSelectedPriorityId(orderData.salesorder_priority_id);
            const priorities = lookupsData.salesorder_priorities || [];
            const priority = Array.isArray(priorities) ? priorities.find((p: any) => (p?.id ?? p?.salesorder_priority_id) === orderData.salesorder_priority_id) : null;
            if (priority) {
                setOrderPriority(priority?.name ?? priority?.label ?? "");
            }
        }

        if (orderData.certificate_type_id) {
            setSelectedCertificateTypeId(orderData.certificate_type_id);
            const certTypes = lookupsData.certificate_types || [];
            const certType = Array.isArray(certTypes) ? certTypes.find((ct: any) => (ct?.id ?? ct?.certificate_type_id) === orderData.certificate_type_id) : null;
            if (certType) {
                setCertificateType(certType?.name ?? certType?.label ?? "");
            }
        }

        if (orderData.salesorder_type_id) {
            setSelectedTypeId(orderData.salesorder_type_id);
            const types = lookupsData.salesorder_types || [];
            const type = Array.isArray(types) ? types.find((t: any) => (t?.id ?? t?.salesorder_type_id) === orderData.salesorder_type_id) : null;
            if (type) {
                setOrderCategory(type?.name ?? type?.label ?? "");
            }
        }

        // Set dates and text fields
        if (orderData.due_date) {
            const dueDateStr = orderData.due_date;
            // Format date to YYYY-MM-DD for input
            const date = new Date(dueDateStr);
            if (!isNaN(date.getTime())) {
                setDueDate(date.toISOString().split('T')[0]);
            } else {
                setDueDate(dueDateStr);
            }
        }

        if (orderData.po_number) {
            setPoNumber(orderData.po_number);
        }

        // Quote will be set after accountQuotesData loads

        // Set comments
        if (orderData.processing_comments !== null && orderData.processing_comments !== undefined) {
            setProcessingComments(orderData.processing_comments || "");
        }

        if (orderData.shipping_comments !== null && orderData.shipping_comments !== undefined) {
            setShippingComments(orderData.shipping_comments || "");
        }

        if (orderData.special_conditions !== null && orderData.special_conditions !== undefined) {
            setSpecialConditions(orderData.special_conditions || "");
        }

        // Set product rows from line_items - load immediately with all available data
        // In edit mode, product details come from get-salesorder-for-editing API response
        if (orderData.line_items && Array.isArray(orderData.line_items)) {
            const rows: ProductRow[] = orderData.line_items.map((item: any, index: number) => {

                const productId = item.item_id ? String(item.item_id) : null;
                
                // In edit mode, product details come from the API response line_items
                // Extract product details directly from line_item (product details are included in get-salesorder-for-editing response)
                const productNumber = item.product_number || item.productNumber || item.item_code || item.itemCode || "";
                const productName = item.product_name || item.productName || item.item_name || item.itemName || item.internal_name || item.internalName || item.description || item.name || "";
                const productDescription = item.description || item.product_description || item.productDescription || "";
                
                // Create ProductOption from line_item data (product details come from API response)
                let productToUse: ProductOption | null = null;
                if (productId) {
                    productToUse = {
                        id: productId,
                        name: productName || `Item ${productId}`,
                        productNumber: productNumber,
                        description: productDescription,
                        raw: item,
                    };
                }

                return {
                    id: String(index + 1),
                    product: productToUse,
                    productCode: productNumber,
                    productDescription: productDescription,
                    productNotes: item.comment || item.notes || "",
                    productPrice: item.list_price || item.listPrice || item.price ? String(item.list_price || item.listPrice || item.price) : "",
                    productQuantity: item.quantity ? String(item.quantity) : "",
                    productTotal: (item.list_price || item.listPrice || item.price) && item.quantity ? String((item.list_price || item.listPrice || item.price) * item.quantity) : "",
                };
            });

            if (rows.length > 0) {
                setProductRows(rows);
            }
        }
    }, [orderData, customersData, lookupsData, productsData, customerOptions, productOptions]);

    React.useEffect(() => {
        if (orderData?.contact_id && customerContacts.length > 0) {
            const contactId = String(orderData.contact_id);
            const foundContact = customerContacts.find((c) => c.id === contactId);
            if (foundContact) {
                setSelectedContact(foundContact);
            } else if (customerContacts.length > 0) {
                setSelectedContact(customerContacts[0]);
            }
        }
    }, [orderData?.contact_id, customerContacts]);

    // Update product references when productOptions loads (after initial product rows are set)
    // In edit mode, prioritize product details from get-salesorder-for-editing API response (orderData.line_items)
    React.useEffect(() => {
        if (!orderData?.line_items || !Array.isArray(orderData.line_items)) return;

        setProductRows((prevRows) => {
            // Only update if we have the same number of rows as line_items
            if (prevRows.length !== orderData.line_items.length) return prevRows;

            return prevRows.map((row, index) => {
                const item = orderData.line_items[index];
                if (!item) return row;

                const productId = item.item_id ? String(item.item_id) : null;
                
                // In edit mode, product details come from get-salesorder-for-editing API response
                // Extract product details directly from line_item
                const productNumber = item.product_number || item.productNumber || item.item_code || item.itemCode || "";
                const productName = item.product_name || item.productName || item.item_name || item.itemName || item.internal_name || item.internalName || item.description || item.name || "";
                const productDescription = item.description || item.product_description || item.productDescription || "";
                
                // If product is missing or incomplete, create/update it from line_item data
                if (!row.product || (productId && row.product.id !== productId)) {
                    if (productId) {
                        const productFromLineItem: ProductOption = {
                            id: productId,
                            name: productName || `Item ${productId}`,
                            productNumber: productNumber,
                            description: productDescription,
                            raw: item,
                        };
                        return {
                            ...row,
                            product: productFromLineItem,
                            productCode: productNumber || row.productCode || "",
                            productDescription: productDescription || row.productDescription || "",
                        };
                    }
                } else if (row.product && productId && row.product.id === productId) {
                    // Product exists, but update details from line_item if they're more complete
                    // This ensures we use the latest data from the API response
                    const updatedProduct: ProductOption = {
                        ...row.product,
                        productNumber: productNumber || row.product.productNumber || "",
                        description: productDescription || row.product.description || "",
                        raw: item,
                    };
                    return {
                        ...row,
                        product: updatedProduct,
                        productCode: productNumber || row.productCode || "",
                        productDescription: productDescription || row.productDescription || "",
                    };
                }

                return row;
            });
        });
    }, [productOptions, orderData?.line_items]);

    // Set quote from quote_id when order data and quotes are loaded
    React.useEffect(() => {
        if (!orderData?.quote_id || !accountQuotesData) return;

        const quoteId = String(orderData.quote_id);

        // Find quote in accountQuotesData by quote_id
        const findQuote = (data: any): any | null => {
            if (!data) return null;

            // Handle different response structures
            const quotes = data.quotes || data.data || (Array.isArray(data) ? data : []);
            
            for (const quote of quotes) {
                const qId = String(quote?.quote_id ?? quote?.id ?? quote?.quoteId ?? "");
                if (qId === quoteId) {
                    return quote;
                }
            }
            return null;
        };

        const foundQuote = findQuote(accountQuotesData);
        if (foundQuote) {
            const subject = foundQuote.subject ?? foundQuote.name ?? foundQuote.quote_name ?? foundQuote.title ?? "";
            if (subject) {
                const uniqueId = String(foundQuote.quote_id ?? foundQuote.id ?? foundQuote.quoteId ?? quoteId);
                setSelectedQuote({
                    id: uniqueId,
                    name: subject,
                    subject: subject,
                    raw: foundQuote,
                });
            }
        }
    }, [orderData?.quote_id, accountQuotesData]);

    const handleCancel = React.useCallback(() => {
        router.push("/dashboard/orders");
    }, [router]);

    const handleSave = React.useCallback(async () => {
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

        // Validate product rows - check if any row has empty product name
        const hasEmptyProduct = productRows.some((row) => !row.product || !row.product.name || !row.product.name.trim());
        if (hasEmptyProduct) {
            alert("Please select a product name for all product rows before saving.");
            hasErrors = true;
        }

        if (hasErrors) {
            return;
        }

        if (!isLoggedIn || !token) {
            alert("You must be logged in to save an order.");
            return;
        }

        setIsSaving(true);

        try {
        // Convert string IDs to numbers where needed
        const accountId = selectedCustomer?.id ? parseInt(selectedCustomer.id, 10) : null;
        const contactId = selectedContact?.id ? parseInt(selectedContact.id, 10) : null;
        const companyId = effectiveCompanyId ? parseInt(String(effectiveCompanyId), 10) : null;
            const quoteId = selectedQuote?.subject || selectedQuote?.name || null; // Use quote subject as quote_id

        const payload = {
            company_id: companyId,
            subject: orderSubject,
            account_id: accountId,
            contact_id: contactId,
            quote_id: quoteId,
            due_date: dueDate || null,
            customer_no: null,
            po_number: poNumber || null,
            carrier_id: selectedCarrierId,
            salesorder_type_id: selectedTypeId,
            salesorder_status_id: selectedStatusId,
            salesorder_priority_id: selectedPriorityId,
            certificate_type_id: selectedCertificateTypeId,
            special_conditions: specialConditions || null,
            terms_conditions: null,
                shipping_comments: shippingComments || null,
                processing_comments: processingComments || null,
            subtotal: netTotal || 0,
            discount_percent: 0,
            discount_amount: 0,
            adjustment: 0,
            shipping_handling_amount: 0,
            total: grandTotal || 0,
            billing_address: {
                street: billingAddress || "",
                city: billingCity || "",
                state: billingState || "",
                postal_code: billingCode || "",
                country: billingCountry || "",
                po_box: billingPOBox || "",
            },
            shipping_address: {
                street: shippingAddress || "",
                city: shippingCity || "",
                state: shippingState || "",
                postal_code: shippingCode || "",
                country: shippingCountry || "",
                po_box: shippingPOBox || "",
            },
            line_items: productRows.map((row, index) => ({
                sequence_no: index + 1,
                item_id: row.product?.id ? parseInt(row.product.id, 10) : null,
                quantity: row.productQuantity ? parseFloat(row.productQuantity) : 0,
                list_price: row.productPrice ? parseFloat(row.productPrice) : 0,
                discount_percent: 0,
                discount_amount: 0,
                adjustment: 0,
                comment: row.productNotes || null,
                description: row.productDescription || null,
                pricetype_id: null,
            })),
        };

            const url = apiURL("add-salesorder", "add-salesorder.json");
            const res = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                if (res.status === 401) {
                    alert("Unauthorized – please log in again");
                    return;
                }
                const errorText = await res.text();
                throw new Error(`Failed to save order: ${res.status} ${errorText}`);
            }

            const responseData = await res.json();
            alert("Order saved successfully.");
            router.push("/dashboard/orders");
        } catch (error) {
            console.error("Error saving order:", error);
            alert(error instanceof Error ? error.message : "Failed to save order. Please try again.");
        } finally {
            setIsSaving(false);
        }
    }, [
        effectiveCompanyId,
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
        certificateType,
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
        netTotal,
        grandTotal,
        productRows,
        selectedCarrierId,
        selectedTypeId,
        selectedStatusId,
        selectedPriorityId,
        selectedCertificateTypeId,
        poNumber,
        dueDate,
        selectedQuote,
        isLoggedIn,
        token,
        router,
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
                    {orderIdFromUrl ? `Create / Edit Order - ${orderIdFromUrl}` : "Create / Edit Order"}
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                    <Button variant="outlined" onClick={handleCancel} disabled={isSaving}>Cancel</Button>
                    <Button variant="contained" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? "Saving..." : "Save Order"}
                    </Button>
                </Box>
            </Box>

            {/* Display error if order not found or company ID mismatch */}
            {orderError && orderIdFromUrl && (
                <Alert 
                    severity="error" 
                    sx={{ mb: 2 }}
                    action={
                        <Button 
                            color="inherit" 
                            size="small" 
                            onClick={handleCancel}
                        >
                            Go Back
                        </Button>
                    }
                >
                    <Typography variant="body1" fontWeight={600}>
                        {orderError instanceof Error ? orderError.message : "Order not found"}
                    </Typography>
                    {orderError instanceof Error && orderError.message === "Order not found" && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            The order with ID "{orderIdFromUrl}" does not exist or does not belong to your company. 
                            Please check the order ID and try again, or create a new order.
                        </Typography>
                    )}
                </Alert>
            )}

            {/* Show loading state while fetching order */}
            {orderLoading && orderIdFromUrl && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    Loading order data...
                </Alert>
            )}

            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", lg: "1.2fr 0.7fr" },
                    gap: 2,
                    opacity: orderError && orderIdFromUrl ? 0.6 : 1,
                    pointerEvents: orderError && orderIdFromUrl ? "none" : "auto",
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
                                        <Divider sx={{ gridColumn: { xs: "span 1", sm: "span 2" }, my: 2 }} />
                                        {/* Billing and Shipping Address Fields */}
                                        <Box sx={{ gridColumn: { xs: "span 1", sm: "span 2" }, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                                            {/* Billing Information */}
                                            <Box>
                                                <Typography variant="subtitle2" sx={{ mb: 0.75, fontSize: "0.875rem" }}>Billing Information</Typography>
                                                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr" }, gap: 1.125 }}>
                                                    <TextField
                                                        fullWidth
                                                        size="small"
                                                        label="Billing Address"
                                                        value={billingAddress}
                                                        onChange={(event) => setBillingAddress(event.target.value)}
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
                                                    />
                                                    <TextField
                                                        fullWidth
                                                        size="small"
                                                        label="Billing City"
                                                        value={billingCity}
                                                        onChange={(event) => setBillingCity(event.target.value)}
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
                                                    />
                                                </Box>
                                            </Box>
                                            {/* Shipping Information */}
                                            <Box>
                                                <Typography variant="subtitle2" sx={{ mb: 0.75, fontSize: "0.875rem" }}>Shipping Information</Typography>
                                                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr" }, gap: 1.125 }}>
                                                    <TextField
                                                        fullWidth
                                                        size="small"
                                                        label="Shipping Address"
                                                        value={shippingAddress}
                                                        onChange={(event) => setShippingAddress(event.target.value)}
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
                                                    />
                                                    <TextField
                                                        fullWidth
                                                        size="small"
                                                        label="Shipping City"
                                                        value={shippingCity}
                                                        onChange={(event) => setShippingCity(event.target.value)}
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
                                                    />
                                                </Box>
                                            </Box>
                                        </Box>
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
                                        <TextField 
                                            fullWidth 
                                            size="small" 
                                            label="Purchase Order"
                                            value={poNumber}
                                            onChange={(event) => setPoNumber(event.target.value)}
                                        />
                                        <Autocomplete
                                            size="small"
                                            fullWidth
                                            options={quoteOptions}
                                            value={selectedQuote}
                                            onChange={(event, newValue) => setSelectedQuote(newValue)}
                                            loading={accountQuotesLoading}
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
                                                    label="Quote Name"
                                                    placeholder="Select Quote"
                                                    error={!!accountQuotesError}
                                                    helperText={accountQuotesError ? (accountQuotesError instanceof Error ? accountQuotesError.message : "Failed to load quotes") : undefined}
                                                    InputProps={{
                                                        ...params.InputProps,
                                                        endAdornment: (
                                                            <>
                                                                {accountQuotesLoading ? <CircularProgress color="inherit" size={16} /> : null}
                                                                {params.InputProps.endAdornment}
                                                            </>
                                                        ),
                                                    }}
                                                />
                                            )}
                                            noOptionsText={accountQuotesLoading ? "Loading..." : accountQuotesError ? "Error loading quotes" : !selectedCustomerId ? "Select a customer first" : "No quotes found"}
                                            disabled={!selectedCustomerId || !effectiveCompanyId}
                                        />
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
                                                onChange={(event) => {
                                                    const selectedName = event.target.value as string;
                                                    setOrderCategory(selectedName);
                                                    // Find the type ID for the selected name
                                                    const selectedOption = orderCategoryOptions.find(
                                                        (opt) => opt.name === selectedName
                                                    );
                                                    setSelectedTypeId(selectedOption?.id ?? null);
                                                }}
                                                disabled={lookupsLoading}
                                            >
                                                {orderCategoryOptions.length > 0 ? (
                                                    orderCategoryOptions.map((option) => (
                                                        <MenuItem key={option.name} value={option.name}>
                                                            {option.name}
                                                        </MenuItem>
                                                    ))
                                                ) : (
                                                    <MenuItem value="" disabled>
                                                        {lookupsLoading ? "Loading..." : "No options available"}
                                                    </MenuItem>
                                                )}
                                            </Select>
                                        </FormControl>
                                        <TextField 
                                            fullWidth 
                                            size="small" 
                                            label="Due Date" 
                                            type="date" 
                                            value={dueDate}
                                            onChange={(event) => setDueDate(event.target.value)}
                                            InputLabelProps={{ shrink: true }} 
                                        />
                                        <FormControl fullWidth size="small">
                                            <InputLabel id="shipping-method-label">Shipping Method</InputLabel>
                                            <Select
                                                labelId="shipping-method-label"
                                                label="Shipping Method"
                                                value={shippingMethod || ""}
                                                onChange={(event) => {
                                                    const selectedName = event.target.value as string;
                                                    setShippingMethod(selectedName);
                                                    // Find the carrier ID for the selected name
                                                    const selectedOption = shippingMethodOptions.find(
                                                        (opt) => opt.name === selectedName
                                                    );
                                                    setSelectedCarrierId(selectedOption?.id ?? null);
                                                }}
                                                disabled={lookupsLoading}
                                            >
                                                {shippingMethodOptions.length > 0 ? (
                                                    shippingMethodOptions.map((option) => (
                                                        <MenuItem key={option.name} value={option.name}>
                                                            {option.name}
                                                        </MenuItem>
                                                    ))
                                                ) : (
                                                    <MenuItem value="" disabled>
                                                        {lookupsLoading ? "Loading..." : "No options available"}
                                                    </MenuItem>
                                                )}
                                            </Select>
                                        </FormControl>
                                        <FormControl fullWidth size="small">
                                            <InputLabel id="order-status-label">Status</InputLabel>
                                            <Select
                                                labelId="order-status-label"
                                                label="Status"
                                                value={orderStatus || ""}
                                                onChange={(event) => {
                                                    const selectedName = event.target.value as string;
                                                    setOrderStatus(selectedName);
                                                    // Find the status ID for the selected name
                                                    const selectedOption = orderStatusOptions.find(
                                                        (opt) => opt.name === selectedName
                                                    );
                                                    setSelectedStatusId(selectedOption?.id ?? null);
                                                }}
                                                disabled={lookupsLoading}
                                            >
                                                {orderStatusOptions.length > 0 ? (
                                                    orderStatusOptions.map((option) => (
                                                        <MenuItem key={option.name} value={option.name}>
                                                            {option.name}
                                                        </MenuItem>
                                                    ))
                                                ) : (
                                                    <MenuItem value="" disabled>
                                                        {lookupsLoading ? "Loading..." : "No options available"}
                                                    </MenuItem>
                                                )}
                                            </Select>
                                        </FormControl>
                                        <FormControl fullWidth size="small">
                                            <InputLabel id="order-priority-label">Priority</InputLabel>
                                            <Select
                                                labelId="order-priority-label"
                                                label="Priority"
                                                value={orderPriority || ""}
                                                onChange={(event) => {
                                                    const selectedName = event.target.value as string;
                                                    setOrderPriority(selectedName);
                                                    // Find the priority ID for the selected name
                                                    const selectedOption = orderPriorityOptions.find(
                                                        (opt) => opt.name === selectedName
                                                    );
                                                    setSelectedPriorityId(selectedOption?.id ?? null);
                                                }}
                                                disabled={lookupsLoading}
                                            >
                                                {orderPriorityOptions.length > 0 ? (
                                                    orderPriorityOptions.map((option) => (
                                                        <MenuItem key={option.name} value={option.name}>
                                                            {option.name}
                                                        </MenuItem>
                                                    ))
                                                ) : (
                                                    <MenuItem value="" disabled>
                                                        {lookupsLoading ? "Loading..." : "No options available"}
                                                    </MenuItem>
                                                )}
                                            </Select>
                                        </FormControl>
                                        <FormControl fullWidth size="small">
                                            <InputLabel id="certificate-type-label">Certificate Type</InputLabel>
                                            <Select
                                                labelId="certificate-type-label"
                                                label="Certificate Type"
                                                value={certificateType || ""}
                                                onChange={(event) => {
                                                    const selectedName = event.target.value as string;
                                                    setCertificateType(selectedName);
                                                    // Find the certificate type ID for the selected name
                                                    const selectedOption = certificateTypeOptions.find(
                                                        (opt) => opt.name === selectedName
                                                    );
                                                    setSelectedCertificateTypeId(selectedOption?.id ?? null);
                                                }}
                                                disabled={lookupsLoading}
                                            >
                                                {certificateTypeOptions.length > 0 ? (
                                                    certificateTypeOptions.map((option) => (
                                                        <MenuItem key={option.name} value={option.name}>
                                                            {option.name}
                                                        </MenuItem>
                                                    ))
                                                ) : (
                                                    <MenuItem value="" disabled>
                                                        {lookupsLoading ? "Loading..." : "No options available"}
                                                    </MenuItem>
                                                )}
                                            </Select>
                                        </FormControl>
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
                            <Typography variant="caption" fontWeight={600}>
                                Price
                            </Typography>
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
                                        options={combinedProductOptions}
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
                        {/* Net Total and Grand Total Rows */}
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

                {false && (
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

                {false && (
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

                    {/* Only render active tab content for better performance */}
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
                                        <Button variant="contained" size="small" onClick={handleSave} disabled={isSaving}>
                                            {isSaving ? "Saving..." : "Submit"}
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



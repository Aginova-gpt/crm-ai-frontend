"use client";

import * as React from "react";
import {
    Box,
    Typography,
    TextField,
    Divider,
    Button,
    IconButton,
    Tooltip,
    Paper,
    CircularProgress,
    Alert,
} from "@mui/material";
import { MdSearch } from "react-icons/md";
import { DeleteOutline } from "@mui/icons-material";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import type { SelectChangeEvent } from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { useRouter } from "next/navigation";
import Autocomplete from "@mui/material/Autocomplete";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../../../contexts/AuthContext";
import { useBackend } from "../../../../contexts/BackendContext";
import { useCompany } from "../../../../contexts/CompanyContext";
import { useProfile } from "../../../../contexts/ProfileContext";
import { useProducts } from "../../products/hooks/useProducts";
import { useCompanyCustomers } from "../../customers/hooks/useCompanyCustomers";

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
    id: string;
    name: string;
    subject: string;
    quote_id: number | null;
    raw?: any;
};

// Helper types and functions
type NamedOption = { id: number | string | null; name: string };

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
    return rawContacts
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
        .filter((contact): contact is ContactOption => contact !== null);
}

type ProductRow = {
    id: string;
    product: ProductOption | null;
    productCode: string;
    productDescription: string;
    productNotes: string;
    productPrice: string;
    productQuantity: string;
    productTotal: string;
    salesorder_item_id?: number | null;
};

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
                `get-salesorder-for-editing?salesorder_id=${encodeURIComponent(
                    salesorderId
                )}&company_id=${encodeURIComponent(companyId)}`,
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
            if (!salesorder) {
                throw new Error("Order not found");
            }
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
        retry: false,
    });
}

type OrderFormProps = {
    mode?: "create" | "edit";
    orderIdFromParams?: string | null;
};

// Matches ProductForm behavior exactly
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

export default function OrderForm(props: OrderFormProps = {}) {
    const router = useRouter();
    const [orderIdFromUrl, setOrderIdFromUrl] = React.useState<string | null>(
        props.orderIdFromParams ?? null
    );

    React.useEffect(() => {
        if (props.orderIdFromParams !== undefined) {
            setOrderIdFromUrl(props.orderIdFromParams ?? null);
            return;
        }
        if (typeof window === "undefined") return;
        const params = new URLSearchParams(window.location.search);
        const id =
            params.get("orderId") ?? params.get("orderID") ?? params.get("orderid");
        setOrderIdFromUrl(id);
    }, [props.orderIdFromParams]);

    const { selectedCompanyId, userCompanyId } = useCompany();
    const { isAdmin } = useProfile();
    const { token, isLoggedIn } = useAuth();
    const { apiURL } = useBackend();

    const [orderStatusError, setOrderStatusError] = React.useState("");
    const [lineItemsError, setLineItemsError] = React.useState("");

    const [orderSubject, setOrderSubject] = React.useState("");
    const [orderSubjectError, setOrderSubjectError] = React.useState("");
    const [customerNameError, setCustomerNameError] = React.useState("");
    const [selectedCustomer, setSelectedCustomer] =
        React.useState<CustomerOption | null>(null);
    const selectedCustomerId = selectedCustomer?.id ?? null;

    const decodedToken = React.useMemo(() => {
        if (!token) return null;
        try {
            const [_, payload] = token.split(".");
            if (!payload) return null;
            const json =
                typeof window !== "undefined"
                    ? atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
                    : Buffer.from(payload, "base64").toString("utf-8");
            return JSON.parse(json);
        } catch {
            return null;
        }
    }, [token]);

    const effectiveCompanyId = React.useMemo(
        () => (isAdmin ? selectedCompanyId : userCompanyId),
        [isAdmin, selectedCompanyId, userCompanyId]
    );

    // ✅ Use shared company customers hook – only accounts for this company
    const {
        data: customersData,
        isLoading: customersLoading,
        error: customersError,
    } = useCompanyCustomers();

    const { data: lookupsData, isLoading: lookupsLoading } = useSalesOrderLookups();

    const [selectedCarrierId, setSelectedCarrierId] = React.useState<number | null>(
        null
    );
    const [selectedStatusId, setSelectedStatusId] = React.useState<number | null>(null);
    const [selectedPriorityId, setSelectedPriorityId] =
        React.useState<number | null>(null);
    const [selectedCertificateTypeId, setSelectedCertificateTypeId] =
        React.useState<number | null>(null);
    const [specialConditions, setSpecialConditions] = React.useState("");
    const [selectedTypeId, setSelectedTypeId] = React.useState<number | null>(null);
    const [shipmentAccount, setShipmentAccount] = React.useState("");
    const [poNumber, setPoNumber] = React.useState("");
    const [dueDate, setDueDate] = React.useState("");
    const [selectedQuote, setSelectedQuote] = React.useState<QuoteOption | null>(null);
    const [isSaving, setIsSaving] = React.useState(false);
    const [customerPhone, setCustomerPhone] = React.useState("");
    const [customerEmail, setCustomerEmail] = React.useState("");

    const [billingAddress, setBillingAddress] = React.useState("");
    const [billingPOBox, setBillingPOBox] = React.useState("");
    const [billingCity, setBillingCity] = React.useState("");
    const [billingState, setBillingState] = React.useState("");
    const [billingCode, setBillingCode] = React.useState("");
    const [billingCountry, setBillingCountry] = React.useState("");

    const [shippingAddress, setShippingAddress] = React.useState("");
    const [shippingPOBox, setShippingPOBox] = React.useState("");
    const [shippingCity, setShippingCity] = React.useState("");
    const [shippingState, setShippingState] = React.useState("");
    const [shippingCode, setShippingCode] = React.useState("");
    const [shippingCountry, setShippingCountry] = React.useState("");
    const [customerContacts, setCustomerContacts] = React.useState<ContactOption[]>([]);
    const [selectedContact, setSelectedContact] =
        React.useState<ContactOption | null>(null);
    const [shippingComments, setShippingComments] = React.useState("");
    const [processingComments, setProcessingComments] = React.useState("");

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

    const {
        data: accountQuotesData,
        isLoading: accountQuotesLoading,
        error: accountQuotesError,
    } = useAccountQuotes(
        selectedCustomerId,
        effectiveCompanyId ? String(effectiveCompanyId) : null
    );

    const {
        data: customerDetail,
        isFetching: customerDetailLoading,
        error: customerDetailError,
    } = useCustomerDetail(selectedCustomerId);

    const {
        data: productsData,
        isLoading: productsLoading,
        error: productsError,
    } = useProductDirectory(effectiveCompanyId ? String(effectiveCompanyId) : null);

    const {
        data: orderData,
        isLoading: orderLoading,
        error: orderError,
    } = useSalesOrderForEditing(
        orderIdFromUrl,
        effectiveCompanyId ? String(effectiveCompanyId) : null
    );

    const isBusy =
        customersLoading || productsLoading || lookupsLoading || orderLoading || isSaving;



    // Populate form when editing and order data arrives
    React.useEffect(() => {
        if (!orderData) return;
        const so: any = orderData;

        setOrderSubject(String(so.subject ?? so.order_subject ?? ""));
        setPoNumber(String(so.po_number ?? so.po ?? ""));
        setDueDate(so.due_date ?? so.due ?? "");

        if (so.salesorder_status_id != null)
            setSelectedStatusId(Number(so.salesorder_status_id));

        if (so.salesorder_priority_id != null)
            setSelectedPriorityId(Number(so.salesorder_priority_id));

        if (so.salesorder_type_id != null)
            setSelectedTypeId(Number(so.salesorder_type_id));

        if (so.certificate_type_id != null)
            setSelectedCertificateTypeId(Number(so.certificate_type_id));

        if (so.carrier_id != null) setSelectedCarrierId(Number(so.carrier_id));

        setShipmentAccount(String(so.customer_no ?? so.shipment_account ?? ""));
        setSpecialConditions(String(so.special_conditions ?? ""));

        const billingParsed = parseAddress(
            so.billing_address ?? so.accountBillingAddress
        );
        setBillingAddress(billingParsed.street);
        setBillingPOBox(billingParsed.poBox);
        setBillingCity(billingParsed.city);
        setBillingState(billingParsed.state);
        setBillingCode(billingParsed.code);
        setBillingCountry(billingParsed.country);

        const shippingParsed = parseAddress(
            so.shipping_address ?? so.accountShippingAddress
        );
        setShippingAddress(shippingParsed.street);
        setShippingPOBox(shippingParsed.poBox);
        setShippingCity(shippingParsed.city);
        setShippingState(shippingParsed.state);
        setShippingCode(shippingParsed.code);
        setShippingCountry(shippingParsed.country);

        setShippingComments(String(so.shipping_comments ?? ""));
        setProcessingComments(String(so.processing_comments ?? ""));

        let items: any[] =
            (Array.isArray(so.products) && so.products) ||
            (Array.isArray(so.items) && so.items) ||
            (Array.isArray(so.salesorder_items) && so.salesorder_items) ||
            [];
        if (!items.length && Array.isArray(so.line_items)) {
            items = so.line_items;
        }
        if (items.length) {
            const mapped: ProductRow[] = items.map((it, idx) => ({
                id: String(it.salesorder_item_id ?? it.id ?? idx + 1),
                product:
                    it.product_id ?? it.item_id
                        ? {
                            id: String(it.product_id ?? it.item_id),
                            name: String(
                                it.product_name ?? it.item_name ?? it.name ?? ""
                            ),
                            productNumber:
                                it.product_code_reference ??
                                it.product_number ??
                                it.item_code ??
                                "",
                            description: String(
                                it.product_name ?? it.item_name ?? it.name ?? ""
                            ),
                            raw: it,
                        }
                        : null,
                productCode: String(
                    it.product_code_reference ??
                    it.product_number ??
                    it.item_code ??
                    ""
                ),
                productDescription: String(
                    it.product_name ?? it.item_name ?? it.name ?? ""
                ),
                productNotes: String(it.product_notes ?? it.notes ?? ""),
                productPrice: String(
                    it.price ?? it.unit_price ?? it.list_price ?? ""
                ),
                productQuantity: String(it.quantity ?? it.qty ?? ""),
                productTotal: String(
                    it.total ??
                    it.line_total ??
                    (it.list_price != null && it.quantity != null
                        ? Number(it.list_price) * Number(it.quantity)
                        : "")
                ),
                salesorder_item_id:
                    it.salesorder_item_id != null
                        ? Number(it.salesorder_item_id)
                        : null,
            }));
            setProductRows(
                mapped.length
                    ? mapped
                    : [
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
                    ]
            );
        }
    }, [orderData]);

    const quoteOptions: QuoteOption[] = React.useMemo(() => {
        if (!accountQuotesData || !Array.isArray(accountQuotesData)) return [];
        return accountQuotesData.map((q: any, index: number) => ({
            id: String(q.quote_id ?? q.id ?? index),
            name: q.subject ?? q.quote_no ?? `Quote ${index + 1}`,
            subject: q.subject ?? "",
            quote_id: q.quote_id ?? q.id ?? null,
            raw: q,
        }));
    }, [accountQuotesData]);

    // ✅ Only customers for this company (because hook calls /accounts?company_id=...)
    const filteredCustomerOptions: CustomerOption[] = React.useMemo(() => {
        if (!customersData?.customers) return [];

        return customersData.customers
            .map((c) => ({
                id: c.id,
                name: c.name,
                phone: c.phone ?? "",
                email: c.email ?? "",
                companyId: c.company_id ?? undefined,
                raw: c, // keep raw around in case you need more fields later
            }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [customersData]);

    // Select customer from order once customers list is available
    React.useEffect(() => {
        if (!orderData || !filteredCustomerOptions.length) return;
        const so: any = orderData;
        const cid = so.customer_id ?? so.account_id ?? so.accountId;
        const cname = so.customer_name ?? so.account_name ?? so.customer;
        let match: CustomerOption | null = null;
        if (cid != null) {
            match =
                filteredCustomerOptions.find((c) => c.id === String(cid)) ?? null;
        }
        if (!match && cname) {
            match =
                filteredCustomerOptions.find(
                    (c) =>
                        c.name?.toLowerCase() === String(cname).toLowerCase()
                ) ?? null;
        }
        if (match) {
            setSelectedCustomer(match);
            if (match.phone) setCustomerPhone(match.phone);
            if (match.email) setCustomerEmail(match.email);
        }
    }, [orderData, filteredCustomerOptions]);

    // Select quote from order once account quotes are available
    React.useEffect(() => {
        if (!orderData || !Array.isArray(quoteOptions) || quoteOptions.length === 0)
            return;
        const so: any = orderData;
        const qid = so.quote_id ?? so.sales_quote_id ?? null;
        if (!qid) return;
        const match = quoteOptions.find((q) => q.quote_id === qid);
        if (match) setSelectedQuote(match);
    }, [orderData, quoteOptions]);

    const combinedProductOptions: ProductOption[] = React.useMemo(() => {
        const options: ProductOption[] = [];
        const seenIds = new Set<string>();
        const pushProduct = (p: any) => {
            if (!p) return;
            const id = String(p.product_id ?? p.id ?? "");
            const name = p.internal_name ?? p.product_name ?? p.name ?? "";
            const productNumber = p.product_number ?? p.productNumber ?? "";
            const description = p.description ?? "";
            if (!id || !name || seenIds.has(id)) return;
            seenIds.add(id);
            options.push({ id, name, productNumber, description, raw: p });
        };
        if (productsData?.products && Array.isArray(productsData.products)) {
            productsData.products.forEach(pushProduct);
        } else if (productsData?.data && Array.isArray(productsData.data)) {
            productsData.data.forEach((group: any) => {
                if (group && Array.isArray(group.products)) {
                    group.products.forEach(pushProduct);
                }
            });
        } else if (Array.isArray(productsData)) {
            productsData.forEach(pushProduct);
        }
        return options;
    }, [productsData]);

    const orderStatusOptions: NamedOption[] = React.useMemo(() => {
        const d: any = (lookupsData as any)?.data ?? lookupsData ?? {};
        const src: any[] = Array.isArray(d?.salesorder_statuses)
            ? d.salesorder_statuses
            : [];
        return src.map((s: any) => ({
            id: s?.salesorder_status_id ?? s?.id ?? null,
            name:
                s?.status_name ??
                s?.salesorder_status_name ??
                String(s?.name ?? ""),
        }));
    }, [lookupsData]);

    const orderPriorityOptions: NamedOption[] = React.useMemo(() => {
        const d: any = (lookupsData as any)?.data ?? lookupsData ?? {};
        const src: any[] = Array.isArray(d?.salesorder_priorities)
            ? d.salesorder_priorities
            : [];
        return src.map((p: any) => ({
            id: p?.salesorder_priority_id ?? p?.id ?? null,
            name:
                p?.priority_name ??
                p?.salesorder_priority_name ??
                String(p?.name ?? ""),
        }));
    }, [lookupsData]);

    const orderCategoryOptions: NamedOption[] = React.useMemo(() => {
        const d: any = (lookupsData as any)?.data ?? lookupsData ?? {};
        const src: any[] = Array.isArray(d?.salesorder_types)
            ? d.salesorder_types
            : [];
        return src.map((t: any) => ({
            id: t?.salesorder_type_id ?? t?.id ?? null,
            name:
                t?.type_name ??
                t?.salesorder_type_name ??
                String(t?.name ?? ""),
        }));
    }, [lookupsData]);

    const shippingMethodOptions: NamedOption[] = React.useMemo(() => {
        const d: any = (lookupsData as any)?.data ?? lookupsData ?? {};
        const src: any[] = Array.isArray(d?.carriers) ? d.carriers : [];
        return src.map((c: any) => ({
            id: c?.carrier_id ?? c?.id ?? null,
            name: c?.carrier_name ?? String(c?.name ?? ""),
        }));
    }, [lookupsData]);

    const certificateTypeOptions: NamedOption[] = React.useMemo(() => {
        const d: any = (lookupsData as any)?.data ?? lookupsData ?? {};
        const src: any[] = Array.isArray(d?.certificate_types)
            ? d.certificate_types
            : [];
        return src.map((c: any) => ({
            id: c?.certificate_type_id ?? c?.id ?? null,
            name:
                c?.certificate_name ??
                c?.certificate_type_name ??
                String(c?.name ?? ""),
        }));
    }, [lookupsData]);

    const netTotal = React.useMemo(() => {
        return productRows.reduce((sum, row) => {
            const line = parseFloat(row.productTotal || "0");
            return sum + (Number.isFinite(line) ? line : 0);
        }, 0);
    }, [productRows]);

    const grandTotal = React.useMemo(() => netTotal, [netTotal]);

    const handleCustomerSelect = React.useCallback(
        (_event: React.SyntheticEvent, newValue: CustomerOption | null) => {
            setSelectedCustomer(newValue);
            if (!newValue) {
                setCustomerContacts([]);
                return;
            }
            const contacts = newValue.raw?.contacts ?? newValue.raw?.contact_list ?? [];
            const mapped = mapContacts(contacts);
            setCustomerContacts(mapped);
            if (newValue.phone) setCustomerPhone(newValue.phone);
            if (newValue.email) setCustomerEmail(newValue.email);
        },
        []
    );

    React.useEffect(() => {
        if (!selectedCustomer) return;
        const stillExists = filteredCustomerOptions.some(
            (option) => option.id === selectedCustomer.id
        );
        if (!stillExists) {
            setSelectedCustomer(null);
            setCustomerContacts([]);
            setSelectedContact(null);
        }
    }, [filteredCustomerOptions, selectedCustomer]);

    // Clear addresses when account changes
    React.useEffect(() => {
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
    }, [selectedCustomer?.id]);

    // Populate addresses from customer detail
    React.useEffect(() => {
        if (!customerDetail) return;
        const billing = parseAddress(
            customerDetail.billing_address ?? customerDetail.accountBillingAddress
        );
        const shipping = parseAddress(
            customerDetail.shipping_address ?? customerDetail.accountShippingAddress
        );
        setBillingAddress(billing.street || "");
        setBillingPOBox(billing.poBox || "");
        setBillingCity(billing.city || "");
        setBillingState(billing.state || "");
        setBillingCode(billing.code || "");
        setBillingCountry(billing.country || "");
        setShippingAddress(shipping.street || "");
        setShippingPOBox(shipping.poBox || "");
        setShippingCity(shipping.city || "");
        setShippingState(shipping.state || "");
        setShippingCode(shipping.code || "");
        setShippingCountry(shipping.country || "");
    }, [customerDetail, selectedCustomer?.id]);

    // Populate contact list from customer detail and pre-select contact on edit
    React.useEffect(() => {
        if (!customerDetail) {
            setCustomerContacts([]);
            setSelectedContact(null);
            return;
        }
        const rawContacts: any[] =
            (Array.isArray((customerDetail as any).contacts) &&
                (customerDetail as any).contacts) ||
            (Array.isArray((customerDetail as any).contact_list) &&
                (customerDetail as any).contact_list) ||
            (Array.isArray((customerDetail as any)?.data?.contacts) &&
                (customerDetail as any).data.contacts) ||
            [];
        const mapped = mapContacts(rawContacts);
        setCustomerContacts(mapped);

        const existingContactId = (orderData as any)?.contact_id;
        if (existingContactId != null) {
            const found = mapped.find((c) => c.id === String(existingContactId));
            setSelectedContact(found ?? null);
        } else {
            if (mapped.length === 0) {
                setSelectedContact(null);
            }
        }
    }, [customerDetail, orderData]);

    const handleAddProductRow = React.useCallback(() => {
        setProductRows((prev) => [
            ...prev,
            {
                id: String(prev.length + 1),
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

    const handleRemoveProductRow = React.useCallback((rowId: string) => {
        setProductRows((prev) => prev.filter((row) => row.id !== rowId));
    }, []);

    const handleProductSelect = React.useCallback(
        (rowId: string, _event: React.SyntheticEvent, product: ProductOption | null) => {
            setProductRows((prev) => {
                return prev.map((row) => {
                    if (row.id !== rowId) return row;
                    const next: ProductRow = {
                        ...row,
                        product,
                        productCode: product?.productNumber ?? row.productCode,
                        productDescription: product?.name ?? row.productDescription,
                    };
                    return next;
                });
            });
        },
        []
    );

    const handleQuantityChange = React.useCallback(
        (rowId: string, event: React.ChangeEvent<HTMLInputElement>) => {
            const value = event.target.value;
            setProductRows((prev) => {
                return prev.map((row) => {
                    if (row.id !== rowId) return row;
                    const next: ProductRow = { ...row, productQuantity: value };
                    const qty = parseFloat(next.productQuantity || "0") || 0;
                    const price = parseFloat(next.productPrice || "0") || 0;
                    next.productTotal = Number.isFinite(qty * price)
                        ? (qty * price).toFixed(2)
                        : next.productTotal;
                    return next;
                });
            });
        },
        []
    );

    const handlePriceChange = React.useCallback(
        (rowId: string, event: React.ChangeEvent<HTMLInputElement>) => {
            const value = event.target.value;
            setProductRows((prev) => {
                return prev.map((row) => {
                    if (row.id !== rowId) return row;
                    const next: ProductRow = { ...row, productPrice: value };
                    const qty = parseFloat(next.productQuantity || "0") || 0;
                    const price = parseFloat(next.productPrice || "0") || 0;
                    next.productTotal = Number.isFinite(qty * price)
                        ? (qty * price).toFixed(2)
                        : next.productTotal;
                    return next;
                });
            });
        },
        []
    );

    const handleProductFieldChange = React.useCallback(
        (rowId: string, field: keyof ProductRow, value: string) => {
            setProductRows((prev) => {
                return prev.map((row) => {
                    if (row.id !== rowId) return row;
                    const next: ProductRow = { ...row, [field]: value } as ProductRow;
                    if (field === "productPrice" || field === "productQuantity") {
                        const qty = parseFloat(next.productQuantity || "0") || 0;
                        const price = parseFloat(next.productPrice || "0") || 0;
                        next.productTotal = Number.isFinite(qty * price)
                            ? (qty * price).toFixed(2)
                            : next.productTotal;
                    }
                    return next;
                });
            });
        },
        []
    );

    const handleCancel = React.useCallback(() => {
        router.push("/dashboard/orders");
    }, [router]);

    const handleSave = React.useCallback(async () => {
        let hasErrors = false;
        setOrderSubjectError("");
        setCustomerNameError("");
        setOrderStatusError("");
        setLineItemsError("");

        if (!orderSubject.trim()) {
            setOrderSubjectError("Order Subject is required");
            hasErrors = true;
        }
        if (!selectedCustomer) {
            setCustomerNameError("Customer Name is required");
            hasErrors = true;
        }
        if (selectedStatusId == null) {
            setOrderStatusError("Status is required");
            hasErrors = true;
        }
        const activeRows = productRows.filter(
            (row) =>
                row.productDescription ||
                row.productCode ||
                row.product?.id
        );

        if (activeRows.length === 0) {
            setLineItemsError("At least one product line is required");
            hasErrors = true;
        } else {
            const invalidRow = activeRows.find((row) => {
                const qty = parseFloat(row.productQuantity || "0") || 0;
                const hasProduct = row.product?.id != null;
                return !hasProduct || qty <= 0;
            });
            if (invalidRow) {
                setLineItemsError(
                    "Each product line must have a selected product and quantity greater than 0"
                );
                hasErrors = true;
            }
        }

        if (hasErrors) return;
        if (!isLoggedIn || !token) {
            alert("You must be logged in to save orders.");
            return;
        }

        setIsSaving(true);
        try {
            const lineItemsPayload = productRows
                .filter(
                    (row) =>
                        row.productDescription ||
                        row.productCode ||
                        row.product?.id
                )
                .map((row, idx) => ({
                    salesorder_item_id: row.salesorder_item_id ?? null,
                    sequence_no: idx + 1,
                    item_id:
                        row.product?.id != null ? Number(row.product.id) : null,
                    item_code:
                        row.productCode || row.product?.productNumber || null,
                    item_name:
                        row.productDescription || row.product?.name || null,
                    quantity: parseFloat(row.productQuantity || "0") || 0,
                    list_price: parseFloat(row.productPrice || "0") || 0,
                    discount_percent: 0,
                    discount_amount: 0,
                    adjustment: 0,
                    comment: row.productNotes || "",
                    pricetype_id: null,
                }));

            const salesorderPayload: any = {
                subject: orderSubject.trim(),
                company_id: normalizeNumericId(effectiveCompanyId) ?? 0,
                account_id: selectedCustomer ? Number(selectedCustomer.id) : null,
                contact_id: selectedContact ? Number(selectedContact.id) : null,
                quote_id: selectedQuote?.quote_id ?? null,
                due_date: dueDate || null,
                customer_no: shipmentAccount || null,
                po_number: poNumber || null,
                carrier_id: selectedCarrierId,
                salesorder_type_id: selectedTypeId,
                salesorder_status_id: selectedStatusId,
                salesorder_priority_id: selectedPriorityId,
                certificate_type_id: selectedCertificateTypeId,
                hosting: false,
                emailed: false,
                subtotal: netTotal || 0,
                discount_percent: 0,
                discount_amount: 0,
                adjustment: 0,
                shipping_handling_amount: 0,
                total: grandTotal || 0,
                special_conditions: specialConditions || null,
                shipping_comments: shippingComments || null,
                processing_comments: processingComments || null,
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
                line_items: lineItemsPayload,
            };

            const isEditMode = !!orderIdFromUrl;
            if (isEditMode) {
                salesorderPayload.salesorder_id = parseInt(
                    orderIdFromUrl as string,
                    10
                );
            }

            const url = isEditMode
                ? apiURL("edit-salesorder", "edit-salesorder.json")
                : apiURL("add-salesorder", "add-salesorder.json");
            const method = isEditMode ? "PUT" : "POST";
            const payload = isEditMode
                ? { salesorder: salesorderPayload }
                : salesorderPayload;

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(
                    `Failed to save order: ${res.status} ${errorText}`
                );
            }

            await res.json().catch(() => null);
            alert("Order saved successfully.");
            router.push("/dashboard/orders");
        } catch (error) {
            console.error("Error saving order:", error);
            alert(
                error instanceof Error
                    ? error.message
                    : "Failed to save order. Please try again."
            );
        } finally {
            setIsSaving(false);
        }
    }, [
        effectiveCompanyId,
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
        orderSubject,
        router,
        selectedCustomer,
        selectedContact,
        shipmentAccount,
        shippingComments,
        processingComments,
        specialConditions,
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
        orderIdFromUrl,
        apiURL,
        orderData,
    ]);

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                bgcolor: "#F3F5F9",
                p: 2,
                minHeight: "100vh",
            }}
        >
            {/* Header */}
            <Paper
                elevation={0}
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
                    {orderIdFromUrl
                        ? `Edit Order - ${orderIdFromUrl}`
                        : "Create Order"}
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                        variant="outlined"
                        onClick={handleCancel}
                        disabled={isSaving}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSave}
                        disabled={isBusy}
                    >
                        {isSaving ? "Saving..." : "Save Order"}
                    </Button>
                </Box>
            </Paper>

            {orderIdFromUrl && !orderLoading && orderError && (
                <Alert severity="error">
                    The specified order could not be found. You can still create a
                    new order.
                </Alert>
            )}

            {(customersLoading ||
                productsLoading ||
                lookupsLoading ||
                orderLoading) && (
                    <Alert
                        severity="info"
                        icon={<CircularProgress size={16} />}
                    >
                        Loading data...
                    </Alert>
                )}

            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", lg: "1.2fr 0.7fr" },
                    gap: 2,
                }}
            >
                {/* LEFT PANEL: order details & products */}
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
                            <Typography
                                variant="body2"
                                color="text.secondary"
                            ></Typography>
                        </Box>
                        <Divider />
                        <Box
                            sx={{
                                display: "grid",
                                gap: 2,
                                mt: 0.5,
                                gridTemplateColumns: {
                                    xs: "1fr",
                                    md: "0.75fr 1.25fr",
                                },
                            }}
                        >
                            {/* Customer + Contact */}
                            <Box
                                sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 1.125,
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
                                    "& .MuiSelect-select": {
                                        fontSize: "0.75rem",
                                        padding: "6px 12px",
                                    },
                                    "& .MuiFormControl-root": {
                                        fontSize: "0.75rem",
                                    },
                                    "& .MuiTypography-root": {
                                        fontSize: "0.875rem",
                                    },
                                }}
                            >
                                <Autocomplete
                                    size="small"
                                    options={filteredCustomerOptions}
                                    value={selectedCustomer}
                                    onChange={(event, newValue) => {
                                        handleCustomerSelect(event, newValue);
                                        if (customerNameError)
                                            setCustomerNameError("");
                                    }}
                                    loading={customersLoading}
                                    disableClearable={false}
                                    isOptionEqualToValue={(option, value) =>
                                        option.id === value.id
                                    }
                                    getOptionLabel={(option) =>
                                        option?.name ?? ""
                                    }
                                    renderOption={(props, option) => (
                                        <li {...props} key={option.id}>
                                            {option.name}
                                        </li>
                                    )}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Customer"
                                            placeholder="Select Customer"
                                            size="small"
                                            error={!!customerNameError}
                                            helperText={
                                                customerNameError || undefined
                                            }
                                            InputProps={{
                                                ...params.InputProps,
                                                endAdornment: (
                                                    <>
                                                        {customersLoading ? (
                                                            <CircularProgress
                                                                color="inherit"
                                                                size={16}
                                                            />
                                                        ) : null}
                                                        {
                                                            params.InputProps
                                                                .endAdornment
                                                        }
                                                    </>
                                                ),
                                            }}
                                        />
                                    )}
                                />
                                {customerDetailLoading && selectedCustomer ? (
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                    >
                                        Loading latest customer details…
                                    </Typography>
                                ) : null}
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Customer Phone"
                                    value={customerPhone}
                                    onChange={(e) =>
                                        setCustomerPhone(e.target.value)
                                    }
                                />
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Customer Email"
                                    value={customerEmail}
                                    onChange={(e) =>
                                        setCustomerEmail(e.target.value)
                                    }
                                />
                                <Autocomplete
                                    size="small"
                                    options={customerContacts}
                                    value={selectedContact}
                                    onChange={(_, contact) =>
                                        setSelectedContact(contact)
                                    }
                                    getOptionLabel={(option) =>
                                        option?.name ?? ""
                                    }
                                    isOptionEqualToValue={(option, value) =>
                                        option.id === value.id
                                    }
                                    renderOption={(props, option) => (
                                        <li {...props} key={option.id}>
                                            {option.name}
                                        </li>
                                    )}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Contact Name"
                                            size="small"
                                        />
                                    )}
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
                            </Box>

                            {/* Right column section: Order Details (PO/Quote/etc) */}
                            <Box
                                sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 1.125,
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
                                    "& .MuiSelect-select": {
                                        fontSize: "0.75rem",
                                        padding: "6px 12px",
                                    },
                                    "& .MuiFormControl-root": {
                                        fontSize: "0.75rem",
                                    },
                                    "& .MuiTypography-root": {
                                        fontSize: "0.875rem",
                                    },
                                }}
                            >
                                <Typography
                                    variant="subtitle2"
                                    sx={{ fontSize: "0.875rem" }}
                                >
                                    Order Details
                                </Typography>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Order Subject"
                                    value={orderSubject}
                                    onChange={(e) => {
                                        setOrderSubject(e.target.value);
                                        if (orderSubjectError) setOrderSubjectError("");
                                    }}
                                    error={!!orderSubjectError}
                                    helperText={orderSubjectError || ""}
                                />
                                <Box
                                    sx={{
                                        display: "grid",
                                        gap: 1.125,
                                        gridTemplateColumns: {
                                            xs: "1fr",
                                            sm: "1fr 1fr",
                                        },
                                    }}
                                >
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label="Purchase Order"
                                        value={poNumber}
                                        onChange={(e) =>
                                            setPoNumber(e.target.value)
                                        }
                                    />
                                    <Autocomplete
                                        size="small"
                                        fullWidth
                                        options={quoteOptions}
                                        value={selectedQuote}
                                        onChange={(_, newValue) =>
                                            setSelectedQuote(newValue)
                                        }
                                        loading={accountQuotesLoading}
                                        disableClearable={false}
                                        isOptionEqualToValue={(option, value) =>
                                            option.id === value.id
                                        }
                                        getOptionLabel={(option) =>
                                            typeof option === "string"
                                                ? option
                                                : option?.name ?? ""
                                        }
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
                                                helperText={
                                                    accountQuotesError
                                                        ? accountQuotesError instanceof
                                                            Error
                                                            ? accountQuotesError.message
                                                            : "Failed to load quotes"
                                                        : undefined
                                                }
                                                InputProps={{
                                                    ...params.InputProps,
                                                    endAdornment: (
                                                        <>
                                                            {accountQuotesLoading ? (
                                                                <CircularProgress
                                                                    color="inherit"
                                                                    size={16}
                                                                />
                                                            ) : null}
                                                            {
                                                                params.InputProps
                                                                    .endAdornment
                                                            }
                                                        </>
                                                    ),
                                                }}
                                            />
                                        )}
                                        noOptionsText={
                                            accountQuotesLoading
                                                ? "Loading..."
                                                : accountQuotesError
                                                    ? "Error loading quotes"
                                                    : !selectedCustomerId
                                                        ? "Select a customer first"
                                                        : "No quotes found"
                                        }
                                        disabled={
                                            !selectedCustomerId ||
                                            !effectiveCompanyId
                                        }
                                    />
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label="Shipping Account"
                                        value={shipmentAccount}
                                        onChange={(e) =>
                                            setShipmentAccount(e.target.value)
                                        }
                                    />
                                    <FormControl fullWidth size="small">
                                        <InputLabel id="order-category-label">
                                            Order Category
                                        </InputLabel>
                                        <Select
                                            labelId="order-category-label"
                                            label="Order Category"
                                            value={selectedTypeId ?? ""}
                                            onChange={(event) => {
                                                const value =
                                                    event.target
                                                        .value as
                                                    | number
                                                    | string;
                                                const id =
                                                    value === ""
                                                        ? null
                                                        : Number(value);
                                                setSelectedTypeId(id);
                                            }}
                                            disabled={lookupsLoading}
                                        >
                                            {orderCategoryOptions.length > 0 ? (
                                                orderCategoryOptions.map(
                                                    (option) => (
                                                        <MenuItem
                                                            key={option.id}
                                                            value={
                                                                option.id as any
                                                            }
                                                        >
                                                            {option.name}
                                                        </MenuItem>
                                                    )
                                                )
                                            ) : (
                                                <MenuItem
                                                    value=""
                                                    disabled
                                                >
                                                    {lookupsLoading
                                                        ? "Loading..."
                                                        : "No options available"}
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
                                        onChange={(e) =>
                                            setDueDate(e.target.value)
                                        }
                                        InputLabelProps={{ shrink: true }}
                                    />
                                    <FormControl fullWidth size="small">
                                        <InputLabel id="shipping-method-label">
                                            Shipping Method
                                        </InputLabel>
                                        <Select
                                            labelId="shipping-method-label"
                                            label="Shipping Method"
                                            value={selectedCarrierId ?? ""}
                                            onChange={(event) => {
                                                const value =
                                                    event.target
                                                        .value as
                                                    | number
                                                    | string;
                                                const id =
                                                    value === ""
                                                        ? null
                                                        : Number(value);
                                                setSelectedCarrierId(id);
                                            }}
                                            disabled={lookupsLoading}
                                        >
                                            {shippingMethodOptions.length >
                                                0 ? (
                                                shippingMethodOptions.map(
                                                    (option) => (
                                                        <MenuItem
                                                            key={option.id}
                                                            value={
                                                                option.id as any
                                                            }
                                                        >
                                                            {option.name}
                                                        </MenuItem>
                                                    )
                                                )
                                            ) : (
                                                <MenuItem
                                                    value=""
                                                    disabled
                                                >
                                                    {lookupsLoading
                                                        ? "Loading..."
                                                        : "No options available"}
                                                </MenuItem>
                                            )}
                                        </Select>
                                    </FormControl>
                                    <FormControl fullWidth size="small" error={!!orderStatusError}>
                                        <InputLabel id="order-status-label">
                                            Status
                                        </InputLabel>
                                        <Select
                                            labelId="order-status-label"
                                            label="Status"
                                            value={selectedStatusId ?? ""}
                                            onChange={(event) => {
                                                const value =
                                                    event.target.value as | number | string;
                                                const id = value === "" ? null : Number(value);
                                                setSelectedStatusId(id);
                                                if (orderStatusError) {
                                                    setOrderStatusError("");
                                                }
                                            }}
                                            disabled={lookupsLoading}
                                        >
                                            {orderStatusOptions.length > 0 ? (
                                                orderStatusOptions.map(
                                                    (option) => (
                                                        <MenuItem key={option.id} value={option.id as any}>
                                                            {option.name}
                                                        </MenuItem>
                                                    )
                                                )
                                            ) : (
                                                <MenuItem value="" disabled>
                                                    {lookupsLoading ? "Loading..." : "No options available"}
                                                </MenuItem>
                                            )}
                                        </Select>
                                    </FormControl>
                                    <FormControl fullWidth size="small">
                                        <InputLabel id="order-priority-label">
                                            Priority
                                        </InputLabel>
                                        <Select
                                            labelId="order-priority-label"
                                            label="Priority"
                                            value={selectedPriorityId ?? ""}
                                            onChange={(event) => {
                                                const value =
                                                    event.target
                                                        .value as
                                                    | number
                                                    | string;
                                                const id =
                                                    value === ""
                                                        ? null
                                                        : Number(value);
                                                setSelectedPriorityId(id);
                                            }}
                                            disabled={lookupsLoading}
                                        >
                                            {orderPriorityOptions.length >
                                                0 ? (
                                                orderPriorityOptions.map(
                                                    (option) => (
                                                        <MenuItem
                                                            key={option.id}
                                                            value={
                                                                option.id as any
                                                            }
                                                        >
                                                            {option.name}
                                                        </MenuItem>
                                                    )
                                                )
                                            ) : (
                                                <MenuItem
                                                    value=""
                                                    disabled
                                                >
                                                    {lookupsLoading
                                                        ? "Loading..."
                                                        : "No options available"}
                                                </MenuItem>
                                            )}
                                        </Select>
                                    </FormControl>
                                    <FormControl fullWidth size="small">
                                        <InputLabel id="certificate-type-label">
                                            Certificate Type
                                        </InputLabel>
                                        <Select
                                            labelId="certificate-type-label"
                                            label="Certificate Type"
                                            value={
                                                selectedCertificateTypeId ?? ""
                                            }
                                            onChange={(event) => {
                                                const value =
                                                    event.target
                                                        .value as
                                                    | number
                                                    | string;
                                                const id =
                                                    value === ""
                                                        ? null
                                                        : Number(value);
                                                setSelectedCertificateTypeId(
                                                    id
                                                );
                                            }}
                                            disabled={lookupsLoading}
                                        >
                                            {certificateTypeOptions.length >
                                                0 ? (
                                                certificateTypeOptions.map(
                                                    (option) => (
                                                        <MenuItem
                                                            key={option.id}
                                                            value={
                                                                option.id as any
                                                            }
                                                        >
                                                            {option.name}
                                                        </MenuItem>
                                                    )
                                                )
                                            ) : (
                                                <MenuItem
                                                    value=""
                                                    disabled
                                                >
                                                    {lookupsLoading
                                                        ? "Loading..."
                                                        : "No options available"}
                                                </MenuItem>
                                            )}
                                        </Select>
                                    </FormControl>
                                </Box>
                                <Box
                                    sx={{
                                        display: "grid",
                                        gap: 1.125,
                                        gridTemplateColumns: {
                                            xs: "1fr",
                                            sm: "1fr 1fr",
                                        },
                                    }}
                                >
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label="Special Conditions"
                                        multiline
                                        minRows={3}
                                        value={specialConditions}
                                        onChange={(event) =>
                                            setSpecialConditions(
                                                event.target.value
                                            )
                                        }
                                        sx={{
                                            gridColumn: {
                                                xs: "span 1",
                                                sm: "span 2",
                                            },
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

                    {/* Products table */}
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mb: 2,
                        }}
                    >
                        <Typography variant="subtitle1" fontWeight={600}>
                            Product Details
                        </Typography>
                        <Button
                            size="small"
                            variant="contained"
                            onClick={handleAddProductRow}
                        >
                            Add Product
                        </Button>
                    </Box>
                    {lineItemsError && (
                        <Alert severity="error" sx={{ mb: 1 }}>
                            {lineItemsError}
                        </Alert>
                    )}
                    <Box
                        sx={{
                            "& .MuiTypography-root": { fontSize: "12px" },
                            "& .MuiInputBase-input": { fontSize: "12px", py: 0.5 },
                            "& .MuiInputLabel-root": { fontSize: "12px" },
                            "& .MuiButton-root": { fontSize: "12px", py: 0.25, px: 1, },
                            "& .MuiSvgIcon-root": { fontSize: "0.8rem" },
                        }}
                    >
                        <Paper
                            variant="outlined"
                            sx={{
                                display: "grid",
                                gridTemplateColumns:
                                    "0.35fr 2.5fr 0.9fr 0.6fr 0.6fr 0.6fr 0.4fr",
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
                                <Typography
                                    variant="caption"
                                    fontWeight={600}
                                >
                                    Product Name
                                </Typography>
                                <Typography
                                    variant="caption"
                                    fontWeight={600}
                                    color="text.secondary"
                                    display="block"
                                >
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
                                    gridTemplateColumns:
                                        "0.35fr 2.5fr 0.9fr 0.6fr 0.6fr 0.6fr 0.4fr",
                                    alignItems: "stretch",
                                    px: 2,
                                    py: 1.5,
                                    gap: 1,
                                    mb: 1,
                                }}
                            >
                                <Typography variant="body2">
                                    {index + 1}
                                </Typography>
                                <Box
                                    sx={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 1,
                                    }}
                                >
                                    <Autocomplete
                                        size="small"
                                        fullWidth
                                        options={combinedProductOptions}
                                        value={row.product}
                                        onChange={(event, newValue) =>
                                            handleProductSelect(
                                                row.id,
                                                event,
                                                newValue
                                            )
                                        }
                                        loading={productsLoading}
                                        disableClearable={false}
                                        isOptionEqualToValue={(option, value) =>
                                            option.id === value.id
                                        }
                                        getOptionLabel={(option) =>
                                            typeof option === "string"
                                                ? option
                                                : option?.name ?? ""
                                        }
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
                                                helperText={
                                                    productsError
                                                        ? productsError instanceof
                                                            Error
                                                            ? productsError.message
                                                            : "Failed to load products"
                                                        : undefined
                                                }
                                                InputProps={{
                                                    ...params.InputProps,
                                                    endAdornment: (
                                                        <>
                                                            {productsLoading ? (
                                                                <CircularProgress
                                                                    color="inherit"
                                                                    size={16}
                                                                />
                                                            ) : null}
                                                            {
                                                                params.InputProps
                                                                    .endAdornment
                                                            }
                                                        </>
                                                    ),
                                                }}
                                            />
                                        )}
                                        noOptionsText={
                                            productsLoading
                                                ? "Loading..."
                                                : productsError
                                                    ? "Error loading products"
                                                    : "No products found"
                                        }
                                    />
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
                                    onChange={(
                                        event: React.ChangeEvent<HTMLInputElement>
                                    ) =>
                                        handleQuantityChange(row.id, event)
                                    }
                                    placeholder="Quantity"
                                    inputProps={{
                                        style: { MozAppearance: "textfield" },
                                    }}
                                    sx={{
                                        "& input[type=number]": {
                                            MozAppearance: "textfield",
                                        },
                                        "& input[type=number]::-webkit-outer-spin-button":
                                        {
                                            WebkitAppearance: "none",
                                            margin: 0,
                                        },
                                        "& input[type=number]::-webkit-inner-spin-button":
                                        {
                                            WebkitAppearance: "none",
                                            margin: 0,
                                        },
                                    }}
                                />
                                <TextField
                                    size="small"
                                    type="number"
                                    value={row.productPrice}
                                    onChange={(
                                        event: React.ChangeEvent<HTMLInputElement>
                                    ) =>
                                        handlePriceChange(row.id, event)
                                    }
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
                                        "& input[type=number]::-webkit-outer-spin-button":
                                        {
                                            WebkitAppearance: "none",
                                            margin: 0,
                                        },
                                        "& input[type=number]::-webkit-inner-spin-button":
                                        {
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
                                        onClick={() =>
                                            handleRemoveProductRow(row.id)
                                        }
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
                                gridTemplateColumns:
                                    "0.35fr 2.5fr 0.9fr 0.6fr 0.6fr 0.6fr 0.9fr",
                                alignItems: "stretch",
                                px: 2,
                                py: 1.5,
                                gap: 1,
                                mb: 1,
                                mt: 1,
                            }}
                        >
                            <Box sx={{ gridColumn: "span 5" }} />
                            <Typography
                                variant="caption"
                                fontWeight={600}
                                sx={{
                                    alignSelf: "center",
                                    textAlign: "right",
                                    pr: 1,
                                }}
                            >
                                Net Total:
                            </Typography>
                            <TextField
                                size="small"
                                value={
                                    netTotal > 0 ? netTotal.toFixed(2) : ""
                                }
                                placeholder="0.00"
                                InputProps={{ readOnly: true }}
                                fullWidth
                            />
                        </Paper>
                        <Paper
                            variant="outlined"
                            sx={{
                                display: "grid",
                                gridTemplateColumns:
                                    "0.35fr 2.5fr 0.9fr 0.6fr 0.6fr 0.6fr 0.9fr",
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
                            <Typography
                                variant="caption"
                                fontWeight={700}
                                sx={{
                                    alignSelf: "center",
                                    fontSize: "13px",
                                    textAlign: "right",
                                    pr: 1,
                                }}
                            >
                                Grand Total:
                            </Typography>
                            <TextField
                                size="small"
                                value={
                                    grandTotal > 0
                                        ? grandTotal.toFixed(2)
                                        : ""
                                }
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

                {/* RIGHT PANEL: Billing & Shipping */}
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
                    <Typography
                        variant="h6"
                        fontWeight={600}
                        sx={{ fontSize: "1rem" }}
                    >
                        Billing & Shipping
                    </Typography>
                    <Divider />
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                            gap: 2,
                        }}
                    >
                        <Box sx={{ maxWidth: 420 }}>
                            <Typography
                                variant="subtitle2"
                                sx={{ mb: 0.75, fontSize: "0.875rem" }}
                            >
                                Billing Information
                            </Typography>
                            <Box
                                sx={{
                                    display: "grid",
                                    gridTemplateColumns: { xs: "1fr" },
                                    gap: 1.125,
                                }}
                            >
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Billing Address"
                                    value={billingAddress}
                                    onChange={(e) =>
                                        setBillingAddress(e.target.value)
                                    }
                                />
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Billing PO Box"
                                    value={billingPOBox}
                                    onChange={(e) =>
                                        setBillingPOBox(e.target.value)
                                    }
                                />
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Billing City"
                                    value={billingCity}
                                    onChange={(e) =>
                                        setBillingCity(e.target.value)
                                    }
                                />
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Billing State"
                                    value={billingState}
                                    onChange={(e) =>
                                        setBillingState(e.target.value)
                                    }
                                />
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Code"
                                    value={billingCode}
                                    onChange={(e) =>
                                        setBillingCode(e.target.value)
                                    }
                                />
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Billing Country"
                                    value={billingCountry}
                                    onChange={(e) =>
                                        setBillingCountry(e.target.value)
                                    }
                                />
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Billing Comments"
                                    multiline
                                    minRows={6}
                                    value={processingComments}
                                    onChange={(e) =>
                                        setProcessingComments(e.target.value)
                                    }
                                    sx={{
                                        "& .MuiInputBase-root": {
                                            height: "auto",
                                        },
                                    }}
                                />
                            </Box>
                        </Box>
                        <Box sx={{ maxWidth: 420 }}>
                            <Typography
                                variant="subtitle2"
                                sx={{ mb: 0.75, fontSize: "0.875rem" }}
                            >
                                Shipping Information
                            </Typography>
                            <Box
                                sx={{
                                    display: "grid",
                                    gridTemplateColumns: { xs: "1fr" },
                                    gap: 1.125,
                                }}
                            >
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Shipping Address"
                                    value={shippingAddress}
                                    onChange={(e) =>
                                        setShippingAddress(e.target.value)
                                    }
                                />
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Shipping PO Box"
                                    value={shippingPOBox}
                                    onChange={(e) =>
                                        setShippingPOBox(e.target.value)
                                    }
                                />
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Shipping City"
                                    value={shippingCity}
                                    onChange={(e) =>
                                        setShippingCity(e.target.value)
                                    }
                                />
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Shipping State"
                                    value={shippingState}
                                    onChange={(e) =>
                                        setShippingState(e.target.value)
                                    }
                                />
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Code"
                                    value={shippingCode}
                                    onChange={(e) =>
                                        setShippingCode(e.target.value)
                                    }
                                />
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Shipping Country"
                                    value={shippingCountry}
                                    onChange={(e) =>
                                        setShippingCountry(e.target.value)
                                    }
                                />
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Shipping Comments"
                                    multiline
                                    minRows={6}
                                    value={shippingComments}
                                    onChange={(e) =>
                                        setShippingComments(e.target.value)
                                    }
                                    sx={{
                                        "& .MuiInputBase-root": {
                                            height: "auto",
                                        },
                                    }}
                                />
                            </Box>
                        </Box>
                    </Box>
                </Paper>
            </Box>
        </Box>
    );
}

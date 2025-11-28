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
    Collapse,
} from "@mui/material";
import { MdSearch } from "react-icons/md";
import { DeleteOutline, ExpandMore, ExpandLess } from "@mui/icons-material";
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
        poBox: address.po_box ?? address.poBox ?? address.poBoxNumber ?? "",
        city: address.city ?? "",
        state: address.state ?? address.region ?? "",
        code: address.postal_code ?? address.postalcode ?? address.zip ?? address.code ?? "",
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
    quote_item_id?: number | null;
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

function useQuoteLookups(companyId: string | null) {
    const { token, isLoggedIn } = useAuth();
    const { apiURL } = useBackend();

    return useQuery({
        queryKey: ["quote-lookups", companyId],
        queryFn: async () => {
            if (!companyId) return null;
            const url = apiURL(
                `quotes/lookups?company_id=${encodeURIComponent(companyId)}`,
                `quotes-lookups-${companyId}.json`
            );
            const res = await fetch(url, {
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            });
            if (!res.ok) {
                if (res.status === 401) throw new Error("Unauthorized – please log in again");
                throw new Error(`Failed to fetch lookups: ${res.status}`);
            }
            return res.json();
        },
        enabled: isLoggedIn && !!token && !!companyId,
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

function useQuoteForEditing(quoteId: string | null, companyId: string | null) {
    const { token, isLoggedIn } = useAuth();
    const { apiURL } = useBackend();

    return useQuery({
        queryKey: ["quote-for-editing", quoteId, companyId],
        queryFn: async () => {
            if (!quoteId || !companyId) return null;
            const url = apiURL(
                `get-quote-for-editing?quote_id=${encodeURIComponent(
                    quoteId
                )}&company_id=${encodeURIComponent(companyId)}`,
                `get-quote-for-editing-${quoteId}-${companyId}.json`
            );
            const res = await fetch(url, {
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            });
            if (!res.ok) {
                if (res.status === 401) throw new Error("Unauthorized – please log in again");
                if (res.status === 404) throw new Error("Quote not found");
                throw new Error(`Failed to fetch quote: ${res.status}`);
            }
            const data = await res.json();
            const quote = data?.quote || null;
            if (!quote) {
                throw new Error("Quote not found");
            }
            if (quote && companyId) {
                const quoteCompanyId = String(quote.company_id ?? "");
                const requestedCompanyId = String(companyId);
                if (quoteCompanyId !== requestedCompanyId) {
                    throw new Error("Quote not found");
                }
            }
            return quote;
        },
        enabled: isLoggedIn && !!token && !!quoteId && !!companyId,
        staleTime: 0,
        refetchOnWindowFocus: false,
        retry: false,
    });
}

type QuoteFormProps = {
    mode?: "create" | "edit";
    quoteIdFromParams?: string | null;
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

export default function QuoteForm(props: QuoteFormProps = {}) {
    const router = useRouter();
    const [quoteIdFromUrl, setQuoteIdFromUrl] = React.useState<string | null>(
        props.quoteIdFromParams ?? null
    );

    React.useEffect(() => {
        if (props.quoteIdFromParams !== undefined) {
            setQuoteIdFromUrl(props.quoteIdFromParams ?? null);
            return;
        }
        if (typeof window === "undefined") return;
        const params = new URLSearchParams(window.location.search);
        const id =
            params.get("quoteId") ?? params.get("quoteID") ?? params.get("quoteid");
        setQuoteIdFromUrl(id);
    }, [props.quoteIdFromParams]);

    const { selectedCompanyId, userCompanyId } = useCompany();
    const { isAdmin } = useProfile();
    const { token, isLoggedIn } = useAuth();
    const { apiURL } = useBackend();

    const [quoteStageError, setQuoteStageError] = React.useState("");
    const [lineItemsError, setLineItemsError] = React.useState("");

    const [quoteSubject, setQuoteSubject] = React.useState("");
    const [quoteSubjectError, setQuoteSubjectError] = React.useState("");
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

    const { data: lookupsData, isLoading: lookupsLoading } = useQuoteLookups(
        effectiveCompanyId ? String(effectiveCompanyId) : null
    );

    const [selectedStageId, setSelectedStageId] = React.useState<number | null>(null);
    const [selectedAssignedUserId, setSelectedAssignedUserId] = React.useState<number | null>(null);
    const [selectedCarrierId, setSelectedCarrierId] = React.useState<number | null>(null);
    const [specialConditions, setSpecialConditions] = React.useState("");
    const [validTill, setValidTill] = React.useState("");
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
    const [expandedComments, setExpandedComments] = React.useState<Set<string>>(new Set());

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
        data: quoteData,
        isLoading: quoteLoading,
        error: quoteError,
    } = useQuoteForEditing(
        quoteIdFromUrl,
        effectiveCompanyId ? String(effectiveCompanyId) : null
    );

    const isBusy =
        customersLoading || productsLoading || lookupsLoading || quoteLoading || isSaving;



    // Populate form when editing and quote data arrives
    React.useEffect(() => {
        if (!quoteData) return;
        const q: any = quoteData;

        setQuoteSubject(String(q.subject ?? q.quote_subject ?? ""));
        setValidTill(q.valid_till ?? q.validTill ?? "");

        if (q.quote_stage_id != null)
            setSelectedStageId(Number(q.quote_stage_id));

        if (q.assigned_to != null || q.assigned_to_user_id != null)
            setSelectedAssignedUserId(Number(q.assigned_to ?? q.assigned_to_user_id));

        if (q.carrier_id != null)
            setSelectedCarrierId(Number(q.carrier_id));

        setSpecialConditions(
            String(
                q.terms_conditions ??
                q.special_conditions ??
                q.termsConditions ??
                ""
            )
        );

        const billingAddressData =
            q.addresses?.billing ??
            q.billing_address ??
            q.accountBillingAddress;
        const billingParsed = parseAddress(billingAddressData);
        setBillingAddress(billingParsed.street);
        setBillingPOBox(billingParsed.poBox);
        setBillingCity(billingParsed.city);
        setBillingState(billingParsed.state);
        setBillingCode(billingParsed.code);
        setBillingCountry(billingParsed.country);

        const shippingAddressData =
            q.addresses?.shipping ??
            q.shipping_address ??
            q.accountShippingAddress;
        const shippingParsed = parseAddress(shippingAddressData);
        setShippingAddress(shippingParsed.street);
        setShippingPOBox(shippingParsed.poBox);
        setShippingCity(shippingParsed.city);
        setShippingState(shippingParsed.state);
        setShippingCode(shippingParsed.code);
        setShippingCountry(shippingParsed.country);

        setShippingComments(String(q.shipping_comments ?? ""));
        setProcessingComments(String(q.processing_comments ?? ""));

        let items: any[] =
            (Array.isArray(q.products) && q.products) ||
            (Array.isArray(q.items) && q.items) ||
            (Array.isArray(q.quote_items) && q.quote_items) ||
            [];
        if (!items.length && Array.isArray(q.line_items)) {
            items = q.line_items;
        }
        if (items.length) {
            const mapped: ProductRow[] = items.map((it, idx) => ({
                id: String(it.quote_item_id ?? it.id ?? idx + 1),
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
                productNotes: String(
                    it.comment ??
                    it.product_notes ??
                    it.notes ??
                    ""
                ),
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
                quote_item_id:
                    it.quote_item_id != null
                        ? Number(it.quote_item_id)
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
    }, [quoteData]);

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

    // Select customer from quote once customers list is available
    React.useEffect(() => {
        if (!quoteData || !filteredCustomerOptions.length) return;
        const q: any = quoteData;
        const cid = q.customer_id ?? q.account_id ?? q.accountId;
        const cname = q.customer_name ?? q.account_name ?? q.customer;
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
    }, [quoteData, filteredCustomerOptions]);

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

    const quoteStageOptions: NamedOption[] = React.useMemo(() => {
        const d: any = (lookupsData as any)?.data ?? lookupsData ?? {};
        const src: any[] = Array.isArray(d?.quote_stages)
            ? d.quote_stages
            : [];
        return src.map((s: any) => ({
            id: s?.quote_stage_id ?? s?.id ?? null,
            name:
                s?.stage_name ??
                s?.quote_stage_name ??
                String(s?.name ?? ""),
        }));
    }, [lookupsData]);

    const userOptions: NamedOption[] = React.useMemo(() => {
        const d: any = (lookupsData as any)?.data ?? lookupsData ?? {};
        const src: any[] = Array.isArray(d?.users) ? d.users : [];
        return src.map((u: any) => ({
            id: u?.user_id ?? u?.id ?? null,
            name: u?.username ?? u?.name ?? u?.user_name ?? String(u?.email ?? ""),
        }));
    }, [lookupsData]);

    const carrierOptions: NamedOption[] = React.useMemo(() => {
        const d: any = (lookupsData as any)?.data ?? lookupsData ?? {};
        const src: any[] = Array.isArray(d?.carriers) ? d.carriers : [];
        return src.map((c: any) => ({
            id: c?.carrier_id ?? c?.id ?? null,
            name: c?.carrier_name ?? String(c?.name ?? ""),
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

        const existingContactId = (quoteData as any)?.contact_id;
        if (existingContactId != null) {
            const found = mapped.find((c) => c.id === String(existingContactId));
            setSelectedContact(found ?? null);
        } else {
            if (mapped.length === 0) {
                setSelectedContact(null);
            }
        }
    }, [customerDetail, quoteData]);

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

    const toggleCommentExpanded = React.useCallback((rowId: string) => {
        setExpandedComments((prev) => {
            const next = new Set(prev);
            if (next.has(rowId)) {
                next.delete(rowId);
            } else {
                next.add(rowId);
            }
            return next;
        });
    }, []);

    const handleCancel = React.useCallback(() => {
        router.push("/dashboard/quotes");
    }, [router]);

    const handleSave = React.useCallback(async () => {
        let hasErrors = false;
        setQuoteSubjectError("");
        setCustomerNameError("");
        setQuoteStageError("");
        setLineItemsError("");

        if (!quoteSubject.trim()) {
            setQuoteSubjectError("Quote Subject is required");
            hasErrors = true;
        }
        if (!selectedCustomer) {
            setCustomerNameError("Customer Name is required");
            hasErrors = true;
        }
        if (selectedStageId == null) {
            setQuoteStageError("Stage is required");
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
            alert("You must be logged in to save quotes.");
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
                .filter((row) => row.product?.id != null)
                .map((row, idx) => ({
                    item_id: Number(row.product!.id),
                    sequence_no: idx + 1,
                    quantity: parseFloat(row.productQuantity || "0") || 0,
                    list_price: parseFloat(row.productPrice || "0") || 0,
                    discount_percent: 0,
                    discount_amount: 0,
                    pricetype_id: null,
                    comment: row.productNotes || "",
                }));

            const quotePayload: any = {
                company_id: normalizeNumericId(effectiveCompanyId) ?? 0,
                assigned_to: selectedAssignedUserId,
                subject: quoteSubject.trim(),
                quote_stage_id: selectedStageId,
                valid_till: validTill || null,
                account_id: selectedCustomer ? Number(selectedCustomer.id) : null,
                contact_id: selectedContact ? Number(selectedContact.id) : null,
                carrier_id: selectedCarrierId,
                discount_percent: 0,
                discount_amount: 0,
                adjustment: 0,
                shipping_handling: 0,
                subtotal: netTotal || 0,
                total: grandTotal || 0,
                terms_conditions: specialConditions || null,
                addresses: {
                    billing: {
                        street: billingAddress || "",
                        city: billingCity || "",
                        state: billingState || "",
                        country: billingCountry || "",
                        postal_code: billingCode || "",
                        po_box: billingPOBox || "",
                        is_primary: true,
                    },
                    shipping: {
                        street: shippingAddress || "",
                        city: shippingCity || "",
                        state: shippingState || "",
                        country: shippingCountry || "",
                        postal_code: shippingCode || "",
                        po_box: shippingPOBox || "",
                        is_primary: true,
                    },
                },
                line_items: lineItemsPayload,
            };

            const isEditMode = !!quoteIdFromUrl;
            if (isEditMode) {
                quotePayload.quote_id = parseInt(
                    quoteIdFromUrl as string,
                    10
                );
            }

            const url = isEditMode
                ? apiURL("edit-quote", "edit-quote.json")
                : apiURL("add-quote", "add-quote.json");
            const method = isEditMode ? "PUT" : "POST";
            const payload = isEditMode
                ? { quote: quotePayload }
                : quotePayload;

           // console.log("Quote Payload:", JSON.stringify(payload, null, 2));

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
                    `Failed to save quote: ${res.status} ${errorText}`
                );
            }

            await res.json().catch(() => null);
            alert("Quote saved successfully.");
            router.push("/dashboard/quotes");
        } catch (error) {
            console.error("Error saving quote:", error);
            alert(
                error instanceof Error
                    ? error.message
                    : "Failed to save quote. Please try again."
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
        quoteSubject,
        router,
        selectedCustomer,
        selectedContact,
        shippingComments,
        processingComments,
        specialConditions,
        netTotal,
        grandTotal,
        productRows,
        selectedStageId,
        selectedAssignedUserId,
        selectedCarrierId,
        validTill,
        isLoggedIn,
        token,
        quoteIdFromUrl,
        apiURL,
        quoteData,
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
                    {quoteIdFromUrl
                        ? `Edit Quote - ${quoteIdFromUrl}`
                        : "Create Quote"}
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
                        {isSaving ? "Saving..." : "Save Quote"}
                    </Button>
                </Box>
            </Paper>

            {quoteIdFromUrl && !quoteLoading && quoteError && (
                <Alert severity="error">
                    The specified quote could not be found. You can still create a
                    new quote.
                </Alert>
            )}

            {(customersLoading ||
                productsLoading ||
                lookupsLoading ||
                quoteLoading) && (
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
                                Quote Details
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

                            {/* Right column section: Quote Details */}
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
                                    Quote Details
                                </Typography>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Quote Subject"
                                    value={quoteSubject}
                                    onChange={(e) => {
                                        setQuoteSubject(e.target.value);
                                        if (quoteSubjectError) setQuoteSubjectError("");
                                    }}
                                    error={!!quoteSubjectError}
                                    helperText={quoteSubjectError || ""}
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
                                    <FormControl fullWidth size="small">
                                        <InputLabel id="assigned-user-label">
                                            Assigned to User
                                        </InputLabel>
                                        <Select
                                            labelId="assigned-user-label"
                                            label="Assigned to User"
                                            value={selectedAssignedUserId ?? ""}
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
                                                setSelectedAssignedUserId(id);
                                            }}
                                            disabled={lookupsLoading}
                                        >
                                            {userOptions.length > 0 ? (
                                                userOptions.map(
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
                                        <InputLabel id="carrier-label">
                                            Carrier
                                        </InputLabel>
                                        <Select
                                            labelId="carrier-label"
                                            label="Carrier"
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
                                            {carrierOptions.length > 0 ? (
                                                carrierOptions.map(
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
                                        label="Valid Till"
                                        type="date"
                                        value={validTill}
                                        onChange={(e) =>
                                            setValidTill(e.target.value)
                                        }
                                        InputLabelProps={{ shrink: true }}
                                    />
                                    <FormControl fullWidth size="small" error={!!quoteStageError}>
                                        <InputLabel id="quote-stage-label">
                                            Stage
                                        </InputLabel>
                                        <Select
                                            labelId="quote-stage-label"
                                            label="Stage"
                                            value={selectedStageId ?? ""}
                                            onChange={(event) => {
                                                const value =
                                                    event.target.value as | number | string;
                                                const id = value === "" ? null : Number(value);
                                                setSelectedStageId(id);
                                                if (quoteStageError) {
                                                    setQuoteStageError("");
                                                }
                                            }}
                                            disabled={lookupsLoading}
                                        >
                                            {quoteStageOptions.length > 0 ? (
                                                quoteStageOptions.map(
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
                                        label="Terms & Conditions"
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
                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 0.5,
                                        }}
                                    >
                                        <IconButton
                                            size="small"
                                            onClick={() => toggleCommentExpanded(row.id)}
                                            sx={{
                                                padding: 0.5,
                                                "&:hover": {
                                                    backgroundColor: "action.hover",
                                                },
                                            }}
                                        >
                                            {expandedComments.has(row.id) ? (
                                                <ExpandLess fontSize="small" />
                                            ) : (
                                                <ExpandMore fontSize="small" />
                                            )}
                                        </IconButton>
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                cursor: "pointer",
                                                color: "text.secondary",
                                                "&:hover": {
                                                    color: "text.primary",
                                                },
                                            }}
                                            onClick={() => toggleCommentExpanded(row.id)}
                                        >
                                            Comment
                                        </Typography>
                                    </Box>
                                    <Collapse in={expandedComments.has(row.id)}>
                                        <TextField
                                            size="small"
                                            fullWidth
                                            multiline
                                            rows={3}
                                            value={row.productNotes}
                                            onChange={(e) =>
                                                handleProductFieldChange(
                                                    row.id,
                                                    "productNotes",
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Add a comment for this product..."
                                            sx={{
                                                mt: 0.5,
                                                "& .MuiInputBase-root": {
                                                    fontSize: "0.75rem",
                                                },
                                                "& .MuiInputBase-input": {
                                                    fontSize: "0.75rem",
                                                },
                                            }}
                                        />
                                    </Collapse>
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

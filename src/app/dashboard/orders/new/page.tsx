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
} from "@mui/material";
import { MdSearch } from "react-icons/md";
import { DeleteOutline, CloudUpload, Visibility, VisibilityOff } from "@mui/icons-material";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { useRouter, useSearchParams } from "next/navigation";
import Autocomplete from "@mui/material/Autocomplete";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../../../contexts/AuthContext";
import { useBackend } from "../../../../contexts/BackendContext";
import { useCompany } from "../../../../contexts/CompanyContext";

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
    const { selectedCompanyId } = useCompany();
    const { data: customersData, isLoading: customersLoading } = useCustomerDirectory();
    const [selectedCustomer, setSelectedCustomer] = React.useState<CustomerOption | null>(null);
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
    const [specialConditions, setSpecialConditions] = React.useState("");
    const [orderCategory, setOrderCategory] = React.useState("");
    const [shipmentStatus, setShipmentStatus] = React.useState("Approved");
    const [shipmentAccount, setShipmentAccount] = React.useState("Account 1");
    const [showWifiPassword, setShowWifiPassword] = React.useState(false);
    const [customerPhone, setCustomerPhone] = React.useState("");
    const [customerEmail, setCustomerEmail] = React.useState("");
    const [customerBillingAddress, setCustomerBillingAddress] = React.useState("");
    const [customerShippingAddress, setCustomerShippingAddress] = React.useState("");
    const [customerContacts, setCustomerContacts] = React.useState<ContactOption[]>([]);
    const [selectedContact, setSelectedContact] = React.useState<ContactOption | null>(null);
    const [shippingComments, setShippingComments] = React.useState("");
    const [processingComments, setProcessingComments] = React.useState("");

    const shippingMethodOptions = ["FedEx Ground", "FedEx 2Day", "UPS Ground", "DHL Express"];
    const orderStatusOptions = ["Draft", "Processing", "Fulfilled", "Shipped", "Closed"];
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

    const handleCustomerSelect = React.useCallback(
        (_event: React.SyntheticEvent, newValue: CustomerOption | null) => {
            setSelectedCustomer(newValue);
            const initialContacts = newValue?.contacts ?? [];
            setCustomerContacts(initialContacts);
            if (newValue) {
                setCustomerPhone(newValue.phone ?? "");
                setCustomerEmail(newValue.email ?? "");
                setCustomerBillingAddress(newValue.billingAddress ?? "");
                setCustomerShippingAddress(newValue.shippingAddress ?? "");
                const firstContact = initialContacts[0];
                setSelectedContact(firstContact ?? null);
            } else {
                setCustomerPhone("");
                setCustomerEmail("");
                setCustomerBillingAddress("");
                setCustomerShippingAddress("");
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
            setCustomerBillingAddress("");
            setCustomerShippingAddress("");
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
        setCustomerBillingAddress(formatAddress(billingAddressData));
        setCustomerShippingAddress(formatAddress(shippingAddressData));

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
        const payload = {
            shippingMethod,
            orderStatus,
            specialConditions,
            orderCategory,
            shipmentStatus,
            shipmentAccount,
            assignedSensors,
            customer: {
                id: selectedCustomer?.id ?? null,
                name: selectedCustomer?.name ?? "",
                phone: customerPhone,
                email: customerEmail,
                billingAddress: customerBillingAddress,
                shippingAddress: customerShippingAddress,
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
        };
        console.log("Saving order draft:", payload);
        alert("Order saved successfully.");
        router.push("/dashboard/orders");
    }, [
        assignedSensors,
        customerBillingAddress,
        customerEmail,
        customerShippingAddress,
        customerPhone,
        orderStatus,
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
                    gridTemplateColumns: { xs: "1fr", lg: "1.1fr 0.9fr" },
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
                                Created at: 03.01.2025 &nbsp;•&nbsp; Modified at: 05.02.2025
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
                                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                                    <Typography variant="subtitle2">Customer Details</Typography>
                                    <Stack spacing={1.5}>
                                        <TextField fullWidth size="small" label="Order Subject" />
                                        <Autocomplete
                                            size="small"
                                            options={filteredCustomerOptions}
                                            value={selectedCustomer}
                                            onChange={handleCustomerSelect}
                                            loading={customersLoading}
                                            disableClearable={false}
                                            isOptionEqualToValue={(option, value) => option.id === value.id}
                                            getOptionLabel={(option) => option?.name ?? ""}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label="Customer Name"
                                                    size="small"
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
                                        <TextField
                                            fullWidth
                                            size="small"
                                            label="Billing Address"
                                            multiline
                                            minRows={3}
                                            value={customerBillingAddress}
                                            onChange={(event) => setCustomerBillingAddress(event.target.value)}
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
                                            label="Shipping Address"
                                            multiline
                                            minRows={3}
                                            value={customerShippingAddress}
                                            onChange={(event) => setCustomerShippingAddress(event.target.value)}
                                            InputProps={{
                                                endAdornment: customerDetailLoading ? (
                                                    <InputAdornment position="end">
                                                        <CircularProgress size={16} />
                                                    </InputAdornment>
                                                ) : undefined,
                                            }}
                                        />
                                    </Stack>
                            </Box>
                                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                                    <Typography variant="subtitle2">Order Details</Typography>
                                    <Box
                                        sx={{
                                            display: "grid",
                                            gap: 1.5,
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
                                                value={orderCategory}
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
                                                value={shippingMethod}
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
                                                value={orderStatus}
                                                onChange={(event) => setOrderStatus(event.target.value as string)}
                                            >
                                                {orderStatusOptions.map((option) => (
                                                    <MenuItem key={option} value={option}>
                                                        {option}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Box>
                                    <Box
                                        sx={{
                                            display: "grid",
                                            gap: 1.5,
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
                                            sx={{ gridColumn: { xs: "span 1", sm: "span 2" } }}
                                        />
                                        <TextField
                                            fullWidth
                                            size="small"
                                            label="Shipping Comments"
                                            multiline
                                            minRows={4}
                                            value={shippingComments}
                                            onChange={(event) => setShippingComments(event.target.value)}
                                            sx={{ gridColumn: { xs: "span 1", sm: "span 2" } }}
                                        />
                                        <TextField
                                            fullWidth
                                            size="small"
                                            label="Processing Comments"
                                            multiline
                                            minRows={4.5}
                                            value={processingComments}
                                            onChange={(event) => setProcessingComments(event.target.value)}
                                            sx={{ gridColumn: { xs: "span 1", sm: "span 2" } }}
                                        />
                                    </Box>
                                </Box>
                        </Box>
                    </Box>

                    <Box>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                            <Typography variant="subtitle1" fontWeight={600}>
                                Product Details
                            </Typography>
                            <Button size="small" variant="outlined">
                                Add Details
                            </Button>
                        </Box>
                        <Paper
                            variant="outlined"
                            sx={{
                                display: "grid",
                                gridTemplateColumns: "0.5fr 1.2fr 1.5fr 1fr 0.3fr",
                                alignItems: "center",
                                px: 2,
                                py: 1,
                                gap: 1,
                                mb: 1,
                                bgcolor: "#F9FAFB",
                                borderStyle: "dashed",
                            }}
                        >
                            <Typography variant="caption" fontWeight={600}>
                                Sr. No.
                            </Typography>
                            <Typography variant="caption" fontWeight={600}>
                                Product Name
                            </Typography>
                            <Typography variant="caption" fontWeight={600}>
                                Description
                            </Typography>
                            <Typography variant="caption" fontWeight={600}>
                                Notes
                            </Typography>
                            <Typography variant="caption" fontWeight={600}>
                                Actions
                            </Typography>
                        </Paper>
                        <Paper
                            variant="outlined"
                            sx={{
                                display: "grid",
                                gridTemplateColumns: "0.5fr 1.2fr 1.5fr 1fr 0.3fr",
                                alignItems: "center",
                                px: 2,
                                py: 1.5,
                                gap: 1,
                            }}
                        >
                            <Typography variant="body2">1</Typography>
                            <TextField size="small" value="Sentinel ST LTE" />
                            <TextField size="small" value="Sentinel Next 1.5 (Lorem Ipsum dolor)" />
                            <TextField size="small" value="Lorem ipsum dolor" />
                            <Tooltip title="Remove">
                                <IconButton size="small" color="error">
                                    <DeleteOutline fontSize="small" />
                                </IconButton>
                            </Tooltip>
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
                    <Typography variant="h6" fontWeight={600}>
                        Setup Network Information
                    </Typography>
                    <Stack spacing={3}>
                        <Box>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                1. WiFi Access Point Router
                            </Typography>
                            <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
                                <TextField fullWidth size="small" label="Brand" />
                                <TextField fullWidth size="small" label="Model" />
                            </Box>
                        </Box>
                        <Box>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                2. SSID of the WiFi network
                            </Typography>
                            <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
                                <TextField fullWidth size="small" label="SSID 1" />
                                <TextField fullWidth size="small" label="Channel" />
                                <TextField fullWidth size="small" label="SSID 2" />
                                <TextField fullWidth size="small" label="Channel" />
                            </Box>
                        </Box>
                        <Box>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                3. Level of security used in the network
                            </Typography>
                            <RadioGroup row defaultValue="open">
                                <FormControlLabel value="open" control={<Radio size="small" />} label="Open (None)" />
                                <FormControlLabel value="wpa2" control={<Radio size="small" />} label="WPA2-802.1x" />
                                <FormControlLabel value="psk" control={<Radio size="small" />} label="WPA2-PSK" />
                                <FormControlLabel value="others" control={<Radio size="small" />} label="Others" />
                            </RadioGroup>
                            <Box
                                sx={{
                                    display: "grid",
                                    gap: 2,
                                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                                    mt: 1,
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
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                4. DHCP
                            </Typography>
                            <RadioGroup row defaultValue="yes">
                                <FormControlLabel value="yes" control={<Radio size="small" />} label="Yes (Recommended)" />
                                <FormControlLabel value="no" control={<Radio size="small" />} label="No" />
                            </RadioGroup>
                        </Box>
                        <Box>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                5. WiFi Access Point IP
                            </Typography>
                            <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
                                <TextField fullWidth size="small" label="IP Address" />
                                <TextField fullWidth size="small" label="Netmask" />
                            </Box>
                        </Box>
                        <Box>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                6. Web Portal Server
                            </Typography>
                            <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
                                <TextField fullWidth size="small" label="IP Address" />
                                <TextField fullWidth size="small" label="Netmask" />
                            </Box>
                        </Box>
                        <Box>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                7. Sensor IP
                            </Typography>
                            <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
                                <TextField fullWidth size="small" label="Starting IP" />
                                <TextField fullWidth size="small" label="Ending IP" />
                            </Box>
                        </Box>
                        <Box>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                8. DNS
                            </Typography>
                            <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
                                <TextField fullWidth size="small" label="Primary DNS" />
                                <TextField fullWidth size="small" label="Secondary DNS" />
                            </Box>
                        </Box>
                        <Box>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                9. Comments
                            </Typography>
                            <TextField fullWidth size="small" multiline minRows={3} placeholder="Add any additional comments" />
                        </Box>
                        <Box>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                Upload Setup Document
                            </Typography>
                            <Button variant="outlined" component="label" startIcon={<CloudUpload />}>
                                Choose File
                                <input hidden type="file" />
                            </Button>
                        </Box>
                    </Stack>
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



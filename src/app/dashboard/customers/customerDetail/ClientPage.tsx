"use client";

import * as React from "react";
import {
  Box, Typography, Button, MenuItem, Select, InputLabel,
  FormControl, Divider, CircularProgress, TextField,
} from "@mui/material";
import { useRouter } from "next/navigation";              // ⬅️ keep router
import CustomerFormLeft from "@/components/CustomerForm/CustomerFormLeft";
import { useApi } from "@/utils/api";
import { useBackend } from "@/contexts/BackendContext";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";
import { useMemo, useEffect } from "react";

// ⬇️ Add props type. No search params here.
type Props = { customerId?: string };

type Customer = {
  id: string;
  name: string;
  company_id?: string;
};

type Contact = { name: string; phone: string; email: string; notes?: string };

function useCustomers() {
  const { token, isLoggedIn } = useAuth();
  const { apiURL } = useBackend();

  return useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const url = apiURL("accounts", "accounts.json");
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        if (res.status === 401) throw new Error("Unauthorized – please log in again");
        throw new Error(`Request failed: ${res.status}`);
      }
      return res.json();
    },
    enabled: isLoggedIn && !!token,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

function useUsers(companyId: number | string) {
  const { token, isLoggedIn } = useAuth();
  const { fetchWithAuth } = useApi();

  return useQuery({
    queryKey: ["users", companyId],
    queryFn: async () => {
      const url = `http://34.58.37.44/api/users?company_id=${companyId}`;
      const res = await fetchWithAuth(url);
      if (!res.ok) {
        if (res.status === 401) throw new Error("Unauthorized – please log in again");
        throw new Error(`Request failed: ${res.status}`);
      }
      return res.json();
    },
    enabled: isLoggedIn && !!token && !!companyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

function useAccountTypes() {
  const { token, isLoggedIn } = useAuth();
  const { fetchWithAuth } = useApi();

  return useQuery({
    queryKey: ["account-types"],
    queryFn: async () => {
      const url = "http://34.58.37.44/api/account-types";
      const res = await fetchWithAuth(url);
      if (!res.ok) {
        if (res.status === 401) throw new Error("Unauthorized – please log in again");
        throw new Error(`Request failed: ${res.status}`);
      }
      return res.json();
    },
    enabled: isLoggedIn && !!token,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

export default function ClientPage({ customerId }: Props) {
  const router = useRouter();
  const isEditMode = !!customerId;                           // ⬅️ drive mode from prop
  const { fetchWithAuth } = useApi();
  const { apiURL } = useBackend();
  const { token, email } = useAuth();
  const { selectedCompanyName, selectedCompanyId } = useCompany();

  const [assignedTo, setAssignedTo] = React.useState("");
  const [accountType, setAccountType] = React.useState("");
  const [customerName, setCustomerName] = React.useState("");
  const [companyName, setCompanyName] = React.useState("");
  const [customerPhone, setCustomerPhone] = React.useState("");
  const [parent, setParent] = React.useState("");
  const [customerEmail, setCustomerEmail] = React.useState("");
  const [childrenList, setChildrenList] = React.useState("");
  const [website, setWebsite] = React.useState("");
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
  const [notes, setNotes] = React.useState("");

  const [contacts, setContacts] = React.useState<Contact[]>([]);
  const setContactsPlain = React.useCallback((value: Contact[]) => setContacts(value), []);

  const { data: customersData, isLoading: customersLoading } = useCustomers();

  const customers: Customer[] = useMemo(() => {
    if (!customersData?.data) return [];
    return customersData.data
      .flatMap((company: any) =>
        company.data.map((acc: any) => ({
          id: String(acc.id),
          name: acc.name,
          company_id: company.company_id as string | undefined,
        }))
      )
      .sort((a: Customer, b: Customer) => a.name.localeCompare(b.name));
  }, [customersData]);

  const customerToEdit = useMemo(() => {
    if (!isEditMode || !customersData?.data) return null;
    for (const company of customersData.data) {
      const customer = company.data.find((acc: any) => String(acc.id) === customerId);
      if (customer) {
        return {
          id: String(customer.id),
          name: customer.name || "",
          company_id: company.company_id,
          phone: customer.phone || "",
          email: customer.email || "",
          city: customer.city || "",
          street: customer.street || "",
          billing_po_box: customer.billing_po_box || "",
          state: customer.state || "",
          country: customer.country || "",
          code: customer.address_code || "",
          shipping_address: customer.shipping_address || "",
          shipping_po_box: customer.shipping_po_box || "",
          shipping_city: customer.shipping_city || "",
          shipping_state: customer.shipping_state || "",
          shipping_code: customer.shipping_code || "",
          shipping_country: customer.shipping_country || "",
          notes: customer.notes || "",
          contacts: (customer.contacts || []).map((contact: any) => ({
            name: contact.name || "",
            phone: contact.phone || "",
            email: contact.email || "",
            notes: contact.notes || contact.description || "",
          })),
          children_list: customer.children_list || "",
          parent: customer.parent_account_id || "",
          company_name: customer.company_name || "",
          assigned_to: customer.assigned_to ?? null,
          website: customer.website || "",
        };
      }
    }
    return null;
  }, [isEditMode, customerId, customersData]);

  // Determine company ID for users API
  const companyIdForUsers = useMemo(() => {
    if (isEditMode && customerToEdit?.company_id) {
      return customerToEdit.company_id;
    }
    return selectedCompanyId && selectedCompanyId !== "all" ? selectedCompanyId : "1";
  }, [isEditMode, customerToEdit?.company_id, selectedCompanyId]);

  const { data: usersData, isLoading: usersLoading } = useUsers(companyIdForUsers);
  const { data: accountTypesData } = useAccountTypes();

  // Extract and format users from API response
  const users = useMemo(() => {
    if (!usersData?.data) return [];
    // The API returns data as { "CompanyName": [users...] }
    const usersArray = Object.values(usersData.data).flat() as any[];
    return usersArray
      .map((user: any) => ({
        id: user.user_id,
        username: user.username || `User ${user.user_id}`,
        value: String(user.user_id),
      }))
      .sort((a, b) => a.username.localeCompare(b.username));
  }, [usersData]);

  // Extract and format account types from API response
  const accountTypes = useMemo(() => {
    if (!accountTypesData || !Array.isArray(accountTypesData)) return [];
    return accountTypesData
      .map((type: any) => ({
        id: type.account_type_id,
        name: type.account_type_name,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [accountTypesData]);

  // Try to extract company name/id from JWT token
  const companyFromToken = useMemo(() => {
    try {
      if (!token) return null;
      const parts = token.split(".");
      if (parts.length < 2) return null;
      const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const json = typeof window !== "undefined" ? atob(base64) : Buffer.from(base64, "base64").toString("utf-8");
      const payload = JSON.parse(json);
      const name = payload.company || payload.company || null;
      const id = payload.company_id || payload.companyId || null;
      if (!name && !id) return null;
      return { name: name as string | null, id: id != null ? String(id) : null };
    } catch {
      return null;
    }
  }, [token]);

  useEffect(() => {
    if (isEditMode && customerToEdit) {
      setCustomerName(customerToEdit.name || "");
      setCustomerPhone(customerToEdit.phone || "");
      setCustomerEmail(customerToEdit.email || "");
      setBillingCity(customerToEdit.city || "");
      setBillingState(customerToEdit.state || "");
      setBillingAddress(customerToEdit.street || "");
      setBillingPOBox(customerToEdit.billing_po_box || "");
      setBillingCountry(customerToEdit.country || "");
      setShippingAddress(customerToEdit.street || "");
      setShippingPOBox(customerToEdit.shipping_po_box || "");
      setShippingCity(customerToEdit.city || "");
      setShippingState(customerToEdit.state || "");
      setShippingCode(customerToEdit.code || "");
      setShippingCountry(customerToEdit.country || "");
      setCompanyName(customerToEdit.company_name || "");
      setParent(customerToEdit.parent || "");
      setChildrenList(customerToEdit.children_list || "");
      setWebsite(customerToEdit.website || "");
      setNotes(customerToEdit.notes || "");
      if (customerToEdit.contacts) setContacts(customerToEdit.contacts);
    }
  }, [isEditMode, customerToEdit]);

  // Auto-populate company name (works in both create and edit mode)
  useEffect(() => {
    // Only auto-populate if company name is empty
    if (!companyName) {
      if (companyFromToken?.name) {
        setCompanyName(companyFromToken.name);
        return;
      }
      if (selectedCompanyName && selectedCompanyId && selectedCompanyId !== "all") {
        setCompanyName(selectedCompanyName);
      }
    }
  }, [companyName, companyFromToken, selectedCompanyName, selectedCompanyId]);

  // Set assignedTo from customer data in edit mode (only when users are loaded)
  // This ensures the Select component can find the matching user option
  useEffect(() => {
    if (isEditMode && customerToEdit?.assigned_to != null && users.length > 0) {
      const assignedToValue = String(customerToEdit.assigned_to);
      // Verify that the user exists in the users list
      const userExists = users.some((user) => user.value === assignedToValue);
      if (userExists) {
        setAssignedTo(assignedToValue);
      }
    }
  }, [isEditMode, customerToEdit?.assigned_to, users]);

  // Auto-populate assignedTo with logged-in user's email
  // In create mode: always use logged-in user
  // In edit mode: only use logged-in user if assigned_to is null
  useEffect(() => {
    if (!assignedTo && email && users.length > 0) {
      // Find user whose username matches the logged-in email
      const loggedInUser = users.find((user) => 
        user.username.toLowerCase() === email.toLowerCase()
      );
      if (loggedInUser) {
                // In edit mode, only set if customer data doesn't have assigned_to
        // In create mode, always set
        if (!isEditMode || (isEditMode && customerToEdit?.assigned_to == null)) {
          setAssignedTo(loggedInUser.value);
        }
      }
    }
  }, [isEditMode, assignedTo, email, users, customerToEdit?.assigned_to]);

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();

    // Extract user_id from assignedTo (it's already stored as user_id string)
    const userId = assignedTo ? parseInt(assignedTo) || null : null;

    // Get company_id - priority: token company_id > selectedCompanyId > null
    const companyId = companyFromToken?.id || (selectedCompanyId && selectedCompanyId !== "all" ? selectedCompanyId : null);

    // Convert accountType name to accountType ID
    const accountTypeId = accountType 
      ? (accountTypes.find((type) => type.name === accountType)?.id || null)
      : null;

    const payload = {
      ...(isEditMode && { id: customerId }),
      assignedTo: userId, // Send user_id as number
      accountType: accountTypeId, // Send account_type_id instead of name
      customerName,
      customerPhone,
      companyId: companyId, // Send company_id instead of company name
      parent,
      customerEmail,
      childrenList,
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
      website,
      notes,
      contacts,
    };
    console.log("💾 Saving Customer - JSON Payload:", JSON.stringify(payload, null, 2));

    try {
      if (isEditMode) {
        const response = await fetch("/api/customers", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token || ""}`,
          },
          body: JSON.stringify({
            id: customerId,
            name: customerName,
            city: billingCity,
            phone: customerPhone,
            assignedTo: userId, // Send user_id as number
            accountType: accountTypeId, // Send account_type_id instead of name
            street: billingAddress,
            country: billingCountry,
            notes,
            contacts,
            parent,
            childrenList,
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
            website,
            companyId: companyId, // Send company_id instead of company name
          }),
        });
        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: "Failed to update customer" }));
          throw new Error(error.error || `Failed to update customer: ${response.status}`);
        }
        await response.json().catch(() => ({}));
        router.push("/dashboard/customers");
      } else {
        const response = await fetch("https://pythonify.info/savecustomer.py", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: "Failed to save customer" }));
          throw new Error(error.error || `Failed to save customer: ${response.status}`);
        }
        await response.json().catch(() => ({}));
        router.push("/dashboard/customers");
      }
    } catch (error: any) {
      console.error(`Error ${isEditMode ? "updating" : "saving"} customer:`, error);
      alert(error.message || `Failed to ${isEditMode ? "update" : "save"} customer`);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, bgcolor: "#FAFAFD", p: 2, borderRadius: 1 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", bgcolor: "#FFF", p: 2, borderRadius: 1 }}>
        <Box sx={{ flex: "0 0 50%", display: "flex", flexDirection: "column", gap: 0.5 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "left" }}>
            <Box sx={{ display: "flex", gap: 3, alignItems: "left" }}>
              <Typography variant="body1" color="text.secondary" fontSize={30} sx={{ whiteSpace: "nowrap" }}>
                {isEditMode ? "Edit Customer" : "Create New Customer"}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 2, alignItems: "center", marginLeft: "5%" }}>
              <TextField 
                fullWidth 
                size="small" 
                label="Company Name" 
                value={companyName}
                slotProps={{
                  input: { 
                    sx: { height: 32, fontSize: 12, paddingY: 0 },
                    readOnly: true,
                  },
                  inputLabel: {
                    sx: { fontSize: 12 },
                  },
                }}
                sx={{ minWidth: 200 }}
              />
              <FormControl size="small" sx={{ minWidth: 300, marginRight: "10px" }}>
                <InputLabel id="assigned-to-label" sx={{ fontSize: 12 }}>Assigned To</InputLabel>
                <Select
                  labelId="assigned-to-label"
                  value={assignedTo}
                  label="Assigned To"
                  onChange={(e) => setAssignedTo(e.target.value as string)}
                  disabled={usersLoading}
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 200, // Approximately 5 items (40px per item)
                      },
                    },
                  }}
                  sx={{
                    height: 32,
                    fontSize: 12,
                    "& .MuiOutlinedInput-notchedOutline": {
                      fontSize: 12,
                    },
                  }}
                >
                  {usersLoading ? (
                    <MenuItem disabled>
                      <CircularProgress size={16} sx={{ mr: 1 }} />
                      Loading users...
                    </MenuItem>
                  ) : users.length > 0 ? (
                    users.map((user) => (
                      <MenuItem key={user.id} value={user.value}>
                        {user.username}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>No users available</MenuItem>
                  )}
                </Select>
              </FormControl>
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Button variant="outlined" onClick={() => router.push("/dashboard/customers")}>Cancel</Button>
          <Button type="submit" variant="contained" form="customer-form" disabled={customersLoading && isEditMode}>
            {customersLoading && isEditMode ? <CircularProgress size={20} /> : isEditMode ? "Update" : "Save"}
          </Button>
        </Box>
      </Box>

      <Divider />

      <Box component="form" id="customer-form" onSubmit={handleSave} sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
        <CustomerFormLeft
          customerName={customerName} setCustomerName={setCustomerName}
          accountType={accountType} setAccountType={setAccountType}
          customerPhone={customerPhone} setCustomerPhone={setCustomerPhone}
          parent={parent} setParent={setParent}
          customerEmail={customerEmail} setCustomerEmail={setCustomerEmail}
          childrenList={childrenList} setChildrenList={setChildrenList}
          website={website} setWebsite={setWebsite}
          billingAddress={billingAddress} setBillingAddress={setBillingAddress}
          billingPOBox={billingPOBox} setBillingPOBox={setBillingPOBox}
          billingCity={billingCity} setBillingCity={setBillingCity}
          billingState={billingState} setBillingState={setBillingState}
          billingCode={billingCode} setBillingCode={setBillingCode}
          billingCountry={billingCountry} setBillingCountry={setBillingCountry}
          shippingAddress={shippingAddress} setShippingAddress={setShippingAddress}
          shippingPOBox={shippingPOBox} setShippingPOBox={setShippingPOBox}
          shippingCity={shippingCity} setShippingCity={setShippingCity}
          shippingState={shippingState} setShippingState={setShippingState}
          shippingCode={shippingCode} setShippingCode={setShippingCode}
          shippingCountry={shippingCountry} setShippingCountry={setShippingCountry}
          notes={notes} setNotes={setNotes}
          contacts={contacts} setContacts={setContactsPlain}
          customers={customers}
        />

        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Box sx={{ bgcolor: "#FFF", p: 2, borderRadius: 1 }}>
            <Typography fontWeight={600} sx={{ mb: 1 }}>Orders</Typography>
          </Box>
          <Box sx={{ bgcolor: "#FFF", p: 2, borderRadius: 1 }}>
            <Typography fontWeight={600} sx={{ mb: 1 }}>Quotes</Typography>
          </Box>
          <Box sx={{ bgcolor: "#FFF", p: 2, borderRadius: 1 }}>
            <Typography fontWeight={600} sx={{ mb: 1 }}>Invoices</Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

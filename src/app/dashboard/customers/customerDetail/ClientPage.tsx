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

type Contact = {
  id?: number | string | null;
  name: string;
  phone: string;
  email: string;
  notes?: string;
  salutationId?: number | null;
};

function useCustomerDetail(customerId?: string) {
  const { token, isLoggedIn } = useAuth();
  const { fetchWithAuth } = useApi();

  return useQuery({
    queryKey: ["customer-detail", customerId],
    queryFn: async () => {
      if (!customerId) throw new Error("Missing customer id");
      const url = `http://34.58.37.44/api/get-account/${customerId}`;
      const res = await fetchWithAuth(url);
      if (!res.ok) {
        if (res.status === 401) throw new Error("Unauthorized – please log in again");
        throw new Error(`Request failed: ${res.status}`);
      }
      return res.json();
    },
    enabled: isLoggedIn && !!token && !!customerId,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
    refetchOnReconnect: "always",
  });
}

function useCustomers() {
  const { token, isLoggedIn } = useAuth();
  const { apiURL } = useBackend();

  return useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const url = apiURL("get-account/${customerId}", "accounts.json");
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
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 24 * 60 * 60 * 1000,
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
  const [description, setDescription] = React.useState("");
  const saveAccountUrl = apiURL("create-account", "accounts.json");
  const editAccountUrl = apiURL("edit-account", "edit-account.json");

  const [contacts, setContacts] = React.useState<Contact[]>([]);
  const setContactsPlain = React.useCallback((value: Contact[]) => setContacts(value), []);

  const { data: customersData, isLoading: customersLoading } = useCustomers();
  const { data: customerDetail, isLoading: customerDetailLoading } = useCustomerDetail(
    isEditMode ? customerId : undefined
  );
  const { data: accountTypesData, isLoading: accountTypesLoading } = useAccountTypes();

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

  // Determine company ID for users API
  const companyIdForUsers = useMemo(() => {
    if (isEditMode && customerDetail?.company_id) {
      return String(customerDetail.company_id);
    }
    return selectedCompanyId && selectedCompanyId !== "all" ? selectedCompanyId : "1";
  }, [isEditMode, customerDetail?.company_id, selectedCompanyId]);

  const { data: usersData, isLoading: usersLoading } = useUsers(companyIdForUsers);

  // Extract and format users from API response
  const users = useMemo(() => {
    if (!usersData?.data) return [];
    // The API returns data as { "CompanyName": [users...] }
    const usersArray = Object.values(usersData.data).flat() as any[];
    return usersArray
      .map((user: any) => {
        const username =
          user.username ||
          user.email ||
          user.name ||
          user.full_name ||
          `User ${user.user_id}`;
        return {
          id: user.user_id,
          username,
          value: String(user.user_id),
        };
      })
      .sort((a, b) => a.username.localeCompare(b.username));
  }, [usersData]);

  const fallbackAssignedUser = useMemo(() => {
    if (!customerDetail || customerDetail.assigned_to == null) return null;
    const value = String(customerDetail.assigned_to);
    const exists = users.some((user) => user.value === value);
    if (exists) return null;
    const candidateNames = [
      (customerDetail as any).assigned_to_name,
      (customerDetail as any).assigned_to_username,
      (customerDetail as any).assigned_user_name,
      (customerDetail as any).assigned_user,
      (customerDetail as any).assigned_to_email,
    ].filter((name) => typeof name === "string" && name.trim().length > 0);
    const username =
      candidateNames.length > 0 ? candidateNames[0] : `User ${value}`;
    return { id: `fallback-${value}`, username, value };
  }, [customerDetail, users]);

  const userOptions = useMemo(() => {
    if (fallbackAssignedUser) {
      return [fallbackAssignedUser, ...users];
    }
    return users;
  }, [fallbackAssignedUser, users]);

  const accountTypes = useMemo(() => {
    if (!Array.isArray(accountTypesData)) return [];
    return (accountTypesData as any[])
      .map((type) => {
        const id = type.account_type_id ?? type.id ?? type.value ?? null;
        const name = type.account_type_name ?? type.name ?? type.label ?? "";
        if (id == null || String(id).trim() === "" || name.trim() === "") return null;
        return { id: String(id), name: String(name) };
      })
      .filter((type): type is { id: string; name: string } => type !== null)
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
    if (isEditMode && customerDetail) {
      setCustomerName(customerDetail.account_name ?? "");
      setCustomerPhone(customerDetail.account_phone ?? "");
      setCustomerEmail(customerDetail.account_email ?? "");
      setAccountType(
        customerDetail.account_type_id != null ? String(customerDetail.account_type_id) : ""
      );

      const billingAddressData = customerDetail.billing_address ?? {};
      setBillingAddress(billingAddressData.street ?? "");
     // setBillingPOBox(billingAddressData.addresscode ?? "");
      setBillingCity(billingAddressData.city ?? "");
      setBillingState(billingAddressData.state ?? "");
      setBillingCode(billingAddressData.postalcode ?? "");
      setBillingCountry(billingAddressData.country ?? "");

      const shippingAddressData = customerDetail.shipping_address ?? {};
      setShippingAddress(shippingAddressData.street ?? "");
     // setShippingPOBox(shippingAddressData.addresscode ?? "");
      setShippingCity(shippingAddressData.city ?? "");
      setShippingState(shippingAddressData.state ?? "");
      setShippingCode(shippingAddressData.postalcode ?? "");
      setShippingCountry(shippingAddressData.country ?? "");

      setCompanyName(customerDetail.company_name ?? "");
      setParent(
        customerDetail.parent_account_id != null ? String(customerDetail.parent_account_id) : ""
      );

      if (Array.isArray(customerDetail.children) && customerDetail.children.length > 0) {
        const childrenText = customerDetail.children
          .map((child: any) => child.account_name || child.name || child.account_id)
          .filter(Boolean)
          .join(", ");
        setChildrenList(childrenText);
      } else {
        setChildrenList("");
      }

      setWebsite(customerDetail.account_website ?? "");
      setDescription(customerDetail.description ?? "");

      if (Array.isArray(customerDetail.contacts)) {
        setContacts(
          customerDetail.contacts.map((contact: any) => ({
            id:
              contact.contact_id ??
              contact.contactId ??
              contact.id ??
              contact.contactID ??
              null,
            name:
              contact.name ??
              contact.contact_name ??
              contact.full_name ??
              contact.username ??
              "",
            phone:
              contact.phone ??
              contact.phone_number ??
              contact.contact_phone ??
              contact.mobile ??
              "",
            email:
              contact.email ??
              contact.contact_email ??
              contact.work_email ??
              contact.personal_email ??
              "",
            notes: contact.notes ?? contact.description ?? "",
            salutationId:
              contact.salutation_id != null
                ? Number(contact.salutation_id)
                : contact.salutationId != null
                ? Number(contact.salutationId)
                : undefined,
          }))
        );
      } else {
        setContacts([]);
      }
    }
  }, [isEditMode, customerDetail]);

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

  useEffect(() => {
    if (!isEditMode) return;
    if (!customerDetail) return;
    if (customerDetail.assigned_to == null) {
      setAssignedTo("");
    } else {
      setAssignedTo(String(customerDetail.assigned_to));
    }
  }, [isEditMode, customerDetail]);

  // Auto-populate assignedTo with logged-in user's email
  // In create mode: always use logged-in user
  // In edit mode: only use logged-in user if assigned_to is null
  useEffect(() => {
    if (!assignedTo && email && userOptions.length > 0) {
      // Find user whose username matches the logged-in email
      const loggedInUser = userOptions.find((user) => {
        if (!user.username || !email) return false;
        return user.username.toLowerCase() === email.toLowerCase();
      });
      if (loggedInUser) {
                // In edit mode, only set if customer data doesn't have assigned_to
        // In create mode, always set
        if (!isEditMode || (isEditMode && customerDetail?.assigned_to == null)) {
          setAssignedTo(loggedInUser.value);
        }
      }
    }
  }, [isEditMode, assignedTo, email, userOptions, customerDetail?.assigned_to]);

  useEffect(() => {
    if (isEditMode) return;
    if (accountType) return;
    if (accountTypes.length === 0) return;
    setAccountType(accountTypes[0].id);
  }, [isEditMode, accountType, accountTypes]);

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();

    // Extract user_id from assignedTo (it's already stored as user_id string)
    const userId = assignedTo ? parseInt(assignedTo) || null : null;

    // Get company_id - priority: token company_id > selectedCompanyId > null
    const companyId = companyFromToken?.id || (selectedCompanyId && selectedCompanyId !== "all" ? selectedCompanyId : null);

    const companyIdNumber = companyId != null ? Number(companyId) : 0;
    const accountTypeNumeric = accountType ? Number(accountType) : 0;
    const parentAccountId = parent ? Number(parent) : null;

    const payload = {
      company_id: Number.isFinite(companyIdNumber) ? companyIdNumber : 0,
      assigned_to: userId ?? 0,
      account_name: customerName ?? "",
      account_type_id: Number.isFinite(accountTypeNumeric) ? accountTypeNumeric : 0,
      parent_account_id: parentAccountId,
      description: description ?? "",
      phone: customerPhone ?? "",
      email: customerEmail ?? "",
      website: website ?? "",
      accountAddress: {
        billingAddress: {
          street: billingAddress ?? "",
          city: billingCity ?? "",
          state: billingState ?? "",
          country: billingCountry ?? "",
          postalcode: billingCode ?? "",
          pobox: billingPOBox ?? "",
        },
        shippingAddress: {
          street: shippingAddress ?? "",
          city: shippingCity ?? "",
          state: shippingState ?? "",
          country: shippingCountry ?? "",
          postalcode: shippingCode ?? "",
          pobox: shippingPOBox ?? "",
          latitude: null,
          longitude: null,
        },
      },
      contacts: contacts.map((contact) => {
        const normalizedId = (() => {
          if (contact.id == null) return null;
          if (typeof contact.id === "number") {
            return Number.isFinite(contact.id) ? contact.id : null;
          }
          if (typeof contact.id === "string") {
            const trimmed = contact.id.trim();
            if (!trimmed) return null;
            const numeric = Number(trimmed);
            if (!Number.isNaN(numeric)) return numeric;
            return trimmed;
          }
          return null;
        })();
        return {
          contact_id: normalizedId,
          id: normalizedId,
          salutation_id: contact.salutationId ?? 0,
          contact_name: contact.name ?? "",
          phone: contact.phone ?? "",
          email: contact.email ?? "",
          notes: contact.notes ?? "",
        };
      }),
    };
   // console.log("Saving Customer - JSON Payload:", JSON.stringify(payload, null, 2));

    try {
      const accountId = (() => {
        const candidates = [
          customerDetail?.account_id,
          (customerDetail as any)?.accountId,
          customerDetail?.id,
          (customerDetail as any)?.accountID,
          customerId,
        ];
        for (const candidate of candidates) {
          if (candidate == null) continue;
          if (typeof candidate === "number") {
            if (Number.isFinite(candidate)) return candidate;
            continue;
          }
          if (typeof candidate === "string") {
            const trimmed = candidate.trim();
            if (!trimmed) continue;
            const numeric = Number(trimmed);
            if (!Number.isNaN(numeric)) return numeric;
            return trimmed;
          }
        }
        return null;
      })();

      if (isEditMode && accountId == null) {
        console.error("Missing account_id while attempting to update account", {
          customerId,
          customerDetail,
        });
        alert("We could not determine the account to update. Please reload and try again.");
        return;
      }

      if (isEditMode) {
        const response = await fetchWithAuth(editAccountUrl, {
          method: "POST",
          body: JSON.stringify({
            ...payload,
            account_id: accountId,
            id: accountId,
          }),
        });
        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: "Failed to update customer" }));
          throw new Error(error.error || `Failed to update customer: ${response.status}`);
        }
        await response.json().catch(() => ({}));
        alert("Customer updated successfully.");
        router.push("/dashboard/customers");
      } else {
        const response = await fetchWithAuth(saveAccountUrl, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const error = await response.json().catch(() => ({ error:  `Failed to update customer: ${response.status}`} ));
          throw new Error(error.error || `Failed to save customer: ${response.status}`);
        }
        await response.json().catch(() => ({}));
        alert("Customer saved successfully.");
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
                  ) : userOptions.length > 0 ? (
                    userOptions.map((user) => (
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
          <Button
            type="submit"
            variant="contained"
            form="customer-form"
            disabled={isEditMode && (customersLoading || customerDetailLoading)}
          >
            {isEditMode && (customersLoading || customerDetailLoading) ? (
              <CircularProgress size={20} />
            ) : isEditMode ? (
              "Update"
            ) : (
              "Save"
            )}
          </Button>
        </Box>
      </Box>

      <Divider />

      <Box component="form" id="customer-form" onSubmit={handleSave} sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
        <CustomerFormLeft
          customerName={customerName} setCustomerName={setCustomerName}
          accountType={accountType} setAccountType={setAccountType}
          accountTypes={accountTypes} accountTypesLoading={accountTypesLoading}
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
          description={description} setDescription={setDescription}
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

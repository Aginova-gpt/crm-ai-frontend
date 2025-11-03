"use client";

import * as React from "react";
import {
  Box,
  Typography,
  Button,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Divider,
} from "@mui/material";
import { useRouter } from "next/navigation";
import CustomerFormLeft from "@/components/CustomerForm/CustomerFormLeft";
import { useApi } from "@/utils/api";
import { useBackend } from "@/contexts/BackendContext";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useMemo } from "react";

type Customer = {
  id: string;
  name: string;
  company_id?: string;
};

// ✅ Explicitly type Contact so useState doesn’t infer never[]
type Contact = { name: string; phone: string; email: string };

function useCustomers() {
  const { token, isLoggedIn } = useAuth();
  const { apiURL } = useBackend();

  return useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const url = apiURL("accounts", "accounts.json");

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        if (res.status === 401)
          throw new Error("Unauthorized – please log in again");
        throw new Error(`Request failed: ${res.status}`);
      }
      return res.json();
    },
    enabled: isLoggedIn && !!token,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

export default function CustomerDetailPage() {
  const router = useRouter();
  const { fetchWithAuth } = useApi();
  const { apiURL } = useBackend();

  const [assignedTo, setAssignedTo] = React.useState("");
  const [customerName, setCustomerName] = React.useState("");
  const [companyName, setCompanyName] = React.useState("");
  const [customerPhone, setCustomerPhone] = React.useState("");
  const [parent, setParent] = React.useState("");
  const [customerEmail, setCustomerEmail] = React.useState("");
  const [childrenList, setChildrenList] = React.useState("");
  const [billingAddress, setBillingAddress] = React.useState("");
  const [billingCity, setBillingCity] = React.useState("");
  const [billingState, setBillingState] = React.useState("");
  const [billingCode, setBillingCode] = React.useState("");
  const [billingCountry, setBillingCountry] = React.useState("");
  const [shippingAddress, setShippingAddress] = React.useState("");
  const [shippingCity, setShippingCity] = React.useState("");
  const [shippingState, setShippingState] = React.useState("");
  const [shippingCode, setShippingCode] = React.useState("");
  const [shippingCountry, setShippingCountry] = React.useState("");
  const [notes, setNotes] = React.useState("");

  // ✅ Properly typed contacts state
  const [contacts, setContacts] = React.useState<Contact[]>([]);

  // ✅ Wrapper so the child can keep a simple `(value: Contact[]) => void` prop
  const setContactsPlain = React.useCallback(
    (value: Contact[]) => setContacts(value),
    []
  );

  // Fetch customers for parent dropdown
  const { data: customersData } = useCustomers();

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

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();

    const payload = {
      assignedTo: assignedTo,
      customerName: customerName,
      customerPhone: customerPhone,
      companyName: companyName || "Hidden",
      parent: parent,
      customerEmail: customerEmail,
      childrenList: childrenList,
      billingAddress: billingAddress,
      billingCity: billingCity,
      billingState: billingState,
      billingCode: billingCode,
      billingCountry: billingCountry,
      shippingAddress: shippingAddress,
      shippingCity: shippingCity,
      shippingState: shippingState,
      shippingCode: shippingCode,
      shippingCountry: shippingCountry,
      notes: notes,
      contacts: contacts,
    };

    try {
      const url = apiURL("api/accounts", "customers");
      const response = await fetchWithAuth(url, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      console.log(JSON.stringify(payload));
      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ error: "Failed to save customer" }));
        throw new Error(
          error.error || `Failed to save customer: ${response.status}`
        );
      }

      const data = await response.json();
      console.log("Customer saved successfully:", data);
      router.push("/dashboard/customers");
    } catch (error: any) {
      console.error("Error saving customer:", error);
      alert(error.message || "Failed to save customer");
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        bgcolor: "#FAFAFD",
        p: 2,
        borderRadius: 1,
      }}
    >
      {/* === Top Section === */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          bgcolor: "#FFF",
          p: 2,
          borderRadius: 1,
        }}
      >
        {/* Left: constrained to left column width */}
        <Box
          sx={{ flex: "0 0 50%", display: "flex", flexDirection: "column", gap: 0.5 }}
        >
          {/* Row 1: Customer name + AssignedTo */}
          <Box
            sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            <Box sx={{ display: "flex", gap: 3, alignItems: "left" }}>
              <Typography variant="body1" color="text.secondary" fontSize={30}>
                Create New Account
              </Typography>
            </Box>
            <FormControl size="small" sx={{ minWidth: 300, marginRight: "30px" }}>
              <InputLabel id="assigned-to-label">Assigned To</InputLabel>
              <Select
                labelId="assigned-to-label"
                value={assignedTo}
                label="Assigned To"
                onChange={(e) => setAssignedTo(e.target.value as string)}
              >
                <MenuItem value="User 1">User 1</MenuItem>
                <MenuItem value="User 2">User 2</MenuItem>
                <MenuItem value="User 3">User 3</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Row 2: Created + Modified */}
        </Box>

        {/* Right: Actions */}
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button variant="outlined" onClick={() => router.push("/dashboard/customers")}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" form="customer-form">
            Save
          </Button>
        </Box>
      </Box>

      <Divider />

      {/* === Main Layout: Left Form + Right Tables === */}
      <Box
        component="form"
        id="customer-form"
        onSubmit={handleSave}
        sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}
      >
        {/* Left side form */}
        <CustomerFormLeft
          customerName={customerName}
          setCustomerName={setCustomerName}
          customerPhone={customerPhone}
          setCustomerPhone={setCustomerPhone}
          parent={parent}
          setParent={setParent}
          customerEmail={customerEmail}
          setCustomerEmail={setCustomerEmail}
          childrenList={childrenList}
          setChildrenList={setChildrenList}
          billingAddress={billingAddress}
          setBillingAddress={setBillingAddress}
          billingCity={billingCity}
          setBillingCity={setBillingCity}
          billingState={billingState}
          setBillingState={setBillingState}
          billingCode={billingCode}
          setBillingCode={setBillingCode}
          billingCountry={billingCountry}
          setBillingCountry={setBillingCountry}
          shippingAddress={shippingAddress}
          setShippingAddress={setShippingAddress}
          shippingCity={shippingCity}
          setShippingCity={setShippingCity}
          shippingState={shippingState}
          setShippingState={setShippingState}
          shippingCode={shippingCode}
          setShippingCode={setShippingCode}
          shippingCountry={shippingCountry}
          setShippingCountry={setShippingCountry}
          notes={notes}
          setNotes={setNotes}
          contacts={contacts}
          // ✅ Pass wrapped setter to match child’s plain function prop
          setContacts={setContactsPlain}
          companyName={companyName}
          setCompanyName={setCompanyName}
          customers={customers}
        />

        {/* Right side placeholders */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Box sx={{ bgcolor: "#FFF", p: 2, borderRadius: 1 }}>
            <Typography fontWeight={600} sx={{ mb: 1 }}>
              Orders
            </Typography>
          </Box>
          <Box sx={{ bgcolor: "#FFF", p: 2, borderRadius: 1 }}>
            <Typography fontWeight={600} sx={{ mb: 1 }}>
              Quotes
            </Typography>
          </Box>
          <Box sx={{ bgcolor: "#FFF", p: 2, borderRadius: 1 }}>
            <Typography fontWeight={600} sx={{ mb: 1 }}>
              Invoices
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

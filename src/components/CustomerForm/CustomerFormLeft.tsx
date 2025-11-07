"use client";

import * as React from "react";
import {
    Box,
    Typography,
    TextField,
    IconButton,
    Button,
    Divider,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Tooltip,
    Autocomplete,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    CircularProgress,
} from "@mui/material";
import { MdDelete } from "react-icons/md";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import { useMemo } from "react";

interface Customer {
    id: string;
    name: string;
    company_id?: string;
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

interface ContactEntry {
    name: string;
    phone: string;
    email: string;
    notes?: string;
}

interface CustomerFormLeftProps {
    customerName: string;
    setCustomerName: (value: string) => void;   
    accountType: string;
    setAccountType: (value: string) => void;        
    customerPhone: string;
    setCustomerPhone: (value: string) => void;
    parent: string;
    setParent: (value: string) => void;
    customerEmail: string;
    setCustomerEmail: (value: string) => void;
    childrenList: string;
    setChildrenList: (value: string) => void;
    website: string;
    setWebsite: (value: string) => void;
    billingAddress: string;
    setBillingAddress: (value: string) => void;
    billingPOBox: string;
    setBillingPOBox: (value: string) => void;
    billingCity: string;
    setBillingCity: (value: string) => void;
    billingState: string;
    setBillingState: (value: string) => void;
    billingCode: string;
    setBillingCode: (value: string) => void;
    billingCountry: string;
    setBillingCountry: (value: string) => void;
    shippingAddress: string;
    setShippingAddress: (value: string) => void;
    shippingPOBox: string;
    setShippingPOBox: (value: string) => void;
    shippingCity: string;
    setShippingCity: (value: string) => void;
    shippingState: string;
    setShippingState: (value: string) => void;
    shippingCode: string;
    setShippingCode: (value: string) => void;
    shippingCountry: string;
    setShippingCountry: (value: string) => void;
    notes: string;
    setNotes: (value: string) => void;
    contacts: ContactEntry[];
    setContacts: (value: ContactEntry[]) => void;
    customers: Customer[];
}

export default function CustomerFormLeft({ customerName, setCustomerName, customerPhone, setCustomerPhone,
     accountType, setAccountType, parent, setParent, customerEmail, setCustomerEmail, childrenList,
      setChildrenList, website, setWebsite, billingAddress, setBillingAddress, billingPOBox, setBillingPOBox, billingCity, setBillingCity, billingState, 
      setBillingState, billingCode, setBillingCode, billingCountry, setBillingCountry, shippingAddress, 
      setShippingAddress, shippingPOBox, setShippingPOBox, shippingCity, setShippingCity, shippingState, setShippingState, shippingCode, 
      setShippingCode, shippingCountry, setShippingCountry, notes, setNotes, contacts, setContacts, customers }: CustomerFormLeftProps) {
    
    const { data: accountTypesData, isLoading: accountTypesLoading } = useAccountTypes();

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

    // Create a map for O(1) lookup instead of O(n) find operations
    const customersMap = React.useMemo(() => {
        const map = new Map<string, Customer>();
        customers.forEach(customer => map.set(customer.id, customer));
        return map;
    }, [customers]);

    // Memoize the selected customer to improve performance
    const selectedCustomer = React.useMemo(() => {
        if (!parent) return null;
        return customersMap.get(parent) || null;
    }, [parent, customersMap]);

    // Filter customers by company ID 1 by default, and memoize to prevent unnecessary re-renders
    // Optimized: filter once, sort once, cache result with early exits
    const memoizedCustomers = React.useMemo(() => {
        // Early return if no customers
        if (customers.length === 0) return [];
        
        // Filter to only show customers with company_id === "1"
        const filtered: Customer[] = [];
        const targetCompanyId = "1";
        
        // Pre-allocate array size estimate for better performance
        // Use for loop for better performance than filter on large arrays
        for (let i = 0; i < customers.length; i++) {
            const customer = customers[i];
            if (String(customer.company_id || "") === targetCompanyId) {
                filtered.push(customer);
            }
        }
        
        // Check if selected customer needs to be added with early exit
        if (selectedCustomer) {
            const selectedId = selectedCustomer.id;
            let found = false;
            // Early exit search - most selected customers will be in the list
            for (let i = 0; i < filtered.length; i++) {
                if (filtered[i].id === selectedId) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                filtered.unshift(selectedCustomer);
            }
        }
        
        // Sort once instead of on every render
        return filtered.sort((a, b) => a.name.localeCompare(b.name));
    }, [customers, selectedCustomer]);

    const [modalOpen, setModalOpen] = React.useState(false);
    const [newContactName, setNewContactName] = React.useState("");
    const [newContactPhone, setNewContactPhone] = React.useState("");
    const [newContactEmail, setNewContactEmail] = React.useState("");
    const [newContactNotes, setNewContactNotes] = React.useState("");

    const handleAddContact = () => {
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setNewContactName("");
        setNewContactPhone("");
        setNewContactEmail("");
        setNewContactNotes("");
    };

    const handleSaveContact = () => {
        if (newContactName.trim()) {
            setContacts([...contacts, { 
                name: newContactName.trim(), 
                phone: newContactPhone.trim(), 
                email: newContactEmail.trim(),
                notes: newContactNotes.trim(),
            }]);
            handleCloseModal();
        }
    };

    const handleDeleteContact = (index: number) => {
        setContacts(contacts.filter((_, i) => i !== index));
    };

    // Memoize renderOption callback to prevent unnecessary re-renders
    const renderOption = React.useCallback((props: React.HTMLAttributes<HTMLLIElement>, option: Customer) => (
        <Box component="li" {...props} key={option.id} sx={{ fontSize: 12 }}>
            {option.name}
        </Box>
    ), []);

    // Memoize onChange handler
    const handleAutocompleteChange = React.useCallback((_: any, newValue: Customer | null) => {
        setParent(newValue?.id || "");
    }, [setParent]);

    // Memoize getOptionLabel for consistency
    const getOptionLabel = React.useCallback((option: Customer) => option.name || "", []);

    // Memoize isOptionEqualToValue for consistency
    const isOptionEqualToValue = React.useCallback((option: Customer, value: Customer) => {
        if (!option || !value) return false;
        return option.id === value.id;
    }, []);

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* === Account Information === */}
            <Box>
                <Typography fontWeight={600} sx={{ mb: 1 }}>
                    Account information
                </Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                    {/* Row 1 */}
                    <TextField 
                     fullWidth 
                     size="small" 
                     required 
                     label="Customer Name"  
                     name="customerName"
                     value={customerName} 
                     onChange={(e) => setCustomerName(e.target.value)}
                    slotProps={{
                        input: { sx: { height: 32, fontSize: 12, paddingY: 0,},
                        },
                        inputLabel: {
                            sx: { fontSize: 12 }, 
                        },
                    }} /> 
                    <FormControl fullWidth size="small">
                        <InputLabel id="account-type-label" sx={{ fontSize: 12 }}>Account Type</InputLabel>
                        <Select
                            labelId="account-type-label"
                            value={accountType}
                            label="Account Type"
                            onChange={(e) => setAccountType(e.target.value)}
                            disabled={accountTypesLoading}
                            MenuProps={{
                                PaperProps: {
                                    style: {
                                        maxHeight: 200// Approximately 5 items (40px per item)
                                    },
                                },
                            }}
                            slotProps={{
                                input: {
                                    sx: { height: 32, fontSize: 12, paddingY: 0 },
                                },
                                inputLabel: {
                                    sx: { fontSize: 12 },
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
                            {accountTypesLoading ? (
                                <MenuItem disabled>
                                    <CircularProgress size={16} sx={{ mr: 1 }} />
                                    Loading account types...
                                </MenuItem>
                            ) : accountTypes.length > 0 ? (
                                accountTypes.map((type) => (
                                    <MenuItem key={type.id} value={type.name}>
                                        {type.name}
                                    </MenuItem>
                                ))
                            ) : (
                                <MenuItem disabled>No account types available</MenuItem>
                            )}
                        </Select>
                    </FormControl>

                    {/* Row 2 */}
                    <TextField fullWidth size="small" label="Customer Phone" value={customerPhone} 
                      onChange={(e) => setCustomerPhone(e.target.value)}
                    slotProps={{
                        input: { sx: { height: 32, fontSize: 12, paddingY: 0,},
                        },
                        inputLabel: {
                            sx: { fontSize: 12 }, 
                        },
                    }}/>
                    <Autocomplete
                        fullWidth
                        size="small"
                        disablePortal
                        options={memoizedCustomers}
                        value={selectedCustomer}
                        onChange={handleAutocompleteChange}
                        getOptionLabel={getOptionLabel}
                        isOptionEqualToValue={isOptionEqualToValue}
                        filterOptions={(options, { inputValue }) => {
                            // Early return - no filtering needed if no input
                            if (!inputValue || inputValue.trim() === "") {
                                // Return first 100 options for initial display to improve performance
                                return options.slice(0, 100);
                            }
                            
                            // Optimized filtering: use for loop with early exit conditions
                            const query = inputValue.toLowerCase().trim();
                            const filtered: Customer[] = [];
                            const maxResults = 100; // Limit results for better performance
                            
                            // Early exit if query is too short but still meaningful
                            if (query.length < 1) return options.slice(0, 100);
                            
                            for (let i = 0; i < options.length && filtered.length < maxResults; i++) {
                                const option = options[i];
                                const nameLower = option.name.toLowerCase();
                                
                                // Check if name starts with query first (common case)
                                if (nameLower.startsWith(query)) {
                                    filtered.unshift(option); // Prioritize matches at start
                                } else if (nameLower.includes(query)) {
                                    filtered.push(option);
                                }
                            }
                            
                            return filtered;
                        }}
                        noOptionsText="No customers found"
                        loading={customers.length === 0}
                        loadingText="Loading customers..."
                        openOnFocus={true}
                        disableListWrap={false}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                variant="outlined"
                                label="Select Parent Customer"
                                size="small"
                                placeholder={selectedCustomer ? undefined : "Type to search..."}
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        height: 32,
                                        fontSize: 12,
                                    },
                                    "& .MuiInputLabel-root": {
                                        fontSize: 12,
                                    },
                                }}
                            />
                        )}
                        renderOption={renderOption}
                        ListboxProps={{
                            style: { 
                                maxHeight: 300, 
                                fontSize: 12,
                            },
                        }}
                        sx={{
                            "& .MuiAutocomplete-inputRoot": {
                                height: 32,
                                paddingY: 0,
                            },
                        }}
                    />

                    {/* Row 3 */}
                    <TextField fullWidth size="small" label="Customer E-mail" value={customerEmail} 
                    onChange={(e) => setCustomerEmail(e.target.value)} slotProps={{
                        input: { sx: { height: 32, fontSize: 12, paddingY: 0,},
                        },
                        inputLabel: {
                            sx: { fontSize: 12 }, // smaller label
                        },
                    }}/>
                    <TextField
                        fullWidth
                        size="small"
                        label="Children List"
                        value={childrenList} 
                       slotProps={{
                            input: { sx: { height: 32, fontSize: 12, paddingY: 0,},
                            },
                            inputLabel: {
                                sx: { fontSize: 12 }, // smaller label
                            },
                        }}
                    />
                    <TextField
                        fullWidth
                        size="small"
                        label="Website"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        slotProps={{
                            input: { sx: { height: 32, fontSize: 12, paddingY: 0,},
                            },
                            inputLabel: {
                                sx: { fontSize: 12 }, // smaller label
                            },
                        }}
                    />
                </Box>
            </Box>

            {/* === Billing + Shipping Information side by side === */}
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
                {/* Billing */}
                <Box>
                    <Typography fontWeight={600} fontSize={14} sx={{ mb: 1 }}>
                        Billing information
                    </Typography>
                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                        <TextField fullWidth size="small" label="Billing Address" sx={{ gridColumn: "span 2" }}
                        value={billingAddress}
                        onChange={(e) => setBillingAddress(e.target.value)}
                        slotProps={{
                        input: { sx: { height: 32, fontSize: 12, paddingY: 0,},
                        },
                        inputLabel: {
                            sx: { fontSize: 12 }, // smaller label
                        },
                    }}/>
                        <TextField fullWidth size="small" label="Billing PO Box" 
                        value={billingPOBox}
                        onChange={(e) => setBillingPOBox(e.target.value)}
                        slotProps={{
                        input: { sx: { height: 32, fontSize: 12, paddingY: 0,},
                        },
                        inputLabel: {
                            sx: { fontSize: 12 }, // smaller label
                        },
                    }}/>
                        <TextField fullWidth size="small" label="Billing City" sx={{ gridColumn: "span 2" }} 
                        value={billingCity}
                        onChange={(e) => setBillingCity(e.target.value)} slotProps={{
                        input: { sx: { height: 32, fontSize: 12, paddingY: 0,},
                        },
                        inputLabel: {
                            sx: { fontSize: 12 }, // smaller label
                        },
                    }}/>
                        <TextField fullWidth size="small" label="Billing State" 
                        value={billingState}
                        onChange={(e) => setBillingState(e.target.value)} slotProps={{
                        input: { sx: { height: 32, fontSize: 12, paddingY: 0,},
                        },
                        inputLabel: {
                            sx: { fontSize: 12 }, // smaller label
                        },
                    }} />
                        <TextField fullWidth size="small" label="Code" 
                        value={billingCode}
                        onChange={(e) => setBillingCode(e.target.value)} slotProps={{
                        input: { sx: { height: 32, fontSize: 12, paddingY: 0,},
                        },
                        inputLabel: {
                            sx: { fontSize: 12 }, // smaller label
                        },
                    }}/>
                        <TextField fullWidth size="small" label="Billing Country" sx={{ gridColumn: "span 2" }} 
                        value={billingCountry}
                        onChange={(e) => setBillingCountry(e.target.value)} slotProps={{
                        input: { sx: { height: 32, fontSize: 12, paddingY: 0,},
                        },
                        inputLabel: {
                            sx: { fontSize: 12 }, // smaller label
                        },
                    }}/>
                    </Box>
                </Box>

                {/* Shipping */}
                <Box>
                    <Typography fontWeight={600} fontSize={14} sx={{ mb: 1 }}>
                        Shipping information
                    </Typography>
                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                        <TextField fullWidth size="small" label="Shipping Address" sx={{ gridColumn: "span 2" }} 
                        value={shippingAddress}
                        onChange={(e) => setShippingAddress(e.target.value)} slotProps={{
                        input: { sx: { height: 32, fontSize: 12, paddingY: 0,},
                        },
                        inputLabel: {
                            sx: { fontSize: 12 }, // smaller label
                        },
                    }}/>
                        <TextField fullWidth size="small" label="Shipping PO Box" 
                        value={shippingPOBox}
                        onChange={(e) => setShippingPOBox(e.target.value)} slotProps={{
                        input: { sx: { height: 32, fontSize: 12, paddingY: 0,},
                        },
                        inputLabel: {
                            sx: { fontSize: 12 }, // smaller label
                        },
                    }}/>
                        <TextField fullWidth size="small" label="Shipping City" sx={{ gridColumn: "span 2" }} 
                        value={shippingCity}
                        onChange={(e) => setShippingCity(e.target.value)} slotProps={{
                        input: { sx: { height: 32, fontSize: 12, paddingY: 0,},
                        },
                        inputLabel: {
                            sx: { fontSize: 12 }, // smaller label
                        },
                    }}/>
                        <TextField fullWidth size="small" label="Shipping State" 
                        value={shippingState}
                        onChange={(e) => setShippingState(e.target.value)} slotProps={{
                        input: { sx: { height: 32, fontSize: 12, paddingY: 0,},
                        },
                        inputLabel: {
                            sx: { fontSize: 12 }, // smaller label
                        },
                    }}/>
                        <TextField fullWidth size="small" label="Code" 
                        value={shippingCode}
                        onChange={(e) => setShippingCode(e.target.value)} slotProps={{
                        input: { sx: { height: 32, fontSize: 12, paddingY: 0,},
                        },
                        inputLabel: {
                            sx: { fontSize: 12 }, // smaller label
                        },
                    }}/>
                        <TextField fullWidth size="small" label="Shipping Country" sx={{ gridColumn: "span 2" }} 
                        value={shippingCountry}
                        onChange={(e) => setShippingCountry(e.target.value)} slotProps={{
                        input: { sx: { height: 32, fontSize: 12, paddingY: 0,},
                        },
                        inputLabel: {
                            sx: { fontSize: 12 }, // smaller label
                        },
                    }}/>
                    </Box>
                </Box>
            </Box>

            {/* === Description === */}
            <Box>
                <Typography fontWeight={600} sx={{ mb: 1 }}>
                    Description
                </Typography>
                        <TextField fullWidth size="small" multiline rows={3} placeholder="Add description..." 
                value={notes}
                onChange={(e) => setNotes(e.target.value)} />
            </Box>

            <Divider />

            {/* === Contacts === */}
            <Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                    <Typography fontWeight={600}>Contacts</Typography>
                    <Button variant="text" size="small" onClick={handleAddContact}>
                        + Add Contact
                    </Button>
                </Box>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Phone</TableCell>
                            <TableCell>Email</TableCell>
                                <TableCell>Notes</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {contacts.map((c, i) => (
                            <TableRow key={i}>
                                <TableCell>{c.name}</TableCell>
                                <TableCell>{c.phone}</TableCell>
                                <TableCell>{c.email}</TableCell>
                                <TableCell>{c.notes || ""}</TableCell>
                                <TableCell align="right">
                                    <Tooltip title="Delete">
                                        <IconButton size="small" color="error" onClick={() => handleDeleteContact(i)}>
                                            <MdDelete size={18} />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Box>

            {/* Add Contact Modal */}
            <Dialog
                open={modalOpen}
                onClose={handleCloseModal}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Add Contact</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
                        <TextField
                            autoFocus
                            label="Name"
                            fullWidth
                            size="small"
                            required
                            value={newContactName}
                            onChange={(e) => setNewContactName(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === "Enter") {
                                    handleSaveContact();
                                }
                            }}
                            slotProps={{
                                input: { sx: { height: 32, fontSize: 12, paddingY: 0 } },
                                inputLabel: {
                                    sx: { fontSize: 12 },
                                },
                            }}
                        />
                        <TextField
                            label="Phone"
                            fullWidth
                            size="small"
                            value={newContactPhone}
                            onChange={(e) => setNewContactPhone(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === "Enter") {
                                    handleSaveContact();
                                }
                            }}
                            slotProps={{
                                input: { sx: { height: 32, fontSize: 12, paddingY: 0 } },
                                inputLabel: {
                                    sx: { fontSize: 12 },
                                },
                            }}
                        />
                        <TextField
                            label="Email"
                            fullWidth
                            size="small"
                            value={newContactEmail}
                            onChange={(e) => setNewContactEmail(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === "Enter") {
                                    handleSaveContact();
                                }
                            }}
                            slotProps={{
                                input: { sx: { height: 32, fontSize: 12, paddingY: 0 } },
                                inputLabel: {
                                    sx: { fontSize: 12 },
                                },
                            }}
                        />
                        <TextField
                            label="Notes"
                            fullWidth
                            size="small"
                            value={newContactNotes}
                            onChange={(e) => setNewContactNotes(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === "Enter") {
                                    handleSaveContact();
                                }
                            }}
                            slotProps={{
                                input: { sx: { height: 32, fontSize: 12, paddingY: 0 } },
                                inputLabel: {
                                    sx: { fontSize: 12 },
                                },
                            }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ marginRight: "15px", marginBottom: "10px" }}>
                    <Button onClick={handleCloseModal} sx={{ color: "black" }}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSaveContact}
                        variant="contained"
                        color="primary"
                        disabled={!newContactName.trim()}
                    >
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

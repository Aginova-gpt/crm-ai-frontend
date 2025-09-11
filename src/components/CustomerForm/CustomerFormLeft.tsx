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
} from "@mui/material";
import { MdDelete } from "react-icons/md";

export default function CustomerFormLeft() {
    const [contacts, setContacts] = React.useState([
        { name: "John Doe", phone: "707-406-3060", email: "john.doe@aginova.com" },
        { name: "Jane Doe", phone: "707-405-7069", email: "jane.doe@aginova.com" },
    ]);

    const handleAddContact = () => {
        setContacts([...contacts, { name: "", phone: "", email: "" }]);
    };

    const handleDeleteContact = (index: number) => {
        setContacts(contacts.filter((_, i) => i !== index));
    };

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* === Account Information === */}
            <Box>
                <Typography fontWeight={600} sx={{ mb: 1 }}>
                    Account information
                </Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                    {/* Row 1 */}
                    <TextField fullWidth size="small" label="Customer Name"  slotProps={{
                        input: { sx: { height: 32, fontSize: 12, paddingY: 0,},
                        },
                        inputLabel: {
                            sx: { fontSize: 12 }, 
                        },
                    }} />
                    <TextField fullWidth size="small" label="Company Name" value="Aginova" slotProps={{
                        input: { sx: { height: 32, fontSize: 12, paddingY: 0,},
                        },
                        inputLabel: {
                            sx: { fontSize: 12 },
                        },
                    }}/>

                    {/* Row 2 */}
                    <TextField fullWidth size="small" label="Customer Phone" value="707-405-7069" slotProps={{
                        input: { sx: { height: 32, fontSize: 12, paddingY: 0,},
                        },
                        inputLabel: {
                            sx: { fontSize: 12 }, 
                        },
                    }}/>
                    <TextField fullWidth size="small" label="Parent" value="Aginova" slotProps={{
                        input: { sx: { height: 32, fontSize: 12, paddingY: 0,},
                        },
                        inputLabel: {
                            sx: { fontSize: 12 }, // smaller label
                        },
                    }}/>

                    {/* Row 3 */}
                    <TextField fullWidth size="small" label="Customer E-mail" value="mihai@aginova.com" slotProps={{
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
                        value="Aginova1, Aginova2, Aginova3" slotProps={{
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
                        <TextField fullWidth size="small" label="Billing Address" sx={{ gridColumn: "span 2" }} slotProps={{
                        input: { sx: { height: 32, fontSize: 12, paddingY: 0,},
                        },
                        inputLabel: {
                            sx: { fontSize: 12 }, // smaller label
                        },
                    }}/>
                        <TextField fullWidth size="small" label="Billing City" sx={{ gridColumn: "span 2" }} slotProps={{
                        input: { sx: { height: 32, fontSize: 12, paddingY: 0,},
                        },
                        inputLabel: {
                            sx: { fontSize: 12 }, // smaller label
                        },
                    }}/>
                        <TextField fullWidth size="small" label="Billing State" slotProps={{
                        input: { sx: { height: 32, fontSize: 12, paddingY: 0,},
                        },
                        inputLabel: {
                            sx: { fontSize: 12 }, // smaller label
                        },
                    }} />
                        <TextField fullWidth size="small" label="Code" slotProps={{
                        input: { sx: { height: 32, fontSize: 12, paddingY: 0,},
                        },
                        inputLabel: {
                            sx: { fontSize: 12 }, // smaller label
                        },
                    }}/>
                        <TextField fullWidth size="small" label="Billing Country" sx={{ gridColumn: "span 2" }} slotProps={{
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
                        <TextField fullWidth size="small" label="Shipping Address" sx={{ gridColumn: "span 2" }} slotProps={{
                        input: { sx: { height: 32, fontSize: 12, paddingY: 0,},
                        },
                        inputLabel: {
                            sx: { fontSize: 12 }, // smaller label
                        },
                    }}/>
                        <TextField fullWidth size="small" label="Shipping City" sx={{ gridColumn: "span 2" }} slotProps={{
                        input: { sx: { height: 32, fontSize: 12, paddingY: 0,},
                        },
                        inputLabel: {
                            sx: { fontSize: 12 }, // smaller label
                        },
                    }}/>
                        <TextField fullWidth size="small" label="Shipping State" slotProps={{
                        input: { sx: { height: 32, fontSize: 12, paddingY: 0,},
                        },
                        inputLabel: {
                            sx: { fontSize: 12 }, // smaller label
                        },
                    }}/>
                        <TextField fullWidth size="small" label="Code" slotProps={{
                        input: { sx: { height: 32, fontSize: 12, paddingY: 0,},
                        },
                        inputLabel: {
                            sx: { fontSize: 12 }, // smaller label
                        },
                    }}/>
                        <TextField fullWidth size="small" label="Shipping Country" sx={{ gridColumn: "span 2" }} slotProps={{
                        input: { sx: { height: 32, fontSize: 12, paddingY: 0,},
                        },
                        inputLabel: {
                            sx: { fontSize: 12 }, // smaller label
                        },
                    }}/>
                    </Box>
                </Box>
            </Box>

            {/* === Notes === */}
            <Box>
                <Typography fontWeight={600} sx={{ mb: 1 }}>
                    Notes
                </Typography>
                <TextField fullWidth size="small" multiline rows={3} placeholder="Add notes..." />
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
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {contacts.map((c, i) => (
                            <TableRow key={i}>
                                <TableCell>{c.name}</TableCell>
                                <TableCell>{c.phone}</TableCell>
                                <TableCell>{c.email}</TableCell>
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
        </Box>
    );
}

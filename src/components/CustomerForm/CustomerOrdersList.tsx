"use client";

import * as React from "react";
import {
    Box,
    Typography,
    Table,
    TableContainer,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    TablePagination,
    Checkbox,
    IconButton,
    Tooltip,
    Divider,
    Skeleton,
    Button,
} from "@mui/material";
import { MdModeEditOutline, MdDelete } from "react-icons/md";

type UnknownRecord = Record<string, any>;

export type CustomerOrder = {
    id: string;
    orderNo: string;
    subject: string;
    quoteName: string;
    totalAmount: string;
    productsList: string;
    raw: UnknownRecord;
};

function coerceToArray(value: unknown): UnknownRecord[] {
    if (Array.isArray(value)) {
        return value.filter((item) => item && typeof item === "object") as UnknownRecord[];
    }
    return [];
}

function normalizeTotalAmount(value: unknown): string {
    if (value == null) return "-";
    if (typeof value === "number") return value.toLocaleString();
    const trimmed = String(value).trim();
    if (!trimmed) return "-";
    return trimmed;
}

function normalizeProductsList(value: unknown): string {
    if (Array.isArray(value)) {
        return value
            .map((item) => {
                if (item == null) return "";
                if (typeof item === "string") return item;
                if (typeof item === "object") {
                    const name =
                        (item as UnknownRecord).name ??
                        (item as UnknownRecord).product_name ??
                        (item as UnknownRecord).label ??
                        "";
                    const quantity =
                        (item as UnknownRecord).quantity ??
                        (item as UnknownRecord).qty ??
                        (item as UnknownRecord).count ??
                        null;
                    if (name && quantity != null) {
                        return `${name} (${quantity})`;
                    }
                    return String(name || quantity || "").trim();
                }
                return String(item).trim();
            })
            .filter(Boolean)
            .join(", ");
    }
    if (typeof value === "string") return value;
    if (value && typeof value === "object") {
        const entries = Object.entries(value as UnknownRecord)
            .map(([key, val]) => {
                if (val == null || val === "") return "";
                return `${key} (${val})`;
            })
            .filter(Boolean);
        if (entries.length) return entries.join(", ");
    }
    return "-";
}

function normalizeOrders(rawOrders: UnknownRecord[] | undefined | null): CustomerOrder[] {
    if (!rawOrders || rawOrders.length === 0) return [];

    return rawOrders.map((order, index) => {
        const fallbackId = `order-${index}`;
        const orderNo =
            order.order_no ??
            order.orderNo ??
            order.order_number ??
            order.orderNumber ??
            order.order_id ??
            order.orderId ??
            order.invoice_no ??
            order.id ??
            fallbackId;

        const subject =
            order.subject ??
            order.order_subject ??
            order.name ??
            order.title ??
            order.description ??
            "-";

        const quoteName =
            order.quote_name ??
            order.quoteName ??
            order.quote ??
            order.related_quote ??
            "-";

        const totalAmount =
            order.total_amount ??
            order.amount ??
            order.total ??
            order.totalAmount ??
            order.grand_total ??
            order.value ??
            null;

        const productsList =
            order.products_list ??
            order.products ??
            order.product_list ??
            order.items ??
            order.order_items ??
            order.line_items ??
            null;

        return {
            id: String(order.id ?? order.order_id ?? order.orderId ?? fallbackId),
            orderNo: String(orderNo ?? `#${index + 1}`),
            subject: String(subject ?? "-") || "-",
            quoteName: String(quoteName ?? "-") || "-",
            totalAmount: normalizeTotalAmount(totalAmount),
            productsList: normalizeProductsList(productsList),
            raw: order,
        };
    });
}

interface CustomerOrdersListProps {
    loading?: boolean;
    rawOrders?: unknown;
    headerTitle?: string;
    rowsPerPageOptions?: number[];
}

export default function CustomerOrdersList({
    loading = false,
    rawOrders,
    headerTitle = "Orders",
    rowsPerPageOptions = [5, 10, 25],
}: CustomerOrdersListProps) {
    const orders = React.useMemo(
        () => normalizeOrders(coerceToArray(rawOrders as UnknownRecord[])),
        [rawOrders]
    );

    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(rowsPerPageOptions[0] ?? 5);

    React.useEffect(() => {
        setPage(0);
    }, [rowsPerPage, orders.length]);

    const paginatedOrders = React.useMemo(() => {
        const start = page * rowsPerPage;
        return orders.slice(start, start + rowsPerPage);
    }, [orders, page, rowsPerPage]);

    return (
        <Box sx={{ bgcolor: "#FFF", borderRadius: 1, border: "1px solid #EDF1F5" }}>
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 2,
                    px: 2,
                    py: 1.5,
                }}
            >
                <Typography sx={{ fontWeight: 600, fontSize: 18 }}>
                    {orders.length ? `${orders.length} ${headerTitle}` : headerTitle}
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexShrink: 0 }}>
                    <Button
                        size="small"
                        variant="contained"
                        color="error"
                        sx={{ minWidth: 88, fontWeight: 600 }}
                    >
                        Delete
                    </Button>
                    <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        sx={{ minWidth: 88, fontWeight: 600 }}
                    >
                        Duplicate
                    </Button>
                    <Button
                        size="small"
                        variant="contained"
                        color="success"
                        sx={{ minWidth: 88, fontWeight: 600 }}
                    >
                        Save
                    </Button>
                </Box>
            </Box>
            <Divider />
            {loading ? (
                <Box sx={{ p: 2 }}>
                    {Array.from({ length: Math.min(rowsPerPage, 5) }).map((_, index) => (
                        <Skeleton key={index} height={40} sx={{ mb: index === rowsPerPage - 1 ? 0 : 1 }} />
                    ))}
                </Box>
            ) : orders.length === 0 ? (
                <Box sx={{ p: 2 }}>
                    <Typography color="text.secondary" fontSize={14}>
                        No orders found for this customer.
                    </Typography>
                </Box>
            ) : (
                <>
                    <TableContainer sx={{ maxHeight: 340 }}>
                        <Table size="small" stickyHeader>
                            <TableHead>
                                <TableRow sx={{ "& th": { fontSize: 12, fontWeight: 600, bgcolor: "#EAF5FF" } }}>
                                    <TableCell padding="checkbox">
                                        <Checkbox size="small" />
                                    </TableCell>
                                    <TableCell>Order No</TableCell>
                                    <TableCell>Subject</TableCell>
                                    <TableCell>Quote Name</TableCell>
                                    <TableCell>Total Amount</TableCell>
                                    <TableCell>Products list</TableCell>
                                    <TableCell align="center">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {paginatedOrders.map((order) => (
                                    <TableRow key={order.id} hover sx={{ "& td": { fontSize: 12 } }}>
                                        <TableCell padding="checkbox">
                                            <Checkbox size="small" />
                                        </TableCell>
                                        <TableCell>{order.orderNo}</TableCell>
                                        <TableCell>{order.subject}</TableCell>
                                        <TableCell>{order.quoteName}</TableCell>
                                        <TableCell>{order.totalAmount}</TableCell>
                                        <TableCell sx={{ maxWidth: 220 }}>
                                            <Typography noWrap title={order.productsList}>
                                                {order.productsList}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Tooltip title="View / Edit">
                                                <IconButton size="small" color="primary">
                                                    <MdModeEditOutline size={16} />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete">
                                                <IconButton size="small" color="error">
                                                    <MdDelete size={16} />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        component="div"
                        count={orders.length}
                        page={page}
                        rowsPerPage={rowsPerPage}
                        rowsPerPageOptions={rowsPerPageOptions}
                        onPageChange={(_, newPage) => setPage(newPage)}
                        onRowsPerPageChange={(event) => {
                            setRowsPerPage(parseInt(event.target.value, 10));
                            setPage(0);
                        }}
                        labelRowsPerPage="Rows per page"
                        labelDisplayedRows={({ from, to, count }) =>
                            `${from}-${to} of ${count !== -1 ? count : orders.length}`
                        }
                        sx={{
                            "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                                fontSize: 12,
                            },
                        }}
                    />
                </>
            )}
        </Box>
    );
}



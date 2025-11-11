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
import {
    coerceToArray,
    normalizeProductsList,
    normalizeTotalAmount,
} from "./CustomerOrdersList";

type UnknownRecord = Record<string, any>;

export type CustomerQuote = {
    id: string;
    quoteNo: string;
    subject: string;
    quoteStage: string;
    totalAmount: string;
    productsList: string;
    raw: UnknownRecord;
};

function normalizeQuotes(rawQuotes: UnknownRecord[] | undefined | null): CustomerQuote[] {
    if (!rawQuotes || rawQuotes.length === 0) return [];

    return rawQuotes.map((quote, index) => {
        const fallbackId = `quote-${index}`;
        const quoteNoSource =
            quote.quote_no ??
            quote.quoteNo ??
            quote.quote_number ??
            quote.quoteNumber ??
            quote.quote_num ??
            quote.quoteNum ??
            quote.quotation_number ??
            quote.quotationNumber ??
            quote.quote_code ??
            quote.quoteCode ??
            quote.quote_reference ??
            quote.quoteReference ??
            quote.reference_number ??
            quote.referenceNumber ??
            quote.number ??
            quote.quote_id ??
            quote.quoteId ??
            quote.id ??
            null;

        const quoteNo =
            quoteNoSource != null && String(quoteNoSource).trim()
                ? quoteNoSource
                : fallbackId;

        const subject =
            quote.subject ??
            quote.quote_subject ??
            quote.name ??
            quote.title ??
            quote.description ??
            "-";

        const quoteStage =
            quote.quote_stage ??
            quote.quoteStage ??
            quote.stage ??
            quote.stage_name ??
            quote.stageName ??
            quote.status ??
            quote.quote_status ??
            quote.pipeline_stage ??
            quote.pipelineStage ??
            quote.phase ??
            "-";

        const totalAmount =
            quote.total_amount ??
            quote.amount ??
            quote.total ??
            quote.totalAmount ??
            quote.grand_total ??
            quote.value ??
            null;

        const productsList =
            quote.product_code_list ??
            quote.products ??
            quote.product_list ??
            quote.items ??
            quote.quote_items ??
            quote.line_items ??
            null;

        return {
            id: String(quote.id ?? quote.quote_id ?? quote.quoteId ?? fallbackId),
            quoteNo: String(quoteNo ?? `#${index + 1}`),
            subject: String(subject ?? "-") || "-",
            quoteStage: String(quoteStage ?? "-") || "-",
            totalAmount: normalizeTotalAmount(totalAmount),
            productsList: normalizeProductsList(productsList),
            raw: quote,
        };
    });
}

interface CustomerQuotesListProps {
    loading?: boolean;
    rawQuotes?: unknown;
    headerTitle?: string;
    rowsPerPageOptions?: number[];
}

export default function CustomerQuotesList({
    loading = false,
    rawQuotes,
    headerTitle = "Quotes",
    rowsPerPageOptions = [5, 10, 25],
}: CustomerQuotesListProps) {
    const quotes = React.useMemo(
        () => normalizeQuotes(coerceToArray(rawQuotes as UnknownRecord[])),
        [rawQuotes]
    );

    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(rowsPerPageOptions[0] ?? 5);

    React.useEffect(() => {
        setPage(0);
    }, [rowsPerPage, quotes.length]);

    const paginatedQuotes = React.useMemo(() => {
        const start = page * rowsPerPage;
        return quotes.slice(start, start + rowsPerPage);
    }, [quotes, page, rowsPerPage]);

    const hasQuotes = quotes.length > 0;

    return (
        <Box sx={{ bgcolor: "#FFF", borderRadius: 1, border: "1px solid #EDF1F5" }}>
            <Box
                sx={{
                    display: "flex",
                    justifyContent: hasQuotes ? "space-between" : "flex-start",
                    alignItems: "center",
                    gap: 2,
                    px: 2,
                    py: 1.5,
                }}
            >
                <Typography sx={{ fontWeight: 600, fontSize: 18 }}>
                    {quotes.length ? `${quotes.length} ${headerTitle}` : headerTitle}
                </Typography>
                {hasQuotes && (
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
                )}
            </Box>
            <Divider />
            {loading ? (
                <Box sx={{ p: 2 }}>
                    {Array.from({ length: Math.min(rowsPerPage, 5) }).map((_, index) => (
                        <Skeleton key={index} height={40} sx={{ mb: index === rowsPerPage - 1 ? 0 : 1 }} />
                    ))}
                </Box>
            ) : quotes.length === 0 ? (
                <Box sx={{ p: 2 }}>
                    <Typography color="text.secondary" fontSize={14}>
                        No quotes found for this customer.
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
                                    <TableCell>Quote No</TableCell>
                                    <TableCell>Subject</TableCell>
                                    <TableCell>Quote Stage</TableCell>
                                    <TableCell>Total Amount</TableCell>
                                    <TableCell>Products list</TableCell>
                                    <TableCell align="center">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {paginatedQuotes.map((quote) => (
                                    <TableRow
                                        key={quote.id}
                                        hover
                                        sx={{ "& td": { fontSize: 12 }, "& .subjectCell": { fontSize: 10 } }}
                                    >
                                        <TableCell padding="checkbox">
                                            <Checkbox size="small" />
                                        </TableCell>
                                        <TableCell>{quote.quoteNo}</TableCell>
                                        <TableCell className="subjectCell">{quote.subject}</TableCell>
                                        <TableCell>{quote.quoteStage}</TableCell>
                                        <TableCell>{quote.totalAmount}</TableCell>
                                        <TableCell sx={{ maxWidth: 220 }}>
                                            <Typography noWrap title={quote.productsList} sx={{ fontSize: 10 }}>
                                                {quote.productsList}
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
                        count={quotes.length}
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
                            `${from}-${to} of ${count !== -1 ? count : quotes.length}`
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



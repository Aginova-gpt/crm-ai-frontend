"use client";

import InvoiceForm from "../components/InvoiceForm";

export default function AddInvoicePage() {
	return <InvoiceForm mode="create" invoiceIdFromParams={null} />;
}

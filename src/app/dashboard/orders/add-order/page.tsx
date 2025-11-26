"use client";

import OrderForm from "../components/OrderForm";

export default function AddOrderPage() {
	return <OrderForm mode="create" orderIdFromParams={null} />;
}


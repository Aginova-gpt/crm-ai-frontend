"use client";

import * as React from "react";
import OrderForm from "../../components/OrderForm";

type EditOrderClientProps = {
	params: Promise<{ orderId: string }>;
};

export default function EditOrderClient({ params }: EditOrderClientProps) {
	const { orderId } = (React as any).use(params) as { orderId: string };
	return <OrderForm mode="edit" orderIdFromParams={orderId} />;
}


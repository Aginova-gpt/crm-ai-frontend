"use client";

import * as React from "react";
import QuoteForm from "../../components/QuoteForm";

type EditQuoteClientProps = {
	params: Promise<{ quoteId: string }>;
};

export default function EditQuoteClient({ params }: EditQuoteClientProps) {
	const { quoteId } = (React as any).use(params) as { quoteId: string };
	return <QuoteForm mode="edit" quoteIdFromParams={quoteId} />;
}


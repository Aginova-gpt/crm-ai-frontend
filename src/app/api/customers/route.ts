// app/api/customers/route.ts
import { NextResponse } from "next/server";

type RawAccount = {
  account_id: number;
  assigned_to: number | null;
  city: string | null;
  country: string | null;
  name: string;
  phone: string | null;
  state: string | null;
  street: string | null;
  website: string | null;
};

type UpstreamResponse = {
  accounts: RawAccount[];
  total_accounts: number;
};

export const dynamic = "force-dynamic"; // avoid caching

function normalizeWebsite(url?: string | null) {
  if (!url) return "";
  const t = url.trim();
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization") || "";

  // ✅ Only include Authorization if present
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (authHeader) {
    headers["Authorization"] = authHeader;
  }

  const upstream = await fetch("http://34.58.37.44/api/accounts", {
    cache: "no-store",
    headers,
  });

  if (!upstream.ok) {
    const err = await upstream.text();
    return NextResponse.json(
      { error: `Upstream error: ${upstream.status}`, details: err },
      { status: upstream.status }
    );
  }

  const data = (await upstream.json()) as UpstreamResponse;

  const accounts = data.accounts.map((a) => ({
    id: String(a.account_id),
    name: a.name,
    company: undefined,
    city: a.city ?? "",
    website: normalizeWebsite(a.website),
    phone: a.phone ?? "",
    assignedTo: a.assigned_to != null ? `User ${a.assigned_to}` : "",
    openOrders: 0,
    openQuotes: 0,
  }));

  return NextResponse.json({
    accounts,
    total_accounts: data.total_accounts,
  });
}

export async function PUT(req: Request) {
  const authHeader = req.headers.get("authorization") || "";
  
  // Parse the request body
  const body = await req.json();
  const { id, name, city, website, phone, assignedTo } = body;
  
  if (!id) {
    return NextResponse.json(
      { error: "Customer ID is required" },
      { status: 400 }
    );
  }

  // Prepare headers
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (authHeader) {
    headers["Authorization"] = authHeader;
  }

  // Extract assigned_to number from "User X" format, plain number/string, or set to null
  const assigned_to = assignedTo ? 
    (typeof assignedTo === 'number' ? assignedTo : 
     parseInt(String(assignedTo).replace(/^User\s+/i, '')) || null) : 
    null;

  // Prepare the update payload
  const updatePayload = {
    name: name || '',
    city: city || null,
    website: website || null,
    phone: phone || null,
    assigned_to: assigned_to,
  };

  // Make the API call to update the customer
  const upstream = await fetch(`http://34.58.37.44/api/accounts/${id}`, {
    method: "PUT",
    cache: "no-store",
    headers,
    body: JSON.stringify(updatePayload),
  });

  if (!upstream.ok) {
    const err = await upstream.text();
    return NextResponse.json(
      { error: `Failed to update customer: ${upstream.status}`, details: err },
      { status: upstream.status }
    );
  }

  const data = await upstream.json();
  
  return NextResponse.json({
    message: "Customer updated successfully",
    customer: data,
  });
}
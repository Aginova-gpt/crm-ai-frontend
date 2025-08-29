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

export async function GET() {
  const upstream = await fetch("http://34.58.37.44/api/accounts", { cache: "no-store" });
  if (!upstream.ok) {
    return NextResponse.json({ error: `Upstream error: ${upstream.status}` }, { status: upstream.status });
  }

  const data = (await upstream.json()) as UpstreamResponse;

  // Transform to your dashboard's Customer shape
  const accounts = data.accounts.map((a) => ({
    id: String(a.account_id),
    name: a.name,
    company: undefined, // upstream doesn't provide a separate "company"
    city: a.city ?? "",
    website: normalizeWebsite(a.website),
    phone: a.phone ?? "",
    assignedTo: a.assigned_to != null ? `User ${a.assigned_to}` : "",
    openOrders: 0, // placeholders until you have these
    openQuotes: 0,
  }));

  // Keep field names familiar (accounts/total_accounts)
  return NextResponse.json({
    accounts,
    total_accounts: data.total_accounts,
  });
}

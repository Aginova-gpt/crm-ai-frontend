import { NextResponse } from "next/server";

// Mock data generator for user filters
const generateMockUserFilters = () => {
  return {
    deactivated: 5,
    owners: 12,
    inactive_90_days: 8,
    total_users: 50,
  };
};

const mockUserFilters = generateMockUserFilters();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  
  // If there's a search term, adjust the counts to be more realistic
  let adjustedFilters = { ...mockUserFilters };
  
  if (search && search.length >= 1) {
    // Simulate filtering based on search term
    const searchLower = search.toLowerCase();
    
    // Reduce counts based on search term (simulating filtered results)
    if (searchLower.includes("admin") || searchLower.includes("owner")) {
      adjustedFilters.owners = Math.max(1, Math.floor(adjustedFilters.owners * 0.7));
    }
    
    if (searchLower.includes("inactive") || searchLower.includes("old")) {
      adjustedFilters.inactive_90_days = Math.max(1, Math.floor(adjustedFilters.inactive_90_days * 0.8));
    }
    
    if (searchLower.includes("deactivated") || searchLower.includes("disabled")) {
      adjustedFilters.deactivated = Math.max(1, Math.floor(adjustedFilters.deactivated * 0.6));
    }
    
    // Adjust total based on search
    adjustedFilters.total_users = Math.max(
      adjustedFilters.deactivated + adjustedFilters.owners + adjustedFilters.inactive_90_days,
      Math.floor(adjustedFilters.total_users * 0.6)
    );
  }

  return NextResponse.json(adjustedFilters);
} 
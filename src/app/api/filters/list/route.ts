import { NextResponse } from "next/server";

// Mock data generator for filters
const generateMockFilters = () => {
  return {
    filter_alarming_sensors: 10,
    filter_inactive_sensors: 20,
    filter_low_battery: 30,
    filter_weak_signal: 40,
    total_sensors: 100,
  };
};

const mockFilters = generateMockFilters();

export async function GET() {
  return NextResponse.json(mockFilters);
}

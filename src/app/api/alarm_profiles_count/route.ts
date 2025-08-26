import { NextResponse } from "next/server";

// Mock data for alarm counts matching AlarmProfilesFiltersType
const mockAlarmCounts = {
  filter_battery: Math.floor(Math.random() * 20) + 5,
  filter_connectivity: Math.floor(Math.random() * 15) + 3,
  filter_threshold: Math.floor(Math.random() * 25) + 8,
  filter_not_reading: Math.floor(Math.random() * 30) + 10,
  filter_active: Math.floor(Math.random() * 50) + 20,
  filter_disabled: Math.floor(Math.random() * 70) + 30,
  total_profiles: Math.floor(Math.random() * 100) + 50,
};

export async function GET() {
  return NextResponse.json(mockAlarmCounts);
}

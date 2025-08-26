import { NextResponse } from "next/server";

// Mock data for alarm counts matching AlarmsFiltersTypeResponse
const mockAlarmCounts = {
  type_not_reading: Math.floor(Math.random() * 20) + 5,
  type_lowbattery: Math.floor(Math.random() * 15) + 3,
  type_connectivity: Math.floor(Math.random() * 18) + 2,
  type_threshold: Math.floor(Math.random() * 25) + 8,
  open_alarms: Math.floor(Math.random() * 30) + 10,
  closed_alarms: Math.floor(Math.random() * 50) + 20,
  total_alarms: Math.floor(Math.random() * 100) + 50,
};

export async function GET() {
  return NextResponse.json(mockAlarmCounts);
}

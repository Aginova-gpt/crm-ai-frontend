import { NextResponse } from "next/server";
import { t_name } from "@/utils/sensorHelpers";

// Mock data for alarms matching AlarmObject interface
const mockAlarms = Array.from({ length: 50 }, (_, index) => ({
  id: `alarm-${(index % 5) + 1}`,
  type: [
    "notreadingdata",
    "lowbattery",
    "connectivity",
    "threshold",
  ][Math.floor(Math.random() * 4)] as any,
  sensor_name: `BR_CTRB_ A420 LN2 # ${Math.floor(Math.random() * 5) + 1}`,
  sensor_id: `sensor-${Math.floor(Math.random() * 100000) + 100000}`,
  coalition: "Cedars-Sinai Health System",
  group: "CSMC Path Lab - SOCC CNR Lab Group",
  location: "Room 101",
  alarm_condition: `CNR Lab Rm Temp/Humidity - 1 (00209299)\nMeasured for tempSht (celsius) the value 24.06\u2103 on 2025-07-18 11:33:49 GMT\n(0.06\u2103 above upper limit 24.00\u2103\nof alarm profile \"SOCC CNR LAB (18C - 24C, 20% - 80%)\").`,
  alarm_time: new Date(Date.now() - Math.random() * 86400000).toISOString(),
  alarm_profile_name: "SOCC CNR LAB (18C - 24C, 20% - 80%)",
  alarm_profile_id: `${Math.floor(Math.random() * 1000) + 1}`,
  probe_type: Math.random() > 0.5 ? "Temp1" : "DryContact",
  status: Math.random() > 0.5 ? "open" : "closed",
  measurement_current_reading: Math.floor(Math.random() * 100) + 20,
  measurement_unit: "°C",
  is_safe: Math.random() > 0.5,
  sent_to_sms_count: Math.floor(Math.random() * 5),
  sent_to_email_count: Math.floor(Math.random() * 3),
  sent_to_call_count: Math.floor(Math.random() * 2),
  acknowledge_date:
    Math.random() > 0.7
      ? new Date(Date.now() - Math.random() * 3600000).toISOString()
      : null,
  acknowledged_by: Math.random() > 0.7 ? "john.doe@example.com" : null,
  acknowledgement_note: Math.random() > 0.7 ? "Battery replaced" : null,
  acknowledgement_comment: Math.random() > 0.7 ? "Comment Battery replaced" : null,
  measurement_name: ["temp1", "temp2", "temp3", "temp4", "temp5"][
    Math.floor(Math.random() * 5)
  ] as t_name,
  measurement_id: ["t1", "t2", "t3", "t4", "t5"][
    Math.floor(Math.random() * 5)
  ] as t_name,
}));

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const search = searchParams.get("search") || "";

  let filteredAlarms = [...mockAlarms];

  // Apply search filter
  if (search) {
    filteredAlarms = filteredAlarms.filter(
      (alarm) =>
        alarm.sensor_name.toLowerCase().includes(search.toLowerCase()) ||
        alarm.alarm_condition.toLowerCase().includes(search.toLowerCase()) ||
        alarm.location.toLowerCase().includes(search.toLowerCase())
    );
  }

  // Apply filter parameters
  const filterParams = searchParams.toString().split("&");
  filterParams.forEach((param) => {
    const [key, value] = param.split("=");
    if (value === "true" && key.startsWith("filter_")) {
      filteredAlarms = filteredAlarms.filter((alarm) => alarm.type === key);
    }
  });

  // Pagination
  const pageSize = 10;
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedAlarms = filteredAlarms.slice(startIndex, endIndex);

  return NextResponse.json({
    data: paginatedAlarms,
    total: filteredAlarms.length,
    page,
    pageSize,
  });
}

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Mock data for sensors
const mockSensors = Array.from({ length: 50 }, (_, index) => ({
  id: `sensor-${index + 1}`,
  name: `BR_CTRB_ A420 LN2 # ${index + 1}`,
  location: `Building Long Long Long Long Long Name ${
    Math.floor(index / 10) + 1
  }, Room ${(index % 10) + 1}`,
  group_id: `group-${index + 1}`,
  coalition_id: `coalition-${index + 1}`,
  group: `Group Long Long Long Long Long Name ${Math.floor(index / 10) + 1}`,
  coalition: `Coalition Long Long Long Long Long Name ${
    Math.floor(index / 10) + 1
  }`,
  asset: `Asset Long Long Long Long Long Name ${Math.floor(index / 10) + 1}`,
  mac_address: `00:00:00:00:00:${index.toString(16).padStart(2, "0")}`,
  ap_mac_address: `00:00:00:00:00:${index.toString(16).padStart(2, "0")}`,
  ssid: `SSID-${index + 1}`,
  product: `Product ${Math.floor(index / 10) + 1}`,
  filter_inactive_sensors: Math.random() < 0.5,
  in_maintenance:
    Math.random() < 0.5
      ? new Date(Date.now() + Math.random() * 86400000).toISOString()
      : null,
  open_alarms: Math.floor(Math.random() * 5),
  code_version: `${Math.floor(index / 10) + 1}`,
  upload_period: 300,
  sampling_period: 300,
  signal_rssi: Math.floor(Math.random() * -100),
  battery_voltage: 3.2 + Math.random() * 0.8,
  battery_charging_status: Math.random() > 0.5 ? "1" : "0",
  last_seen: new Date(Date.now() - Math.random() * 86400000).toISOString(),
  last_data: new Date(Date.now() - Math.random() * 86400000).toISOString(),
  probe: {
    id: index + 1,
    internal_code: `X_NO_PROBE`,
    name: `Probe ${index + 1}`,
  },
  alarm_profile: {
    id: `${index + 1}`,
    name: `Profile ${index + 1}`,
  },
  nist: Math.random() > 0.5 ? "NS-2142" : null,
  data_t1: {
    name: `Temperature 1`,
    value: Math.random() * 100,
    unit: "celsius",
    lower_threshold: Math.random() * 100,
    upper_threshold: Math.random() * 100,
    visible: Math.random() > 0.5,
  },
  data_t2: {
    name: `Temperature 2`,
    value: Math.random() * 100,
    unit: "celsius",
    lower_threshold: Math.random() * 100,
    upper_threshold: Math.random() * 100,
    visible: Math.random() > 0.5,
  },
  data_t3: {
    name: `Temperature 3`,
    value: Math.random() * 100,
    unit: "celsius",
    lower_threshold: Math.random() * 100,
    upper_threshold: Math.random() * 100,
    visible: Math.random() > 0.5,
  },
  data_t4: {
    name: `Temperature ${index + 4}`,
    value: Math.random() * 100,
    unit: "celsius",
    lower_threshold: Math.random() * 100,
    upper_threshold: Math.random() * 100,
    visible: Math.random() > 0.5,
  },
  data_t5: {
    name: `Temperature ${index + 5}`,
    value: Math.random() * 100,
    unit: "celsius",
    lower_threshold: Math.random() * 100,
    upper_threshold: Math.random() * 100,
    visible: Math.random() > 0.5,
  },
  data_t6: {
    name: `Temperature ${index + 6}`,
    value: Math.random() * 100,
    unit: "celsius",
    lower_threshold: Math.random() * 100,
    upper_threshold: Math.random() * 100,
    visible: Math.random() > 0.5,
  },
  data_t7: {
    name: `Temperature ${index + 7}`,
    value: Math.random() * 100,
    unit: "celsius",
    lower_threshold: Math.random() * 100,
    upper_threshold: Math.random() * 100,
    visible: Math.random() > 0.5,
  },
  data_t8: {
    name: `Temperature ${index + 8}`,
    value: Math.random() * 100,
    unit: "celsius",
    lower_threshold: Math.random() * 100,
    upper_threshold: Math.random() * 100,
    visible: Math.random() > 0.5,
  },
  data_t9: {
    name: `Temperature ${index + 9}`,
    value: Math.random() * 100,
    unit: "celsius",
    lower_threshold: Math.random() * 100,
    upper_threshold: Math.random() * 100,
    visible: Math.random() > 0.5,
  },
  data_t10: {
    name: `Temperature ${index + 10}`,
    value: Math.random() * 100,
    unit: "celsius",
    lower_threshold: Math.random() * 100,
    upper_threshold: Math.random() * 100,
    visible: Math.random() > 0.5,
  },
  data_t11: {
    name: `Temperature ${index + 11}`,
    value: Math.random() * 100,
    unit: "celsius",
    lower_threshold: Math.random() * 100,
    upper_threshold: Math.random() * 100,
    visible: Math.random() > 0.5,
  },
  data_t12: {
    name: `Temperature ${index + 12}`,
    value: Math.random() * 100,
    unit: "celsius",
    lower_threshold: Math.random() * 100,
    upper_threshold: Math.random() * 100,
    visible: Math.random() > 0.5,
  },
  data_t13: {
    name: `Temperature ${index + 13}`,
    value: Math.random() * 100,
    unit: "celsius",
    lower_threshold: Math.random() * 100,
    upper_threshold: Math.random() * 100,
    visible: Math.random() > 0.5,
  },
  data_t14: {
    name: `Temperature ${index + 14}`,
    value: Math.random() * 100,
    unit: "celsius",
    lower_threshold: Math.random() * 100,
    upper_threshold: Math.random() * 100,
    visible: Math.random() > 0.5,
  },
  data_t15: {
    name: `Temperature ${index + 15}`,
    value: Math.random() * 100,
    unit: "celsius",
    lower_threshold: Math.random() * 100,
    upper_threshold: Math.random() * 100,
    visible: Math.random() > 0.5,
  },
}));

export async function GET(request: NextRequest, context: any) {
  try {
    const id = context.params.id;

    // const sensor = mockSensors.find((s) => s.id === id);
    const sensor = mockSensors[0];

    if (!sensor) {
      return NextResponse.json({ error: "Sensor not found" }, { status: 404 });
    }

    return NextResponse.json(sensor);
  } catch (error) {
    console.error("Error fetching sensor details:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch sensor details",
      },
      { status: 500 }
    );
  }
}

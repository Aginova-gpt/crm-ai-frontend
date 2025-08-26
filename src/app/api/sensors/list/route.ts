import { NextResponse } from "next/server";

// Mock data generator
const generateMockSensors = (count: number) => {
  // Available internal codes for random selection
  const internalCodes = [
    "XCOMP_2000_0020",
    "XTEMP_2000_0020",
    "XTEMP_2000_0021",
    "EL-RG-4H",
    "EL-RG-12H",
    "EL-RG-16H",
    "EL-RG-23H",
    "EL-RG-49H",
    "2-F-4",
    "EL-F-4H",
    "EL-F-4K",
    "2-R-12G",
    "2-R-23G",
    "2-R-4",
    "2-R-48G",
    "XCAM_6001_0000",
    "XCAM_2000_0001",
    "XTEMP_2000_0004",
    "XCOMP_2000_0001",
    "XCORR_2000_0001",
    "XCORR_2000_0003",
    "XCORR_3000_0001",
    "X_NO_PROBE",
    "XTEMP_2000_0001",
    "XTEMP_2000_0002",
    "XTEMP_2000_0003",
    "XTEMP_2000_0005",
    "XTEMP_2000_0006",
    "XTEMP_2000_0008",
    "XTEMP_2000_0009",
    "XTEMP_2000_0010",
    "XTEMP_2000_0011",
    "XTEMP_2000_0012",
    "XTEMP_2000_0013",
    "XTEMP_2000_0014",
    "XTEMP_2000_0015",
    "XTEMP_2000_0016",
    "XCO2_2000_0001",
    "XCO2_2000_0002",
    "XTEMP_2000_0017",
    "XXXXXXXXXXXXXXXX",
  ];

  return Array.from({ length: count }, (_, i) => {
    const data1 = Math.random() * 100;
    const data2 = Math.random() * 100;
    const lowerThreshold1 = 10;
    const upperThreshold1 = 90;
    const lowerThreshold2 = 10;
    const upperThreshold2 = 90;

    // Determine reading status based on thresholds
    const getReadingStatus = (value: number, lower: number, upper: number) => {
      if (value < lower) return "below";
      if (value > upper) return "above";
      return "normal";
    };

    const units = ["celsius", "fahrenheit", "percentage"];

    return {
      sensor_id: `sensor-${i + 1}`,
      probe: {
        id: Math.floor(Math.random() * 10) + 1,
        internal_code:
          internalCodes[Math.floor(Math.random() * internalCodes.length)],
        name: `Probe ${i + 1}`,
      },
      sensor_name: `Sensor ${i + 1}`,
      last_seen: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      last_data: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      data: {
        t1: {
          value: data1,
          lower_threshold: lowerThreshold1,
          upper_threshold: upperThreshold1,
          average: data1 + (Math.random() * 10 - 5),
          min: data1 - Math.random() * 5,
          max: data1 + Math.random() * 5,
          unit: units[Math.floor(Math.random() * units.length)],
        },
        t2: {
          value: data2,
          lower_threshold: lowerThreshold2,
          upper_threshold: upperThreshold2,
          average: data2 + (Math.random() * 10 - 5),
          min: data2 - Math.random() * 5,
          max: data2 + Math.random() * 5,
          unit: units[Math.floor(Math.random() * units.length)],
        },
      },
      signal_rssi: Math.floor(Math.random() * -100),
      battery_voltage: 3.2 + Math.random() * 0.8,
      battery_charging_status: Math.random() > 0.5 ? "1" : "0",
      open_alarms: Math.floor(Math.random() * 5),
      filter_inactive_sensors: Math.random() < 0.5,
      alarm_profile: {
        id: Math.random() > 0.4 ? Math.floor(Math.random() * 10) + 1 : null,
        name:
          Math.random() > 0.4
            ? `${Math.floor(Math.random() * 10) + 1}`
            : null,
      },
      in_maintenance:
        Math.random() < 0.5
          ? new Date(Date.now() + Math.random() * 86400000).toISOString()
          : null,
      coalition: ["Coalition 1", "Coalition 2", "Coalition 3"][
        Math.floor(Math.random() * 3)
      ],
      group: ["Group 1", "Group 2", "Group 3"][Math.floor(Math.random() * 3)],
      asset: ["Asset 1", "Asset 2", "Asset 3"][Math.floor(Math.random() * 3)],
      location: ["Location 1", "Location 2", "Location 3"][
        Math.floor(Math.random() * 3)
      ],
    };
  });
};

// Generate 100 mock sensors
const mockSensors = generateMockSensors(100);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const search = searchParams.get("search") || "";
  const pageSize = 10;

  // Filter sensors based on search term
  const filteredSensors = mockSensors.filter(
    (sensor) =>
      sensor.sensor_name.toLowerCase().includes(search.toLowerCase()) ||
      sensor.sensor_id.toLowerCase().includes(search.toLowerCase())
  );

  // Calculate pagination
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedSensors = filteredSensors.slice(startIndex, endIndex);

  return NextResponse.json({
    data: paginatedSensors,
    total: filteredSensors.length,
    page,
    pageSize,
  });
}

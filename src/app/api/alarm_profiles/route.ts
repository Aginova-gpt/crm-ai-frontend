import { ReceiverType } from "@/utils/helpers";
import { NextResponse } from "next/server";

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

// Mock data for alarm profiles matching AlarmProfileType interface
const mockAlarmProfiles = Array.from({ length: 50 }, (_, index) => ({
  id: `${index + 1}`,
  enabled: Math.random() > 0.3,
  name: `Alarm Profile ${index + 1}`,
  selected_product_number:
    internalCodes[Math.floor(Math.random() * internalCodes.length)],
  num_sensors: Math.floor(Math.random() * 100) + 1,
  coalition: ["Hospital A", "Hospital B", "Clinic C", "Lab D"][
    Math.floor(Math.random() * 4)
  ],
  group: ["Group A", "Group B", "Group C", "Group D"][
    Math.floor(Math.random() * 4)
  ],
  alarm_types: [
    ["threshold", "battery"],
    ["connectivity", "not_reading"],
    ["threshold", "battery", "connectivity"],
    ["battery", "not_reading"],
    ["threshold"],
  ][Math.floor(Math.random() * 5)] as any,
  automatically_close: Math.random() > 0.5,
  send_acknowledgment: Math.random() > 0.5,
  ack: Math.random() > 0.5,
  recovery_time: Math.floor(Math.random() * 60) + 5,
  delay_before_repeating: Math.floor(Math.random() * 60),
  receivers: Array.from(
    { length: Math.floor(Math.random() * 5) + 1 },
    (_, i) => ({
      label: `Receiver ${i + 1}`,
      receiver_type: ["list", "relay", "individual", "user"][
        Math.floor(Math.random() * 4)
      ] as ReceiverType,
      count: Math.floor(Math.random() * 10) + 1,
    })
  ),
  escalations: [
    {
      delay_before_sending: 15,
      id: 3555,
      is_active: true,
      level: 1,
      targets: [
        {
          call_enabled: false,
          email: "jeanette.andrade@cshs.org",
          email_enabled: false,
          sms_enabled: false,
          type: "user",
          username: "jeanette.andrade@cshs.org",
        },
        {
          call_enabled: false,
          email: "aaron.fishburn@cshs.org",
          email_enabled: true,
          sms_enabled: false,
          type: "user",
          username: "aaron.fishburn@cshs.org",
        },
        {
          id: 1,
          members: [
            {
              call_enabled: false,
              email: "rena.casarez@csmns.org",
              email_enabled: true,
              sensor_id: null,
              sms_enabled: true,
              type: "user",
            },
            {
              call_enabled: false,
              email: "brian.bass@sonitor.com",
              email_enabled: true,
              sensor_id: null,
              sms_enabled: true,
              type: "user",
            },
            {
              call_enabled: false,
              email: "octavche@gmail.com",
              email_enabled: true,
              sensor_id: null,
              sms_enabled: true,
              type: "receiver",
            },
            {
              call_enabled: true,
              email: null,
              email_enabled: false,
              sensor_id: "00520001",
              sms_enabled: false,
              type: "relay",
            },
          ],
          name: "Test Receiver List 1",
          type: "receiver_list",
        },
      ],
    },
  ],
}));

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const search = searchParams.get("search") || "";

  let filteredProfiles = [...mockAlarmProfiles];

  // Apply search filter
  if (search) {
    filteredProfiles = filteredProfiles.filter(
      (profile) =>
        profile.name.toLowerCase().includes(search.toLowerCase()) ||
        profile.coalition.toLowerCase().includes(search.toLowerCase())
    );
  }

  // Apply filter parameters
  const filterParams = searchParams.toString().split("&");
  filterParams.forEach((param) => {
    const [key, value] = param.split("=");
    if (value === "true" && key.startsWith("filter_")) {
      filteredProfiles = filteredProfiles.filter((profile) =>
        profile.alarm_types.includes(key.replace("filter_", ""))
      );
    }
  });

  // Pagination
  const pageSize = 10;
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedProfiles = filteredProfiles.slice(startIndex, endIndex);

  return NextResponse.json({
    data: paginatedProfiles,
    total: filteredProfiles.length,
    page,
    pageSize,
  });
}

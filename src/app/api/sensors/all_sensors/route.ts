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

// Mock data generator for all sensors
const generateMockAllSensors = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    sensor_id: `002032221${i + 1}`,
    sensor_name: `Sensor Some Name Long ${i + 1}`,
    sensor_type:
      internalCodes[Math.floor(Math.random() * internalCodes.length)],
    coalition_name: `Coalition ${Math.floor(Math.random() * 10) + 1}`,
    group_name: `Group ${Math.floor(Math.random() * 10) + 1}`,
    location_name: `Location ${Math.floor(Math.random() * 10) + 1}`,
  }));
};

const mockedData = [
  {
    coalition_name: "Aginova Testing",
    group_name: "Mason Group",
    location_name: "Mason",
    sensor_id: "00204237",
    sensor_name: "Sensor_00204237",
    sensor_type: "XTEMP_2000_0004",
    alarm_profile: {
      id: 1,
      name: "Profile 1",
    },
  },
  {
    coalition_name: "Aginova Testing",
    group_name: "Mason Group",
    location_name: "Mason",
    sensor_id: "00204413",
    sensor_name: "UltraLow Freezer - Lab Was in Doylestown",
    sensor_type: "XTEMP_2000_0017",
    alarm_profile: {
      id: 1,
      name: "Profile 1",
    },
  },
  {
    coalition_name: "Aginova Testing",
    group_name: "Mason Group",
    location_name: "Mason",
    sensor_id: "00205066",
    sensor_name: "Nursery Pyxis Ref",
    sensor_type: "XTEMP_2000_0001",
    alarm_profile: {
      id: 2,
      name: "Wolpaw Lab 3300 LN2",
    },
  },
  {
    coalition_name: "Aginova Testing",
    group_name: "Mason Group",
    location_name: "Ashok House",
    sensor_id: "00205190",
    sensor_name: "Test Sensor",
    sensor_type: "X_NO_PROBE",
    alarm_profile: {
      id: null,
      name: null,
    },
  },
  {
    coalition_name: "Aginova Testing",
    group_name: "Mason Group",
    location_name: "Mason",
    sensor_id: "00205619",
    sensor_name: "Alarm Test",
    sensor_type: "XTEMP_2000_0001",
    alarm_profile: {
      id: null,
      name: null,
    },
  },
  {
    coalition_name: "Aginova Testing",
    group_name: "Mason Group",
    location_name: "Mason",
    sensor_id: "00205695",
    sensor_name: "1525 Room 4A Fridge Old",
    sensor_type: "X_NO_PROBE",
    alarm_profile: {
      id: null,
      name: null,
    },
  },
  {
    coalition_name: "Aginova Testing",
    group_name: "Mason Group",
    location_name: "Mason",
    sensor_id: "00205826",
    sensor_name: "1525 Pharmacy Freezer",
    sensor_type: "X_NO_PROBE",
    alarm_profile: {
      id: null,
      name: null,
    },
  },
  {
    coalition_name: "Aginova Testing",
    group_name: "Mason Group",
    location_name: "Mason",
    sensor_id: "00206668",
    sensor_name: "Sensor_00206668",
    sensor_type: "X_NO_PROBE",
    alarm_profile: {
      id: null,
      name: null,
    },
  },
  {
    coalition_name: "Aginova Testing",
    group_name: "Mason Group",
    location_name: "Mason",
    sensor_id: "00206812",
    sensor_name: "Neil Street Freezer",
    sensor_type: "XTEMP_2000_0001",
    alarm_profile: {
      id: null,
      name: null,
    },
  },
  {
    coalition_name: "Aginova Testing",
    group_name: "Mason Group",
    location_name: "Mason",
    sensor_id: "00206815",
    sensor_name: "Neil Street Fridge",
    sensor_type: "XTEMP_2000_0001",
    alarm_profile: {
      id: null,
      name: null,
    },
  },
  {
    coalition_name: "Aginova Testing",
    group_name: "Mason Group",
    location_name: "Mason",
    sensor_id: "00206973",
    sensor_name: "Was at Back Bay Net",
    sensor_type: "XIAQ_1000_0001",
    alarm_profile: {
      id: null,
      name: null,
    },
  },
  {
    coalition_name: "Aginova Testing",
    group_name: "Mason Group",
    location_name: "Mason",
    sensor_id: "00208554",
    sensor_name: "Little Bella Vista Old",
    sensor_type: "XXXXXXXXXXXXXXXX",
    alarm_profile: {
      id: null,
      name: null,
    },
  },
  {
    coalition_name: "Aginova Testing",
    group_name: "Mason Group",
    location_name: "Mason",
    sensor_id: "00209572",
    sensor_name: "Sonitor Test 9572_A",
    sensor_type: "X_NO_PROBE",
    alarm_profile: {
      id: null,
      name: null,
    },
  },
  {
    coalition_name: "Aginova Testing",
    group_name: "Mason Group",
    location_name: "Mason",
    sensor_id: "00210179",
    sensor_name: "Was Picket Fence",
    sensor_type: "XIAQ_1000_0001",
    alarm_profile: {
      id: null,
      name: null,
    },
  },
  {
    coalition_name: "Aginova Testing",
    group_name: "Mason Group",
    location_name: "Mason",
    sensor_id: "00210259",
    sensor_name: "Sensor_00210259",
    sensor_type: "XIAQ_1000_0001",
    alarm_profile: {
      id: null,
      name: null,
    },
  },
  {
    coalition_name: "Aginova Testing",
    group_name: "Mason Group",
    location_name: "Mason",
    sensor_id: "00210389",
    sensor_name: "Was Spring Charter School",
    sensor_type: "XIAQ_1000_0001",
    alarm_profile: {
      id: null,
      name: null,
    },
  },
];

// Generate 100 mock sensors
const mockAllSensors = generateMockAllSensors(100).sort((a, b) =>
  a.sensor_type.localeCompare(b.sensor_type)
);

export async function GET() {
  return NextResponse.json(mockedData);
}

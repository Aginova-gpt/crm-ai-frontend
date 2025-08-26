import { GREEN, DARK_ORANGE, RED } from "@/styles/colors";
import {
  SignalWifi1Bar,
  SignalWifi2Bar,
  SignalWifi3Bar,
  SignalWifi4Bar,
  Battery20,
  Battery50,
  Battery80,
  BatteryFull,
  BatteryCharging20,
  BatteryCharging50,
  BatteryCharging80,
  BatteryChargingFull,
} from "@mui/icons-material";
import {
  closedAlarms,
  connectivity,
  lowBattery,
  threshold,
  notReading,
  openAlarms,
  connectivitySmall,
  lowBatterySmall,
  thresholdSmall,
  notReadingSmall,
} from "@/styles/icons";

import {
  pressureIcon,
  rtdIcon,
  asset4HIcon,
  asset12HIcon,
  asset49HIcon,
  freezerSmallIcon,
  noSensorIcon,
  cameraIcon,
  glycolIcon,
  turbidityIcon,
  corrosionIcon,
  newTemperatureIcon,
  newHumidityIcon,
  newPressureIcon,
  newCo2Icon,
  aiqIcon,
} from "@/styles/icons";

export type SensorInternalCode =
  | "XCOMP_2000_0020"
  | "XTEMP_2000_0020"
  | "XTEMP_2000_0021"
  | "EL-RG-4H"
  | "EL-RG-12H"
  | "EL-RG-16H"
  | "EL-RG-23H"
  | "EL-RG-49H"
  | "2-F-4"
  | "EL-F-4H"
  | "EL-F-4K"
  | "2-R-12G"
  | "2-R-23G"
  | "2-R-4"
  | "2-R-48G"
  | "XCAM_6001_0000"
  | "XCAM_2000_0001"
  | "XTEMP_2000_0004"
  | "XCOMP_2000_0001"
  | "XCORR_2000_0001"
  | "XCORR_2000_0003"
  | "XCORR_3000_0001"
  | "X_NO_PROBE"
  | "XTEMP_2000_0001"
  | "XTEMP_2000_0002"
  | "XTEMP_2000_0003"
  | "XTEMP_2000_0005"
  | "XTEMP_2000_0006"
  | "XTEMP_2000_0008"
  | "XTEMP_2000_0009"
  | "XTEMP_2000_0010"
  | "XTEMP_2000_0011"
  | "XTEMP_2000_0012"
  | "XTEMP_2000_0013"
  | "XTEMP_2000_0014"
  | "XTEMP_2000_0015"
  | "XTEMP_2000_0016"
  | "XCO2_2000_0001"
  | "XCO2_2000_0002"
  | "XTEMP_2000_0017"
  | "XIAQ_1000_0001"
  | "XXXXXXXXXXXXXXXX";

export type SortDirection = "asc" | "desc";
export type SensorsSortKey = "sensor_name" | "sensor_id" | "last_seen";
export type AlarmsSortKey = "status" | "alert_time";
export type ProfileSortKey = "name" | "enabled";

export interface SensorData {
  sensor_id: string;
  probe?: {
    id: number;
    internal_code: SensorInternalCode;
    name: string;
  };
  sensor_name: string;
  last_seen: string;
  last_data: string;
  data: {
    [key in t_name]: {
      value: number | null;
      lower_threshold: number | null;
      upper_threshold: number | null;
      average: number | null;
      min: number | null;
      max: number | null;
      unit: string;
    };
  };
  signal_rssi: number;
  battery_voltage: number;
  battery_charging_status: "0" | "1" | "2";
  open_alarms?: number;
  filter_inactive_sensors: boolean;
  alarm_profile?: {
    id: number;
    name: string;
  };
  in_maintenance: string | null;
  coalition?: string | null;
  group?: string | null;
  asset?: string | null;
  location?: string | null;
}

export type t_name =
  | "t1"
  | "t2"
  | "t3"
  | "t4"
  | "t5"
  | "t6"
  | "t7"
  | "t8"
  | "t9"
  | "t10"
  | "t11"
  | "t12"
  | "t13"
  | "t14"
  | "t15"
  | "t16"
  | "t17"
  | "t18"
  | "t19"
  | "t20"
  | "t21"
  | "t22"
  | "t23"
  | "t24"
  | "t25";

export type AlarmFilterType =
  | "filter_type_notreadingdata"
  | "filter_type_lowbattery"
  | "filter_type_connectivity"
  | "filter_type_threshold"
  | "open_alarms"
  | "closed_alarms";

export type AlertingType =
  | "lowbattery"
  | "connectivity"
  | "notreadingdata"
  | "threshold";

export type ProfileFilterType =
  | "filter_threshold"
  | "filter_battery"
  | "filter_connectivity"
  | "filter_not_reading"
  | "filter_active"
  | "filter_disabled";

export const alarmIcon = (alarmType: AlarmFilterType) => {
  switch (alarmType) {
    case "filter_type_lowbattery":
      return lowBattery.src;
    case "filter_type_connectivity":
      return connectivity.src;
    case "filter_type_threshold":
      return threshold.src;
    case "filter_type_notreadingdata":
      return notReading.src;
    case "open_alarms":
      return openAlarms.src;
    case "closed_alarms":
      return closedAlarms.src;
  }
};

export const alarmIconSmall = (alarmType: AlarmFilterType | AlertingType) => {
  if (alarmType.includes("threshold")) {
    return thresholdSmall.src;
  } else if (alarmType.includes("battery")) {
    return lowBatterySmall.src;
  } else if (alarmType.includes("connectivity")) {
    return connectivitySmall.src;
  } else if (alarmType.includes("reading")) {
    return notReadingSmall.src;
  }
  return noSensorIcon.src;
};

export const alarmFilterName = (alarmType: AlarmFilterType | AlertingType) => {
  if (alarmType.includes("battery")) {
    return "Low Battery";
  }
  if (alarmType.includes("connectivity")) {
    return "Connectivity";
  }
  if (alarmType.includes("threshold")) {
    return "Threshold";
  }
  if (alarmType.includes("reading")) {
    return "Not Reading Data";
  }
  if (alarmType === "open_alarms") {
    return "Open Alarms";
  }
  if (alarmType === "closed_alarms") {
    return "Closed Alarms";
  }
  return "N/A";
};

export const profileFilterIcon = (profileType: ProfileFilterType) => {
  switch (profileType) {
    case "filter_battery":
      return lowBattery.src;
    case "filter_connectivity":
      return connectivity.src;
    case "filter_threshold":
      return threshold.src;
    case "filter_not_reading":
      return notReading.src;
    case "filter_active":
      return openAlarms.src;
    case "filter_disabled":
      return closedAlarms.src;
  }
};

export const profileFilterName = (profileType: ProfileFilterType) => {
  if (profileType === "filter_battery") {
    return "Battery";
  }
  if (profileType === "filter_connectivity") {
    return "Connectivity";
  }
  if (profileType === "filter_threshold") {
    return "Threshold";
  }
  if (profileType === "filter_not_reading") {
    return "Not Reading Data";
  }
  if (profileType === "filter_active") {
    return "Active Profiles";
  }
  if (profileType === "filter_disabled") {
    return "Disabled Profiles";
  }
};

export const sensors_icons = [
  {
    name: "Differential Pressure",
    internal_code: "XCOMP_2000_0020",
    icon: pressureIcon,
  },
  {
    name: "Differential Pressure",
    internal_code: "XTEMP_2000_0020",
    icon: pressureIcon,
  },
  {
    name: "Differential Pressure",
    internal_code: "XTEMP_2000_0021",
    icon: pressureIcon,
  },
  {
    name: "Asset 4H",
    internal_code: "EL-RG-4H",
    icon: asset4HIcon,
  },
  {
    name: "Asset 12H",
    internal_code: "EL-RG-12H",
    icon: asset12HIcon,
  },
  {
    name: "Asset 16H",
    internal_code: "EL-RG-16H",
    icon: asset12HIcon,
  },
  {
    name: "Asset 23H",
    internal_code: "EL-RG-23H",
    icon: asset12HIcon,
  },
  {
    name: "Asset 49H",
    internal_code: "EL-RG-49H",
    icon: asset49HIcon,
  },
  {
    name: "Asset 2-F-4",
    internal_code: "2-F-4",
    icon: freezerSmallIcon,
  },
  {
    name: "Asset EL-F-4H",
    internal_code: "EL-F-4H",
    icon: freezerSmallIcon,
  },
  {
    name: "Asset EL-F-4K",
    internal_code: "EL-F-4K",
    icon: freezerSmallIcon,
  },
  {
    name: "Asset 2-R-12G",
    internal_code: "2-R-12G",
    icon: asset12HIcon,
  },
  {
    name: "Asset 2-R-23G",
    internal_code: "2-R-23G",
    icon: asset12HIcon,
  },
  {
    name: "Asset 2-R-4",
    internal_code: "2-R-4",
    icon: asset4HIcon,
  },
  {
    name: "Asset 2-R-48",
    internal_code: "2-R-48G",
    icon: asset49HIcon,
  },
  {
    name: "Unknown sensor type",
    internal_code: "XXXXXXXXXXXXXXXX",
    icon: noSensorIcon,
  },
  {
    name: "Sentinel CAM with EVO 2640 camera",
    internal_code: "XCAM_6001_0000",
    icon: cameraIcon,
  },
  {
    name: "Sentinel Eye with EVO 2640 camera",
    internal_code: "XCAM_2000_0001",
    icon: cameraIcon,
  },
  {
    name: "External 2x Pro Probe",
    internal_code: "XTEMP_2000_0004",
    icon: glycolIcon,
  },
  {
    name: "Sentinel RS-485 with Turbidity Sensor ",
    internal_code: "XCOMP_2000_0001",
    icon: turbidityIcon,
  },
  {
    name: "Standard Caps board",
    internal_code: "XCORR_2000_0001",
    icon: corrosionIcon,
  },
  {
    name: "Caps board for 4xTmas",
    internal_code: "XCORR_2000_0003",
    icon: corrosionIcon,
  },
  {
    name: "New IC Probe",
    internal_code: "XCORR_3000_0001",
    icon: corrosionIcon,
  },
  {
    name: "No Probe Connected",
    internal_code: "X_NO_PROBE",
    icon: noSensorIcon,
  },
  {
    name: "External Pro Probe",
    internal_code: "XTEMP_2000_0001",
    icon: newTemperatureIcon,
  },
  {
    name: "Dual BBQ probe",
    internal_code: "XTEMP_2000_0002",
    icon: newTemperatureIcon,
  },
  {
    name: "RH",
    internal_code: "XTEMP_2000_0003",
    icon: newHumidityIcon,
  },
  {
    name: "External 2x Pro Probe",
    internal_code: "XTEMP_2000_0004",
    icon: newTemperatureIcon,
  },
  {
    name: "External RTD probe",
    internal_code: "XTEMP_2000_0005",
    icon: rtdIcon,
  },
  {
    name: "External 2x Pro Probe with SHT20",
    internal_code: "XTEMP_2000_0006",
    icon: newHumidityIcon,
  },
  {
    name: "External Wetness probe",
    internal_code: "XTEMP_2000_0008",
    icon: newTemperatureIcon,
  },
  {
    name: "IR Probe",
    internal_code: "XTEMP_2000_0009",
    icon: newTemperatureIcon,
  },
  {
    name: "External Diff pressure (25 Pa)",
    internal_code: "XTEMP_2000_0010",
    icon: newPressureIcon,
  },
  {
    name: "External BT Probe",
    internal_code: "XTEMP_2000_0011",
    icon: newTemperatureIcon,
  },
  {
    name: "External Diff pressure (500 Pa)",
    internal_code: "XTEMP_2000_0012",
    icon: newPressureIcon,
  },
  {
    name: "External RTD probe with Dry Contact",
    internal_code: "XTEMP_2000_0013",
    icon: rtdIcon,
  },
  {
    name: "External Pro Probe with SHT20",
    internal_code: "XTEMP_2000_0014",
    icon: newHumidityIcon,
  },
  {
    name: "Dual BBQ B probe",
    internal_code: "XTEMP_2000_0015",
    icon: newTemperatureIcon,
  },
  {
    name: "Dual BBQ C probe",
    internal_code: "XTEMP_2000_0016",
    icon: newTemperatureIcon,
  },
  {
    name: "CO2 probe with SHT11 (Senseair)",
    internal_code: "XCO2_2000_0001",
    icon: newCo2Icon,
  },
  {
    name: "CO2 30% probe with SHT15 (Senseair)",
    internal_code: "XCO2_2000_0002",
    icon: newCo2Icon,
  },
  {
    name: "Exteal RTD probe with Dry Contact",
    internal_code: "XTEMP_2000_0017",
    icon: rtdIcon,
  },
  {
    name: "Indoor Air Quality Probe",
    internal_code: "XIAQ_1000_0001",
    icon: aiqIcon,
  },
];

export const sensorIcon = (internal_code: SensorInternalCode) => {
  const sensor = sensors_icons.find(
    (sensor) => sensor.internal_code === internal_code
  );
  return sensor?.icon || noSensorIcon;
};

export const batteryIcon = (
  batteryVoltage: number,
  batteryCharging: boolean
) => {
  if (batteryCharging) {
    if (batteryVoltage < 3.4) return <BatteryCharging20 sx={{ color: RED }} />;
    if (batteryVoltage < 3.6)
      return <BatteryCharging50 sx={{ color: DARK_ORANGE }} />;
    if (batteryVoltage < 3.8)
      return <BatteryCharging80 sx={{ color: GREEN }} />;
    return <BatteryChargingFull sx={{ color: GREEN }} />;
  }
  if (batteryVoltage < 3.4) return <Battery20 sx={{ color: RED }} />;
  if (batteryVoltage < 3.6) return <Battery50 sx={{ color: DARK_ORANGE }} />;
  if (batteryVoltage < 3.8) return <Battery80 sx={{ color: GREEN }} />;
  return <BatteryFull sx={{ color: GREEN }} />;
};

export const batteryColor = (
  batteryVoltage: number,
  batteryCharging: boolean
) => {
  if (batteryCharging) {
    if (batteryVoltage < 3.4) return RED;
    if (batteryVoltage < 3.6) return DARK_ORANGE;
    if (batteryVoltage < 3.8) return GREEN;
    return GREEN;
  }
  if (batteryVoltage < 3.4) return RED;
  if (batteryVoltage < 3.6) return DARK_ORANGE;
  if (batteryVoltage < 3.8) return GREEN;
  return GREEN;
};

export const wifiIcon = (signalRssi: number) => {
  if (signalRssi < -100) return <SignalWifi1Bar />;
  if (signalRssi < -80) return <SignalWifi2Bar />;
  if (signalRssi < -60) return <SignalWifi3Bar />;
  return <SignalWifi4Bar />;
};

export const signalColor = (signalRssi: number) => {
  if (signalRssi < -80) return `${RED}80`;
  if (signalRssi < -60) return `${DARK_ORANGE}80`;
  return `${GREEN}80`;
};

export const getMaintenanceStatus = (inMaintenance: string | null) => {
  if (!inMaintenance) return null;

  const maintenanceEnd = new Date(inMaintenance);
  const now = new Date();
  const timeDiff = maintenanceEnd.getTime() - now.getTime();

  if (timeDiff <= 0) {
    return { isActive: false, hoursRemaining: 0 };
  }

  const hoursRemaining = Math.ceil(timeDiff / (1000 * 60 * 60));
  return { isActive: true, hoursRemaining };
};

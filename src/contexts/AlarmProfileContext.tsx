"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";
import { Coalition, CoalitionGroup } from "@/app/alarms/add/ProfileNameStep";
import { SensorData } from "@/components/SensorsSelector/SensorsSelector";
import { AlarmProfileType } from "@/components/AlarmProfiles/AlarmProfiles";
import { EscalationReceiver } from "@/components/AlarmProfiles/AlarmProfiles";

export type ProfileSettingsObject = {
  delay_before_repeating: number;
  send_acknowledgment: boolean;
  recovery_time: number;
  enabled: boolean;
  automatically_close: boolean;
};

type SingleThresholdObject = {
  upper_threshold: number | null;
  lower_threshold: number | null;
};

export type ThresholdSettingsObject = {
  data_t1: SingleThresholdObject;
  data_t2: SingleThresholdObject;
  data_t3: SingleThresholdObject;
  data_t4: SingleThresholdObject;
  data_t5: SingleThresholdObject;
  data_t6: SingleThresholdObject;
  data_t7: SingleThresholdObject;
  data_t8: SingleThresholdObject;
  data_t9: SingleThresholdObject;
  data_t10: SingleThresholdObject;
  data_t11: SingleThresholdObject;
  data_t12: SingleThresholdObject;
  data_t13: SingleThresholdObject;
  data_t14: SingleThresholdObject;
  data_t15: SingleThresholdObject;
  data_t16: SingleThresholdObject;
  data_t17: SingleThresholdObject;
  data_t18: SingleThresholdObject;
  data_t19: SingleThresholdObject;
  data_t20: SingleThresholdObject;
  data_t21: SingleThresholdObject;
  data_t22: SingleThresholdObject;
  data_t23: SingleThresholdObject;
  data_t24: SingleThresholdObject;
  data_t25: SingleThresholdObject;
};

export type ProfileThresholdObject = {
  settings: ThresholdSettingsObject;
  escalation_1: EscalationSettingsObject;
  escalation_2: EscalationSettingsObject;
  escalation_3: EscalationSettingsObject;
  escalation_4: EscalationSettingsObject;
};

export type ProfileBatteryObject = {
  minimum_battery_level: number | null;
  escalation_1: EscalationSettingsObject;
  escalation_2: EscalationSettingsObject;
  escalation_3: EscalationSettingsObject;
  escalation_4: EscalationSettingsObject;
};

export type ProfileConnectivityObject = {
  maximum_offline_time: number | null;
  escalation_1: EscalationSettingsObject;
  escalation_2: EscalationSettingsObject;
  escalation_3: EscalationSettingsObject;
  escalation_4: EscalationSettingsObject;
};

export type ProfileNotReadingObject = {
  maximum_downtime: number | null;
  escalation_1: EscalationSettingsObject;
  escalation_2: EscalationSettingsObject;
  escalation_3: EscalationSettingsObject;
  escalation_4: EscalationSettingsObject;
};

export type EscalationSettingsObject = {
  is_active: boolean;
  level: 1 | 2 | 3 | 4;
  delay_before_sending: number;
  targets: EscalationReceiver[];
};

interface AlarmProfileContextType {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  profileName: string;
  setProfileName: (name: string) => void;
  coalition: Coalition | null;
  setCoalition: (coalition: Coalition | null) => void;
  group: CoalitionGroup | null;
  setGroup: (group: CoalitionGroup | null) => void;
  assignedSensors: SensorData[];
  setAssignedSensors: (sensors: SensorData[]) => void;
  resetProgress: () => void;
  settings: ProfileSettingsObject;
  setSettings: (settings: ProfileSettingsObject) => void;
  thresholdSettings: ProfileThresholdObject;
  setThresholdSettings: (thresholdSettings: ProfileThresholdObject) => void;
  batterySettings: ProfileBatteryObject;
  setBatterySettings: (batterySettings: ProfileBatteryObject) => void;
  connectivitySettings: ProfileConnectivityObject;
  setConnectivitySettings: (
    connectivitySettings: ProfileConnectivityObject
  ) => void;
  notReadingSettings: ProfileNotReadingObject;
  setNotReadingSettings: (notReadingSettings: ProfileNotReadingObject) => void;
  thereAreGeneralChangesComparedTo: (alarmProfile: AlarmProfileType) => boolean;
  alarmProfileRequestBody: () => any;
  alarmProfileSettingsBody: () => any;
  editingProfile: number | null;
  setEditingProfile: (profile: number | null) => void;
}

const AlarmProfileContext = createContext<AlarmProfileContextType | undefined>(
  undefined
);

const settingsDefault: ProfileSettingsObject = {
  delay_before_repeating: -1,
  send_acknowledgment: false,
  recovery_time: 0,
  enabled: true,
  automatically_close: false,
};

const defaultEscalation = (level: 1 | 2 | 3 | 4) => {
  return {
    is_active: false,
    level: level,
    delay_before_sending: 0,
    targets: [],
  };
};

const defaultEscalations = {
  escalation_1: defaultEscalation(1),
  escalation_2: defaultEscalation(2),
  escalation_3: defaultEscalation(3),
  escalation_4: defaultEscalation(4),
};

const defaultThresholdSettings = {
  settings: {
    data_t1: {
      upper_threshold: null,
      lower_threshold: null,
    },
    data_t2: {
      upper_threshold: null,
      lower_threshold: null,
    },
    data_t3: {
      upper_threshold: null,
      lower_threshold: null,
    },
    data_t4: {
      upper_threshold: null,
      lower_threshold: null,
    },
    data_t5: {
      upper_threshold: null,
      lower_threshold: null,
    },
    data_t6: {
      upper_threshold: null,
      lower_threshold: null,
    },
    data_t7: {
      upper_threshold: null,
      lower_threshold: null,
    },
    data_t8: {
      upper_threshold: null,
      lower_threshold: null,
    },
    data_t9: {
      upper_threshold: null,
      lower_threshold: null,
    },
    data_t10: {
      upper_threshold: null,
      lower_threshold: null,
    },
    data_t11: {
      upper_threshold: null,
      lower_threshold: null,
    },
    data_t12: {
      upper_threshold: null,
      lower_threshold: null,
    },
    data_t13: {
      upper_threshold: null,
      lower_threshold: null,
    },
    data_t14: {
      upper_threshold: null,
      lower_threshold: null,
    },
    data_t15: {
      upper_threshold: null,
      lower_threshold: null,
    },
    data_t16: {
      upper_threshold: null,
      lower_threshold: null,
    },
    data_t17: {
      upper_threshold: null,
      lower_threshold: null,
    },
    data_t18: {
      upper_threshold: null,
      lower_threshold: null,
    },
    data_t19: {
      upper_threshold: null,
      lower_threshold: null,
    },
    data_t20: {
      upper_threshold: null,
      lower_threshold: null,
    },
    data_t21: {
      upper_threshold: null,
      lower_threshold: null,
    },
    data_t22: {
      upper_threshold: null,
      lower_threshold: null,
    },
    data_t23: {
      upper_threshold: null,
      lower_threshold: null,
    },
    data_t24: {
      upper_threshold: null,
      lower_threshold: null,
    },
    data_t25: {
      upper_threshold: null,
      lower_threshold: null,
    },
  },
  ...defaultEscalations,
};
const defaultBatterySettings = {
  minimum_battery_level: null,
  ...defaultEscalations,
};
const defaultConnectivitySettings = {
  maximum_offline_time: null,
  ...defaultEscalations,
};
const defaultNotReadingSettings = {
  maximum_downtime: null,
  ...defaultEscalations,
};

export function AlarmProfileProvider({ children }: { children: ReactNode }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [profileName, setProfileName] = useState("");
  const [coalition, setCoalition] = useState<Coalition | null>(null);
  const [group, setGroup] = useState<CoalitionGroup | null>(null);
  const [assignedSensors, setAssignedSensors] = useState<SensorData[]>([]);
  const [settings, setSettings] =
    useState<ProfileSettingsObject>(settingsDefault);
  const [thresholdSettings, setThresholdSettings] =
    useState<ProfileThresholdObject>(defaultThresholdSettings);
  const [batterySettings, setBatterySettings] = useState<ProfileBatteryObject>(
    defaultBatterySettings
  );
  const [connectivitySettings, setConnectivitySettings] =
    useState<ProfileConnectivityObject>(defaultConnectivitySettings);
  const [notReadingSettings, setNotReadingSettings] =
    useState<ProfileNotReadingObject>(defaultNotReadingSettings);
  const [editingProfile, setEditingProfile] = useState<number | null>(null);
  
  const resetProgress = () => {
    setCurrentStep(0);
    setProfileName("");
    setCoalition(null);
    setGroup(null);
    setAssignedSensors([]);
    setSettings(settingsDefault);
    setThresholdSettings(defaultThresholdSettings);
    setBatterySettings(defaultBatterySettings);
    setConnectivitySettings(defaultConnectivitySettings);
    setNotReadingSettings(defaultNotReadingSettings);
  };

  const thereAreGeneralChangesComparedTo = (alarmProfile: AlarmProfileType) => {
    return (
      settings.enabled !== alarmProfile.enabled ||
      settings.delay_before_repeating !== alarmProfile.delay_before_repeating ||
      settings.recovery_time !== alarmProfile.recovery_time ||
      settings.automatically_close !== alarmProfile.automatically_close ||
      settings.send_acknowledgment !== alarmProfile.send_acknowledgment
    );
  };
  const alarmProfileRequestBody = () => {
    return {
      ...alarmProfileSettingsBody(),
      sensor_ids: assignedSensors.map((sensor) => sensor.sensor_id),
      escalation_levels: [
        {
          ...thresholdSettings.escalation_1,
          is_active: thresholdSettings.escalation_1.targets.length > 0,
        },
        {
          ...thresholdSettings.escalation_2,
          is_active: thresholdSettings.escalation_2.targets.length > 0,
        },
        {
          ...thresholdSettings.escalation_3,
          is_active: thresholdSettings.escalation_3.targets.length > 0,
        },
        {
          ...thresholdSettings.escalation_4,
          is_active: thresholdSettings.escalation_4.targets.length > 0,
        },
      ],
      group_id: group?.id,
      coalition_id: Number(coalition?.id),
      type_connectivity_enabled:
        connectivitySettings.maximum_offline_time !== null,
      type_lowbattery_enabled: batterySettings.minimum_battery_level !== null,
      type_notreadingdata_enabled: notReadingSettings.maximum_downtime !== null,
      type_threshold_enabled:
        thresholdSettings.settings.data_t1.upper_threshold !== null ||
        thresholdSettings.settings.data_t1.lower_threshold !== null ||
        thresholdSettings.settings.data_t2.upper_threshold !== null ||
        thresholdSettings.settings.data_t2.lower_threshold !== null ||
        thresholdSettings.settings.data_t3.upper_threshold !== null ||
        thresholdSettings.settings.data_t3.lower_threshold !== null ||
        thresholdSettings.settings.data_t4.upper_threshold !== null ||
        thresholdSettings.settings.data_t4.lower_threshold !== null ||
        thresholdSettings.settings.data_t5.upper_threshold !== null ||
        thresholdSettings.settings.data_t5.lower_threshold !== null ||
        thresholdSettings.settings.data_t6.upper_threshold !== null ||
        thresholdSettings.settings.data_t6.lower_threshold !== null ||
        thresholdSettings.settings.data_t7.upper_threshold !== null ||
        thresholdSettings.settings.data_t7.lower_threshold !== null ||
        thresholdSettings.settings.data_t8.upper_threshold !== null ||
        thresholdSettings.settings.data_t8.lower_threshold !== null ||
        thresholdSettings.settings.data_t9.upper_threshold !== null ||
        thresholdSettings.settings.data_t9.lower_threshold !== null ||
        thresholdSettings.settings.data_t10.upper_threshold !== null ||
        thresholdSettings.settings.data_t10.lower_threshold !== null ||
        thresholdSettings.settings.data_t11.upper_threshold !== null ||
        thresholdSettings.settings.data_t11.lower_threshold !== null ||
        thresholdSettings.settings.data_t12.upper_threshold !== null ||
        thresholdSettings.settings.data_t12.lower_threshold !== null ||
        thresholdSettings.settings.data_t13.upper_threshold !== null ||
        thresholdSettings.settings.data_t13.lower_threshold !== null ||
        thresholdSettings.settings.data_t14.upper_threshold !== null ||
        thresholdSettings.settings.data_t14.lower_threshold !== null ||
        thresholdSettings.settings.data_t15.upper_threshold !== null ||
        thresholdSettings.settings.data_t15.lower_threshold !== null ||
        thresholdSettings.settings.data_t16.upper_threshold !== null ||
        thresholdSettings.settings.data_t16.lower_threshold !== null ||
        thresholdSettings.settings.data_t17.upper_threshold !== null ||
        thresholdSettings.settings.data_t17.lower_threshold !== null ||
        thresholdSettings.settings.data_t18.upper_threshold !== null ||
        thresholdSettings.settings.data_t18.lower_threshold !== null ||
        thresholdSettings.settings.data_t19.upper_threshold !== null ||
        thresholdSettings.settings.data_t19.lower_threshold !== null ||
        thresholdSettings.settings.data_t20.upper_threshold !== null ||
        thresholdSettings.settings.data_t20.lower_threshold !== null ||
        thresholdSettings.settings.data_t21.upper_threshold !== null ||
        thresholdSettings.settings.data_t21.lower_threshold !== null ||
        thresholdSettings.settings.data_t22.upper_threshold !== null ||
        thresholdSettings.settings.data_t22.lower_threshold !== null ||
        thresholdSettings.settings.data_t23.upper_threshold !== null ||
        thresholdSettings.settings.data_t23.lower_threshold !== null ||
        thresholdSettings.settings.data_t24.upper_threshold !== null ||
        thresholdSettings.settings.data_t24.lower_threshold !== null ||
        thresholdSettings.settings.data_t25.upper_threshold !== null ||
        thresholdSettings.settings.data_t25.lower_threshold !== null,
      thresholds: {
        connectivity: connectivitySettings.maximum_offline_time,
        notreadingdata: notReadingSettings.maximum_downtime,
        lowbattery: batterySettings.minimum_battery_level,
        data: {
          "1": {
            upper: thresholdSettings.settings.data_t1.upper_threshold,
            lower: thresholdSettings.settings.data_t1.lower_threshold,
          },
          "2": {
            upper: thresholdSettings.settings.data_t2.upper_threshold,
            lower: thresholdSettings.settings.data_t2.lower_threshold,
          },
          "3": {
            upper: thresholdSettings.settings.data_t3.upper_threshold,
            lower: thresholdSettings.settings.data_t3.lower_threshold,
          },
          "4": {
            upper: thresholdSettings.settings.data_t4.upper_threshold,
            lower: thresholdSettings.settings.data_t4.lower_threshold,
          },
          "5": {
            upper: thresholdSettings.settings.data_t5.upper_threshold,
            lower: thresholdSettings.settings.data_t5.lower_threshold,
          },
          "6": {
            upper: thresholdSettings.settings.data_t6.upper_threshold,
            lower: thresholdSettings.settings.data_t6.lower_threshold,
          },
          "7": {
            upper: thresholdSettings.settings.data_t7.upper_threshold,
            lower: thresholdSettings.settings.data_t7.lower_threshold,
          },
          "8": {
            upper: thresholdSettings.settings.data_t8.upper_threshold,
            lower: thresholdSettings.settings.data_t8.lower_threshold,
          },
          "9": {
            upper: thresholdSettings.settings.data_t9.upper_threshold,
            lower: thresholdSettings.settings.data_t9.lower_threshold,
          },
          "10": {
            upper: thresholdSettings.settings.data_t10.upper_threshold,
            lower: thresholdSettings.settings.data_t10.lower_threshold,
          },
          "11": {
            upper: thresholdSettings.settings.data_t11.upper_threshold,
            lower: thresholdSettings.settings.data_t11.lower_threshold,
          },
          "12": {
            upper: thresholdSettings.settings.data_t12.upper_threshold,
            lower: thresholdSettings.settings.data_t12.lower_threshold,
          },
          "13": {
            upper: thresholdSettings.settings.data_t13.upper_threshold,
            lower: thresholdSettings.settings.data_t13.lower_threshold,
          },
          "14": {
            upper: thresholdSettings.settings.data_t14.upper_threshold,
            lower: thresholdSettings.settings.data_t14.lower_threshold,
          },
          "15": {
            upper: thresholdSettings.settings.data_t15.upper_threshold,
            lower: thresholdSettings.settings.data_t15.lower_threshold,
          },
          "16": {
            upper: thresholdSettings.settings.data_t16.upper_threshold,
            lower: thresholdSettings.settings.data_t16.lower_threshold,
          },
          "17": {
            upper: thresholdSettings.settings.data_t17.upper_threshold,
            lower: thresholdSettings.settings.data_t17.lower_threshold,
          },
          "18": {
            upper: thresholdSettings.settings.data_t18.upper_threshold,
            lower: thresholdSettings.settings.data_t18.lower_threshold,
          },
          "19": {
            upper: thresholdSettings.settings.data_t19.upper_threshold,
            lower: thresholdSettings.settings.data_t19.lower_threshold,
          },
          "20": {
            upper: thresholdSettings.settings.data_t20.upper_threshold,
            lower: thresholdSettings.settings.data_t20.lower_threshold,
          },
          "21": {
            upper: thresholdSettings.settings.data_t21.upper_threshold,
            lower: thresholdSettings.settings.data_t21.lower_threshold,
          },
          "22": {
            upper: thresholdSettings.settings.data_t22.upper_threshold,
            lower: thresholdSettings.settings.data_t22.lower_threshold,
          },
          "23": {
            upper: thresholdSettings.settings.data_t23.upper_threshold,
            lower: thresholdSettings.settings.data_t23.lower_threshold,
          },
          "24": {
            upper: thresholdSettings.settings.data_t24.upper_threshold,
            lower: thresholdSettings.settings.data_t24.lower_threshold,
          },
          "25": {
            upper: thresholdSettings.settings.data_t25.upper_threshold,
            lower: thresholdSettings.settings.data_t25.lower_threshold,
          },
        },
      },
    };
  };

  const alarmProfileSettingsBody = () => {
    return {
      name: profileName,
      enabled: settings.enabled,
      automatically_close: settings.automatically_close,
      delay_before_repeating: settings.delay_before_repeating,
      recovery_time: settings.recovery_time,
      send_acknowledgment: settings.send_acknowledgment,
    };
  };

  return (
    <AlarmProfileContext.Provider
      value={{
        currentStep,
        setCurrentStep,
        profileName,
        setProfileName,
        coalition,
        setCoalition,
        group,
        setGroup,
        assignedSensors,
        setAssignedSensors,
        resetProgress,
        settings,
        setSettings,
        thresholdSettings,
        setThresholdSettings,
        batterySettings,
        setBatterySettings,
        connectivitySettings,
        setConnectivitySettings,
        notReadingSettings,
        setNotReadingSettings,
        thereAreGeneralChangesComparedTo,
        alarmProfileRequestBody,
        alarmProfileSettingsBody,
        editingProfile,
        setEditingProfile,
      }}
    >
      {children}
    </AlarmProfileContext.Provider>
  );
}

export function useAlarmProfileContext() {
  const context = useContext(AlarmProfileContext);
  if (context === undefined) {
    throw new Error(
      "useAlarmProfileContext must be used within an AlarmProfileProvider"
    );
  }
  return context;
}

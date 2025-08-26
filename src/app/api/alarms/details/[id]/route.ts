import { NextRequest, NextResponse } from "next/server";
import { AlertingType } from "@/utils/sensorHelpers";

// Mock data for alarm details matching AlarmObject interface
const mockAlarmDetails = {
  "alarm-1": {
    id: "alarm-1",
    type: "threshold" as AlertingType,
    sensor_name: "BR_CTRB_ A420 LN2 # 1",
    sensor_id: "00203245",
    coalition: "Hospital A",
    group: "ICU",
    location: "Room 101",
    alarm_condition: "Temperature exceeded upper threshold by 5°C",
    alarm_time: "2025-08-06T18:37:50.447905+00:00",
    alarm_profile_name: "BioRep CTRB A level LN2",
    alarm_profile_id: "123",
    measurement_name: "Temperature",
    measurement_id: "t1",
    status: "open" as const,
    measurement_current_reading: 85.5,
    measurement_unit: "°C",
    is_safe: false,
    sent_to_sms_count: 2,
    sent_to_email_count: 1,
    sent_to_call_count: 0,
    acknowledge_date: null,
    acknowledged_by: null,
    acknowledgement_note: null,
    acknowledgement_comment: null,
  },
  "alarm-2": {
    id: "alarm-2",
    type: "lowbattery" as AlertingType,
    sensor_name: "BR_CTRB_ A420 LN2 # 2",
    sensor_id: "00203245",
    coalition: "Hospital A",
    group: "ICU",
    location: "Room 102",
    alarm_condition: "Battery voltage below 3.2V long description to test the alarm condition text length and see how it looks and how it wraps",
    alarm_time: "2025-07-18T11:34:16.527165+00:00",
    alarm_profile_name: "BioRep CTRB A level LN2",
    alarm_profile_id: "124",
    measurement_name: "DryContact",
    measurement_id: "t2",
    status: "open" as const,
    measurement_current_reading: 2.8,
    measurement_unit: "V",
    is_safe: true,
    sent_to_sms_count: 1,
    sent_to_email_count: 1,
    sent_to_call_count: 0,
    acknowledge_date: null,
    acknowledged_by: null,
    acknowledgement_note: null,
    acknowledgement_comment: null,
  },
  "alarm-3": {
    id: "alarm-3",
    type: "connectivity" as AlertingType,
    sensor_name: "BR_CTRB_ A420 LN2 # 3",
    sensor_id: "00203245",
    coalition: "Hospital A",
    group: "ICU",
    location: "Room 103",
    alarm_condition: "No data received for 15 minutes",
    alarm_time: "2025-07-18T11:34:16.527165+00:00",
    alarm_profile_name: "BioRep CTRB A level LN2",
    alarm_profile_id: "125",
    measurement_name: "Temperature",
    measurement_id: "t3",
    status: "closed" as const,
    measurement_current_reading: 0,
    measurement_unit: "N/A",
    is_safe: false,
    sent_to_sms_count: 3,
    sent_to_email_count: 2,
    sent_to_call_count: 1,
    acknowledge_date: "2024-01-15T09:00:00Z",
    acknowledged_by: "john.doe@example.com",
    acknowledgement_note: "Battery replaced",
    acknowledgement_comment: "Comment Battery replaced",
  },
  "alarm-4": {
    id: "alarm-4",
    type: "notreadingdata" as AlertingType,
    sensor_name: "BR_CTRB_ A420 LN2 # 4",
    sensor_id: "00203245",
    coalition: "Hospital A",
    group: "ICU",
    location: "Room 104",
    alarm_condition: "Sensor not reading data for 30 minutes",
    alarm_time: "2025-07-18T11:34:16.527165+00:00",
    alarm_profile_name: "BioRep CTRB A level LN2",
    alarm_profile_id: "126",
    measurement_name: "Temperature",
    measurement_id: "t4",
    status: "open" as const,
    measurement_current_reading: null,
    measurement_unit: "N/A",
    is_safe: false,
    sent_to_sms_count: 1,
    sent_to_email_count: 1,
    sent_to_call_count: 0,
    acknowledge_date: null,
    acknowledged_by: null,
    acknowledgement_note: null,
    acknowledgement_comment: null,
  },
  "alarm-5": {
    id: "alarm-5",
    type: "threshold" as AlertingType,
    sensor_name: "BR_CTRB_ A420 LN2 # 5",
    sensor_id: "00203245",
    coalition: "Hospital A",
    group: "ICU",
    location: "Room 105",
    alarm_condition: "Temperature below lower threshold by 3°C Temperature below lower threshold by 3°C Temperature below lower threshold by 3°C Temperature below lower threshold by 3°C",
    alarm_time: "2025-07-18T11:34:16.527165+00:00",
    alarm_profile_name: "BioRep CTRB A level LN2",
    alarm_profile_id: "127",
    measurement_name: "Temperature",
    measurement_id: "t5",
    status: "closed" as const,
    measurement_current_reading: 72.0,
    measurement_unit: "°C",
    is_safe: true,
    sent_to_sms_count: 1,
    sent_to_email_count: 1,
    sent_to_call_count: 0,
    acknowledge_date: "2024-01-15T06:45:00Z",
    acknowledged_by: "jane.smith@example.com",
    acknowledgement_note: "Temperature corrected",
    acknowledgement_comment: "Comment Temperature corrected Comment Temperature corrected Comment Temperature corrected Comment Temperature corrected",
  },
};

export async function GET(request: NextRequest, context: any) {
  try {
    const id = context.params.id;

    // Simulate a small delay to mimic real API
    await new Promise((resolve) => setTimeout(resolve, 100));

    const alarmDetails = mockAlarmDetails[id as keyof typeof mockAlarmDetails];

    if (!alarmDetails) {
      return NextResponse.json({ error: "Alarm not found" }, { status: 404 });
    }

    return NextResponse.json(alarmDetails);
  } catch (error) {
    console.error("Error fetching sensor details:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch alarm details",
      },
      { status: 500 }
    );
  }
}

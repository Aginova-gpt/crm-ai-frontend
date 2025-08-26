import { NextRequest, NextResponse } from "next/server";
import { AlarmProfileType } from "@/components/AlarmProfiles/AlarmProfiles";

// Mock data for alarm details matching AlarmObject interface
const mockAlarmProfileDetails = [
  {
    alarm_types: ["threshold", "battery", "connectivity", "not_reading"],
    automatically_close: true,
    send_acknowledgment: Math.random() > 0.5,
    delay_before_repeating: -1,
    delay_before_sending: 0,
    enabled: false,
    escalations: [
      {
        delay_before_sending: 60,
        id: 1826,
        is_active: true,
        level: 1,
        targets: [
          {
            call_enabled: false,
            email: "SHAPIROM2@chop.edu",
            email_enabled: true,
            sms_enabled: false,
            type: "user",
            username: "Shapiro01",
          },
          {
            call_enabled: false,
            email: "WolpawA@chop.edu",
            email_enabled: true,
            sms_enabled: true,
            type: "user",
            username: "Wolpaw01",
          },
          {
            call_enabled: false,
            email: "jungpk@chop.edu",
            email_enabled: true,
            sms_enabled: true,
            type: "user",
            username: "Jungp01",
          },
          {
            call_enabled: true,
            email: "dadds@.sds",
            email_enabled: true,
            email_to_text: false,
            email_to_text_enabled: false,
            phone: "321313231",
            sms: undefined,
            sms_enabled: false,
            type: "individual",
          },
          {
            call_enabled: false,
            email_enabled: true,
            email_to_text: false,
            email_to_text_enabled: false,
            sms: undefined,
            sms_enabled: false,
            sensor_id: "00206448",
            type: "relay",
          },
        ],
      },
      {
        delay_before_sending: 60,
        id: 1827,
        is_active: true,
        level: 2,
        targets: [
          {
            call_enabled: false,
            email: "SHAPIROM2@chop.edu",
            email_enabled: true,
            sms_enabled: false,
            type: "user",
            username: "Shapiro01",
          },
          {
            call_enabled: false,
            email: "WolpawA@chop.edu",
            email_enabled: true,
            sms_enabled: true,
            type: "user",
            username: "Wolpaw01",
          },
          {
            call_enabled: false,
            email: "jungpk@chop.edu",
            email_enabled: true,
            sms_enabled: true,
            type: "user",
            username: "Jungp01",
          },
        ],
      },
      null,
      null,
    ],
    id: 873,
    name: "Wolpaw Lab 3300 LN2",
    recovery_time: 5,
    sensors: [
      {
        sensor_id: "00205066",
        sensor_name: "Nursery Pyxis Ref",
        sensor_type: "XTEMP_2000_0001",
      },
    ],
    thresholds: {
      connectivity: 10,
      notreadingdata: 10,
      lowbattery: 10,
      data: {
        "1": {
          lower: 10,
          upper: 20,
        },
        "2": {
          lower: 10,
          upper: 20,
        },
        "3": {
          lower: 10,
          upper: 20,
        },
        "6": {
          lower: 10,
          upper: 20,
        },
      },
    },
  },
];

export async function GET(request: NextRequest, context: any) {
  try {
    const id = context.params.id;

    // Simulate a small delay to mimic real API
    await new Promise((resolve) => setTimeout(resolve, 100));

    const alarmProfileDetails = mockAlarmProfileDetails[0];

    if (!alarmProfileDetails) {
      return NextResponse.json({ error: "Alarm not found" }, { status: 404 });
    }

    return NextResponse.json(alarmProfileDetails);
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

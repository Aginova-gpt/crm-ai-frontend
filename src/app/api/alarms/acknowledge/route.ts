import { NextResponse } from "next/server";

// Mock data for alarms (same as in alarms/route.ts)
const mockAlarms = Array.from({ length: 50 }, (_, index) => ({
  id: `alarm-${index + 1}`,
  title: "BR_CTRB_ A420 LN2 # 2 | CTRB A Level",
  message: `BR_CTRB_ A420 LN2 # 2 (00206414) Measured for temp1 (celsius) the value -138.42℃ on 2025-06-05 18:40:44 GMT (16.58℃ above upper limit -155.00℃ of alarm profile "BioRep CTRB A level LN2"). ${
    index + 1
  }`,
  sensorId: `sensor-${Math.floor(Math.random() * 10) + 1}`,
  startTime: new Date(Date.now() - Math.random() * 86400000).toISOString(),
  lastReading: new Date(Date.now() - Math.random() * 3600000).toISOString(),
  isSafe: Math.random() > 0.5,
  isAlive: Math.random() > 0.3,
  notificationsCount: Math.floor(Math.random() * 10),
  closeTime: new Date(Date.now() - Math.random() * 3600000).toISOString(),
  closedBy: "John Doe",
  closedReason: "Test reason",
}));

// Mock error messages
const errorMessages = [
  "Failed to acknowledge alarms: Database connection error",
  "Failed to acknowledge alarms: Network timeout",
  "Failed to acknowledge alarms: Invalid alarm state",
  "Failed to acknowledge alarms: Permission denied",
  "Failed to acknowledge alarms: Service unavailable",
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { alarmIds, comment, note } = body;

    // Validate request body
    if (!alarmIds || !Array.isArray(alarmIds) || alarmIds.length === 0) {
      return NextResponse.json({ error: "Invalid alarm IDs" }, { status: 400 });
    }

    if (!comment) {
      return NextResponse.json(
        { error: "Comment is required" },
        { status: 400 }
      );
    }

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Randomly decide if this request should fail (30% chance of failure)
    if (Math.random() < 0.3) {
      // Randomly select an error message
      const errorMessage =
        errorMessages[Math.floor(Math.random() * errorMessages.length)];

      // Randomly decide between 400 and 500 status codes
      const statusCode = Math.random() < 0.5 ? 400 : 500;

      return NextResponse.json({ error: errorMessage }, { status: statusCode });
    }

    // Update mock data (in a real app, this would update a database)
    const updatedAlarms = mockAlarms.map((alarm) => {
      if (alarmIds.includes(alarm.id)) {
        return {
          ...alarm,
          isSafe: true,
          closeTime: new Date().toISOString(),
          closedBy: "Current User", // In a real app, this would be the logged-in user
          closedReason: `${comment}${note ? ` - ${note}` : ""}`,
        };
      }
      return alarm;
    });

    return NextResponse.json({
      success: true,
      message: "Alarms acknowledged successfully",
      acknowledgedCount: alarmIds.length,
    });
  } catch (error) {
    console.error("Error acknowledging alarms:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to acknowledge alarms",
      },
      { status: 500 }
    );
  }
}

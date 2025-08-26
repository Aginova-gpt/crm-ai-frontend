import { NextResponse } from "next/server";

// Mock error messages
const errorMessages = [
  "Failed to sign sensors: Database connection error",
  "Failed to sign sensors: Network timeout",
  "Failed to sign sensors: Invalid sensor state",
  "Failed to sign sensors: Permission denied",
  "Failed to sign sensors: Service unavailable",
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sensorIds, note } = body;

    // Validate request body
    if (!sensorIds || !Array.isArray(sensorIds) || sensorIds.length === 0) {
      return NextResponse.json({ error: "Invalid sensor IDs" }, { status: 400 });
    }

    if (!note) {
      return NextResponse.json(
        { error: "Note is required" },
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

    return NextResponse.json({
      success: true,
      message: "Sensors signed successfully",
      signedCount: sensorIds.length,
    });
  } catch (error) {
    console.error("Error signing sensors:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to sign sensors",
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";

interface GraphMeasurement {
  value: number | null;
  timestamp_raw: number;
}

interface ProbeGraphData {
  visible: boolean;
  unit: string;
  name: string;
  upper_threshold: number | null;
  lower_threshold: number | null;
  data: GraphMeasurement[];
}

interface SensorGraphData {
  t1: ProbeGraphData;
  t2: ProbeGraphData;
  t3: ProbeGraphData;
  t4: ProbeGraphData;
  t5: ProbeGraphData;
  t6: ProbeGraphData;
  t7: ProbeGraphData;
  t8: ProbeGraphData;
  t9: ProbeGraphData;
  t10: ProbeGraphData;
  t11: ProbeGraphData;
  t12: ProbeGraphData;
  t13: ProbeGraphData;
  t14: ProbeGraphData;
  t15: ProbeGraphData;
  t16: ProbeGraphData;
  t17: ProbeGraphData;
  t18: ProbeGraphData;
  t19: ProbeGraphData;
  t20: ProbeGraphData;
  t21: ProbeGraphData;
  t22: ProbeGraphData;
  t23: ProbeGraphData;
  t24: ProbeGraphData;
  t25: ProbeGraphData;
}

// Helper function to generate time series data
const generateTimeSeriesData = (
  hours: number = 1,
  intervalMinutes: number = 5
) => {
  // const data: GraphMeasurement[] = [];
  // const now = Date.now();
  // const intervalMs = intervalMinutes * 60 * 1000;
  // const points = (hours * 60) / intervalMinutes;

  // // Generate a base value and add some random variation
  // let baseValue = 20 + Math.random() * 10; // Start between 20-30
  // const trend = (Math.random() - 0.5) * 0.1; // Slight upward or downward trend

  // // Define gap positions (random but not too many)
  // const gapCount = Math.floor(Math.random() * 3) + 1; // 1-3 gaps
  // const gapPositions = new Set<number>();
  // for (let i = 0; i < gapCount; i++) {
  //   const gapPos = Math.floor(Math.random() * (points - 10)) + 5; // Avoid edges
  //   gapPositions.add(gapPos);
  // }

  // for (let i = 0; i < points; i++) {
  //   const timestamp = now - (points - i) * intervalMs;

  //   // Check if this position should have a gap
  //   if (gapPositions.has(i)) {
  //     // Create a gap by skipping this data point
  //     continue;
  //   }

  //   // Add some random noise and trend
  //   const noise = (Math.random() - 0.5) * 2;
  //   baseValue += trend + noise;
  //   // Keep value within reasonable bounds
  //   baseValue = Math.max(0, Math.min(100, baseValue));

  //   data.push({
  //     value: Math.random() > 0.03 ? Number(baseValue.toFixed(2)) : null,
  //     timestamp_raw: timestamp,
  //   });

  //   return data;

  return [
    {
      timestamp_raw: 1754502098000,
      value: 1.9399999999999977,
    },
    {
      timestamp_raw: 1754502098000,
      value: 1.9399999999999977,
    },
    {
      timestamp_raw: 1754502398000,
      value: 2.6299999999999955,
    },
    {
      timestamp_raw: 1754502398000,
      value: 2.6299999999999955,
    },
    {
      timestamp_raw: 1754502698000,
      value: 2.8499999999999943,
    },
    {
      timestamp_raw: 1754502998000,
      value: 2.8499999999999943,
    },
    {
      timestamp_raw: 1754503298000,
      value: 2.6999999999999886,
    },
    {
      timestamp_raw: 1754503598000,
      value: 2.4499999999999886,
    },
    {
      timestamp_raw: 1754503898000,
      value: 2.3400000000000034,
    },
    {
      timestamp_raw: 1754503898000,
      value: 2.3400000000000034,
    },
    {
      timestamp_raw: 1754504198000,
      value: 1.9799999999999898,
    },
    {
      timestamp_raw: 1754504498000,
      value: 1.509999999999991,
    },
    {
      timestamp_raw: 1754504498000,
      value: 1.509999999999991,
    },
    {
      timestamp_raw: 1754504798000,
      value: 0.960000000000008,
    },
    {
      timestamp_raw: 1754505098000,
      value: 0.5200000000000102,
    },
    {
      timestamp_raw: 1754505398000,
      value: 0.09000000000000341,
    },
    {
      timestamp_raw: 1754505698000,
      value: 0.4199999999999875,
    },
    {
      timestamp_raw: 1754505998000,
      value: 0.7700000000000102,
    },
    {
      timestamp_raw: 1754505998000,
      value: 0.7700000000000102,
    },
    {
      timestamp_raw: 1754506298000,
      value: 1.4099999999999966,
    },
    {
      timestamp_raw: 1754506298000,
      value: 1.4099999999999966,
    },
    {
      timestamp_raw: 1754506598000,
      value: 2.0900000000000034,
    },
    {
      timestamp_raw: 1754506898000,
      value: 2.0800000000000125,
    },
    {
      timestamp_raw: 1754507198000,
      value: 1.710000000000008,
    },
    {
      timestamp_raw: 1754507198000,
      value: 1.710000000000008,
    },
    {
      timestamp_raw: 1754507498000,
      value: 1.1699999999999875,
    },
    {
      timestamp_raw: 1754507798000,
      value: 0.9699999999999989,
    },
    {
      timestamp_raw: 1754507798000,
      value: 0.9699999999999989,
    },
    {
      timestamp_raw: 1754508098000,
      value: 1.3700000000000045,
    },
    {
      timestamp_raw: 1754508398000,
      value: 1.990000000000009,
    },
    {
      timestamp_raw: 1754508398000,
      value: 1.990000000000009,
    },
    {
      timestamp_raw: 1754508698000,
      value: 2.7700000000000102,
    },
    {
      timestamp_raw: 1754508698000,
      value: 2.7700000000000102,
    },
    {
      timestamp_raw: 1754508998000,
      value: 3.469999999999999,
    },
  ];
};

// Helper function to generate probe data
const generateProbeData = (
  name: string,
  unit: string,
  visible: boolean = true
): ProbeGraphData => {
  const threshold = Math.random() * 100;
  return {
    visible,
    unit,
    name,
    upper_threshold: threshold + 5,
    lower_threshold: threshold - 5,
    data: generateTimeSeriesData(),
  };
};

// Mock data generator for sensor graph
const generateMockSensorGraph = (sensorId: string): SensorGraphData => {
  return {
    t1: generateProbeData("Temperature 1", "celsius", Math.random() > 0.5),
    t2: generateProbeData("Humidity", "percentage", Math.random() > 0.1),
    t3: generateProbeData("Temperature 3", "celsius", Math.random() > 0.5),
    t4: generateProbeData("Temperature 4", "celsius", Math.random() > 0.5),
    t5: generateProbeData("Temperature 5", "celsius", Math.random() > 0.5),
    t6: generateProbeData("Temperature 6", "celsius", Math.random() > 0.5),
    t7: generateProbeData("Temperature 7", "celsius", Math.random() > 0.5),
    t8: generateProbeData("Temperature 8", "celsius", Math.random() > 0.5),
    t9: generateProbeData("Temperature 9", "celsius", Math.random() > 0.5),
    t10: generateProbeData("Temperature 10", "celsius", Math.random() > 0.5),
    t11: generateProbeData("Temperature 11", "celsius", Math.random() > 0.5),
    t12: generateProbeData("Temperature 12", "celsius", Math.random() > 0.5),
    t13: generateProbeData("Temperature 13", "celsius", Math.random() > 0.5),
    t14: generateProbeData("Temperature 14", "celsius", Math.random() > 0.5),
    t15: generateProbeData("Temperature 15", "celsius", Math.random() > 0.5),
    t16: generateProbeData("Temperature 16", "celsius", Math.random() > 0.5),
    t17: generateProbeData("Temperature 17", "celsius", Math.random() > 0.5),
    t18: generateProbeData("Temperature 18", "celsius", Math.random() > 0.5),
    t19: generateProbeData("Temperature 19", "celsius", Math.random() > 0.5),
    t20: generateProbeData("Temperature 20", "celsius", Math.random() > 0.5),
    t21: generateProbeData("Temperature 21", "celsius", Math.random() > 0.5),
    t22: generateProbeData("Temperature 22", "celsius", Math.random() > 0.5),
    t23: generateProbeData("Temperature 23", "celsius", Math.random() > 0.5),
    t24: generateProbeData("Temperature 24", "celsius", Math.random() > 0.5),
    t25: generateProbeData("Temperature 25", "celsius", Math.random() > 0.5),
  };
};

// Helper function to generate random errors
const generateRandomError = () => {
  const errorChance = Math.random();

  // 15% chance of error (adjust this percentage as needed)
  if (errorChance < 0.15) {
    const errorTypes = [
      {
        status: 500,
        msg: "Internal server error - sensor data processing failed",
        type: "INTERNAL_ERROR",
      },
      {
        status: 503,
        msg: "Service temporarily unavailable - sensor offline",
        type: "SERVICE_UNAVAILABLE",
      },
      {
        status: 404,
        msg: "Sensor not found or no data available",
        type: "SENSOR_NOT_FOUND",
      },
      {
        status: 408,
        msg: "Request timeout - sensor data retrieval timed out",
        type: "TIMEOUT",
      },
      {
        status: 429,
        msg: "Too many requests - rate limit exceeded",
        type: "RATE_LIMIT",
      },
    ];

    return errorTypes[Math.floor(Math.random() * errorTypes.length)];
  }

  return null;
};

export async function GET(request: NextRequest, context: any) {
  try {
    const id = context.params.id;

    // Check for random error
    const randomError = generateRandomError();
    if (randomError) {
      console.log(
        `🔴 Random error generated for sensor ${id}: ${randomError.type}`
      );

      // Add some delay to simulate real error conditions
      await new Promise((resolve) =>
        setTimeout(resolve, Math.random() * 2000 + 500)
      );

      return NextResponse.json(
        {
          msg: randomError.msg,
        },
        { status: randomError.status }
      );
    }

    // Simulate network delay (0.5 to 2 seconds)
    await new Promise((resolve) =>
      setTimeout(resolve, Math.random() * 1500 + 500)
    );

    const mockData = generateMockSensorGraph(id);
    return NextResponse.json(mockData);
  } catch (error) {
    console.error("Error generating mock sensor graph data:", error);
    return NextResponse.json(
      { error: "Failed to generate sensor graph data" },
      { status: 500 }
    );
  }
}

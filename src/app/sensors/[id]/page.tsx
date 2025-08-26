"use client";
import { useState } from "react";
import BackgroundBox from "@/components/BackgroundBox";
import Navbar from "@/components/Navbar";
import { Box, Paper } from "@mui/material";
import { BACKGROUND } from "@/styles/colors";
import { styles } from "./styles";
import SensorDetails from "@/components/SensorDetails/SensorDetails";
import { useParams } from "next/navigation";
import SensorGraph from "@/components/SensorGraph/SensorGraph";
import { SensorDetailsData } from "@/components/SensorDetails/SensorDetails";

export default function SensorPage() {
  const params = useParams();
  const sensorId = params.id as string;
  const [fetchedSensor, setFetchedSensor] = useState<SensorDetailsData | null>(
    null
  );

  return (
    <BackgroundBox sx={{ backgroundColor: BACKGROUND }}>
      <Navbar />
      <Box sx={styles.container}>
        <Paper elevation={0} sx={styles.paper}>
          <SensorDetails sensorId={sensorId} canGoBack={true} setFetchedSensor={setFetchedSensor} />
        </Paper>
        <Paper elevation={0} sx={{ ...styles.paper, marginTop: "0px" }}>
          <SensorGraph
            sensor={{
              id: sensorId,
              upload_period: fetchedSensor?.upload_period ?? 86400,
            }}
          />
        </Paper>
      </Box>
    </BackgroundBox>
  );
}

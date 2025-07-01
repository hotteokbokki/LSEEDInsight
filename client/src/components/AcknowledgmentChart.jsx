import { ResponsiveBar } from "@nivo/bar";
import { Box, Typography, useTheme } from "@mui/material";
import { useState, useEffect } from "react";
import axios from "axios";
import { tokens } from "../theme";
import { useAuth } from "../context/authContext";

const AcknowledgmentChart = ({}) => {
  const [ackData, setAckData] = useState([]);
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { user } = useAuth();
  const isCoordinator = user?.roles?.includes("LSEED-Coordinator");

  useEffect(() => {
    const fetchAckData = async () => {
      
      let response;
      
      try {

        if (isCoordinator) {
          const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/get-program-coordinator`, {
            method: "GET",
            credentials: "include", // Required to send session cookie
          });

          if (!res.ok) {
            throw new Error("Failed to fetch program coordinator");
          }

          const data = await res.json();
          const program = data[0]?.name;

          if (!program) {
            throw new Error("No program found for this coordinator");
          }

          response = await fetch(
            `${process.env.REACT_APP_API_BASE_URL}/ack-data?program=${program}`
          );
        }
        else {
          response = await fetch(
            `${process.env.REACT_APP_API_BASE_URL}/ack-data`
          );
        }

        if (!response.ok) {
          throw new Error("Failed to fetch ack data");
        }

        const rawData = await response.json();
        const formattedData = rawData.map((item) => ({
          batch: item.se_name, // 🔹 Using SE name for readability
          acknowledged: Number(item.acknowledged_percentage) || 0,
          pending: Number(item.pending_percentage) || 0,
        }));

        setAckData(formattedData);
      } catch (error) {
        console.error("❌ Error fetching acknowledgment data:", error);
        setAckData([]);
      }
    };

    fetchAckData();
  }, []);

  if (!ackData?.length) {
    return (
      <Typography variant="h6" textAlign="center" color="white">
        No data available
      </Typography>
    );
  }

  return (
    <Box sx={{ height: "100%", width: "100%", minHeight: "350px" }}>
      <Typography variant="h6" textAlign="center" sx={{ mb: 2 }} color="white">
        Acknowledgment & Pending Evaluations
      </Typography>
      <ResponsiveBar
        data={ackData}
        keys={["acknowledged", "pending"]}
        indexBy="batch"
        margin={{ top: 50, right: 50, bottom: 130, left: 60 }} // 🔹 Moved chart up
        padding={0.3} // 🔹 Slightly wider bars for better readability
        layout="vertical"
        colors={{ scheme: "set2" }}
        borderRadius={4}
        enableLabel={true}
        labelSkipWidth={12}
        labelSkipHeight={12}
        labelTextColor={colors.grey[100]} // 🔹 White text for better contrast
        axisBottom={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0, // 🔹 Straight labels
          legend: "Social Enterprises",
          legendPosition: "middle",
          legendOffset: 40, // 🔹 Adjusted to avoid overlap
          tickTextColor: "white", // 🔹 White tick labels
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          legend: "Percentage",
          legendPosition: "middle",
          legendOffset: -50,
          tickTextColor: "white", // 🔹 White text
          labelTextColor: "white", // 🔹 White text
          itemTextColor: "white", // 🔹 White text
          legendTextColor: "white", // 🔹 White text
        }}
        theme={{
          axis: {
            ticks: {
              text: {
                fill: colors.primary[100],
              },
            },
            legend: {
              text: {
                fill: colors.primary[100],
              },
            },
          },
          keys: {
            text: {
              fill: colors.primary[100],
            },
          },
        }}
        legends={[
          {
            dataFrom: "keys",
            anchor: "bottom-right",
            direction: "column",
            translateX: -10,
            translateY: 50, // 🔹 Reduced spacing to prevent overflow
            itemWidth: 90,
            itemHeight: 18,
            itemsSpacing: 2,
            symbolSize: 15,
            itemTextColor: colors.primary[100], // 🔹 White legend text
          },
        ]}
        groupMode="grouped"
        animate={true} // 🔹 Smooth animations
        motionConfig="wobbly"
        tooltip={({ id, value, color }) => (
          <Box
            sx={{
              p: 1,
              bgcolor: "#333",
              borderRadius: "5px",
              boxShadow: 3,
              color: "white",
            }}
          >
            <strong style={{ color }}>{id}</strong>: {value}%
          </Box>
        )}
      />
    </Box>
  );
};

export default AcknowledgmentChart;

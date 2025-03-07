import { ResponsiveHeatMap } from "@nivo/heatmap";
import { useTheme } from "@mui/material";
import { tokens } from "../theme";
import { useState, useEffect } from "react";

const HeatmapWrapper = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [heatMapStats, setHeatMapStats] = useState([]);

  useEffect(() => {
    const fetchHeatMapStats = async () => {
      try {
        const response = await fetch("http://localhost:4000/heatmap-stats");
        const data = await response.json();

        console.log("Fetched Data:", data);

        if (!Array.isArray(data) || !data.length) {
          console.warn("Unexpected response:", data);
          setHeatMapStats([]);
          return;
        }

        setHeatMapStats(data);
      } catch (error) {
        console.error("Error fetching heat map stats:", error);
        setHeatMapStats([]);
      }
    };

    fetchHeatMapStats();
  }, []);

  const transformedData = heatMapStats.map(
    ({ abbr, team_name, ...scores }) => ({
      id: abbr,
      team_name,
      data: Object.keys(scores).map((category) => ({
        x: category,
        y: scores[category],
        team_name,
      })),
    })
  );

  return (
    <div
      style={{
        height: 550,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div style={{ height: 480, width: "100%" }}>
        {" "}
        {/* Made heatmap slightly smaller */}
        <ResponsiveHeatMap
          data={transformedData}
          margin={{ top: 40, right: 90, bottom: 100, left: 200 }}
          valueFormat=">-.2f"
          axisTop={null}
          axisRight={null}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            legend: "Social Enterprise",
            legendPosition: "middle",
            legendOffset: -180,
          }}
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: -30,
            truncateTickAt: 0,
          }}
          colors={({ value }) => {
            if (value <= 1.5)
              return theme.palette.mode === "dark"
                ? colors.redAccent[300]
                : colors.redAccent[500];
            if (value <= 3)
              return theme.palette.mode === "dark"
                ? colors.primary[300]
                : colors.grey[700];
            return theme.palette.mode === "dark"
              ? colors.greenAccent[300]
              : colors.greenAccent[500];
          }}
          emptyColor={colors.grey[600]}
          tooltip={({ cell }) => (
            <div
              style={{
                background:
                  theme.palette.mode === "dark"
                    ? colors.primary[500]
                    : colors.grey[900],
                padding: "10px",
                borderRadius: "5px",
                boxShadow: "0px 0px 10px rgba(0, 0, 0, 0.1)",
                color: "#fff",
              }}
            >
              <strong>{cell.data.team_name}</strong>
              <br />
              {cell.data.x}: {parseFloat(cell.data.y).toFixed(2)}
            </div>
          )}
          theme={{
            axis: {
              ticks: {
                text: {
                  fontSize: 12, // Keep labels readable
                  fill:
                    theme.palette.mode === "dark"
                      ? colors.grey[100]
                      : colors.grey[900],
                  textAnchor: "end", // Align labels correctly
                },
              },
              legend: {
                text: {
                  fontSize: 12,
                  fill:
                    theme.palette.mode === "dark"
                      ? colors.grey[100]
                      : colors.grey[900],
                },
              },
            },
            legends: {
              text: {
                fill:
                  theme.palette.mode === "dark"
                    ? colors.grey[100]
                    : colors.grey[900],
              },
            },
          }}
        />
      </div>
    </div>
  );
};

export default HeatmapWrapper;

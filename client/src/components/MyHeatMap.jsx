import { ResponsiveHeatMap } from "@nivo/heatmap";
import { useTheme } from "@mui/material";
import { tokens } from "../theme";
import { useState, useEffect } from "react";
import { Box, Select, MenuItem, Typography } from "@mui/material";

const HeatmapWrapper = ( {userRole} ) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [heatMapStats, setHeatMapStats] = useState([]);
  const [period, setPeriod] = useState("overall"); // Default to quarterly
  const userSession = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const fetchHeatMapStats = async () => {
      try {
        let response;

        if (userRole === 'LSEED-Coordinator') {
          const res = await fetch(
            `http://localhost:4000/api/get-program-coordinator?user_id=${userSession.id}`
          );

          const data = await res.json();
          const program = data[0]?.name; 

          response = await fetch(
            `http://localhost:4000/heatmap-stats?period=${period}&program=${program}`
          );
        } else {
          response = await fetch(
            `http://localhost:4000/heatmap-stats?period=${period}`
          );
        }
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
  }, [period]); // 🔄 Re-fetch data when `period` changes

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

  console.log(transformedData);

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Box>
          <Typography
            variant="h3"
            fontWeight="bold"
            color={colors.greenAccent[500]}
          >
            Heat Map
          </Typography>
        </Box>
        {/* Period Selector */}
        <Box
          display="flex"
          justifyContent="flex-end"
          alignItems="center"
          mb={2}
        >
          <Select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            sx={{
              minWidth: 120,
              bordercolor: colors.grey[100],
              backgroundColor: colors.blueAccent[600],
              color: colors.grey[100],
            }}
          >
            <MenuItem value="overall">Overall</MenuItem>
            <MenuItem value="quarterly">Quarterly</MenuItem>
            <MenuItem value="yearly">Yearly</MenuItem>
          </Select>
        </Box>
      </Box>
      <div
        style={{
          height: 550,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div style={{ height: 500, width: "100%" }}>
          <ResponsiveHeatMap
            data={transformedData}
            valueFormat=">-.2f"
            margin={{ top: 80, right: 60, bottom: 60, left: 180 }}
            axisTop={{
              tickSize: 5,
              tickPadding: 5,
              legend: "Categories",
              legendOffset: -70, // Adjust for positioning
              legendPosition: "middle",
              tickRotation: 0, // Keep text horizontal
              truncateTickAt: 0,
            }}
            axisLeft={{
              tickSize: 5,
              tickPadding: 5,
              legend: "Social Enterprise",
              legendPosition: "middle",
              legendOffset: -170,
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
            tooltip={({ cell }) => {
              const categoryMapping = {
                Teamwork: "Teamwork",
                Logistics: "Logistics",
                "Marketing Plan/Execution": "Marketing",
                "Human Resource Management": "HR",
                "Financial Planning/Management": "Finance",
                "Product/Service Design/Planning": "Product",
              };
              const category = categoryMapping[cell.data.x] || cell.data.x;
              const formattedValue = parseFloat(cell.data.y).toFixed(2);
              return (
                <div
                  style={{
                    background:
                      theme.palette.mode === "dark"
                        ? colors.primary[500]
                        : colors.grey[900],
                    padding: "10px",
                    borderRadius: "5px",
                    boxShadow: "0px 0px 10px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <strong>{cell.data.team_name}</strong>
                  <br />
                  {category}: {formattedValue}
                </div>
              );
            }}
            theme={{
              axis: {
                ticks: {
                  text: {
                    fill:
                      theme.palette.mode === "dark"
                        ? colors.grey[100]
                        : colors.grey[200], // For axis ticks text color
                  },
                },
                legend: {
                  text: {
                    fill:
                      theme.palette.mode === "dark"
                        ? colors.grey[100]
                        : colors.grey[200], // Axis legend text color
                  },
                },
              },
              legends: {
                text: {
                  fill:
                    theme.palette.mode === "dark"
                      ? colors.grey[100]
                      : colors.grey[900], // Color for legends
                },
              },
            }}
          />
        </div>

        {/* Color Legend */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginTop: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div
              style={{
                width: 20,
                height: 20,
                backgroundColor:
                  theme.palette.mode === "dark"
                    ? colors.redAccent[300]
                    : colors.redAccent[500],
                borderRadius: 4,
              }}
            ></div>
            <span
              style={{
                fontSize: 14,
                color:
                  theme.palette.mode === "dark"
                    ? colors.grey[100]
                    : colors.grey[200],
              }}
            >
              Low Performance (≤ 1.5)
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div
              style={{
                width: 20,
                height: 20,
                backgroundColor:
                  theme.palette.mode === "dark"
                    ? colors.primary[300]
                    : colors.grey[700],
                borderRadius: 4,
              }}
            ></div>
            <span
              style={{
                fontSize: 14,
                color:
                  theme.palette.mode === "dark"
                    ? colors.grey[100]
                    : colors.grey[200],
              }}
            >
              Moderate Performance (1.5 - 3)
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div
              style={{
                width: 20,
                height: 20,
                backgroundColor:
                  theme.palette.mode === "dark"
                    ? colors.greenAccent[300]
                    : colors.greenAccent[500],
                borderRadius: 4,
              }}
            ></div>
            <span
              style={{
                fontSize: 14,
                color:
                  theme.palette.mode === "dark"
                    ? colors.grey[100]
                    : colors.grey[200],
              }}
            >
              High Performance (&gt; 3)
            </span>
          </div>
        </div>
      </div>
    </Box>
  );
};

export default HeatmapWrapper;

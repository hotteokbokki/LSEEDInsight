import { useState, useEffect } from "react";
import { Box, Typography, Select, MenuItem } from "@mui/material";
import LineChart from "./LineChart";
import { useTheme } from "@mui/material";
import { tokens } from "../theme";

const SEPerformanceTrendChart = ({userRole}) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [topPerformers, setTopPerformers] = useState([]);
  const [period, setPeriod] = useState("overall");
  const [topPerformer, setTopPerformer] = useState(null);
  const userSession = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const fetchTopPerformers = async () => {
      try {
        let response;

        if (userRole === "LSEED-Coordinator") {
          const res = await fetch(
            `http://localhost:4000/api/get-program-coordinator?user_id=${userSession.id}`
          );

          const data = await res.json();
          const program = data[0]?.name; 
          response = await fetch(
            `http://localhost:4000/api/top-se-performance?period=${period}&program=${program}`
          );
        } else {
          response = await fetch(
            `http://localhost:4000/api/top-se-performance?period=${period}`
          );
        }

        const data = await response.json();
        const formattedData = Array.isArray(data) ? data : [];

        setTopPerformers(formattedData);

        // Determine top performer dynamically for selected period
        if (formattedData.length > 0) {
          const averageRatings = formattedData.reduce(
            (acc, { social_enterprise, avg_rating }) => {
              if (!acc[social_enterprise]) {
                acc[social_enterprise] = { total: 0, count: 0 };
              }
              acc[social_enterprise].total += parseFloat(avg_rating);
              acc[social_enterprise].count += 1;
              return acc;
            },
            {}
          );

          const topSE = Object.entries(averageRatings).reduce(
            (top, [seName, { total, count }]) => {
              const avg = total / count;
              return !top || avg > top.avg ? { name: seName, avg } : top;
            },
            null
          );

          console.log("Top performer for", period, ":", topSE?.name); // Debugging log
          setTopPerformer(topSE ? topSE.name : null);
        } else {
          setTopPerformer(null);
        }
      } catch (error) {
        console.error("Error fetching top SE performance:", error);
        setTopPerformers([]);
        setTopPerformer(null);
      }
    };
    fetchTopPerformers();
  }, [period]); // Only depends on period

  const formatChartData = (data) => {
    if (!data.length) return [];

    const groupedData = {};
    const colorList = [
      colors.blueAccent[500],
      colors.greenAccent[500],
      colors.redAccent[500],
      colors.primary[500],
      colors.grey[500],
    ];

    // 1. Extract all unique quarters (period labels) from data
    const allPeriodsSet = new Set();
    data.forEach(({ quarter_start }) => {
      const date = new Date(quarter_start);
      const periodLabel = `${date.getFullYear()}-Q${Math.floor(date.getMonth() / 3) + 1}`;
      allPeriodsSet.add(periodLabel);
    });

    // 2. Sort quarters chronologically (by year and quarter number)
    const allPeriods = Array.from(allPeriodsSet).sort((a, b) => {
      const [aYear, aQ] = a.split('-Q').map(Number);
      const [bYear, bQ] = b.split('-Q').map(Number);
      if (aYear !== bYear) return aYear - bYear;
      return aQ - bQ;
    });

    // 3. Group ratings by social_enterprise and quarter
    data.forEach(({ social_enterprise, quarter_start, avg_rating }) => {
      const date = new Date(quarter_start);
      const periodLabel = `${date.getFullYear()}-Q${Math.floor(date.getMonth() / 3) + 1}`;

      if (!groupedData[social_enterprise]) {
        groupedData[social_enterprise] = {};
      }
      groupedData[social_enterprise][periodLabel] = parseFloat(avg_rating);
    });

    // 4. For each social enterprise, build data array with all quarters, filling missing with null
    return Object.keys(groupedData).map((seName, index) => {
      const seData = allPeriods.map((period) => ({
        x: period,
        y: groupedData[seName][period] ?? 0,
      }));

      return {
        id: seName,
        color: colorList[index % colorList.length],
        data: seData,
      };
    });
  };


  const chartData = formatChartData(topPerformers);

  console.log("Chart Data: ", chartData)

  return (
    <Box
      gridColumn="span 12"
      gridRow="span 2"
      backgroundColor={colors.primary[400]}
      p="20px"
    >
      {/* Container for title and dropdown */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        {/* Left side - Chart Title and Top Performer */}
        <Box>
          <Typography
            variant="h3"
            fontWeight="bold"
            color={colors.greenAccent[500]}
          >
            {chartData.length === 0 ? "No Data" : "SE Performance Trend"}
          </Typography>

          {topPerformer && (
            <Typography
              variant="h5"
              fontWeight="bold"
              color={colors.blueAccent[500]}
              mt={1}
            >
              Top Performer ({period}): {topPerformer}
            </Typography>
          )}
        </Box>

        {/* Right side - Period Select Dropdown */}
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

      <Box
        height="320px"
        display="flex"
        justifyContent="center"
        alignItems="center"
      >
        {chartData.length === 0 ? (
          <Typography variant="h6" color={colors.grey[300]} textAlign="center">
            No data available for plotting.
          </Typography>
        ) : (
          <LineChart data={chartData} />
        )}
      </Box>
    </Box>
  );
};

export default SEPerformanceTrendChart;

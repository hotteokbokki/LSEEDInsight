import { useState, useEffect } from "react";
import { Box, Typography, Select, MenuItem } from "@mui/material";
import LineChart from "./LineChart";
import { useTheme } from "@mui/material";
import { tokens } from "../theme";

const SEPerformanceTrendChartByMentorship = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [topPerformers, setTopPerformers] = useState([]);
  const [topPerformer, setTopPerformer] = useState(null);
  const [period, setPeriod] = useState("overall");
  const [userSession, setUserSession] = useState(null);

  useEffect(() => {
    const session = JSON.parse(localStorage.getItem("user"));
    if (session) {
      setUserSession(session);
    }
  }, []);

  useEffect(() => {
    const fetchTopPerformers = async () => {
      try {
        if (!userSession || !userSession.id) {
          console.warn("User session not found.");
          return;
        }

        const mentor_id = userSession.id;
        const response = await fetch(
          `http://localhost:4000/api/top-se-performance-with-mentorships?mentor_id=${mentor_id}&period=${period}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        const formattedData = Array.isArray(data) ? data : [];

        setTopPerformers(formattedData);

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

          console.log("Top performer for", period, ":", topSE?.name);
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

    if (userSession) {
      fetchTopPerformers();
    }
  }, [period, userSession]);

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

    data.forEach(({ social_enterprise, month, avg_rating }) => {
      const date = new Date(month);
      const periodLabel = `${date.getFullYear()}-Q${
        Math.floor(date.getMonth() / 3) + 1
      }`;

      if (!groupedData[social_enterprise]) {
        groupedData[social_enterprise] = [];
      }
      groupedData[social_enterprise].push({
        x: periodLabel,
        y: parseFloat(avg_rating),
      });
    });

    return Object.keys(groupedData).map((seName, index) => ({
      id: seName,
      color: colorList[index % colorList.length],
      data: groupedData[seName].sort((a, b) => a.x.localeCompare(b.x)),
    }));
  };

  const chartData = formatChartData(topPerformers);

  return (
    <Box
      gridColumn="span 12"
      gridRow="span 2"
      backgroundColor={colors.primary[400]}
      p="20px"
    >
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

export default SEPerformanceTrendChartByMentorship;

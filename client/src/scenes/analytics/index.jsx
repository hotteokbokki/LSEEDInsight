import { Box, useTheme, Typography, Tooltip, IconButton } from "@mui/material";
import Header from "../../components/Header";
import HorizontalBarChart from "../../components/HorizontalBarChart";
import DualAxisLineChart from "../../components/DualAxisLineChart";
import StatBox from "../../components/StatBox";
import LeaderboardChart from "../../components/LeaderboardChart";
import SEPerformanceTrendChart from "../../components/SEPerformanceTrendChart";
import BarChart from "../../components/BarChart";
import EmailIcon from "@mui/icons-material/Email";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import StoreIcon from "@mui/icons-material/Store";
import GroupIcon from "@mui/icons-material/Group";
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrafficIcon from "@mui/icons-material/Traffic";
import HeatmapWrapper from "../../components/MyHeatMap";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { tokens } from "../../theme";
import { useEffect, useState } from "react";

const Analytics = ( {userRole}) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [stats, setStats] = useState(null);
  const userSession = JSON.parse(localStorage.getItem("user"));


  useEffect(() => {
    const fetchStats = async () => {
      try {
        let response;

        if (userRole === 'LSEED-Coordinator') {
          const res = await fetch(
            `http://localhost:4000/api/get-program-coordinator?user_id=${userSession.id}`
          );

          const data = await res.json();
          const program = data[0]?.name;

          response = await fetch(
            `http://localhost:4000/api/analytics-stats?program=${program}`
          );
        } else {
          response = await fetch(
            `http://localhost:4000/api/analytics-stats`
          );
        }
        const data = await response.json();

        setStats(data);
      } catch (error) {
        console.error("Error fetching analytics stats:", error);
        setStats({ heatmapStats: [] }); // Fallback to empty array
      }
    };
    fetchStats();
  }, []);

  if (!stats) return <Typography>Loading...</Typography>;

  return (
    <Box m="20px">
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Header title="Analytics" subtitle="Welcome to Analytics" />
      </Box>

      {/* Row 1 - StatBoxes */}
      <Box
        display="flex"
        flexWrap="wrap"
        gap="20px"
        justifyContent="space-between"
        mt="20px"
      >
        {/* SE's Enrolled */}
        <Box
          flex="1 1 22%"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
          p="20px"
        >
          <StatBox
            title={stats.totalSocialEnterprises}
            subtitle="SE's Enrolled"
            progress={
              stats.totalSocialEnterprises / (stats.previousMonthSECount || 1)
            }
            increase={`${
              stats.previousMonthSECount > 0
                ? (
                    ((stats.totalSocialEnterprises -
                      stats.previousMonthSECount) /
                      stats.previousMonthSECount) *
                    100
                  ).toFixed(2)
                : 0
            }%`}
            icon={
              <EmailIcon
                sx={{ fontSize: "26px", color: colors.greenAccent[500] }} // 🔄 Updated icon
              />
            }
          />
        </Box>

        {/* SE's with Mentors */}
        <Box
          flex="1 1 22%"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
          p="20px"
        >
          <StatBox
            title={stats.withMentorship}
            subtitle="SE's with Mentors"
            progress={
              stats.withMentorship / (stats.totalSocialEnterprises || 1)
            }
            increase={`${(
              (stats.withMentorship / (stats.totalSocialEnterprises || 1)) *
              100
            ).toFixed(2)}%`}
            icon={
              <GroupIcon
                sx={{ fontSize: "26px", color: colors.blueAccent[500] }} // 🔄 Updated icon
              />
            }
          />
        </Box>

        {/* SE's without Mentors */}
        <Box
          flex="1 1 22%"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
          p="20px"
        >
          <StatBox
            title={stats.withoutMentorship}
            subtitle="SEs without mentors"
            progress={
              stats.withoutMentorship / (stats.totalSocialEnterprises || 1)
            }
            increase={`${(
              (stats.withoutMentorship / (stats.totalSocialEnterprises || 1)) *
              100
            ).toFixed(2)}%`}
            icon={
              <PersonRemoveIcon
                sx={{ fontSize: "26px", color: colors.redAccent[500] }} // 🔄 Updated icon
              />
            }
          />
        </Box>

        {/* SE with Significant Growth */}
        <Box
          flex="1 1 22%"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
          p="20px"
        >
          <StatBox
            title={`${stats.growthScoreTotal} ${
              stats.growthScore?.[0]?.abbr || "N/A"
            }`}
            subtitle="SE with Significant Growth"
            progress={Math.min(stats.cumulativeGrowth / 100, 1)} // ✅ Cap at 100%
            increase={`${stats.cumulativeGrowth}%`}
            icon={
              <TrendingUpIcon
                sx={{ fontSize: "26px", color: colors.blueAccent[500] }} // 🔄 Updated icon
              />
            }
          />
        </Box>
      </Box>

      {/* SE Performance Trend*/}
      <Box
        gridColumn="span 12"
        gridRow="span 2"
        backgroundColor={colors.primary[400]}
        paddingTop="5px"
        marginTop="20px"
      >
        <SEPerformanceTrendChart userRole={userRole}/>
      </Box>

      {/* Row 2 - Horizontal Bar Charts */}
      <Box
        display="flex"
        flexWrap="wrap"
        gap="20px"
        justifyContent="space-between"
        mt="20px"
      >
        {/* Overall SE Performance */}
        <Box
          flex="1 1 100%"
          height="400px"
          backgroundColor={colors.primary[400]}
          p="20px"
        >
          <Typography
            variant="h3"
            fontWeight="bold"
            color={colors.greenAccent[500]}
          >
            {stats.categoricalScoreForAllSE?.length > 0
              ? "Evaluation Score Distribution"
              : ""}
          </Typography>
          <Box
            height="90%"
            display="flex"
            justifyContent="center"
            alignItems="center"
          >
            {stats.categoricalScoreForAllSE?.length > 0 ? (
              <HorizontalBarChart
                data={stats.categoricalScoreForAllSE.map((score) => ({
                  category: score.category,
                  score: parseFloat(score.score) || 0,
                }))}
                type="categoricalScoreForAllSE"
              />
            ) : (
              <Typography
                variant="h6"
                color={colors.grey[300]}
                textAlign="center"
              >
                No Available Data
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      {/* Main container */}
      <Box display="flex" flexDirection="column" gap="20px" mt="20px">
        {/* Row 3 - Social Enterprise Performance Heatmap */}

        <Box
          flexGrow={1} // ✅ Makes sure the heatmap takes available space
          gridColumn="span 12"
          width="100%"
          backgroundColor={colors.primary[400]}
          p="20px"
          alignSelf="center"
          paddingleft="20px"
          paddingRight="20px"
        >
          <HeatmapWrapper userRole={userRole}/>
        </Box>

        {/* Row 4 - Leaderboard */}
        <Box display="flex" flexDirection="column" gap="20px">
          <Box
            width="100%"
            height="300px"
            backgroundColor={colors.primary[400]}
            p="20px"
          >
            <Typography
              variant="h4"
              fontWeight="bold"
              color={colors.greenAccent[500]}
            >
              {stats?.leaderboardData?.length > 0
                ? "Leaderboard - Ratings"
                : ""}
            </Typography>
            <Box height="100%">
              {stats?.leaderboardData ? (
                stats.leaderboardData.length > 0 ? (
                  <LeaderboardChart data={stats.leaderboardData} />
                ) : (
                  <Typography
                    variant="h6"
                    color={colors.grey[300]}
                    textAlign="center"
                  >
                    Leaderboards Unavailable
                  </Typography>
                )
              ) : (
                <Typography variant="h6" color="red" textAlign="center">
                  Error loading data
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
      {/* Row 5 - Improvement Score Over Time */}
      <Box display="flex" flexDirection="column" gap="20px" mt="20px">
        <Box height="300px" backgroundColor={colors.primary[400]} p="20px">
          {/* Title and Tooltip Container */}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography
              variant="h3"
              fontWeight="bold"
              color={colors.greenAccent[500]}
            >
              {stats?.improvementScore?.length > 0
                ? "Improvement Score Trends Over Time"
                : ""}
            </Typography>

            {/* Tooltip for explanation */}
            <Tooltip
              title={
                <Box sx={{ maxWidth: 300, p: 1 }}>
                  <Typography variant="body1" fontWeight="bold">
                    Understanding the Improvement Score Trends 📊
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    This chart tracks the{" "}
                    <strong>progress of Social Enterprises (SEs)</strong> over
                    time using two key indicators:
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2">
                      🔹{" "}
                      <strong style={{ color: colors.greenAccent[500] }}>
                        Overall Avg Improvement
                      </strong>{" "}
                      → Measures the <strong>average improvement score</strong>{" "}
                      across all SEs.
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      🔹{" "}
                      <strong style={{ color: colors.blueAccent[500] }}>
                        Median Improvement
                      </strong>{" "}
                      → Represents the <strong>middle improvement score</strong>{" "}
                      to reduce the impact of outliers.
                    </Typography>
                  </Box>
                  <Typography variant="body1" fontWeight="bold" sx={{ mt: 2 }}>
                    📌 How to Read the Chart:
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2">
                      📈 <strong>Upward trends</strong> → SEs are improving over
                      time.
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      ⏸️ <strong>Flat trends</strong> → Growth is slow but
                      stable.
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      📉 <strong>Declining trends</strong> → SEs are facing
                      challenges.
                    </Typography>
                  </Box>
                </Box>
              }
              arrow
              placement="top"
            >
              <IconButton sx={{ color: colors.grey[300] }}>
                <HelpOutlineIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Chart Container - Properly Centered */}
          <Box
            height="100%"
            display="flex"
            justifyContent="center"
            alignItems="center"
            padding="20px"
          >
            {(() => {
              try {
                console.log(
                  "Raw stats.improvementScore:",
                  stats?.improvementScore
                );

                if (!stats?.improvementScore) {
                  console.error("Data not found");
                  throw new Error("Data not found");
                }
                if (stats.improvementScore.length === 0) {
                  console.warn("No Available Data");
                  return (
                    <Typography
                      variant="h6"
                      color={colors.grey[300]}
                      textAlign="center"
                    >
                      No Available Data
                    </Typography>
                  );
                }

                // Function to convert full date (YYYY-MM-DD) into "QX YYYY" format
                const getQuarterLabel = (dateString) => {
                  if (!dateString) return "Unknown";
                  const date = new Date(dateString);
                  if (isNaN(date.getTime())) return "Unknown"; // Handle invalid dates

                  const year = date.getFullYear();
                  const month = date.getMonth() + 1; // Months are 0-based
                  const quarter = Math.ceil(month / 3);
                  return `Q${quarter} ${year}`;
                };

                // Group data by quarters dynamically
                const formattedData = stats.improvementScore.reduce(
                  (acc, point) => {
                    const quarterLabel = getQuarterLabel(point.month);
                    if (!acc[quarterLabel]) {
                      acc[quarterLabel] = {
                        overall_avg_improvement: 0,
                        median_improvement: 0,
                        count: 0,
                      };
                    }
                    acc[quarterLabel].overall_avg_improvement +=
                      parseFloat(point.overall_avg_improvement) || 0;
                    acc[quarterLabel].median_improvement +=
                      parseFloat(point.median_improvement) || 0;
                    acc[quarterLabel].count += 1;
                    return acc;
                  },
                  {}
                );

                console.log(
                  "Formatted data grouped by quarters:",
                  formattedData
                );

                // Convert grouped data into chart format
                const sortedQuarters = Object.keys(formattedData).sort((a, b) => {
                  const [qa, ya] = a.split(" ");
                  const [qb, yb] = b.split(" ");
                  const quarterToMonth = { Q1: 1, Q2: 4, Q3: 7, Q4: 10 };
                  const dateA = new Date(parseInt(ya), quarterToMonth[qa] - 1);
                  const dateB = new Date(parseInt(yb), quarterToMonth[qb] - 1);
                  return dateA - dateB;
                });

                const chartData = [
                  {
                    id: "Overall Avg Improvement",
                    data: sortedQuarters.map((quarter) => ({
                      x: quarter,
                      y:
                        formattedData[quarter].overall_avg_improvement /
                        formattedData[quarter].count,
                    })),
                  },
                  {
                    id: "Median Improvement",
                    data: sortedQuarters.map((quarter) => ({
                      x: quarter,
                      y:
                        formattedData[quarter].median_improvement /
                        formattedData[quarter].count,
                    })),
                  },
                ];

                console.log("Final chart data:", chartData);

                return <DualAxisLineChart data={chartData} />;
              } catch (error) {
                console.error("Error processing data:", error);
                return (
                  <Typography variant="h6" color="red" textAlign="center">
                    Error loading data
                  </Typography>
                );
              }
            })()}
          </Box>
        </Box>

        {/* Row 5 - Social Enterprise Performance Comparison */}
        <Box height="500px" backgroundColor={colors.primary[400]} p="20px">
          <Typography
            variant="h3"
            fontWeight="bold"
            color={colors.greenAccent[500]}
          >
            Social Enterprise Performance Comparison
          </Typography>
          <Box
            height="100%"
            display="flex"
            justifyContent="center"
            alignItems="center"
          >
            <BarChart userRole={userRole}/>{" "}
            {/* No need for conditional rendering, BarChart fetches its own data */}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Analytics;

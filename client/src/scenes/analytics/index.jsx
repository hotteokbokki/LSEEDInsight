import { Box, useTheme, Typography } from "@mui/material";
import Header from "../../components/Header";
import HorizontalBarChart from "../../components/HorizontalBarChart";
import DualAxisLineChart from "../../components/DualAxisLineChart";
import StatBox from "../../components/StatBox";
import EmailIcon from "@mui/icons-material/Email";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import TrafficIcon from "@mui/icons-material/Traffic";
import { tokens } from "../../theme";
import { useEffect, useState } from "react";

const Analytics = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`http://localhost:4000/api/analytics-stats`);
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error("Error fetching analytics stats:", error);
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
<Box display="flex" flexWrap="wrap" gap="20px" justifyContent="space-between">
  <Box flex="1 1 18%" backgroundColor={colors.primary[400]} display="flex" alignItems="center" justifyContent="center" p="20px">
    <StatBox
      title={stats.totalSocialEnterprises}
      subtitle="SE's Enrolled"
      progress={stats.totalSocialEnterprises / (stats.previousMonthSECount || 1)} // Assuming max 100
      increase={`${stats.previousMonthSECount > 0 
        ? (((stats.totalSocialEnterprises - stats.previousMonthSECount) / stats.previousMonthSECount) * 100).toFixed(2) 
        : 0}%`}
      icon={<EmailIcon sx={{ fontSize: "26px", color: colors.greenAccent[500] }} />}
    />
  </Box>

  <Box flex="1 1 18%" backgroundColor={colors.primary[400]} display="flex" alignItems="center" justifyContent="center" p="20px">
    <StatBox
      title={stats.withMentorship}
      subtitle="SE's with Mentors"
      progress={stats.withMentorship / (stats.totalSocialEnterprises || 1)} // Shows percentage filled
      increase={`${(stats.withMentorship / (stats.totalSocialEnterprises || 1) * 100).toFixed(2)}%`}
      icon={<PointOfSaleIcon sx={{ fontSize: "26px", color: colors.blueAccent[500] }} />}
      />
  </Box>

  <Box flex="1 1 18%" backgroundColor={colors.primary[400]} display="flex" alignItems="center" justifyContent="center" p="20px">
    <StatBox
      title={stats.withoutMentorship}
      subtitle="SEs without mentors"
      progress={stats.withoutMentorship / (stats.totalSocialEnterprises || 1)} // Avoid division by zero
      increase={`${(stats.withoutMentorship / (stats.totalSocialEnterprises || 1) * 100).toFixed(2)}%`}
      icon={<PersonAddIcon sx={{ fontSize: "26px", color: colors.redAccent[500] }} />}
    />
  </Box>

  <Box flex="1 1 18%" backgroundColor={colors.primary[400]} display="flex" alignItems="center" justifyContent="center" p="20px">
    <StatBox
      title={stats.growthScoreTotal}
      subtitle="Overall Growth Score"
      progress={stats.cumulativeGrowth / 100} // Normalize percentage
      increase={`${stats.cumulativeGrowth}%`}
      icon={<TrafficIcon sx={{ fontSize: "26px", color: colors.blueAccent[500] }} />}
    />
  </Box>
</Box>


      {/* Row 2 - Horizontal Bar Charts */}
      <Box display="flex" flexWrap="wrap" gap="20px" justifyContent="space-between" mt="20px">
        {/* Common Challenges */}
        <Box flex="1 1 48%" height="300px" backgroundColor={colors.primary[400]} p="20px">
          <Typography variant="h3" fontWeight="bold" color={colors.greenAccent[500]}>
            Common Challenges
          </Typography>
          <HorizontalBarChart 
            data={(stats.allCommonChallenges || []).map(challenge => ({
              comment: challenge.comment, 
              category: challenge.category, 
              percentage: parseFloat(challenge.percentage) || 0
            }))} 
            type="allCommonChallenges" // Pass the correct type
          />
        </Box>

        {/* Overall SE Performance */}
        <Box flex="1 1 48%" height="300px" backgroundColor={colors.primary[400]} p="20px">
          <Typography variant="h3" fontWeight="bold" color={colors.greenAccent[500]}>
            Overall SE Performance
          </Typography>
          <HorizontalBarChart 
            data={(stats.categoricalScoreForAllSE || []).map(score => ({
              category: score.category, 
              score: parseFloat(score.score) || 0
            }))} 
            type="categoricalScoreForAllSE" // Pass the correct type
          />
        </Box>
      </Box>

      {/* Row 3 - Line Chart */}
      <Box flex="1 1 100%" height="300px" backgroundColor={colors.primary[400]} p="20px" mt="20px">
        <Typography variant="h3" fontWeight="bold" color={colors.greenAccent[500]}>Average Improvement Score Over Time</Typography>
        <DualAxisLineChart 
          data={[{
            id: "Improvement Score",
            data: (stats.improvementScore || []).map(point => ({ 
              x: point.month?.substring(0, 7) || "Unknown", 
              y: parseFloat(point.overall_avg_improvement) || 0 
            }))
          }]} 
        />
      </Box>
    </Box>
  );
};

export default Analytics;

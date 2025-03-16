import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
} from "@mui/material";
import StatBox from "../../components/StatBox"; // Adjust the path based on your project structure
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import StarIcon from "@mui/icons-material/Star";
import GroupsIcon from "@mui/icons-material/Groups";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import MentorHorizontalBarChart from "../../components/MentorHorizontalBarChart";
import { tokens } from "../../theme";
import LineChart from "../../components/LineChart";
import RadarChart from "../../components/RadarChart";
import { useParams, useNavigate } from "react-router-dom"; // Import useNavigate
import { useTheme } from "@mui/material/styles";

const MentorAnalytics = () => {
  const theme = useTheme(); // Now 'useTheme' is defined
  const colors = tokens(theme.palette.mode);
  const { id } = useParams(); // Extract the `id` from the URL
  const [selectedMentorId, setSelectedMentorId] = useState(id);
  const [mentorAnalytics, setMentorAnalytics] = useState([])
  const navigate = useNavigate(); // Initialize useNavigate
  const [categoryType, setCategoryType] = useState("mentor"); // ✅ Define state here

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(
          `http://localhost:4000/api/mentor-analytics/${selectedMentorId}`
        );
        const data = await response.json();
  
        // Extract values correctly
        setMentorAnalytics({
          totalEvaluations: data.totalEvaluations || 0,
          avgRating: data.avgRating || "N/A",
          mostFrequentRating: data.mostFrequentRating || "N/A",
          numHandledSEs: data.numHandledSEs || 0,
          avgRatingPerCategory: data.avgRatingPerCategory || [], 
          performanceOverview: data.performanceOverview || [],
        });
      } catch (error) {
        console.error("❌ Error fetching analytics stats:", error);
      }
    };
  
    if (selectedMentorId) {
      fetchStats();
    }
  }, [selectedMentorId]); // ✅ Ensures it runs when mentor changes
  
  // Mock data for charts
  const mockLineData = [
    {
      id: "performance",
      color: tokens("dark").greenAccent[500],
      data: [
        { x: "Jan", y: 80 },
        { x: "Feb", y: 90 },
        { x: "Mar", y: 70 },
        { x: "Apr", y: 85 },
        { x: "May", y: 95 },
      ],
    },
  ];

  const mockRadarData = [
    {
      category: "Communication",
      Strength: 80,
      Weakness: 60,
    },
    {
      category: "Problem Solving",
      Strength: 90,
      Weakness: 50,
    },
    {
      category: "Leadership",
      Strength: 70,
      Weakness: 75,
    },
  ];

  if (!selectedMentorId) {
    return <Box>No Mentor found</Box>;
  }

  return (
    <Box m="20px">
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        {/* Page Title */}
        <Typography variant="h4" fontWeight="bold" color={colors.grey[100]}>
          {selectedMentorId.mentorName} Analytics
        </Typography>
      </Box>

      {/* Row 1 - StatBoxes */}
      <Box
        display="flex"
        flexWrap="wrap"
        gap="20px"
        justifyContent="space-between"
        mt="20px"
      >
        {/* Total Evaluations */}
        <Box
          flex="1 1 22%"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
          p="20px"
        >
          <StatBox
            title={mentorAnalytics.totalEvaluations}
            subtitle="Total Evaluations"
            progress={1} // Always full bar
            increase={`${mentorAnalytics.totalEvaluations} Evaluations`}
            icon={
              <PointOfSaleIcon
                sx={{ fontSize: "26px", color: colors.blueAccent[500] }}
              />
            }
          />
        </Box>

        {/* Most Frequent Rating */}
        <Box
          flex="1 1 22%"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
          p="20px"
        >
          <StatBox
            title={mentorAnalytics.mostFrequentRating}
            subtitle="Most Frequent Rating"
            progress={null} // No progress bar needed
            sx={{ "& .MuiBox-root.css-1ntui4p": { display: "none" } }} // Hide the progress circle
            icon={
              <StarIcon
                sx={{ fontSize: "26px", color: colors.greenAccent[500] }}
              />
            }
          />
        </Box>

        {/* Number of SEs Handled */}
        <Box
          flex="1 1 22%"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
          p="20px"
        >
          <StatBox
            title={mentorAnalytics.numHandledSEs}
            subtitle="Mentorships"
            progress={null} // No progress bar needed
            sx={{ "& .MuiBox-root.css-1ntui4p": { display: "none" } }} // Hide the progress circle
            icon={
              <GroupsIcon
                sx={{ fontSize: "26px", color: colors.greenAccent[500] }}
              />
            }
          />
        </Box>

        {/* Average Rating */}
        <Box
          flex="1 1 22%"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
          p="20px"
        >
          <StatBox
            title={mentorAnalytics.avgRating}
            subtitle="Average Rating"
            progress={mentorAnalytics.avgRating / 5} // Normalize to 0-1 scale
            increase={`${mentorAnalytics.avgRating} / 5`}
            icon={
              <TrendingUpIcon
                sx={{ fontSize: "26px", color: colors.blueAccent[500] }}
              />
            }
          />
        </Box>
      </Box>

      <Box
        flex="1 1 100%"
        height="450px"
        backgroundColor={colors.primary[400]}
        p="20px"
      >
        {/* Title */}
        <Typography variant="h3" fontWeight="bold" color={colors.greenAccent[500]} mb={2}>
          Average Rating per Category
        </Typography>

        {/* Toggle Button */}
        <Box display="flex" justifyContent="flex-end" mb={2}>
          <Button
            variant="contained"
            sx={{
              backgroundColor: colors.blueAccent[500],
              color: "black",
              "&:hover": { backgroundColor: colors.blueAccent[700] },
            }}
            onClick={() => setCategoryType(categoryType === "mentor" ? "session" : "mentor")}
          >
            {categoryType === "mentor" ? "Show Mentoring Sessions" : "Show Mentor Categories"}
          </Button>
        </Box>

        {/* Chart Container */}
        <Box height="90%" display="flex" flexDirection="column">
          <MentorHorizontalBarChart mentorId={selectedMentorId} categoryType={categoryType} />
        </Box>
      </Box>

      {/* Performance Overview */}
      <Box
        mt="20px"
        sx={{
          backgroundColor: colors.primary[400],
          padding: "20px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Typography variant="h5" fontWeight="bold" color={colors.grey[100]}>
          Performance Overview
        </Typography>
        <Box
          height="300px"
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
          {!mentorAnalytics.performanceOverview || mentorAnalytics.performanceOverview.length === 0 ? (
            <Typography variant="h6" color={colors.grey[300]}>
              Performance Overview Unavailable.
            </Typography>
          ) : (
            <RadarChart radarData={mentorAnalytics.performanceOverview} />
          )}
        </Box>
      </Box>

      {/* Back Button with Spacing */}
      <Box mt="20px" display="flex" justifyContent="start">
        <Button
          variant="contained"
          sx={{
            backgroundColor: colors.blueAccent[500],
            color: "black",
            "&:hover": {
              backgroundColor: colors.blueAccent[800],
            },
            width: "2/12", // Take up 2/12 of the space
            maxWidth: "150px", // Optional: Add a max-width for better control
          }}
          onClick={() => navigate(-1)} // Navigate back to the Mentors page
        >
          Back
        </Button>
      </Box>
    </Box>
  );
};

export default MentorAnalytics;

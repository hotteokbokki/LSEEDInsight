import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { tokens } from "../../theme";
import LineChart from "../../components/LineChart";
import PieChart from "../../components/PieChart";
import LikertChart from "../../components/LikertChart";
import RadarChart from "../../components/RadarChart";
import { useParams, useNavigate } from "react-router-dom"; // Import useNavigate
import { mockDataSE } from "../../sampledata/mockData";
import { useTheme } from "@mui/material/styles";

const SEAnalytics = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { id } = useParams(); // Extract the `id` from the URL
  const [selectedSEId, setSelectedSEId] = useState(id); // State to manage selected SE
  const navigate = useNavigate(); // Initialize useNavigate

  // Find the selected SE based on the ID
  const selectedSE = mockDataSE.find((se) => se.id === parseInt(selectedSEId));

  // Handle SE change in the dropdown
  const handleChangeSE = (event) => {
    setSelectedSEId(event.target.value);
  };

  // Mock data for charts (replace with real data as needed)
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

  const mockPieData = [
    { id: "Challenge A", label: "Challenge A", value: 40 },
    { id: "Challenge B", label: "Challenge B", value: 30 },
    { id: "Challenge C", label: "Challenge C", value: 20 },
    { id: "Challenge D", label: "Challenge D", value: 10 },
  ];

  const mockLikertData = [
    {
      question: "Q1: How satisfied are you?",
      "Strongly Disagree": 10,
      Disagree: 20,
      Neutral: 30,
      Agree: 25,
      "Strongly Agree": 15,
    },
  ];

  const mockRadarData = [
    {
      category: "Challenge A",
      "Social Enterprise A": 80,
      "Social Enterprise B": 60,
      "Social Enterprise C": 70,
    },
    {
      category: "Challenge B",
      "Social Enterprise A": 40,
      "Social Enterprise B": 90,
      "Social Enterprise C": 50,
    },
    {
      category: "Performance A",
      "Social Enterprise A": 90,
      "Social Enterprise B": 80,
      "Social Enterprise C": 85,
    },
  ];

  if (!selectedSE) {
    return <Box>No Social Enterprise found</Box>;
  }

  return (
    <Box m="20px">
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        {/* Back Button and Dropdown Container */}
        <Box display="flex" alignItems="center" gap="10px">
          {/* Social Enterprise Selection Dropdown */}
          <FormControl variant="outlined" sx={{ minWidth: 120 }}>
            <InputLabel>Select SE</InputLabel>
            <Select
              value={selectedSEId}
              onChange={handleChangeSE}
              label="Select SE"
            >
              {mockDataSE.map((se) => (
                <MenuItem key={se.id} value={se.id}>
                  {se.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Page Title */}
        <Typography variant="h4" fontWeight="bold" color={colors.grey[100]}>
          {selectedSE.name} Analytics
        </Typography>
      </Box>

      {/* Performance Trend */}
      <Box
        mt="20px"
        sx={{
          backgroundColor: colors.primary[400], // Gray background
          padding: "20px", // Padding inside the box
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)", // Optional: Add shadow for better UI
        }}
      >
        <Typography variant="h5" fontWeight="bold" color={colors.grey[100]}>
          Performance Trend
        </Typography>
        <Box height="250px">
          <LineChart data={mockLineData} />
        </Box>
      </Box>

      {/* Common Challenges & Performance Score */}
      <Box
        display="grid"
        gridTemplateColumns="repeat(2, 1fr)"
        gap="20px"
        mt="20px"
      >
        {/* Common Challenges */}
        <Box
          sx={{
            backgroundColor: colors.primary[400],
            padding: "20px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          }}
        >
          <Typography variant="h5" fontWeight="bold" color={colors.grey[100]}>
            Common Challenges
          </Typography>
          <Box height="250px">
            <PieChart data={mockPieData} />
          </Box>
        </Box>

        {/* Performance Score */}
        <Box
          sx={{
            backgroundColor: colors.primary[400],
            padding: "20px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          }}
        >
          <Typography variant="h5" fontWeight="bold" color={colors.grey[100]}>
            Performance Score
          </Typography>
          <Box height="250px">
            <LikertChart data={mockLikertData} />
          </Box>
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
        <Box height="300px">
          <RadarChart data={mockRadarData} />
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
          onClick={() => navigate("/mentors")} // Navigate back to the Mentors page
        >
          Back
        </Button>
      </Box>
    </Box>
  );
};

export default SEAnalytics;

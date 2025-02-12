import React from "react";
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
import RadarChart from "../../components/RadarChart";
import { useParams, useNavigate } from "react-router-dom"; // Import useNavigate
import { mockDataMentor } from "../../sampledata/mockData";
import { useTheme } from "@mui/material/styles";

const MentorAnalytics = () => {
  const theme = useTheme(); // Now 'useTheme' is defined
  const colors = tokens(theme.palette.mode);
  const { id } = useParams(); // Extract the `id` from the URL
  const [selectedMentorId, setSelectedMentorId] = React.useState(id);
  const navigate = useNavigate(); // Initialize useNavigate

  // Find the selected mentor based on the ID
  const selectedMentor = mockDataMentor.find(
    (mentor) => mentor.id === parseInt(selectedMentorId)
  );

  // Handle mentor change in the dropdown
  const handleChangeMentor = (event) => {
    setSelectedMentorId(event.target.value);
  };

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

  if (!selectedMentor) {
    return <Box>No Mentor found</Box>;
  }

  return (
    <Box m="20px">
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        {/* Back Button and Dropdown Container */}
        <Box display="flex" alignItems="center" gap="10px">
          {/* Back Button */}
          <Button
            variant="contained"
            sx={{
              backgroundColor: colors.blueAccent[500],
              color: "black",
              "&:hover": {
                backgroundColor: colors.blueAccent[800],
              },
            }}
            onClick={() => navigate("/mentors")} // Navigate back to the Mentors page
          >
            Back
          </Button>

          {/* Mentor Selection Dropdown */}
          <FormControl variant="outlined" sx={{ minWidth: 120 }}>
            <InputLabel>Select Mentor</InputLabel>
            <Select
              value={selectedMentorId}
              onChange={handleChangeMentor}
              label="Select Mentor"
            >
              {mockDataMentor.map((mentor) => (
                <MenuItem key={mentor.id} value={mentor.id}>
                  {mentor.mentorName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Page Title */}
        <Typography variant="h4" fontWeight="bold" color={colors.grey[100]}>
          {selectedMentor.mentorName} Analytics
        </Typography>
      </Box>

      {/* Performance Trend */}
      <Box
        mt="20px"
        sx={{
          backgroundColor: colors.primary[400],
          padding: "20px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Typography variant="h5" fontWeight="bold" color={colors.grey[100]}>
          Performance Trend
        </Typography>
        <Box height="250px">
          <LineChart data={mockLineData} />
        </Box>
      </Box>

      {/* Strengths and Weaknesses */}
      <Box
        mt="20px"
        sx={{
          backgroundColor: colors.primary[400],
          padding: "20px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Typography variant="h5" fontWeight="bold" color={colors.grey[100]}>
          Strengths and Weaknesses
        </Typography>
        <Box height="300px">
          <RadarChart data={mockRadarData} />
        </Box>
      </Box>
    </Box>
  );
};

export default MentorAnalytics;

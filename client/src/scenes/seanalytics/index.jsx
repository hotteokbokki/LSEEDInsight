import React, { useState, useEffect } from "react";
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
import SSEPerformanceTrendChart from "../../components/SSEPerformanceTrendChart";
import PieChart from "../../components/PieChart";
import LikertChart from "../../components/LikertChart";
import RadarChart from "../../components/RadarChart";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";

const SEAnalytics = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { id } = useParams(); // Extract the `id` from the URL
  const [selectedSEId, setSelectedSEId] = useState(id); // State to manage selected SE
  const [socialEnterprises, setSocialEnterprises] = useState([]); // List of all social enterprises
  const [selectedSE, setSelectedSE] = useState(null); // Selected social enterprise
  const [lineData, setLineData] = useState([]); // Real performance trend data
  const [pieData, setPieData] = useState([]); // Real common challenges data
  const [likertData, setLikertData] = useState([]); // Real Likert scale data
  const [radarData, setRadarData] = useState([]); // Real radar chart data
  const navigate = useNavigate(); // Initialize useNavigate

  useEffect(() => {
    const fetchSocialEnterprises = async () => {
      try {
        const response = await fetch(
          "http://localhost:4000/getAllSocialEnterprises"
        );
        const data = await response.json();

        // Format the data for the dropdown
        const formattedData = data.map((se) => ({
          id: se.se_id, // Keep as string (since UUIDs are strings)
          name: se.team_name,
        }));

        setSocialEnterprises(formattedData);

        // Debugging
        console.log("Fetched Social Enterprises:", formattedData);
        console.log("URL ID:", id);

        // Set the initial selected SE if `id` is provided
        if (id) {
          const initialSE = formattedData.find((se) => se.id === id);
          console.log("Matched SE:", initialSE);

          setSelectedSE(initialSE);
          setSelectedSEId(id);
        }
      } catch (error) {
        console.error("Error fetching social enterprises:", error);
      }
    };

    fetchSocialEnterprises();
  }, [id]);

  // Fetch analytics data for the selected social enterprise
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      // Reset all chart data before fetching new data
      setLineData([]);
      setPieData([]);
      setLikertData([]);
      setRadarData([]);

      if (!selectedSEId) return;

      try {
        // Fetch performance trend data
        const lineResponse = await fetch(
          `/api/single-se-performance/${selectedSEId}`
        );
        const lineData = await lineResponse.json();
        setLineData(lineData);

        // Fetch common challenges data
        const pieResponse = await fetch(
          `/api/common-challenges/${selectedSEId}`
        );
        const rawPieData = await pieResponse.json();
        const formattedPieData = rawPieData.map((item) => ({
          id: item.comment,
          label: `${item.percentage}%`,
          value: parseInt(item.count, 10),
          category: item.category,
        }));
        setPieData(formattedPieData);

        // Fetch Likert scale data
        const likertResponse = await fetch(`/api/likert-data/${selectedSEId}`);
        const rawLikertData = await likertResponse.json();
        setLikertData(rawLikertData);

        // Fetch radar chart data
        const radarResponse = await fetch(`/api/radar-data/${selectedSEId}`);
        const radarData = await radarResponse.json();
        if (Array.isArray(radarData)) {
          setRadarData(radarData);
        } else {
          console.error("Invalid radar data format", radarData);
        }
      } catch (error) {
        console.error("Error fetching analytics data:", error);
      }
    };

    fetchAnalyticsData();
  }, [selectedSEId]);

  const handleChangeSE = (event) => {
    const newSEId = event.target.value;
    setSelectedSEId(newSEId);

    // Find the new selected SE using strict string comparison
    const newSE = socialEnterprises.find((se) => se.id === newSEId);
    console.log("Selected SE:", newSE);

    setSelectedSE(newSE);

    // 🔥 Update the URL to reflect the selected SE
    navigate(`/se-analytics/${newSEId}`);
  };

  // If no social enterprise is found, show an error message
  if (!selectedSE && socialEnterprises.length > 0) {
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
              sx={{
                minWidth: 200, // Set a fixed minimum width
                maxWidth: 250, // Optional: Set a maximum width to prevent overflow
                height: 40, // Set a fixed height
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#fff", // White border color
                  borderWidth: "1px", // Thin border
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#fff", // White border on hover
                  borderWidth: "1px", // Maintain thin border on hover
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#fff", // White border when focused
                  borderWidth: "1px", // Maintain thin border when focused
                },
                "& .MuiSelect-select": {
                  padding: "8px", // Adjust padding for better alignment
                  fontSize: "14px", // Optional: Adjust font size for cleaner look
                  whiteSpace: "nowrap", // Prevent text wrapping
                  overflow: "hidden", // Hide overflowed text
                  textOverflow: "ellipsis", // Add ellipsis for long text
                },
              }}
            >
              {socialEnterprises.map((se) => (
                <MenuItem key={se.id} value={se.id}>
                  <Box
                    sx={{
                      whiteSpace: "nowrap", // Prevent text wrapping
                      overflow: "hidden", // Hide overflowed text
                      textOverflow: "ellipsis", // Add ellipsis for long text
                      maxWidth: 200, // Match the dropdown's max width
                    }}
                  >
                    {se.name}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        {/* Page Title */}
        <Typography variant="h4" fontWeight="bold" color={colors.grey[100]}>
          {selectedSE ? `${selectedSE.name} Analytics` : "Loading..."}
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
          <SSEPerformanceTrendChart lineData={lineData} />
        </Box>
      </Box>

      {/* Common Challenges & Performance Score */}
      <Box
        mt="20px"
        sx={{
          backgroundColor: colors.primary[400],
          padding: "20px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Typography variant="h5" fontWeight="bold" color={colors.grey[100]}>
          Common Challenges
        </Typography>
        <Box
          height="250px"
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
          {pieData.length === 0 ? (
            <Typography variant="h6" color={colors.grey[300]}>
              No common challenges found.
            </Typography>
          ) : (
            <PieChart data={pieData} />
          )}
        </Box>
      </Box>
      {/* Performance Score */}
      <Box
        mt="20px"
        sx={{
          backgroundColor: colors.primary[400],
          padding: "20px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Typography variant="h5" fontWeight="bold" color={colors.grey[100]}>
          Performance Score
        </Typography>
        <Box
          height="250px"
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
          {likertData.length === 0 ? (
            <Typography variant="h6" color={colors.grey[300]}>
              No performance ratings available.
            </Typography>
          ) : (
            <LikertChart data={likertData} />
          )}
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
          {radarData.length === 0 ? (
            <Typography variant="h6" color={colors.grey[300]}>
              Performance Overview Unavailable.
            </Typography>
          ) : (
            <RadarChart radarData={radarData} />
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
            width: "2/12",
            maxWidth: "150px",
          }}
          onClick={() => navigate("/socialenterprise")}
        >
          Back
        </Button>
      </Box>
    </Box>
  );
};

export default SEAnalytics;

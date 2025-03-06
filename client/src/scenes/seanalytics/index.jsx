import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { tokens } from "../../theme";
import SSEPerformanceTrendChart from "../../components/SSEPerformanceTrendChart";
import PieChart from "../../components/PieChart";
import LikertChart from "../../components/LikertChart";
import RadarChart from "../../components/RadarChart";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import { DataGrid } from "@mui/x-data-grid";

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
  const [isLoadingEvaluations, setIsLoadingEvaluations] = useState(false);
  const [evaluationsData, setEvaluationsData] = useState([]);
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
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
          `http://localhost:4000/api/single-se-performance/${selectedSEId}`
        );
        const lineData = await lineResponse.json();
        setLineData(lineData);

        // Fetch common challenges data
        const pieResponse = await fetch(
          `http://localhost:4000/api/common-challenges/${selectedSEId}`
        );
        const rawPieData = await pieResponse.json();

        // ✅ Ensure unique IDs and remove duplicates by category
        const formattedPieData = Array.from(
          new Map(
            rawPieData.map((item, index) => [
              item.category || `Unknown-${index}`, // ✅ Unique key per category
              {
                id: item.category || `Unknown-${index}`, // ✅ Category as the unique ID
                label:
                  item.percentage && !isNaN(item.percentage)
                    ? `${parseInt(item.percentage, 10)}%`
                    : "0%",
                value:
                  item.count && !isNaN(item.count) ? parseInt(item.count, 10) : 0,
                comment: item.comment || "No comment available", // ✅ Keep comment for tooltip
              },
            ])
          ).values()
        );

        console.log("Formatted Pie Data:", formattedPieData);
       
        formattedPieData.forEach((item, index) => {
          if (isNaN(item.value)) {
            console.error(`NaN detected in value at index ${index}:`, item);
          }
        });
        
        setPieData(formattedPieData);

        // Fetch Likert scale data
        const likertResponse = await fetch(`http://localhost:4000/api/likert-data/${selectedSEId}`);
        const rawLikertData = await likertResponse.json();
        setLikertData(rawLikertData);

        // Fetch radar chart data
        const radarResponse = await fetch(`http://localhost:4000/api/radar-data/${selectedSEId}`);
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

  useEffect(() => {
    const fetchEvaluations = async () => {
      try {
        setIsLoadingEvaluations(true);
  
        const response = await axios.get(
          "http://localhost:4000/getMentorEvaluationsBySEID",
          {
            params: { se_id: id },
          }
        );
  
        // Ensure evaluation_id is included and set as `id`
        const formattedData = response.data.map((evaluation) => ({
          id: evaluation.evaluation_id, // Use evaluation_id as the unique ID
          evaluation_id: evaluation.evaluation_id, // Explicitly include evaluation_id
          evaluator_name: evaluation.evaluator_name,
          social_enterprise: evaluation.social_enterprise,
          evaluation_date: new Date(
            evaluation.evaluation_date
          ).toLocaleDateString(),
          acknowledged: evaluation.acknowledged ? "Yes" : "No",
        }));
  
        console.log("✅ Formatted EvaluationsData:", formattedData); // Debugging
        setEvaluationsData(formattedData);
      } catch (error) {
        console.error("❌ Error fetching evaluations:", error);
      } finally {
        setIsLoadingEvaluations(false);
      }
    };
  
    if (id) {
      fetchEvaluations();
    }
  }, [id]); // ✅ Add id as a dependency

  const columns = [
    { field: "social_enterprise", headerName: "Social Enterprise", flex: 1 },
    { field: "evaluator_name", headerName: "Evaluator", flex: 1 },
    { field: "acknowledged", headerName: "Acknowledged", flex: 1 },
    { field: "evaluation_date", headerName: "Evaluation Date", flex: 1 },
    {
      field: "action",
      headerName: "Action",
      flex: 1,
      renderCell: (params) => (
        <Button
          variant="contained"
          style={{ backgroundColor: colors.primary[600], color: "white" }}
          onClick={() => handleViewExistingEvaluation(params.row.evaluation_id)} // Pass only evaluation_id
        >
          View
        </Button>
      ),
    },
  ];

  const handleViewExistingEvaluation = async (evaluation_id) => {
    console.log("📌 Evaluation ID Passed:", evaluation_id); // Debugging log

    try {
      const response = await axios.get(
        "http://localhost:4000/getEvaluationDetails",
        {
          params: { evaluation_id },
        }
      );

      console.log("📥 Raw API Response:", response); // Log raw response
      console.log("📥 API Response Data:", response.data); // Log parsed response

      if (!response.data || response.data.length === 0) {
        console.warn("⚠️ No evaluation details found.");
        return;
      }

      // Process evaluation details
      const groupedEvaluation = response.data.reduce((acc, evalItem) => {
        const {
          evaluation_date,
          social_enterprise,
          category_name,
          star_rating,
          selected_comments,
          additional_comment,
        } = evalItem;

        if (!acc.id) {
          acc.id = evaluation_id;
          acc.social_enterprise = social_enterprise;
          acc.evaluation_date = new Date(evaluation_date).toLocaleDateString();
          acc.categories = [];
        }

        acc.categories.push({
          category_name,
          star_rating,
          selected_comments: Array.isArray(selected_comments)
            ? selected_comments
            : [], // Ensure selected_comments is always an array
          additional_comment,
        });

        return acc;
      }, {});

      console.log("✅ Processed Evaluation Data:", groupedEvaluation);
      setSelectedEvaluation(groupedEvaluation);
      setOpenDialog(true);
    } catch (error) {
      console.error("❌ Error fetching evaluation details:", error);
    }
  };

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

      {/* Evaluations Table */}
      <Box
        flexGrow={1}
        height="auto"
        sx={{
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          "& .MuiDataGrid-root": { border: "none" },
          "& .MuiDataGrid-cell": { borderBottom: "none" },
          "& .name-column--cell": { color: colors.greenAccent[300] },
          "& .MuiDataGrid-columnHeaders, & .MuiDataGrid-columnHeader": {
              backgroundColor: colors.blueAccent[700] + " !important",
          },
          "& .MuiDataGrid-virtualScroller": {
            backgroundColor: colors.primary[400],
          },
          "& .MuiDataGrid-footerContainer": {
            borderTop: "none",
            backgroundColor: colors.blueAccent[700],
          },
        }}
      >
        <DataGrid
          autoHeight
          rows={evaluationsData}
          columns={columns}
          getRowId={(row) => row.id}
        />
      </Box>

      {/* Evaluation Details Dialog - Read-Only */}
      <Dialog
          open={openDialog}
          onClose={() => setOpenDialog(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            style: {
              backgroundColor: "#fff", // White background
              color: "#000", // Black text
              border: "1px solid #000", // Black border for contrast
            },
          }}
        >
          {/* Title with DLSU Green Background */}
          <DialogTitle
            sx={{
              backgroundColor: "#1E4D2B", // DLSU Green header
              color: "#fff", // White text
              textAlign: "center",
              fontSize: "1.5rem",
              fontWeight: "bold",
            }}
          >
            View Evaluation
          </DialogTitle>

          {/* Content Section */}
          <DialogContent
            sx={{
              padding: "24px",
              maxHeight: "70vh", // Ensure it doesn't overflow the screen
              overflowY: "auto", // Enable scrolling if content is too long
            }}
          >
            {selectedEvaluation ? (
              <>
                {/* Social Enterprise and Evaluation Date */}
                <Box
                  sx={{
                    marginBottom: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: "bold",
                      borderBottom: "1px solid #000", // Separator line
                      paddingBottom: "8px",
                    }}
                  >
                    Social Enterprise: {selectedEvaluation.social_enterprise}
                  </Typography>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      color: "#000",
                    }}
                  >
                    Evaluation Date: {selectedEvaluation.evaluation_date}
                  </Typography>
                </Box>

                {/* Categories Section */}
                {selectedEvaluation.categories &&
                selectedEvaluation.categories.length > 0 ? (
                  selectedEvaluation.categories.map((category, index) => (
                    <Box
                      key={index}
                      sx={{
                        marginBottom: "24px",
                        padding: "16px",
                        border: "1px solid #000", // Border for each category
                        borderRadius: "8px",
                      }}
                    >
                      {/* Category Name and Rating */}
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: "bold",
                          marginBottom: "8px",
                        }}
                      >
                        {category.category_name} - Rating:{" "}
                        {category.star_rating} ★
                      </Typography>

                      {/* Selected Comments */}
                      <Typography
                        variant="body1"
                        sx={{
                          marginBottom: "8px",
                        }}
                      >
                        Comments:{" "}
                        {category.selected_comments.length > 0 ? (
                          category.selected_comments.join(", ")
                        ) : (
                          <i>No comments</i>
                        )}
                      </Typography>

                      {/* Additional Comment */}
                      <Typography variant="body1">
                        Additional Comment:{" "}
                        {category.additional_comment || (
                          <i>No additional comments</i>
                        )}
                      </Typography>
                    </Box>
                  ))
                ) : (
                  <Typography
                    variant="body1"
                    sx={{
                      fontStyle: "italic",
                    }}
                  >
                    No categories found for this evaluation.
                  </Typography>
                )}
              </>
            ) : (
              <Typography
                variant="body1"
                sx={{
                  fontStyle: "italic",
                }}
              >
                Loading evaluation details...
              </Typography>
            )}
          </DialogContent>

          {/* Action Buttons */}
          <DialogActions
            sx={{
              padding: "16px",
              borderTop: "1px solid #000", // Separator line
            }}
          >
            <Button
              onClick={() => setOpenDialog(false)}
              sx={{
                color: "#000",
                border: "1px solid #000",
                "&:hover": {
                  backgroundColor: "#f0f0f0", // Hover effect
                },
              }}
            >
              Close
            </Button>
          </DialogActions>
      </Dialog>

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
          Recurring Issues
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
          onClick={() => navigate(-1)}
        >
          Back
        </Button>
      </Box>
    </Box>
  );
};

export default SEAnalytics;

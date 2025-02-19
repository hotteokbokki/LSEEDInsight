import React, { useState, useEffect, useRef} from "react";
import axios from "axios";
import {
  Box,
  Button,
  Typography,
  useTheme,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Checkbox,
  FormControlLabel,
  Alert,
  Skeleton,
} from "@mui/material";
import { tokens } from "../../theme";
import { DataGrid } from "@mui/x-data-grid";
import Header from "../../components/Header";

const AssessSEPage = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [openSelectDialog, setOpenSelectDialog] = useState(false); // For SE selection dialog
  const [openEvaluateDialog, setOpenEvaluateDialog] = useState(false); // For evaluation dialog
  const dialogContentRef = useRef(null); // Ref for the dialog content
  const [selectedSEs, setSelectedSEs] = useState([]); // Selected SEs for evaluation
  const [currentSEIndex, setCurrentSEIndex] = useState(0); // Index of the current SE being evaluated
  const [evaluations, setEvaluations] = useState({}); // Store evaluations for all SEs
  const [error, setError] = useState("");
  const [socialEnterprises, setSocialEnterprises] = useState([]);
  const [evaluationCriteria, setEvaluationCriteria] = useState({});
  const [columns, setColumns] = useState([]);
  const userSession = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const fetchPredefinedComments = async () => {
      try {
        const response = await axios.get("http://localhost:4000/getPreDefinedComments");
        setEvaluationCriteria(response.data); // Store fetched data in state
        console.log("📥 Predefined Comments Fetched:", response.data);
      } catch (error) {
        console.error("❌ Error fetching predefined comments:", error);
      }
    };
  
    fetchPredefinedComments();
  }, []);

  const handleSESelectionChange = (seId) => {
    setSelectedSEs((prev) =>
      prev.includes(seId) ? prev.filter((id) => id !== seId) : [...prev, seId]
    );
  };

  // Open the SE selection dialog
  const handleOpenSelectDialog = () => {
    setOpenSelectDialog(true);
  };

  // Close the SE selection dialog
  const handleCloseSelectDialog = () => {
    setOpenSelectDialog(false);
  };

  // Start evaluation after SE selection
  const handleStartEvaluation = () => {
    if (selectedSEs.length === 0) {
      setError("Please select at least one Social Enterprise to evaluate.");
      return;
    }
    setError("");
    setCurrentSEIndex(0);
    setOpenSelectDialog(false);
    setOpenEvaluateDialog(true);
  };

  // Handle rating change for the current SE
  const handleRatingChange = (category, value) => {
    const currentSEId = selectedSEs[currentSEIndex];
  
    setEvaluations((prev) => ({
      ...prev,
      [currentSEId]: {
        ...prev[currentSEId],
        [category]: {
          rating: value,
          selectedCriteria: [],
          predefinedComments: evaluationCriteria[category]?.[value] || [],
        },
      },
    }));
  };
  

  // Handle predefined criteria selection for the current SE
  const handleCriteriaChange = (category, criterion) => {
    const currentSEId = selectedSEs[currentSEIndex];
    setEvaluations((prev) => ({
      ...prev,
      [currentSEId]: {
        ...prev[currentSEId],
        [category]: {
          ...prev[currentSEId]?.[category],
          selectedCriteria: prev[currentSEId]?.[
            category
          ]?.selectedCriteria.includes(criterion)
            ? prev[currentSEId][category].selectedCriteria.filter(
                (c) => c !== criterion
              )
            : [...prev[currentSEId][category].selectedCriteria, criterion],
        },
      },
    }));
    setError("");
  };

  // Handle additional comments change for the current SE
  const handleCommentsChange = (category, value) => {
    const currentSEId = selectedSEs[currentSEIndex];
    setEvaluations((prev) => ({
      ...prev,
      [currentSEId]: {
        ...prev[currentSEId],
        [category]: {
          ...prev[currentSEId]?.[category],
          comments: value,
        },
      },
    }));
  };

  useEffect(() => {
    const fetchSocialEnterprises = async () => {
      try {
        // Step 1: Fetch mentorships for the current mentor
        const mentorshipsResponse = await axios.get("http://localhost:4000/getMentorshipsbyID", {
          params: { mentor_id: userSession.id },
        });
        console.log("📥 Mentorship Response:", mentorshipsResponse.data);
  
        // Step 2: Map data directly from mentorshipsResponse to updatedSocialEnterprises
        const updatedSocialEnterprises = mentorshipsResponse.data.map((se) => ({
          id: se.id,  // Unique ID for each row
          mentor_id: se.mentor_id,
          se_id: se.se_id,
          team_name: se.se || "Unknown Team",  // Social enterprise name
          mentor_name: se.mentor || "No Mentor Assigned",  // Mentor name
          program_name: se.program || "Unknown Program",  // Program name
          sdg_name: se.sdg || "No SDG Name",  // SDG name
        }));
  
        // Step 3: Define dynamic columns
        const dynamicColumns = [
          { field: "team_name", headerName: "Social Enterprise", flex: 1 },
          { field: "mentor_name", headerName: "Assigned Mentor", flex: 1 },
          { field: "program_name", headerName: "Program Name", flex: 1 },
          { field: "sdg_name", headerName: "SDG(s)", flex: 1 },
        ];
  
        // Step 4: Update state
        setColumns(dynamicColumns);
        setSocialEnterprises(updatedSocialEnterprises);
      } catch (error) {
        console.error("❌ Error fetching data:", error);
      }
    };
  
    fetchSocialEnterprises();
  }, [userSession.id]);

  // Scroll to the top of the dialog when it opens
  useEffect(() => {
    if (openEvaluateDialog && dialogContentRef.current) {
      dialogContentRef.current.scrollTop = 0; // Scroll to the top
    }
  }, [openEvaluateDialog]);
  
  const handleSubmit = async () => {
    const currentSEId = selectedSEs[currentSEIndex];
    const currentEvaluations = evaluations[currentSEId];
    const getValidRating = (rating) => (rating && rating >= 1 && rating <= 5 ? rating : 1);
  
    if (!userSession || !userSession.id) {
      console.error("❌ User session not found.");
      alert("Error: User session not found.");
      return;
    }
  
    const selectedSE = socialEnterprises.find((se) => se.se_id === currentSEId);
    if (!selectedSE) {
      console.error("❌ Selected SE not found.");
      alert("Error: Selected Social Enterprise not found.");
      return;
    }
  
    const mentorId = selectedSE.mentor_id;
    if (!mentorId) {
      console.error("❌ ERROR: mentorId is missing!");
      return;
    }
  
    const sdgIds = Array.isArray(selectedSE.sdg_id) ? selectedSE.sdg_id : [selectedSE.sdg_id];
  
    // Validation: Ensure every category has a rating and at least one predefined comment
    const isValid = Object.values(currentEvaluations || {}).every(
      (categoryEval) => categoryEval.rating > 0 && categoryEval.selectedCriteria?.length > 0
    );
  
    if (!isValid) {
      setError("Please provide a rating and select at least one predefined comment for each category.");
      return;
    }
  
    console.log("This is the se_id: ", currentSEId);
  
    const formData = {
      evaluatorId: userSession.id,
      se_id: [currentSEId],
      mentorId: mentorId,
      evaluations: currentEvaluations,
      sdg_id: sdgIds,
    };
  
    Object.keys(currentEvaluations).forEach((category) => {
      formData[`${category}_rating`] = getValidRating(currentEvaluations[category]?.rating);
      formData[`${category}_selectedcriteria`] = currentEvaluations[category]?.selectedCriteria || [];
      formData[`${category}_addtlcmt`] = currentEvaluations[category]?.comments || "";
    });
  
    console.log("📤 Sending Evaluation to Backend:", formData);
  
    try {
      await axios.post("http://localhost:4000/evaluate", formData);
  
      if (currentSEIndex < selectedSEs.length - 1) {
        setCurrentSEIndex((prevIndex) => prevIndex + 1); // Move to the next SE
        setTimeout(() => {
          if (dialogContentRef.current) {
            dialogContentRef.current.scrollTop = 0; // Scroll to top after transition
          }
        }, 100);
      } else {
        console.log("✅ All SEs have been evaluated.");
        handleCloseEvaluateDialog();
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' }); // Ensure full reset to the top
        }, 200);
      }
    } catch (error) {
      console.error("❌ Error submitting evaluations:", error);
    }
  };

  // Disable submit button unless all required fields are completed
  const isSubmitDisabled = () => {
    const currentSEId = selectedSEs[currentSEIndex];
    const currentEvaluations = evaluations[currentSEId] || {};
    return !Object.values(currentEvaluations).every(
      (categoryEval) => categoryEval.rating > 0 && categoryEval.selectedCriteria?.length > 0
    );
  };
  
  // Close the evaluation dialog
  const handleCloseEvaluateDialog = () => {
    setOpenEvaluateDialog(false);
    setSelectedSEs([]);
    setCurrentSEIndex(0);
    setEvaluations({});
  };

  if (!columns.length) {
    return (
      <Box sx={{ padding: "16px" }}>
        {/* Placeholder for Buttons */}
        <Box sx={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
          <Skeleton variant="rectangular" width={120} height={40} />
          <Skeleton variant="rectangular" width={120} height={40} />
        </Box>
  
        {/* Placeholder for DataGrid Rows */}
        {[1, 2, 3, 4, 5].map((rowIndex) => (
          <Box
            key={rowIndex}
            sx={{
              display: "flex",
              gap: "16px",
              marginBottom: "8px",
            }}
          >
            <Skeleton variant="rectangular" width={200} height={40} /> {/* Social Enterprise */}
            <Skeleton variant="rectangular" width={150} height={40} /> {/* Assigned Mentor */}
            <Skeleton variant="rectangular" width={150} height={40} /> {/* Program Name */}
            <Skeleton variant="rectangular" width={100} height={40} /> {/* SDG(s) */}
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <Box m="20px">
      <Header title="ASSESS SE" subtitle="Evaluate and manage SE performance" />
      <Box display="flex" flexDirection="column" alignItems="center" gap={4}>
        {/* Buttons */}
        <Box
          width="80%"
          p={3}
          bgcolor={colors.primary[400]}
          display="flex"
          justifyContent="space-between"
        >
          <Button
            variant="contained"
            color="secondary"
            sx={{ fontSize: "20px", padding: "20px", width: "48%" }}
            onClick={handleOpenSelectDialog}
          >
            Evaluate SE
          </Button>
          <Button
            variant="contained"
            color="secondary"
            sx={{ fontSize: "20px", padding: "20px", width: "48%" }}
          >
            Mentorship Assessment 
          </Button>
        </Box>

        {/* DataGrid */}
        <Box
          width="80%"
          height="250px"
          sx={{
            "& .MuiDataGrid-root": { border: "none" },
            "& .MuiDataGrid-cell": { borderBottom: "none" },
            "& .name-column--cell": { color: colors.greenAccent[300] },
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: colors.blueAccent[700],
              borderBottom: "none",
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
          rows={socialEnterprises} // Ensure this array contains the result from the query
          columns={columns}
          getRowId={(row) => row.id} // Use the 'id' from the query result
        />
        </Box>

        {/* SE Selection Dialog */}
        <Dialog
          open={openSelectDialog}
          onClose={handleCloseSelectDialog}
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
          <DialogTitle
            sx={{
              backgroundColor: "#1E4D2B", // DLSU Green header
              color: "#fff", // White text
              textAlign: "center",
              fontSize: "1.5rem",
              fontWeight: "bold",
            }}
          >
            Select Social Enterprises for Evaluation
          </DialogTitle>
          <DialogContent>
          {socialEnterprises.map((se) => (
            <FormControlLabel
              key={se.se_id}
              control={
                <Checkbox
                  checked={selectedSEs.includes(se.se_id)} // Use se_id here
                  onChange={() => handleSESelectionChange(se.se_id)} // Pass se_id
                  sx={{
                    color: "#000",
                    "&.Mui-checked": { color: "#000" },
                  }}
                />
              }
              label={`${se.team_name} [SDG: ${se.sdg_name}]`}
              sx={{ marginBottom: "8px" }}
            />
          ))}
            {error && <Alert severity="error">{error}</Alert>}
          </DialogContent>

          <DialogActions
            sx={{
              padding: "16px",
              borderTop: "1px solid #000", // Separator line
            }}
          >
            <Button
              onClick={handleCloseSelectDialog}
              sx={{
                color: "#000",
                border: "1px solid #000",
                "&:hover": {
                  backgroundColor: "#f0f0f0", // Hover effect
                },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleStartEvaluation}
              variant="contained"
              sx={{
                backgroundColor: "#1E4D2B",
                color: "#fff",
                "&:hover": {
                  backgroundColor: "#1E4D2B",
                },
              }}
            >
              Start Evaluation
            </Button>
          </DialogActions>
        </Dialog>

        {/* Evaluation Dialog */}
        <Dialog
          open={openEvaluateDialog}
          onClose={handleCloseEvaluateDialog}
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
          {/* Top Portion with DLSU Green Background */}
          <DialogTitle
            sx={{
              backgroundColor: "#1E4D2B", // DLSU Green header
              color: "#fff", // White text
              textAlign: "center",
              fontSize: "1.5rem",
              fontWeight: "bold",
            }}
          >
            Evaluate Social Enterprise
          </DialogTitle>

          <DialogContent
            sx={{
              padding: "24px",
              maxHeight: "70vh", // Ensure it doesn't overflow the screen
              overflowY: "auto", // Enable scrolling if content is too long
            }}
          >
            {/* Current SE Name */}
            <Typography
              variant="h6"
              sx={{
                marginBottom: "16px",
                fontWeight: "bold",
                borderBottom: "1px solid #000", // Separator line
                paddingBottom: "8px",
                paddingTop: "8px",
              }}
            >
              {
                socialEnterprises.find(
                  (se) => se.se_id === selectedSEs[currentSEIndex]
                )?.team_name
              }
            </Typography>

            <Typography variant="h6" sx={{ textAlign: "center", marginBottom: "16px" }}>
              Evaluating {currentSEIndex + 1} / {selectedSEs.length}
            </Typography>;

            {/* Evaluation Categories */}
            {Object.keys(evaluationCriteria).map((category) => {
              const currentSEId = selectedSEs[currentSEIndex];
              const categoryEval = evaluations[currentSEId]?.[category] || {
                rating: 0,
                selectedCriteria: [],
                comments: "",
              };

              return (
                <Box
                  key={category}
                  sx={{
                    marginBottom: "24px",
                    padding: "16px",
                    border: "1px solid #000", // Border for each category
                  }}
                >
                  {/* Category Title */}
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: "bold",
                      marginBottom: "8px",
                    }}
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Typography>

                  {/* Star Rating Selection (Reverted to Original Style) */}
                  <Box display="flex" gap={1} justifyContent="center" mt={1}>
                    {[1, 2, 3, 4, 5].map((value) => (
                      <Box
                        key={value}
                        width="40px"
                        height="40px"
                        border="1px solid black"
                        display="flex"
                        justifyContent="center"
                        alignItems="center"
                        bgcolor={
                          value <= categoryEval.rating
                            ? "#FFEE8C"
                            : "transparent"
                        }
                        sx={{ cursor: "pointer" }}
                        onClick={() => handleRatingChange(category, value)}
                      >
                        <Typography fontSize="24px">★</Typography>
                      </Box>
                    ))}
                  </Box>

                  {/* Predefined Evaluation Criteria (Only If Rating > 0) */}
                  {categoryEval.rating > 0 && (
                    <Box
                      sx={{
                        maxHeight: "150px",
                        overflowY: "auto",
                        mt: 2,
                        p: 1,
                        border: "1px solid #ccc",
                        borderRadius: "5px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                      }}
                    >
                      {categoryEval.predefinedComments.length > 0 ? (
                        categoryEval.predefinedComments.map((criterion, index) => (
                          <FormControlLabel
                            key={index}
                            control={
                              <Checkbox
                                checked={categoryEval.selectedCriteria?.includes(criterion)}
                                onChange={() => handleCriteriaChange(category, criterion)}
                                sx={{
                                  color: "#000",
                                  "&.Mui-checked": {
                                    color: "#000",
                                  },
                                }}
                              />
                            }
                            label={criterion}
                            sx={{
                              marginBottom: "4px",
                            }}
                          />
                        ))
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          Loading predefined comments...
                        </Typography>
                      )}
                    </Box>
                  )}

                  <TextField
                    label="Additional Comments"
                    value={categoryEval.comments}
                    onChange={(e) =>
                      handleCommentsChange(category, e.target.value)
                    }
                    variant="outlined"
                    fullWidth
                    multiline
                    rows={3}
                    sx={{
                      marginTop: "8px",
                      "& .MuiOutlinedInput-root": {
                        border: "1px solid #000", // Apply border only to input field
                        borderRadius: "4px", // Rounded corners
                        "&:hover": {
                          borderColor: "#000",
                        },
                        "&.Mui-focused": {
                          borderColor: "#000",
                        },
                      },
                      "& .MuiInputBase-root": {
                        padding: "8px",
                      },
                      "& .MuiInputBase-input": {
                        color: "#000",
                        lineHeight: "1.5",
                        textDecoration: "none",
                      },
                      "& .MuiInputLabel-root": {
                        color: "#000",
                        backgroundColor: "#fff", // Add background to prevent line through label
                        padding: "0 4px", // Small padding to keep it readable
                      },
                      "& .MuiInputLabel-root.Mui-focused": {
                        color: "#000",
                      },
                    }}
                  />
                </Box>
              );
            })}
          </DialogContent>

          {/* Error Message */}
          {error && (
            <Alert severity="error" sx={{ margin: "16px" }}>
              {error}
            </Alert>
          )}

          {/* Action Buttons */}
          <DialogActions
            sx={{
              padding: "16px",
              borderTop: "1px solid #000", // Separator line
            }}
          >
            <Button
              onClick={handleCloseEvaluateDialog}
              sx={{
                color: "#000",
                border: "1px solid #000",
                "&:hover": {
                  backgroundColor: "#f0f0f0", // Hover effect
                },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={isSubmitDisabled()}
              sx={{
                backgroundColor: isSubmitDisabled() ? "#ccc" : "#1E4D2B",
                color: "#fff",
                '&:hover': {
                  backgroundColor: isSubmitDisabled() ? "#ccc" : "#145A32",
                },
              }}
            >
              Submit
            </Button>;
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default AssessSEPage;

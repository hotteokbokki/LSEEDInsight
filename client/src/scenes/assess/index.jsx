import React, { useState, useEffect, useRef } from "react";
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
  const [isLoadingSocialEnterprises, setIsLoadingSocialEnterprises] = useState(false);
  const [isLoadingEvaluations, setIsLoadingEvaluations] = useState(false);
  const [evaluationsData, setEvaluationsData] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
  const [socialEnterprises, setSocialEnterprises] = useState([]);
  const [evaluationCriteria, setEvaluationCriteria] = useState({});
  const userSession = JSON.parse(localStorage.getItem("user"));
  const [openMentorshipDialog, setOpenMentorshipDialog] = useState(false); // For Mentorship Assessment dialog
  const [programs, setPrograms] = useState([]); // List of programs
  const [selectedPrograms, setSelectedPrograms] = useState([]); // Selected programs
  const [isLoadingPrograms, setIsLoadingPrograms] = useState(false);

  const handleProgramSelectionChange = (programId) => {
    setSelectedPrograms(
      (prev) =>
        prev.includes(programId)
          ? prev.filter((id) => id !== programId) // Deselect
          : [...prev, programId] // Select
    );
  };

  const handleSubmitEvaluations = async () => {
    if (!selectedPrograms.length) {
      console.error("❌ ERROR: No programs selected!");
      return;
    }

    try {
      console.log("📤 Submitting evaluations for programs:", selectedPrograms);

      await axios.post("http://localhost:4000/evaluate-mentor", {
        programs: selectedPrograms, // Send selected program IDs
      });

      console.log("✅ Evaluation Submitted Successfully!");
    } catch (error) {
      console.error(
        "❌ Error submitting mentor evaluation:",
        error.response?.data || error.message
      );
    } finally {
      handleCloseMentorshipDialog();
    }
  };

  const handleOpenMentorshipDialog = () => {
    setOpenMentorshipDialog(true);
  };

  const handleCloseMentorshipDialog = () => {
    setOpenMentorshipDialog(false);
    setSelectedPrograms([]); // Reset selected programs when closing
  };

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        setIsLoadingPrograms(true);
        const response = await axios.get("http://localhost:4000/getPrograms");
        setPrograms(response.data); // Store fetched programs in state
      } catch (error) {
        console.error("❌ Error fetching programs:", error);
      } finally {
        setIsLoadingPrograms(false);
      }
    };

    if (openMentorshipDialog) {
      fetchPrograms();
    }
  }, [openMentorshipDialog]);

  useEffect(() => {
    const fetchPredefinedComments = async () => {
      try {
        const response = await axios.get(
          "http://localhost:4000/getPreDefinedComments"
        );
        setEvaluationCriteria(response.data); // Store fetched data in state
        console.log("📥 Predefined Comments Fetched:", response.data);
      } catch (error) {
        console.error("❌ Error fetching predefined comments:", error);
      }
    };

    fetchPredefinedComments();
  }, []);

  useEffect(() => {
    const fetchEvaluations = async () => {
      try {
        setIsLoadingEvaluations(true);

        const response = await axios.get(
          "http://localhost:4000/getMentorEvaluations",
          {
            params: { mentor_id: userSession.id },
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

    fetchEvaluations();
  }, [userSession.id]);

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
        setIsLoadingSocialEnterprises(true); // Start loading

        const mentorshipsResponse = await axios.get(
          "http://localhost:4000/getMentorshipsbyID",
          {
            params: { mentor_id: userSession.id },
          }
        );
        console.log("📥 Mentorship Response:", mentorshipsResponse.data);

        const updatedSocialEnterprises = mentorshipsResponse.data.map((se) => ({
          id: se.id,
          mentor_id: se.mentor_id,
          se_id: se.se_id,
          team_name: se.se || "Unknown Team",
          mentor_name: se.mentor || "No Mentor Assigned",
          program_name: se.program || "Unknown Program",
          sdg_name: se.sdgs || "No SDG Name",
        }));

        setSocialEnterprises(updatedSocialEnterprises);
      } catch (error) {
        console.error("❌ Error fetching data:", error);
      } finally {
        setIsLoadingSocialEnterprises(false); // Stop loading
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
    const getValidRating = (rating) =>
      rating && rating >= 1 && rating <= 5 ? rating : 1;

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

    const sdgIds = Array.isArray(selectedSE.sdg_id)
      ? selectedSE.sdg_id
      : [selectedSE.sdg_id];

    // Validation: Ensure every category has a rating and at least one predefined comment
    const isValid = Object.values(currentEvaluations || {}).every(
      (categoryEval) =>
        categoryEval.rating > 0 && categoryEval.selectedCriteria?.length > 0
    );

    if (!isValid) {
      setError(
        "Please provide a rating and select at least one predefined comment for each category."
      );
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
      formData[`${category}_rating`] = getValidRating(
        currentEvaluations[category]?.rating
      );
      formData[`${category}_selectedcriteria`] =
        currentEvaluations[category]?.selectedCriteria || [];
      formData[`${category}_addtlcmt`] =
        currentEvaluations[category]?.comments || "";
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
          window.scrollTo({ top: 0, behavior: "smooth" }); // Ensure full reset to the top
        }, 200);
      }
    } catch (error) {
      console.error("❌ Error submitting evaluations:", error);
    }
  };

  const isSubmitDisabled = () => {
    const currentSEId = selectedSEs[currentSEIndex];
    const currentEvaluations = evaluations[currentSEId] || {};

    // Ensure every category meets the conditions
    const allCategoriesValid = Object.keys(evaluationCriteria).every(
      (category) => {
        const categoryEval = currentEvaluations[category] || {};
        return (
          categoryEval.rating > 0 &&
          (categoryEval.selectedCriteria?.length || 0) >= 1
        );
      }
    );

    return !allCategoriesValid; // Disable if any category is invalid
  };

  // Close the evaluation dialog
  const handleCloseEvaluateDialog = () => {
    setOpenEvaluateDialog(false);
    setSelectedSEs([]);
    setCurrentSEIndex(0);
    setEvaluations({});
  };

  {
    isLoadingSocialEnterprises ? (
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
            <Skeleton variant="rectangular" width={200} height={40} />{" "}
            {/* Social Enterprise */}
            <Skeleton variant="rectangular" width={150} height={40} />{" "}
            {/* Assigned Mentor */}
            <Skeleton variant="rectangular" width={150} height={40} />{" "}
            {/* Program Name */}
            <Skeleton variant="rectangular" width={100} height={40} />{" "}
            {/* SDG(s) */}
          </Box>
        ))}
      </Box>
    ) : socialEnterprises.length === 0 ? (
      <Box sx={{ padding: "16px", textAlign: "center" }}>
        <Typography variant="body1" color="white">
          No records found.
        </Typography>
      </Box>
    ) : (
      <DataGrid
        rows={evaluationsData}
        columns={columns}
        getRowId={(row) => row.evaluation_id} // Ensure evaluation_id is used as ID
      />
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
            onClick={handleOpenMentorshipDialog}
            variant="contained"
            color="secondary"
            sx={{ fontSize: "20px", padding: "20px", width: "48%" }}
          >
            Mentorship Assessment
          </Button>
        </Box>

        {/* Mentorship Assessment Dialog */}
        <Dialog
          open={openMentorshipDialog}
          onClose={handleCloseMentorshipDialog}
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
            Select Programs for Evaluation
          </DialogTitle>
          <DialogContent
            sx={{
              display: "flex",
              flexDirection: "column", // Ensure vertical stacking
              gap: "8px", // Add spacing between items
            }}
          >
            {isLoadingPrograms ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {[1, 2, 3].map((index) => (
                  <Skeleton key={index} variant="rectangular" height={40} />
                ))}
              </Box>
            ) : programs.length === 0 ? (
              <Typography>No programs found.</Typography>
            ) : (
              programs.map((program) => (
                <FormControlLabel
                  key={program.id}
                  control={
                    <Checkbox
                      checked={selectedPrograms.includes(program.id)}
                      onChange={() => handleProgramSelectionChange(program.id)}
                      sx={{
                        color: "#000",
                        "&.Mui-checked": { color: "#000" },
                      }}
                    />
                  }
                  label={program.name}
                  sx={{
                    display: "flex", // Ensure label and checkbox align properly
                    alignItems: "center", // Align checkbox and text vertically
                    marginBottom: "8px", // Add spacing between entries
                  }}
                />
              ))
            )}
            {error && <Alert severity="error">{error}</Alert>}
          </DialogContent>
          <DialogActions
            sx={{
              padding: "16px",
              borderTop: "1px solid #000", // Separator line
            }}
          >
            <Button
              onClick={handleCloseMentorshipDialog}
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
              onClick={handleSubmitEvaluations}
              variant="contained"
              disabled={selectedPrograms.length === 0}
              sx={{
                backgroundColor:
                  selectedPrograms.length > 0 ? "#1E4D2B" : "#A0A0A0", // Change color if disabled
                color: "#fff",
                "&:hover": {
                  backgroundColor:
                    selectedPrograms.length > 0 ? "#145A32" : "#A0A0A0",
                },
              }}
            >
              Send Evaluations
            </Button>
          </DialogActions>
        </Dialog>

        {/* DataGrid */}
        <Box
          width="80%"
          height="250px"
          sx={{
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
            rows={evaluationsData}
            columns={columns}
            getRowId={(row) => row.id}
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
              disabled={selectedSEs.length === 0} // 🔥 Disable if no SE is selected
              sx={{
                backgroundColor: selectedSEs.length > 0 ? "#1E4D2B" : "#A0A0A0", // Change color if disabled
                color: "#fff",
                "&:hover": {
                  backgroundColor:
                    selectedSEs.length > 0 ? "#145A32" : "#A0A0A0",
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

          {/* Content Section */}
          <DialogContent
            ref={dialogContentRef} // Ref for scrolling to top
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
              }}
            >
              {
                socialEnterprises.find(
                  (se) => se.se_id === selectedSEs[currentSEIndex]
                )?.team_name
              }
            </Typography>
            <Typography
              variant="h6"
              sx={{ textAlign: "center", marginBottom: "16px" }}
            >
              Evaluating {currentSEIndex + 1} / {selectedSEs.length}
            </Typography>

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

                  {/* Star Rating Selection */}
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
                        categoryEval.predefinedComments.map(
                          (criterion, index) => (
                            <FormControlLabel
                              key={index}
                              control={
                                <Checkbox
                                  checked={categoryEval.selectedCriteria?.includes(
                                    criterion
                                  )}
                                  onChange={() =>
                                    handleCriteriaChange(category, criterion)
                                  }
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
                          )
                        )
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          Loading predefined comments...
                        </Typography>
                      )}
                    </Box>
                  )}

                  {/* Additional Comment Field */}
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
                "&:hover": {
                  backgroundColor: isSubmitDisabled() ? "#ccc" : "#145A32",
                },
              }}
            >
              Submit
            </Button>
          </DialogActions>
        </Dialog>

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
      </Box>
    </Box>
  );
};

export default AssessSEPage;

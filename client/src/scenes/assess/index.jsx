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
  Snackbar,
} from "@mui/material";
import { tokens } from "../../theme";
import { DataGrid } from "@mui/x-data-grid";
import Header from "../../components/Header";
import { useAuth } from "../../context/authContext";

const EvaluatePage = ({ }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { user } = useAuth();
  const [openSelectDialog, setOpenSelectDialog] = useState(false); // For SE selection dialog
  const [openEvaluateDialog, setOpenEvaluateDialog] = useState(false); // For evaluation dialog
  const dialogContentRef = useRef(null); // Ref for the dialog content
  const [selectedSEs, setSelectedSEs] = useState([]); // Selected SEs for evaluation
  const [currentSEIndex, setCurrentSEIndex] = useState(0); // Index of the current SE being evaluated
  const [evaluations, setEvaluations] = useState({}); // Store evaluations for all SEs
  const [error, setError] = useState("");
  const [isLoadingSocialEnterprises, setIsLoadingSocialEnterprises] =
    useState(false);
  const [isLoadingEvaluations, setIsLoadingEvaluations] = useState(false);
  const [evaluationsData, setEvaluationsData] = useState([]);
  const [mentorevaluationsData, setmentorEvaluationsData] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
  const [socialEnterprises, setSocialEnterprises] = useState([]);
  const [evaluationCriteria, setEvaluationCriteria] = useState({});
  const userSession = JSON.parse(localStorage.getItem("user"));
  const [openMentorshipDialog, setOpenMentorshipDialog] = useState(false); // For Mentorship Assessment dialog
  const [programs, setPrograms] = useState([]); // List of programs
  const [selectedPrograms, setSelectedPrograms] = useState([]); // Selected programs
  const [isLoadingPrograms, setIsLoadingPrograms] = useState(false);
  const [openMentorEvalDialog, setMentorEvalDialog] = useState(false);
  const hasMentorRole = user?.roles?.includes("Mentor");
  const isLSEEDUser = user?.roles?.some(role => role?.startsWith("LSEED"));

  const handleProgramSelectionChange = (programId) => {
    setSelectedPrograms(
      (prev) =>
        prev.includes(programId)
          ? prev.filter((id) => id !== programId) // Deselect
          : [...prev, programId] // Select
    );
  };

  const [snackbarOpen, setSnackbarOpen] = useState(false);

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
      setSnackbarOpen(true);
    }
  };

  const handleOpenMentorshipDialog = () => {
    setOpenMentorshipDialog(true);
  };

  const handleCloseMentorshipDialog = () => {
    setOpenMentorshipDialog(false);
    setTimeout(() => {
      window.location.reload();
    }, 500); // Adjust delay if needed
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

        // ⭐️ CORRECTED LOGIC: Check if role (an array) includes the string
        let response;

        if (hasMentorRole) {
          response = await axios.get(
            "http://localhost:4000/getMentorEvaluations",
            {
              withCredentials: true, // Equivalent to credentials: "include"
            }
          );
        } else if (isLSEEDUser) {
          response = await axios.get("http://localhost:4000/getAllEvaluations");
        } else {
            // Handle case where role is not recognized
            console.log("User role is not recognized:", user?.roles);
            return;
        }

        // Ensure evaluation_id is included and set as `id`
        const formattedData = response.data.map((evaluation) => ({
          id: evaluation.evaluation_id, // Use evaluation_id as the unique ID
          evaluation_id: evaluation.evaluation_id, // Explicitly include evaluation_id
          evaluator_name: evaluation.evaluator_name,
          social_enterprise: evaluation.social_enterprise,
          evaluation_date: evaluation.evaluation_date,
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

    if (user) {
      fetchEvaluations();
    }
  }, [user]); // ⭐️ Add user to the dependency array

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

  useEffect(() => {
    const fetchmentorEvaluations = async () => {
      try {
        setIsLoadingEvaluations(true);

        const response = await axios.get(
          "http://localhost:4000/getAllMentorEvaluationType"
        );

        const data = response.data; // ✅ Axios already returns JSON, no need for .json()

        if (!Array.isArray(data)) {
          console.error("❌ Unexpected API Response (Not an Array):", data);
          return;
        }

        // Ensure evaluation_id is included and set as `id`
        const formattedData = data.map((evaluation) => ({
          id: evaluation.evaluation_id, // ✅ Use evaluation_id as the unique ID
          mentor_name: evaluation.mentor_name,
          evaluator_name: evaluation.evaluator_name, // ✅ SE evaluating the mentor
          evaluation_date: evaluation.evaluation_date,
        }));

        setmentorEvaluationsData(formattedData);
      } catch (error) {
        console.error("❌ Error fetching evaluations:", error);
      } finally {
        setIsLoadingEvaluations(false);
      }
    };

    fetchmentorEvaluations();
  }, []);

  const mentorEvaluationColumns = [
    { field: "mentor_name", headerName: "Mentor", flex: 1 },
    { field: "evaluator_name", headerName: "Evaluator (SE)", flex: 1 },
    { field: "evaluation_date", headerName: "Evaluation Date", flex: 1 },
    {
      field: "action",
      headerName: "Action",
      flex: 1,
      renderCell: (params) => (
        <Button
          variant="contained"
          style={{ backgroundColor: colors.primary[600], color: "white" }}
          onClick={() => handleMentorViewExistingEvaluation(params.row.id)} // ✅ Pass evaluation_id
        >
          View
        </Button>
      ),
    },
  ];

  const handleMentorViewExistingEvaluation = async (evaluation_id) => {
    console.log("📌 Evaluation ID Passed:", evaluation_id); // Debugging log

    try {
      const response = await axios.get(
        "http://localhost:4000/getEvaluationDetailsForMentorEvaluation",
        { params: { evaluation_id } }
      );

      console.log("📥 Raw API Response:", response);
      console.log("📥 API Response Data:", response.data);

      // 🚨 Ensure response.data is an array
      if (
        !response.data ||
        !Array.isArray(response.data) ||
        response.data.length === 0
      ) {
        console.warn("⚠️ No evaluation details found.");
        return;
      }

      // ✅ Process evaluation details safely
      const groupedEvaluation = response.data.reduce((acc, evalItem) => {
        const {
          evaluation_date,
          evaluator_name,
          mentor_name,
          category_name,
          star_rating,
          selected_comments,
          additional_comment,
        } = evalItem;

        if (!acc.id) {
          acc.id = evaluation_id;
          acc.evaluator_name = evaluator_name; // ✅ Social Enterprise (Evaluator)
          acc.mentor_name = mentor_name; // ✅ Mentor being evaluated
          acc.evaluation_date = evaluation_date;
          acc.categories = [];
        }

        acc.categories.push({
          category_name,
          star_rating,
          selected_comments: Array.isArray(selected_comments)
            ? selected_comments
            : [], // ✅ Ensure it's always an array
          additional_comment: additional_comment || "", // ✅ Ensure empty comments don't cause issues
        });

        return acc;
      }, {});

      console.log("✅ Processed Evaluation Data:", groupedEvaluation);
      setSelectedEvaluation(groupedEvaluation);
      setMentorEvalDialog(true);
    } catch (error) {
      console.error("❌ Error fetching evaluation details:", error);
    }
  };

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
          evaluator_name, // ✅ Added evaluator name
          social_enterprise,
          category_name,
          star_rating,
          selected_comments,
          additional_comment,
        } = evalItem;

        if (!acc.id) {
          acc.id = evaluation_id;
          acc.evaluator_name = evaluator_name; // ✅ Store evaluator (SE) name
          acc.social_enterprise = social_enterprise; // ✅ Store evaluated SE
          acc.evaluation_date = evaluation_date;
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
    setTimeout(() => {
      window.location.reload();
    }, 500); // Adjust delay if needed
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

  const handleRatingChange = (category, value) => {
    const currentSEId = selectedSEs[currentSEIndex];

    const predefinedComments = evaluationCriteria[category]?.[value] || [
      "No predefined comment available.",
    ];

    console.log(`Rating: ${value}, Predefined Comments:`, predefinedComments);

    setEvaluations((prev) => ({
      ...prev,
      [currentSEId]: {
        ...prev[currentSEId],
        [category]: {
          rating: value,
          selectedCriteria:
            predefinedComments.length > 0 ? [predefinedComments[0]] : [], // ✅ Auto-select first comment
          predefinedComments,
        },
      },
    }));
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
    // ⭐️ CORRECTED: Check if user?.roles (an array) includes the string "Mentor"
    if (hasMentorRole) {
      const fetchSocialEnterprises = async () => {
        try {
          setIsLoadingSocialEnterprises(true); // Start loading

          const mentorshipsResponse = await axios.get(
            "http://localhost:4000/getAvailableEvaluations",
            {
              withCredentials: true, // Equivalent to credentials: "include"
            }
          );
          console.log("📥 Mentorship Response:", mentorshipsResponse.data);

          const updatedSocialEnterprises = mentorshipsResponse.data.map(
            (se) => ({
              id: se.mentoring_session_id, // Updated ID reference
              mentor_name: se.mentor_name || "No Mentor Assigned",
              team_name: se.social_enterprise_name || "Unknown Team",
              se_id: se.se_id || "Unknown Team",
              mentor_id: se.mentor_id || "Unknown Team",
              program_name: se.program_name || "Unknown Program",
              sdg_name: se.sdgs || "No SDG Assigned",
              start_time: se.start_time || "No Start Time",
              end_time: se.end_time || "No End Time",
              date: se.mentoring_session_date,
            })
          );

          setSocialEnterprises(updatedSocialEnterprises);
        } catch (error) {
          console.error("❌ Error fetching data:", error);
        } finally {
          setIsLoadingSocialEnterprises(false); // Stop loading
        }
      };
      if (user) {
        fetchSocialEnterprises();
      }
    }
  }, [user]); // ⭐️ Add user to dependency array

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

    const selectedSE = socialEnterprises.find((se) => se.id === currentSEId);
    if (!selectedSE) {
      console.error("❌ Selected SE not found.");
      alert("Error: Selected Social Enterprise not found.");
      return;
    }

    const mentoring_session_id = selectedSE.id;
    if (!mentoring_session_id) {
      console.error("❌ ERROR: mentorId is missing!");
      return;
    }

    const mentorId = selectedSE.mentor_id;
    if (!mentorId) {
      console.error("❌ ERROR: mentorId is missing!");
      return;
    }

    const se_id = selectedSE.se_id;
    if (!mentorId) {
      console.error("❌ ERROR: mentorId is missing!");
      return;
    }

    const sdgIds = Array.isArray(selectedSE.sdg_name)
      ? selectedSE.sdg_name
      : [selectedSE.sdg_name];

    const isValid = Object.keys(evaluationCriteria).every((category) => {
      const currentSEId = selectedSEs[currentSEIndex];
      const categoryEval = evaluations[currentSEId]?.[category];

      return (
        categoryEval &&
        categoryEval.rating > 0 &&
        categoryEval.selectedCriteria &&
        categoryEval.selectedCriteria.length > 0
      );
    });

    if (!isValid) {
      setError(
        "Please provide a rating and select at least one predefined comment for each category."
      );
      return;
    }

    const formData = {
      evaluatorId: userSession.id,
      se_id: se_id,
      mentorId: mentorId,
      evaluations: currentEvaluations,
      sdg_id: sdgIds,
      mentoring_session_id: mentoring_session_id,
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
        return categoryEval.rating > 0;
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
    setTimeout(() => {
      window.location.reload();
    }, 500); // Adjust delay if needed
  };
  
  // ⭐️ This JSX was outside the return statement, which is a syntax error.
  // It's removed from here as it was causing issues and its logic is now
  // handled within the main JSX return block using conditional rendering.

  return (
    <Box m="20px">
      {/* ⭐️ CORRECTED: Header title check */}
      <Header
        title={
          isLSEEDUser
            ? "Evaluate Mentors"
            : "Evaluate SE"
        }
        subtitle={
          isLSEEDUser
            ? "View and Manage mentor evaluations"
            : "Evaluate Social Enterprises based on key criteria"
        }
      />

      <Box display="flex" flexDirection="column" alignItems="center" gap={4}>
        {/* Buttons */}
        <Box
          width="100%"
          bgcolor={colors.primary[400]}
          display="flex"
          padding={2}
          gap={2} // Adds spacing between buttons
        >
          {/* Show this button only if user?.roles is Mentor */}
          {/* ⭐️ CORRECTED: Button visibility check */}
          {hasMentorRole && (
            <Button
              variant="contained"
              color="secondary"
              sx={{
                fontSize: "16px", // Adjust font size for better fit
                py: "10px", // Reduces height
                flexGrow: 1, // Makes it take full width
                minWidth: 0, // Ensures responsiveness
              }}
              onClick={handleOpenSelectDialog}
            >
              Evaluate SE
            </Button>
          )}
          {/* Show this button only if user?.roles is LSEED */}
          {/* ⭐️ CORRECTED: Button visibility check */}
          {(isLSEEDUser) && (
            <Button
              onClick={handleOpenMentorshipDialog}
              variant="contained"
              color="secondary"
              sx={{
                fontSize: "16px",
                py: "10px",
                flexGrow: 1,
                minWidth: 0,
              }}
            >
              Mentorship Assessment
            </Button>
          )}
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
                      onChange={() =>
                        handleProgramSelectionChange(
                          program.id,
                          program.mentors
                        )
                      }
                      sx={{
                        color: "#000",
                        "&.Mui-checked": { color: "#000" },
                      }}
                    />
                  }
                  label={
                    <span>
                      <strong>{program.name}</strong>
                      <br />
                      <span style={{ fontSize: "0.9em", color: "#666" }}>
                        Evaluation for:{" "}
                        {program.mentors
                          .map((mentor) => mentor.name)
                          .join(", ")}
                      </span>
                    </span>
                  }
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "8px",
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

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000} // ✅ Disappears after 3 seconds
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert
            onClose={() => setSnackbarOpen(false)}
            severity="success"
            sx={{ width: "100%" }}
          >
            Successfully Submitted!
          </Alert>
        </Snackbar>

        {/* ⭐️ CORRECTED: Render the correct DataGrid based on user role */}
        {(isLSEEDUser ) ? (
          <>
            <Box
              width="100%"
              backgroundColor={colors.primary[400]}
              padding="20px"
            >
              <Typography
                variant="h3"
                fontWeight="bold"
                color={colors.greenAccent[500]}
                marginBottom="15px"
              >
                SE Evaluations
              </Typography>
              <Box
                width="100%"
                height="400px"
                minHeight="400px"
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
            </Box>

            <Box
              width="100%"
              backgroundColor={colors.primary[400]}
              padding="20px"
            >
              <Typography
                variant="h3"
                fontWeight="bold"
                color={colors.greenAccent[500]}
                marginBottom="15px"
              >
                Mentor Evaluations
              </Typography>
              <Box
                width="100%"
                height="400px"
                minHeight="400px"
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
                  rows={mentorevaluationsData}
                  columns={mentorEvaluationColumns}
                  getRowId={(row) => row.id}
                />
              </Box>
            </Box>
          </>
        ) : hasMentorRole ? (
          <Box
            width="100%"
            backgroundColor={colors.primary[400]}
            padding="20px"
          >
            <Typography
              variant="h3"
              fontWeight="bold"
              color={colors.greenAccent[500]}
              marginBottom="15px" // Ensures a small gap between header & DataGrid
            >
              My Evaluations
            </Typography>
            <Box
              width="100%"
              height="400px"
              minHeight="400px" // Ensures it does not shrink with missing data
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
          </Box>
        ) : isLoadingSocialEnterprises ? (
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
        ) : null}
      </Box>
    </Box>
  );
};

export default EvaluatePage;
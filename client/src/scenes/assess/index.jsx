import React, { useState } from "react";
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
} from "@mui/material";
import { tokens } from "../../theme";
import { DataGrid } from "@mui/x-data-grid";
import Header from "../../components/Header";
import { mockDataSE } from "../../sampledata/mockData";

// Define evaluation criteria for each category
const evaluationCriteria = {
  teamwork: {
    1: [
      "Lack of collaboration among team members.",
      "Frequent miscommunication leading to inefficiencies.",
      "Minimal participation in group discussions.",
      "Team members do not support or assist each other effectively.",
      "Poor delegation of tasks, leading to confusion and delays.",
      "No clear teamwork structure or coordination.",
    ],
    2: [
      "Occasional coordination issues causing inefficiencies.",
      "Task delegation is inconsistent, leading to workload imbalances.",
      "Collaboration efforts exist but lack effectiveness.",
      "Communication is unclear, causing misunderstandings.",
      "Team members work individually rather than as a unit.",
      "Conflicts arise but are not effectively addressed.",
    ],
    3: [
      "Teamwork is functional but lacks refinement.",
      "Collaboration happens but is not always proactive.",
      "Communication is improving but still has gaps.",
      "Team members assist each other but not consistently.",
      "Conflicts are resolved, but not always smoothly.",
      "Task management is structured but could be more efficient.",
    ],
    4: [
      "Team demonstrates strong collaboration and shared goals.",
      "Communication is clear, with only minor misunderstandings.",
      "Members actively support and motivate each other.",
      "Task delegation is effective, with only small improvements needed.",
      "Conflicts are handled well, with a positive resolution process.",
      "The team works efficiently, with occasional areas for refinement.",
    ],
    5: [
      "Exceptional teamwork and seamless collaboration.",
      "Crystal-clear communication, fostering productivity.",
      "Leadership and unity create a highly efficient team.",
      "Team members proactively support and uplift one another.",
      "Problem-solving is highly effective, even under pressure.",
      "Consistently surpasses teamwork expectations and goals.",
    ],
  },
  financialPlanning: {
    1: [
      "No financial planning or budgeting.",
      "Frequent overspending without accountability.",
    ],
    2: [
      "Basic financial planning exists but lacks detail.",
      "Budgeting is inconsistent.",
    ],
    3: [
      "Financial planning is improving but has gaps.",
      "Some accountability in spending.",
    ],
    4: [
      "Strong financial planning with minor improvements needed.",
      "Clear accountability in spending.",
    ],
    5: [
      "Exceptional financial planning and execution.",
      "Highly efficient budgeting and accountability.",
    ],
  },
  marketingPlan: {
    1: [
      "No marketing plan or strategy.",
      "Minimal effort in promoting the product/service.",
    ],
    2: [
      "Basic marketing efforts exist but lack effectiveness.",
      "Inconsistent promotion strategies.",
    ],
    3: [
      "Marketing plan is functional but needs refinement.",
      "Promotion strategies show improvement.",
    ],
    4: [
      "Strong marketing plan with minor areas for improvement.",
      "Effective promotion strategies.",
    ],
    5: [
      "Exceptional marketing plan and execution.",
      "Highly effective promotion strategies.",
    ],
  },
  serviceDesign: {
    1: ["Poor design/service planning.", "No clear structure or process."],
    2: [
      "Basic design exists but lacks detail.",
      "Service planning is inconsistent.",
    ],
    3: [
      "Design is functional but could be more refined.",
      "Service planning shows improvement.",
    ],
    4: [
      "Strong design with minor areas for improvement.",
      "Service planning is effective.",
    ],
    5: [
      "Exceptional design and service planning.",
      "Highly efficient processes and structures.",
    ],
  },
  humanResourceManagement: {
    1: [
      "No HR management or structure.",
      "Frequent conflicts among team members.",
    ],
    2: [
      "Basic HR management exists but lacks effectiveness.",
      "Conflicts arise but are not resolved well.",
    ],
    3: [
      "HR management is functional but needs refinement.",
      "Conflict resolution is improving.",
    ],
    4: [
      "Strong HR management with minor improvements needed.",
      "Effective conflict resolution.",
    ],
    5: [
      "Exceptional HR management and leadership.",
      "Highly effective team dynamics.",
    ],
  },
  logistics: {
    1: [
      "No logistics planning or execution.",
      "Frequent delays and inefficiencies.",
    ],
    2: [
      "Basic logistics planning exists but lacks detail.",
      "Delays occur due to poor planning.",
    ],
    3: [
      "Logistics planning is functional but needs refinement.",
      "Execution shows improvement.",
    ],
    4: [
      "Strong logistics planning with minor areas for improvement.",
      "Efficient execution.",
    ],
    5: [
      "Exceptional logistics planning and execution.",
      "Highly efficient delivery processes.",
    ],
  },
};

const AssessSEPage = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [openSelectDialog, setOpenSelectDialog] = useState(false); // For SE selection dialog
  const [openEvaluateDialog, setOpenEvaluateDialog] = useState(false); // For evaluation dialog
  const [selectedSEs, setSelectedSEs] = useState([]); // Selected SEs for evaluation
  const [currentSEIndex, setCurrentSEIndex] = useState(0); // Index of the current SE being evaluated
  const [evaluations, setEvaluations] = useState({}); // Store evaluations for all SEs
  const [error, setError] = useState("");

  // Handle SE selection checkbox change
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
          ...prev[currentSEId]?.[category],
          rating: prev[currentSEId]?.[category]?.rating === value ? 0 : value,
          selectedCriteria: [],
        },
      },
    }));
    setError("");
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

  // Submit evaluation for the current SE
  const handleSubmit = async () => {
    const currentSEId = selectedSEs[currentSEIndex];
    const currentEvaluations = evaluations[currentSEId];

    // Validate that at least two predefined comments are selected for each category
    const isValid = Object.values(currentEvaluations).every(
      (categoryEval) => categoryEval.selectedCriteria.length >= 2
    );

    if (!isValid) {
      setError(
        "Please select at least two predefined comments for each category."
      );
      return;
    }

    try {
      // Simulate sending data to the backend
      const formData = { seId: currentSEId, evaluations: currentEvaluations };
      console.log("Form Data Sent to Backend:", formData);

      // Move to the next SE or close the dialog if all SEs are evaluated
      if (currentSEIndex < selectedSEs.length - 1) {
        setCurrentSEIndex(currentSEIndex + 1);
      } else {
        handleCloseEvaluateDialog();
      }
    } catch (error) {
      console.error("Error submitting form data:", error);
    }
  };

  // Close the evaluation dialog
  const handleCloseEvaluateDialog = () => {
    setOpenEvaluateDialog(false);
    setSelectedSEs([]);
    setCurrentSEIndex(0);
    setEvaluations({});
  };

  const columns = [
    { field: "id", headerName: "ID", flex: 0.5 },
    { field: "name", headerName: "Social Enterprise", flex: 1 },
    { field: "mentor", headerName: "Mentor", flex: 1 },
    { field: "sdg", headerName: "SDG", flex: 1 },
    { field: "contact", headerName: "Contact", flex: 1 },
    { field: "members", headerName: "Members", flex: 0.5 },
    { field: "program", headerName: "Program", flex: 1 },
    { field: "status", headerName: "Status", flex: 0.5 },
  ];

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
            File LOM
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
          <DataGrid rows={mockDataSE} columns={columns} />
        </Box>

        {/* SE Selection Dialog */}
        <Dialog
          open={openSelectDialog}
          onClose={handleCloseSelectDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Select Social Enterprises for Evaluation</DialogTitle>
          <DialogContent>
            {mockDataSE.map((se) => (
              <FormControlLabel
                key={se.id}
                control={
                  <Checkbox
                    checked={selectedSEs.includes(se.id)}
                    onChange={() => handleSESelectionChange(se.id)}
                  />
                }
                label={`${se.name} (${se.sdg})`}
              />
            ))}
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseSelectDialog} color="primary">
              Cancel
            </Button>
            <Button onClick={handleStartEvaluation} color="primary">
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
        >
          <DialogTitle>Evaluate Social Enterprise</DialogTitle>
          <DialogContent>
            <Typography variant="h6">
              {
                mockDataSE.find((se) => se.id === selectedSEs[currentSEIndex])
                  ?.name
              }
            </Typography>
            {Object.keys(evaluationCriteria).map((category) => {
              const currentSEId = selectedSEs[currentSEIndex];
              const categoryEval = evaluations[currentSEId]?.[category] || {
                rating: 0,
                selectedCriteria: [],
                comments: "",
              };
              return (
                <Box key={category} mb={3}>
                  <Typography variant="subtitle1">
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Typography>
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
                        borderRadius="5px"
                        bgcolor={
                          value <= categoryEval.rating ? "gold" : "transparent"
                        }
                        sx={{ cursor: "pointer" }}
                        onClick={() => handleRatingChange(category, value)}
                      >
                        <Typography fontSize="24px">★</Typography>
                      </Box>
                    ))}
                  </Box>
                  {categoryEval.rating > 0 && (
                    <Box
                      sx={{
                        maxHeight: "150px",
                        overflowY: "auto",
                        mt: 2,
                        p: 1,
                        border: "1px solid #ccc",
                        borderRadius: "5px",
                      }}
                    >
                      {evaluationCriteria[category][categoryEval.rating]?.map(
                        (criterion, index) => (
                          <FormControlLabel
                            key={index}
                            control={
                              <Checkbox
                                checked={categoryEval.selectedCriteria.includes(
                                  criterion
                                )}
                                onChange={() =>
                                  handleCriteriaChange(category, criterion)
                                }
                              />
                            }
                            label={criterion}
                          />
                        )
                      )}
                    </Box>
                  )}
                  <TextField
                    label={`Additional Comments for ${category}`}
                    multiline
                    rows={3}
                    value={categoryEval.comments}
                    onChange={(e) =>
                      handleCommentsChange(category, e.target.value)
                    }
                    variant="outlined"
                    fullWidth
                    sx={{ mt: 2 }}
                  />
                </Box>
              );
            })}
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseEvaluateDialog} color="primary">
              Cancel
            </Button>
            <Button onClick={handleSubmit} color="primary">
              Submit
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default AssessSEPage;

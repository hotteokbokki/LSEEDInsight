import React, { useState, useEffect } from "react";
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
      "No financial planning or budgeting in place.",
      "Frequent overspending without accountability.",
      "No tracking of income or expenses.",
      "Lack of financial transparency and reporting.",
      "No cost-cutting measures or savings plan.",
      "High financial risks with no mitigation strategies.",
    ],
    2: [
      "Basic financial planning exists but lacks detail.",
      "Budgeting is inconsistent and unstructured.",
      "Limited financial tracking and reporting.",
      "Spending is monitored but lacks strict control.",
      "Minimal efforts to manage financial risks.",
      "Unclear revenue generation strategies.",
    ],
    3: [
      "Financial planning is improving but still has gaps.",
      "Some accountability in spending but needs refinement.",
      "Budgeting exists but is not always followed.",
      "Basic financial reports are available but not detailed.",
      "Risk management strategies are developing but not robust.",
      "Revenue and expenses are tracked but inconsistently.",
    ],
    4: [
      "Strong financial planning with minor improvements needed.",
      "Clear accountability in spending and budgeting.",
      "Financial reports provide good insights but could be more detailed.",
      "Effective cost-cutting and savings strategies in place.",
      "Well-defined financial goals but require periodic adjustments.",
      "Revenue and risk management strategies are mostly effective.",
    ],
    5: [
      "Exceptional financial strategy ensuring sustainable growth.",
      "Clear budgeting and resource allocation maximizing efficiency.",
      "Proactive risk management and strong financial foresight.",
      "Effective revenue generation and cost-control measures in place.",
      "Well-structured financial reports guiding informed decision-making.",
      "Outstanding transparency and accountability in financial management.",
    ],
  },
  marketingPlan: {
    1: [
      "No marketing plan or strategy in place.",
      "Minimal effort in promoting the product/service.",
      "No brand identity or customer engagement activities.",
      "Lack of understanding of the target market.",
      "No use of digital or traditional marketing methods.",
      "Ineffective communication of the product/service benefits.",
    ],
    2: [
      "Basic marketing efforts exist but lack structure.",
      "Promotion is inconsistent and fails to attract attention.",
      "Limited awareness of the brand within the target audience.",
      "Market research is minimal and lacks actionable insights.",
      "Digital and traditional marketing channels are underutilized.",
      "Customer engagement strategies are unclear or ineffective.",
    ],
    3: [
      "Marketing plan is structured but needs refinement.",
      "Promotion strategies are in place but lack full execution.",
      "Brand recognition is improving but remains inconsistent.",
      "Basic market research is conducted but lacks depth.",
      "Customer engagement strategies exist but need more consistency.",
      "Marketing budget allocation is present but not fully optimized.",
    ],
    4: [
      "Well-developed marketing plan with clear execution strategies.",
      "Promotion efforts effectively reach and attract the target audience.",
      "Brand identity is strong with consistent messaging.",
      "Comprehensive market research drives informed decisions.",
      "Customer engagement strategies are personalized and interactive.",
      "Multi-channel marketing efforts are well-coordinated and effective.",
    ],
    5: [
      "Exceptional marketing plan with strategic execution.",
      "Highly effective promotional campaigns maximizing audience reach.",
      "Strong and recognizable brand identity with high market influence.",
      "Data-driven marketing strategies ensuring sustainable growth.",
      "Customer engagement is dynamic, fostering brand loyalty.",
      "Innovative and adaptive marketing techniques consistently outperform competitors.",
    ],
  },
  productServiceDesign: {
    1: [
      "No clear product/service design or development strategy.",
      "Lack of innovation or differentiation in offerings.",
      "Customer needs and preferences are not considered.",
      "Poor usability and functionality of the product/service.",
      "No structured planning for product/service improvements.",
      "Lack of testing or validation before launch.",
    ],
    2: [
      "Basic product/service concept exists but lacks refinement.",
      "Minimal efforts in identifying unique selling points.",
      "Customer feedback is collected but not effectively used.",
      "Usability and functionality remain underdeveloped.",
      "Planning process is inconsistent and lacks foresight.",
      "Market feasibility and demand analysis are insufficient.",
    ],
    3: [
      "Product/service design has a working foundation but needs enhancements.",
      "Moderate efforts in differentiation but still room for improvement.",
      "Customer feedback is acknowledged and selectively applied.",
      "Usability and functionality are improving but not yet optimized.",
      "Planning process is becoming structured but lacks adaptability.",
      "Market research exists but needs deeper insights to guide decisions.",
    ],
    4: [
      "Well-developed product/service design with strategic refinement in place.",
      "Competitive differentiation is evident and evolving.",
      "Customer feedback drives regular iterative improvements.",
      "Usability and functionality are strong with minor optimization needed.",
      "Planning includes both short-term execution and long-term vision.",
      "Market research informs innovation and adapts to trends effectively.",
    ],
    5: [
      "Exceptional product/service design demonstrating strategic innovation.",
      "Strong brand identity and differentiation securing market position.",
      "Customer insights are seamlessly integrated into design decisions.",
      "Top-tier usability and functionality exceeding user expectations.",
      "Future-proofed planning that ensures continuous adaptation and growth.",
      "Data-driven approach fostering sustained competitive advantage.",
    ],
  },
  humanResourceManagement: {
    1: [
      "No HR management or team structure in place.",
      "Frequent unresolved conflicts disrupting team cohesion.",
      "No clear roles or responsibilities among team members.",
      "Lack of leadership and accountability.",
      "No professional development or training opportunities.",
      "Poor communication and lack of teamwork.",
    ],
    2: [
      "Basic HR management exists but is inconsistent.",
      "Conflicts arise frequently with delayed resolutions.",
      "Roles and responsibilities are unclear at times.",
      "Minimal leadership guidance affecting team performance.",
      "Limited professional development opportunities.",
      "Communication barriers create misunderstandings.",
    ],
    3: [
      "HR management is functional but requires improvement.",
      "Conflict resolution is present but not always effective.",
      "Defined roles exist but require better clarity and execution.",
      "Leadership provides direction but lacks consistency.",
      "Some training and development efforts are in place.",
      "Communication is improving but needs better alignment.",
    ],
    4: [
      "Well-structured HR management with minor gaps.",
      "Conflicts are handled effectively with fair resolutions.",
      "Roles and responsibilities are clearly defined and executed.",
      "Leadership fosters a collaborative and motivated environment.",
      "Regular professional development initiatives in place.",
      "Strong communication and teamwork culture.",
    ],
    5: [
      "Exceptional HR management with outstanding leadership.",
      "Conflicts are rare and proactively managed.",
      "Roles, responsibilities, and accountability are well-balanced.",
      "Leadership inspires high performance and teamwork.",
      "Comprehensive training and development programs.",
      "Highly effective communication ensuring seamless collaboration.",
    ],
  },
  logistics: {
    1: [
      "No logistics planning or execution.",
      "Frequent delays and inefficiencies in operations.",
      "Lack of inventory or supply chain management.",
      "Transportation and delivery processes are disorganized.",
      "No tracking or monitoring of shipments.",
      "Significant disruptions affecting overall efficiency.",
    ],
    2: [
      "Basic logistics planning exists but lacks structure.",
      "Delays occur due to poor coordination.",
      "Supply chain is unreliable and inconsistent.",
      "Inventory management is weak, causing shortages or excess stock.",
      "Transportation strategies are ineffective.",
      "Limited tracking and monitoring of goods movement.",
    ],
    3: [
      "Logistics planning is improving but still needs refinement.",
      "Execution is inconsistent but shows progress.",
      "Supply chain management is in place but needs optimization.",
      "Inventory control has improved but requires more efficiency.",
      "Transportation is better coordinated but not fully optimized.",
      "Tracking and monitoring exist but need better accuracy.",
    ],
    4: [
      "Strong logistics planning ensuring smoother operations.",
      "Timely and efficient coordination of deliveries.",
      "Reliable supply chain with minor areas for improvement.",
      "Inventory management is well-handled, reducing stock issues.",
      "Transportation processes are well-structured and cost-effective.",
      "Advanced tracking systems in place, with occasional lapses.",
    ],
    5: [
      "Exceptional logistics planning and flawless execution.",
      "Highly efficient and punctual delivery processes.",
      "Optimized supply chain ensuring seamless operations.",
      "Advanced inventory management preventing shortages or surpluses.",
      "Cost-effective and sustainable transportation strategies.",
      "Real-time tracking and data-driven decision-making for logistics.",
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
  const [socialEnterprises, setSocialEnterprises] = useState([]);
  const [columns, setColumns] = useState([]);

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

  useEffect(() => {
    const fetchSocialEnterprises = async () => {
      try {
        const seResponse = await axios.get(
          "http://localhost:4000/getSocialEnterprises"
        );
        const mentorResponse = await axios.get(
          "http://localhost:4000/api/mentors"
        );
        const programsResponse = await axios.get(
          "http://localhost:4000/getPrograms"
        );
        const sdgResponse = await axios.get("http://localhost:4000/getSDGs");

        console.log("📥 SDG API Response:", sdgResponse.data); // Debugging

        // ✅ Ensure it's an array before using `.forEach()`
        const programsData = Array.isArray(programsResponse.data)
          ? programsResponse.data
          : [];
        const mentorsData = Array.isArray(mentorResponse.data)
          ? mentorResponse.data
          : [];
        const sdgData = Array.isArray(sdgResponse.data) ? sdgResponse.data : [];

        // ✅ Create mapping { program_id -> program_name }
        const programsMap = {};
        programsData.forEach((program) => {
          programsMap[program.program_id] = program.name;
        });

        // ✅ Create mapping { mentor_id -> mentor_name }
        const mentorMap = {};
        mentorsData.forEach((mentor) => {
          mentorMap[
            mentor.mentor_id
          ] = `${mentor.mentor_firstName} ${mentor.mentor_lastName}`;
        });

        // ✅ Create mapping { sdg_id -> sdg_name }
        const sdgMap = {};
        sdgData.forEach((sdg) => {
          sdgMap[sdg.sdg_id] = sdg.name;
        });

        // ✅ Handle multiple SDGs
        const updatedSocialEnterprises = seResponse.data.map((se) => ({
          ...se,
          program_id: programsMap[se.program_id] || "Unknown Program",
          mentor_id: se.mentor_id, // ✅ Keep UUID here
          mentor_name: mentorMap[se.mentor_id] || "No Mentor Assigned", // ✅ Store name separately
          sdg_id: se.sdg_id,
          sdg_name: Array.isArray(se.sdg_id) // ✅ Handle multiple SDGs
            ? se.sdg_id.map((id) => sdgMap[id] || "Unknown SDG").join(", ") // Convert array to string
            : sdgMap[se.sdg_id] || "No SDG Name",
        }));

        const dynamicColumns = [
          { field: "team_name", headerName: "Social Enterprise", flex: 1 },
          { field: "mentor_name", headerName: "Assigned Mentor", flex: 1 }, // ✅ Now shows mentor name
          { field: "program_id", headerName: "Program Name", flex: 1 },
          { field: "sdg_name", headerName: "SDG(s)", flex: 1 }, // ✅ Now shows multiple SDGs
        ];

        setColumns(dynamicColumns);
        setSocialEnterprises(updatedSocialEnterprises);
      } catch (error) {
        console.error(
          "❌ Error fetching SE, Mentors, Programs, or SDGs:",
          error
        );
      }
    };

    fetchSocialEnterprises();
  }, []);

  const handleSubmit = async () => {
    const currentSEId = selectedSEs[currentSEIndex];
    const currentEvaluations = evaluations[currentSEId];
    const getValidRating = (rating) =>
      rating && rating >= 1 && rating <= 5 ? rating : 1;

    const userSession = JSON.parse(localStorage.getItem("user"));
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

    const isValid = Object.values(currentEvaluations || {}).every(
      (categoryEval) => categoryEval.selectedCriteria?.length >= 2
    );

    if (!isValid) {
      setError(
        "Please select at least two predefined comments for each category."
      );
      return;
    }

    const formData = {
      evaluatorId: userSession.id,
      se_id: [currentSEId], // ✅ Send only the current SE in the request
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
        setCurrentSEIndex(currentSEIndex + 1); // Move to the next SE
      } else {
        console.log("✅ All SEs have been evaluated.");
        handleCloseEvaluateDialog();
      }
    } catch (error) {
      console.error("❌ Error submitting evaluations:", error);
    }
  };

  // Close the evaluation dialog
  const handleCloseEvaluateDialog = () => {
    setOpenEvaluateDialog(false);
    setSelectedSEs([]);
    setCurrentSEIndex(0);
    setEvaluations({});
  };

  if (!columns.length) return <Typography>Loading...</Typography>;

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
          <DataGrid
            rows={socialEnterprises}
            columns={columns}
            getRowId={(row) => row.se_id} // Ensure `se_id` is used as `id`
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
          <DialogContent
            sx={{
              padding: "24px",
              maxHeight: "70vh", // Ensure it doesn't overflow the screen
              overflowY: "auto", // Enable scrolling if content is too long
            }}
          >
            {socialEnterprises.map((se) => (
              <FormControlLabel
                key={se.se_id}
                control={
                  <Checkbox
                    checked={selectedSEs.includes(se.se_id)}
                    onChange={() => handleSESelectionChange(se.se_id)}
                    sx={{
                      color: "#000", // Black checkbox
                      "&.Mui-checked": {
                        color: "#000", // Black when checked
                      },
                    }}
                  />
                }
                label={`${se.team_name} (${se.sdg_name})`}
                sx={{
                  marginBottom: "8px", // Spacing between items
                }}
              />
            ))}
            {error && (
              <Alert severity="error" sx={{ margin: "16px" }}>
                {error}
              </Alert>
            )}
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
                      {evaluationCriteria[category]?.[categoryEval.rating]?.map(
                        (criterion, index) => (
                          <FormControlLabel
                            key={index}
                            control={
                              <Checkbox
                                checked={
                                  categoryEval.selectedCriteria?.includes(
                                    criterion
                                  ) || false
                                }
                                onChange={() =>
                                  handleCriteriaChange(category, criterion)
                                }
                                sx={{
                                  color: "#000", // Black checkbox
                                  "&.Mui-checked": {
                                    color: "#000", // Black when checked
                                  },
                                }}
                              />
                            }
                            label={criterion}
                            sx={{
                              marginBottom: "4px", // Spacing between criteria
                            }}
                          />
                        )
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
              sx={{
                backgroundColor: "#1E4D2B",
                color: "#fff",
                "&:hover": {
                  backgroundColor: "#1E4D2B", // Darker hover effect
                },
              }}
            >
              Submit
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default AssessSEPage;

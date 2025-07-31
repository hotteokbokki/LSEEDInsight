import React, { useState, useEffect } from "react";
import axios from "axios";
import { Box, Typography, Chip, Button, useTheme } from "@mui/material";
import Header from "../../components/Header";
import { DataGrid } from "@mui/x-data-grid";
import HandshakeOutlinedIcon from "@mui/icons-material/HandshakeOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import ThumbUpAltOutlinedIcon from "@mui/icons-material/ThumbUpAltOutlined";
import ThumbDownAltOutlinedIcon from "@mui/icons-material/ThumbDownAltOutlined";
import { TextField, MenuItem, IconButton, Tooltip } from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear"
import { tokens } from "../../theme";
import { Snackbar, Alert } from "@mui/material";

const mockEvaluations = [
  {
    id: 1,
    date: "2025-03-10",
    enterprise: "GreenFuture SE",
    status: "Acknowledged",
  },
  { id: 2, date: "2025-03-08", enterprise: "EcoSavers", status: "Pending" },
  {
    id: 3,
    date: "2025-03-05",
    enterprise: "BlueWater Solutions",
    status: "Acknowledged",
  },
];

const mockSessions = [
  {
    id: 1,
    date: "2025-03-20",
    enterprise: "GreenFuture SE",
    status: "Confirmed",
  },
  {
    id: 2,
    date: "2025-03-22",
    enterprise: "EcoSavers",
    status: "Pending Approval",
  },
];

const CollaborationDashboard = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [mentorships, setMentorships] = useState([]);
  const [suggestedCollaborations, setSuggestedCollaborations] = useState([]);
  const [selectedMentorshipId, setSelectedMentorshipId] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success"); // or "error"

  useEffect(() => {
    const fetchMentorships = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/mentorship/get-collaborators`, {
          withCredentials: true,
        });
        setMentorships(res.data || []);
      } catch (err) {
        console.error("Error fetching mentorships:", err);
      }
    };

    fetchMentorships();
  }, []);

  const handleRequestCollaboration = async (targetMentorshipId) => {
    try {
      await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/mentorship/request-collaboration`, {
        mentorship_id_1: selectedMentorshipId,
        mentorship_id_2: targetMentorshipId,
      });
      setSnackbarMessage("Collaboration request sent successfully.");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (err) {
      console.error(err);
      setSnackbarMessage("Failed to send collaboration request.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  useEffect(() => {
    if (!selectedMentorshipId) return;

    const fetchSuggestedCollaborations = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_BASE_URL}/api/mentorship/suggested-collaborations/${selectedMentorshipId}`,
          { withCredentials: true }
        );

        setSuggestedCollaborations(
          Array.isArray(res.data)
            ? res.data.map(item => ({
              ...item,
              priority: Number(item.priority) || 4,
              match_count: Number(item.match_count) || 0,
              matched_categories: Array.isArray(item.matched_categories) ? item.matched_categories : [],
            }))
            : []
        );

        console.log("Collaborators: ", suggestedCollaborations)
      } catch (error) {
        console.error("Error fetching suggested collaborations:", error);
      }
    };

    fetchSuggestedCollaborations();
  }, [selectedMentorshipId]);

  return (
    <Box m="20px">
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Header
          title="Collaboration Dashboard"
          subtitle="Welcome to Collaborations"
        />
      </Box>

      {/* Row 2 - Collaboration Insights StatBoxes */}
      <Box
        display="flex"
        flexWrap="wrap"
        gap="20px"
        justifyContent="space-between"
        mt="20px"
      >
        {/* No. of Collaborations */}
        <Box
          flex="1 1 22%"
          backgroundColor={colors.primary[400]}
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          p="20px"
        >
          <HandshakeOutlinedIcon sx={{ fontSize: 40, color: colors.greenAccent[500], mb: 1 }} />
          <Typography variant="h4" fontWeight="bold" color={colors.grey[100]}>
            69
          </Typography>
          <Typography variant="subtitle2" color={colors.grey[300]}>
            No. of Collaborations
          </Typography>
        </Box>

        {/* No. of Involved Social Enterprises */}
        <Box
          flex="1 1 22%"
          backgroundColor={colors.primary[400]}
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          p="20px"
        >
          <GroupOutlinedIcon sx={{ fontSize: 40, color: colors.blueAccent[500], mb: 1 }} />
          <Typography variant="h4" fontWeight="bold" color={colors.grey[100]}>
            60
          </Typography>
          <Typography variant="subtitle2" color={colors.grey[300]}>
            No. of Evaluations
          </Typography>
        </Box>

        {/* Shared / Peer-Identified Strengths */}
        {/* <Box
          flex="1 1 22%"
          backgroundColor={colors.primary[400]}
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          p="20px"
        >
          <ThumbUpAltOutlinedIcon sx={{ fontSize: 40, color: colors.blueAccent[300], mb: 1 }} />
          <Typography variant="h4" fontWeight="bold" color={colors.grey[100]}>
            {sharedStrengthsCount || peerStrengthsCount || 0}
          </Typography>
          <Typography variant="subtitle2" color={colors.grey[300]} align="center">
            {strengthsLabel}
          </Typography>
        </Box> */}

        {/* Shared / Peer-Identified Weaknesses */}
        {/* <Box
          flex="1 1 22%"
          backgroundColor={colors.primary[400]}
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          p="20px"
        >
          <ThumbDownAltOutlinedIcon sx={{ fontSize: 40, color: colors.redAccent[300], mb: 1 }} />
          <Typography variant="h4" fontWeight="bold" color={colors.grey[100]}>
            {sharedWeaknessesCount || peerWeaknessesCount || 0}
          </Typography>
          <Typography variant="subtitle2" color={colors.grey[300]} align="center">
            {weaknessesLabel}
          </Typography>
        </Box> */}
      </Box>

      {/* Mentorship Selector */}
      {!selectedMentorshipId && (
        <Box mb={4}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Choose a Mentorship to Explore Collaboration Opportunities
          </Typography>
          <TextField
            select
            fullWidth
            label="Select Mentorship"
            variant="outlined"
            value={selectedMentorshipId}
            onChange={(e) => setSelectedMentorshipId(e.target.value)}
            sx={{
              backgroundColor: theme.palette.background.default,
              color: theme.palette.text.primary,
            }}
          >
            <MenuItem value="">-- None Selected --</MenuItem>
            {mentorships.map((m) => (
              <MenuItem key={m.mentorship_id} value={m.mentorship_id}>
                {m.social_enterprise_name || "Untitled Social Enterprise"}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      )}

      {/* Collaboration Suggestion Panel */}
      {selectedMentorshipId && (
        <Box mt={4}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
            <Typography variant="h5" fontWeight="bold">
              Suggested Collaborations for{" "}
              {
                mentorships.find((m) => m.mentorship_id === selectedMentorshipId)
                  ?.social_enterprise_name || "Selected Mentorship"
              }
            </Typography>

            <Tooltip title="Clear mentorship selection">
              <IconButton
                onClick={() => setSelectedMentorshipId("")}
                color="error"
                size="large"
              >
                <ClearIcon />
              </IconButton>
            </Tooltip>
          </Box>

          <Typography variant="body2" color={colors.grey[300]} mb={2}>
            These recommendations are based on complementary strengths and weaknesses in evaluation categories.
          </Typography>

          {/* Tier 1–3 */}
          {suggestedCollaborations.some((s) => s.priority >= 1 && s.priority <= 3) && (
            <>
              <Typography variant="subtitle1" color={colors.greenAccent[400]} fontWeight="bold" mt={2} mb={0.5}>
                Suggested Collaborators
              </Typography>

              <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={2}>
                {suggestedCollaborations
                  .filter((s) => s.priority >= 1 && s.priority <= 3)
                  .map((item, index) => {
                    let explanation = "";
                    const selectedSEName =
                      mentorships.find((m) => m.mentorship_id === selectedMentorshipId)
                        ?.social_enterprise_name || "this social enterprise";

                    switch (item.priority) {
                      case 1:
                        explanation = `Strengths of ${item.se_b_name} address the weaknesses of ${selectedSEName}.`;
                        break;
                      case 2:
                        explanation = `${item.se_b_name} shares common strengths with ${selectedSEName}.`;
                        break;
                      case 3:
                        explanation = `${item.se_b_name} shares common weaknesses with ${selectedSEName}.`;
                        break;
                    }

                    return (
                      <Box
                        key={index}
                        p={2}
                        border={`1px solid ${colors.grey[700]}`}
                        borderRadius="12px"
                        backgroundColor={colors.primary[400]}
                        display="flex"
                        flexDirection="column"
                        justifyContent="space-between"
                        height="100%" // Ensures full height stretch in grid
                      >
                        <Box>
                          <Typography fontWeight="bold" mb={1}>
                            👤 Mentor: {item.mentor_b_name}
                          </Typography>
                          <Typography fontSize="0.9rem" mb={0.5}>
                            SE to Collaborate With: <strong>{item.se_b_name}</strong>
                          </Typography>
                          <Typography fontSize="0.9rem" mb={0.5}>
                            Matched Categories:{" "}
                            {item.matched_categories.length > 0 ? (
                              item.matched_categories.join(", ")
                            ) : (
                              <i>None</i>
                            )}
                          </Typography>
                          <Typography fontSize="0.85rem" mt={1} color={colors.greenAccent[300]}>
                            {explanation}
                          </Typography>
                        </Box>

                        <Button
                          variant="contained"
                          color="secondary"
                          onClick={() => handleRequestCollaboration(item.mentorship_b)}
                          sx={{ mt: 2 }}
                          fullWidth
                        >
                          Request Collaboration
                        </Button>
                      </Box>
                    );
                  })}
              </Box>
            </>
          )}

          {/* Tier 4 */}
          {suggestedCollaborations.some((s) => s.priority === 4) && (
            <>
              <Typography variant="subtitle1" color={colors.redAccent[400]} fontWeight="bold" mt={4} mb={1}>
                Other Collaborators
              </Typography>
              <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={2}>
                {suggestedCollaborations
                  .filter((s) => s.priority === 4)
                  .map((item, index) => (
                    <Box
                      key={index}
                      p={2}
                      border={`1px solid ${colors.grey[700]}`}
                      borderRadius="12px"
                      backgroundColor={colors.primary[400]}
                      display="flex"
                      flexDirection="column"
                      justifyContent="space-between"
                      height="100%"
                    >
                      <Box>
                        <Typography fontWeight="bold" mb={1}>
                          👤 Mentor: {item.mentor_b_name}
                        </Typography>
                        <Typography fontSize="0.9rem" mb={0.5}>
                          SE to Collaborate With: <strong>{item.se_b_name}</strong>
                        </Typography>
                        <Typography fontSize="0.9rem">
                          No specific category match.
                        </Typography>
                      </Box>

                      <Button
                        variant="contained"
                        color="secondary"
                        onClick={() => handleRequestCollaboration(item.mentorship_b)}
                        sx={{ mt: 2 }}
                        fullWidth
                      >
                        Request Collaboration
                      </Button>
                    </Box>
                  ))}
              </Box>
            </>
          )}

          {suggestedCollaborations.length === 0 && (
            <Typography mt={2} color={colors.grey[300]}>
              No suggestions found for the selected mentorship.
            </Typography>
          )}
        </Box>
      )}

      {/* Evaluation History */}
      <Box mt={4}>
        <Typography variant="h6" gutterBottom>
          Recent Evaluations
        </Typography>
        {mockEvaluations.length > 0 ? (
          <Box
            sx={{
              height: 400,
              width: "100%",
              overflowX: "auto",
              "& .MuiDataGrid-root": { border: "none" },
              "& .MuiDataGrid-cell": { borderBottom: "none" },
              "& .MuiDataGrid-columnHeaders, & .MuiDataGrid-columnHeader": {
                backgroundColor: colors.blueAccent[700] + " !important",
              },
              "& .MuiDataGrid-virtualScroller": {
                backgroundColor: colors.primary[400],
              },
              "& .MuiDataGrid-footerContainer": {
                borderTop: "none",
                backgroundColor: colors.blueAccent[700],
                color: colors.grey[100],
              },
            }}
          >
            <DataGrid
              rows={mockEvaluations}
              columns={[
                { field: "date", headerName: "Date", flex: 1 },
                { field: "enterprise", headerName: "Social Enterprise", flex: 2 },
                {
                  field: "status",
                  headerName: "Acknowledgment",
                  flex: 1,
                  renderCell: (params) => (
                    <Chip
                      label={params.value}
                      color={params.value === "Acknowledged" ? "success" : "warning"}
                    />
                  ),
                },
                {
                  field: "actions",
                  headerName: "Actions",
                  flex: 1,
                  renderCell: () => (
                    <Button variant="contained" size="small">View Details</Button>
                  ),
                },
              ]}
              pageSize={5}
              rowsPerPageOptions={[5, 10]}
            />
          </Box>
        ) : (
          <Typography>No evaluations available.</Typography>
        )}
      </Box>

      {/* Upcoming Mentoring Sessions */}
      <Box mt={4}>
        <Typography variant="h6" gutterBottom>
          Upcoming Mentoring Sessions
        </Typography>
        {mockSessions.length > 0 ? (
          <Box
            sx={{
              height: 400,
              width: "100%",
              overflowX: "auto",
              "& .MuiDataGrid-root": { border: "none" },
              "& .MuiDataGrid-cell": { borderBottom: "none" },
              "& .MuiDataGrid-columnHeaders, & .MuiDataGrid-columnHeader": {
                backgroundColor: colors.blueAccent[700] + " !important",
              },
              "& .MuiDataGrid-virtualScroller": {
                backgroundColor: colors.primary[400],
              },
              "& .MuiDataGrid-footerContainer": {
                borderTop: "none",
                backgroundColor: colors.blueAccent[700],
                color: colors.grey[100],
              },
            }}
          >
            <DataGrid
              rows={mockSessions}
              columns={[
                { field: "date", headerName: "Date & Time", flex: 1 },
                { field: "enterprise", headerName: "Social Enterprise", flex: 2 },
                {
                  field: "status",
                  headerName: "Status",
                  flex: 1,
                  renderCell: (params) => (
                    <Chip
                      label={params.value}
                      color={params.value === "Confirmed" ? "success" : "warning"}
                    />
                  ),
                },
              ]}
              pageSize={5}
              rowsPerPageOptions={[5, 10]}
            />
          </Box>
        ) : (
          <Typography>No mentoring sessions scheduled.</Typography>
        )}
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>

  );
};

export default CollaborationDashboard;

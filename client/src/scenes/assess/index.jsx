import React, { useState } from "react";
import axios from "axios"; // Import Axios
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
  Rating,
} from "@mui/material";
import { tokens } from "../../theme";
import { DataGrid } from "@mui/x-data-grid";
import Header from "../../components/Header";
import { mockDataEval } from "../../sampledata/mockData"; // Assuming you have mock data for the evaluation dates

const AssessSEPage = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  // State for opening the dialog and storing form data
  const [openDialog, setOpenDialog] = useState(false);
  const [rating, setRating] = useState(0); // Store star rating
  const [strongCollab, setStrongCollab] = useState(false);
  const [goodComm, setGoodComm] = useState(false);
  const [taskDelegation, setTaskDelegation] = useState(false);
  const [conflictResolution, setConflictResolution] = useState(false);
  const [comments, setComments] = useState("");

  const columns = [
    {
      field: "evaluationDate",
      headerName: "Previous Evaluation Date",
      flex: 1,
    },
    {
      field: "mentorName",
      headerName: "Mentor Name",
      flex: 1,
    },
    {
      field: "seName",
      headerName: "Social Enterprise",
      flex: 1,
    },
  ];

  // Handle form submission and send data to the backend using GET request
  const handleSubmit = async () => {
    const formData = {
      rating,
      strongCollab,
      goodComm,
      taskDelegation,
      conflictResolution,
      comments,
    };

    // Convert the form data to query string format
    const queryParams = new URLSearchParams(formData).toString();

    try {
      // Make a GET request to the backend with query parameters
      const response = await axios.get(`YOUR_BACKEND_URL_HERE?${queryParams}`);
      console.log("Form Data Sent to Backend:", response.data);

      // Close the dialog after submitting
      setOpenDialog(false);
    } catch (error) {
      console.error("Error submitting form data:", error);
    }
  };

  return (
    <Box m="20px">
      {/* Header */}
      <Header title="ASSESS SE" subtitle="Evaluate and manage SE performance" />

      {/* Main Content */}
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        gap={4}
      >
        {/* First Row - Evaluate SE and File LOM Buttons */}
        <Box
          width="80%"
          p={3}
          textAlign="center"
          border={`1px solid ${colors.grey[500]}`}
          bgcolor={colors.primary[400]}
          display="flex"
          justifyContent="space-between"
          gap={2}
        >
          <Button
            variant="contained"
            color="secondary"
            sx={{
              fontSize: "20px",
              padding: "20px",
              width: "48%",
            }}
            onClick={() => setOpenDialog(true)} // Open dialog when clicked
          >
            Evaluate SE
          </Button>
          <Button
            variant="contained"
            color="secondary"
            sx={{
              fontSize: "20px",
              padding: "20px",
              width: "48%",
            }}
          >
            File LOM
          </Button>
        </Box>

        {/* Second Row - DataGrid showing evaluation dates */}
        <Box
          width="80%"
          height="250px"
          sx={{
            "& .MuiDataGrid-root": {
              backgroundColor: colors.primary[400],
              border: "none",
            },
            "& .MuiDataGrid-cell": {
              borderBottom: "none",
              color: colors.grey[100],
            },
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: colors.blueAccent[700],
              borderBottom: "none",
            },
            "& .MuiDataGrid-footerContainer": {
              borderTop: "none",
              backgroundColor: colors.blueAccent[700],
            },
          }}
        >
          <DataGrid rows={mockDataEval} columns={columns} />
        </Box>

        {/* Dialog Popup for SE Evaluation */}
        <Dialog
          open={openDialog}
          onClose={() => setOpenDialog(false)}
          sx={{
            "& .MuiDialog-paper": {
              backgroundColor: "white", // Set dialog background to white
              color: "black", // Set text color to black
              width: "600px", // Make the dialog wider
              minHeight: "500px", // Make the dialog bigger
              padding: "20px", // Add padding inside the dialog
              borderRadius: "10px", // Optional: round corners
            },
          }}
        >
          <DialogTitle
            sx={{
              backgroundColor: "white", // Set title background to white
              color: "black", // Set title text color to black
              fontWeight: "bold", // Make the title bold
            }}
          >
            Evaluate Social Enterprise
          </DialogTitle>
          <DialogContent>
            <Box display="flex" flexDirection="column" gap={2}>
              {/* Star Rating with Individual Boxes for Each Star */}
              <Box>
                <Typography sx={{ color: "black" }}>
                  Rate the performance of the SE
                </Typography>
                <Box display="flex" gap={1}>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <Box
                      key={value}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "40px",
                        height: "40px",
                        border: "1px solid black", // Border for each box
                        borderRadius: "5px", // Rounded corners
                        backgroundColor:
                          value <= rating ? "gold" : "transparent",
                        cursor: "pointer",
                      }}
                      onClick={() => setRating(value)} // Set the rating when clicked
                    >
                      <Typography sx={{ fontSize: "24px", color: "black" }}>
                        ★
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* Checkboxes for Evaluation Criteria */}
              <FormControlLabel
                control={
                  <Checkbox
                    checked={strongCollab}
                    onChange={(e) => setStrongCollab(e.target.checked)}
                    sx={{ color: "black" }}
                  />
                }
                label="Strong Collaboration"
                sx={{ color: "black" }}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={goodComm}
                    onChange={(e) => setGoodComm(e.target.checked)}
                    sx={{ color: "black" }}
                  />
                }
                label="Good Communication Skills"
                sx={{ color: "black" }}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={taskDelegation}
                    onChange={(e) => setTaskDelegation(e.target.checked)}
                    sx={{ color: "black" }}
                  />
                }
                label="Needs Better Task Delegation"
                sx={{ color: "black" }}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={conflictResolution}
                    onChange={(e) => setConflictResolution(e.target.checked)}
                    sx={{ color: "black" }}
                  />
                }
                label="Conflict Resolution Could Improve"
                sx={{ color: "black" }}
              />

              {/* Comments Section */}
              <TextField
                label="Comments"
                multiline
                rows={4}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                variant="outlined"
                fullWidth
                sx={{
                  input: {
                    color: "black", // Set input text color to black
                  },
                  label: {
                    color: "black", // Set label text color to black
                  },
                  border: "1px solid black", // Add black border to the comment box
                }}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ backgroundColor: "white" }}>
            <Button
              onClick={() => setOpenDialog(false)}
              color="primary"
              sx={{ color: "black" }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              color="primary"
              sx={{ color: "black" }}
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

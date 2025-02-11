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
import { mockDataEval } from "../../sampledata/mockData";

const evaluationCriteria = {
  1: [
    "Lack of collaboration among team members.", 
    "Frequent miscommunication leading to inefficiencies.", 
    "Minimal participation in group discussions.", 
    "Team members do not support or assist each other effectively.", 
    "Poor delegation of tasks, leading to confusion and delays.", 
    "No clear teamwork structure or coordination."
  ],
  2: [
    "Occasional coordination issues causing inefficiencies.",
    "Task delegation is inconsistent, leading to workload imbalances.",
    "Collaboration efforts exist but lack effectiveness.",
    "Communication is unclear, causing misunderstandings.",
    "Team members work individually rather than as a unit.",
    "Conflicts arise but are not effectively addressed."
  ],
  3: [
    "Teamwork is functional but lacks refinement.",
    "Collaboration happens but is not always proactive.",
    "Communication is improving but still has gaps.",
    "Team members assist each other but not consistently.",
    "Conflicts are resolved, but not always smoothly.",
    "Task management is structured but could be more efficient."
  ],
  4: [
    "Team demonstrates strong collaboration and shared goals.",
    "Communication is clear, with only minor misunderstandings.",
    "Members actively support and motivate each other.",
    "Task delegation is effective, with only small improvements needed.",
    "Conflicts are handled well, with a positive resolution process.",
    "The team works efficiently, with occasional areas for refinement."
  ],
  5: [
    "Exceptional teamwork and seamless collaboration.",
    "Crystal-clear communication, fostering productivity.",
    "Leadership and unity create a highly efficient team.",
    "Team members proactively support and uplift one another.",
    "Problem-solving is highly effective, even under pressure.",
    "Consistently surpasses teamwork expectations and goals."
  ],
};


const AssessSEPage = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [openDialog, setOpenDialog] = useState(false);
  const [rating, setRating] = useState(0);
  const [selectedCriteria, setSelectedCriteria] = useState([]);
  const [comments, setComments] = useState("");
  const [error, setError] = useState("");

  const handleRatingChange = (value) => {
    setRating(rating === value ? 0 : value);
    setSelectedCriteria([]);
    setError("");
  };

  const handleCriteriaChange = (criterion) => {
    setSelectedCriteria((prev) =>
      prev.includes(criterion) ? prev.filter((c) => c !== criterion) : [...prev, criterion]
    );
    setError("");
  };

  const handleSubmit = async () => {
    if (selectedCriteria.length < 2) {
      setError("Please select at least two predefined comments.");
      return;
    }

    const formData = { rating, selectedCriteria, comments };
    try {
      const response = await axios.post("YOUR_BACKEND_URL_HERE", formData);
      console.log("Form Data Sent to Backend:", response.data);
      handleClose();
    } catch (error) {
      console.error("Error submitting form data:", error);
    }
  };

  const handleOpen = () => {
    setOpenDialog(true);
    setRating(0);
    setSelectedCriteria([]);
    setComments("");
    setError("");
  };

  const handleClose = () => setOpenDialog(false);

  const columns = [
    { field: "evaluationDate", headerName: "Previous Evaluation Date", flex: 1 },
    { field: "mentorName", headerName: "Mentor Name", flex: 1 },
    { field: "seName", headerName: "Social Enterprise", flex: 1 },
  ];

  return (
    <Box m="20px">
      <Header title="ASSESS SE" subtitle="Evaluate and manage SE performance" />
      <Box display="flex" flexDirection="column" alignItems="center" gap={4}>
        <Box width="80%" p={3} bgcolor={colors.primary[400]} display="flex" justifyContent="space-between">
          <Button variant="contained" color="secondary" sx={{ fontSize: "20px", padding: "20px", width: "48%" }} onClick={handleOpen}>
            Evaluate SE
          </Button>
          <Button variant="contained" color="secondary" sx={{ fontSize: "20px", padding: "20px", width: "48%" }}>
            File LOM
          </Button>
        </Box>
        <Box width="80%" height="250px">
          <DataGrid rows={mockDataEval} columns={columns} />
        </Box>
        <Dialog open={openDialog} onClose={handleClose} maxWidth="sm" fullWidth>
          <DialogTitle>Evaluate Social Enterprise</DialogTitle>
          <DialogContent>
            <Typography>Comments on the group's teamwork</Typography>
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
                  bgcolor={value <= rating ? "gold" : "transparent"}
                  sx={{ cursor: "pointer" }}
                  onClick={() => handleRatingChange(value)}
                >
                  <Typography fontSize="24px">★</Typography>
                </Box>
              ))}
            </Box>
            {rating > 0 && (
              <Box sx={{ maxHeight: "150px", overflowY: "auto", mt: 2, p: 1, border: "1px solid #ccc", borderRadius: "5px" }}>
                {evaluationCriteria[rating]?.map((criterion, index) => (
                  <FormControlLabel
                    key={index}
                    control={<Checkbox checked={selectedCriteria.includes(criterion)} onChange={() => handleCriteriaChange(criterion)} />}
                    label={criterion}
                  />
                ))}
              </Box>
            )}
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            <TextField
              label="Additional Comments"
              multiline
              rows={3}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              variant="outlined"
              fullWidth
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} color="primary">Cancel</Button>
            <Button onClick={handleSubmit} color="primary">Submit</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default AssessSEPage;
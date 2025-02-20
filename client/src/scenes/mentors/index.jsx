import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  DialogTitle,
  TextField,
  useTheme,
  Typography,
} from "@mui/material";
import { tokens } from "../../theme";
import { DataGrid } from "@mui/x-data-grid";
import { mockDataMentor } from "../../sampledata/mockData";
import Header from "../../components/Header";
import StatBox from "../../components/StatBox";
import EmailIcon from "@mui/icons-material/Email";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import TrafficIcon from "@mui/icons-material/Traffic";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Mentors = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [rows, setRows] = useState(mockDataMentor);
  const navigate = useNavigate();
  const [mentorshipData, setMentorshipData] = useState({
    selectedMentor: "",
    selectedSocialEnterprise: "",
  });
  const [mentors, setMentors] = useState([]);
  const [socialEnterprises, setSocialEnterprises] = useState([]);
  // Fetch mentors from the database
  useEffect(() => {
    const fetchMentors = async () => {
      try {
        const response = await fetch("http//localhost:4000/api/mentors"); // Adjust based on your API route
        const data = await response.json();
        const formattedData = data.map((mentor) => ({
          id: mentor.mentor_id, // Use actual UUID
          mentor_firstName: mentor.mentor_firstName,
          mentor_lastName: mentor.mentor_lastName,
          mentorName: `${mentor.mentor_firstName} ${mentor.mentor_lastName}`,
          email: mentor.email,
          number: mentor.contactNum,
          numberOfSEsAssigned: mentor.number_SE_assigned,
          status: "Active", // Assuming active by default
        }));
        setRows(formattedData);
      } catch (error) {
        console.error("Error fetching mentors:", error);
      }
    };
    fetchMentors();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch mentors
        const mentorsResponse = await fetch("/api/mentors");
        const mentorsData = await mentorsResponse.json();
        setMentors(
          mentorsData.map((mentor) => ({
            id: mentor.mentor_id,
            name: `${mentor.mentor_firstName} ${mentor.mentor_lastName}`,
          }))
        );

        // Fetch social enterprises
        const seResponse = await fetch(
          "/getAllSocialEnterprisesWithMentorship"
        );
        const seData = await seResponse.json();
        setSocialEnterprises(
          seData.map((se) => ({
            id: se.se_id,
            name: se.team_name,
          }))
        );
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);
  // State for dialogs and data
  const [openDialog, setOpenDialog] = useState(false);
  const [mentorData, setMentorData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    contactNumber: "",
  });
  const [isEditing, setIsEditing] = useState(false); // Toggle editing mode

  // Handle dialog open/close
  const handleDialogOpen = () => {
    setOpenDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
  };

  // Handle input changes for dialog form
  const handleInputChange = (e) => {
    setMentorData({ ...mentorData, [e.target.name]: e.target.value });
  };

  // Submit new mentor data
  const handleSubmit = async () => {
    const { selectedMentor, selectedSocialEnterprise } = mentorshipData;

    if (!selectedMentor || !selectedSocialEnterprise) {
      alert("Please select both a mentor and a social enterprise.");
      return;
    }

    try {
      const response = await fetch("/api/mentorships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mentor_id: selectedMentor,
          se_id: selectedSocialEnterprise,
        }),
      });

      if (response.ok) {
        console.log("Mentorship added successfully");
        handleDialogClose(); // Close the dialog
        setMentorshipData({ selectedMentor: "", selectedSocialEnterprise: "" }); // Reset form
      } else {
        console.error("Error adding mentorship");
      }
    } catch (error) {
      console.error("Failed to add mentorship:", error);
    }
  };

  // Handle row updates
  const handleRowEditCommit = async (params) => {
    const { id, field, value } = params;
    // Update state first for instant UI feedback
    const updatedRows = rows.map((row) =>
      row.id === id ? { ...row, [field]: value } : row
    );
    setRows(updatedRows);

    // Find the updated mentor
    const updatedMentor = updatedRows.find((row) => row.id === id);
    if (!updatedMentor) return;

    // Send only the necessary fields to update
    const updatedMentorData = {
      mentor_id: id,
      mentor_firstName: updatedMentor.mentor_firstName,
      mentor_lastName: updatedMentor.mentor_lastName,
      email: updatedMentor.email,
      contactNum: updatedMentor.number,
      number_SE_assigned: updatedMentor.numberOfSEsAssigned,
    };
    try {
      const response = await fetch(`/api/mentors/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedMentorData),
      });
      if (!response.ok) {
        throw new Error("Failed to update mentor in database");
      }
      console.log("Mentor updated successfully");
    } catch (error) {
      console.error("Error updating mentor:", error);
    }
  };

  // Toggle editing mode
  const toggleEditing = () => {
    setIsEditing((prev) => !prev);
  };

  const columns = [
    {
      field: "mentorName",
      headerName: "Mentor Name",
      flex: 1,
      cellClassName: "name-column--cell",
      editable: isEditing, // Make editable when in edit mode
    },
    {
      field: "email",
      headerName: "Email",
      flex: 1,
      editable: isEditing, // Make editable when in edit mode
    },
    {
      field: "number",
      headerName: "Contact Number",
      flex: 1,
      editable: isEditing, // Make editable when in edit mode
    },
    {
      field: "numberOfSEsAssigned",
      headerName: "SEs Assigned",
      headerAlign: "left",
      align: "left",
      flex: 1,
      type: "number",
      editable: isEditing, // Make editable when in edit mode
    },
    {
      field: "status",
      headerName: "Status",
      flex: 1,
      editable: isEditing, // Make editable when in edit mode
      renderCell: (params) => <Box>{params.value}</Box>,
      renderEditCell: (params) => (
        <TextField
          select
          value={params.value}
          onChange={(e) =>
            params.api.setEditCellValue({
              id: params.id,
              field: params.field,
              value: e.target.value,
            })
          }
          fullWidth
        >
          <MenuItem value="Active">Active</MenuItem>
          <MenuItem value="Inactive">Inactive</MenuItem>
        </TextField>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 150,
      renderCell: (params) => (
        <Button
          variant="contained"
          size="small"
          onClick={() => navigate(`/mentor-analytics/${params.row.id}`)}
        >
          View Mentor
        </Button>
      ),
    },
  ];

  return (
    <Box m="20px">
      {/* HEADER */}
      <Header title="MENTORS" subtitle="Manage Mentors" />

      {/* ROW 1: STAT BOXES */}
      {/* ROW 1: STAT BOXES */}
      <Box
        display="grid"
        gridTemplateColumns="repeat(12, 1fr)"
        gridAutoRows="140px"
        gap="20px"
      >
        <Box
          gridColumn="span 3"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <StatBox
            title="13"
            subtitle="Unassigned Mentors"
            progress="0.75"
            increase="+14%"
            icon={
              <EmailIcon
                sx={{ color: colors.greenAccent[600], fontSize: "26px" }}
              />
            }
          />
        </Box>
        <Box
          gridColumn="span 3"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <StatBox
            title="44"
            subtitle="Assigned Mentors"
            progress="0.50"
            increase="+21%"
            icon={
              <PointOfSaleIcon
                sx={{ color: colors.greenAccent[600], fontSize: "26px" }}
              />
            }
          />
        </Box>
        <Box
          gridColumn="span 3"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <StatBox
            title="Lebron James"
            subtitle="Most Assigned"
            progress="0.30"
            increase="+5%"
            icon={
              <PersonAddIcon
                sx={{ color: colors.greenAccent[600], fontSize: "26px" }}
              />
            }
          />
        </Box>
        <Box
          gridColumn="span 3"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <StatBox
            title="Lavar Ball"
            subtitle="Least Assigned"
            progress="0.80"
            increase="+43%"
            icon={
              <TrafficIcon
                sx={{ color: colors.greenAccent[600], fontSize: "26px" }}
              />
            }
          />
        </Box>
      </Box>

      {/* ADD MENTOR BUTTON AND EDIT TOGGLE */}
      <Box display="flex" gap="10px" mt="20px">
        <Button
          variant="contained"
          sx={{
            backgroundColor: colors.greenAccent[500],
            color: "black",
            "&:hover": {
              backgroundColor: colors.greenAccent[600],
            },
          }}
          onClick={handleDialogOpen}
        >
          Add Mentorship
        </Button>
        <Button
          variant="contained"
          sx={{
            backgroundColor: colors.blueAccent[500],
            color: "black",
            "&:hover": {
              backgroundColor: colors.blueAccent[800],
            },
          }}
          onClick={toggleEditing}
        >
          {isEditing ? "Disable Editing" : "Enable Editing"}
        </Button>
      </Box>

      {/* DIALOG BOX */}
      <Dialog
        open={openDialog}
        onClose={handleDialogClose}
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
        {/* Dialog Title */}
        <DialogTitle
          sx={{
            backgroundColor: "#1E4D2B", // DLSU Green header
            color: "#fff", // White text
            textAlign: "center",
            fontSize: "1.5rem",
            fontWeight: "bold",
          }}
        >
          Add New Mentorship
        </DialogTitle>

        {/* Dialog Content */}
        <DialogContent
          sx={{
            padding: "24px",
            maxHeight: "70vh", // Ensure it doesn't overflow the screen
            overflowY: "auto", // Enable scrolling if content is too long
          }}
        >
          {/* Place Dropdowns Side by Side */}
          <Box
            display="flex"
            gap={2} // Add spacing between dropdowns
            alignItems="center" // Align dropdowns vertically
            mb={2} // Add margin at the bottom
            marginTop="20px"
          >
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: "bold",
                marginBottom: "8px", // Space between label and dropdown
              }}
            >
              Mentor
            </Typography>
            {/* Mentor Dropdown */}
            <FormControl fullWidth margin="normal">
              <InputLabel
                id="mentor-label"
                sx={{
                  backgroundColor: "#fff", // Prevent overlap with the border
                  padding: "0 4px", // Add padding for readability
                  "&.Mui-focused": {
                    backgroundColor: "#fff", // Ensure the background remains white when focused
                  },
                }}
              >
                Select Mentor
              </InputLabel>
              <Select
                labelId="mentor-label"
                name="selectedMentor"
                value={mentorshipData.selectedMentor}
                onChange={handleInputChange}
                label="Select Mentor"
                sx={{
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#000", // Consistent border color
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#000", // Darken border on hover
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#000", // Consistent border color when focused
                  },
                }}
              >
                {mentors.map((mentor) => (
                  <MenuItem key={mentor.id} value={mentor.id}>
                    {mentor.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: "bold",
                marginBottom: "8px", // Space between label and dropdown
              }}
            >
              Social Enterprise
            </Typography>
            {/* Social Enterprise Dropdown */}
            <FormControl fullWidth margin="normal">
              <InputLabel
                id="mentor-label"
                sx={{
                  backgroundColor: "#fff", // Prevent overlap with the border
                  padding: "0 4px", // Add padding for readability
                  "&.Mui-focused": {
                    backgroundColor: "#fff", // Ensure the background remains white when focused
                  },
                }}
              >
                Select Mentor
              </InputLabel>
              <Select
                labelId="se-label"
                name="selectedSocialEnterprise"
                value={mentorshipData.selectedSocialEnterprise}
                onChange={handleInputChange}
                label="Select Social Enterprise"
                sx={{
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#000", // Consistent border color
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#000", // Darken border on hover
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#000", // Consistent border color when focused
                  },
                }}
              >
                {socialEnterprises.map((se) => (
                  <MenuItem key={se.id} value={se.id}>
                    {se.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>

        {/* Dialog Actions */}
        <DialogActions
          sx={{
            padding: "16px",
            borderTop: "1px solid #000", // Separator line
          }}
        >
          <Button
            onClick={handleDialogClose}
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
              backgroundColor: "#1E4D2B", // DLSU Green button
              color: "#fff",
              "&:hover": {
                backgroundColor: "#145A32", // Darker green on hover
              },
            }}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      {/* ROW 2: DATA GRID */}
      <Box
        height="75vh"
        mt="20px"
        sx={{
          "& .MuiDataGrid-root": {
            border: "none",
          },
          "& .MuiDataGrid-cell": {
            borderBottom: "none",
          },
          "& .name-column--cell": {
            color: colors.greenAccent[300],
          },
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: colors.blueAccent[700],
            borderBottom: "none",
            color: colors.grey[100],
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
          rows={rows}
          columns={columns}
          onCellEditCommit={handleRowEditCommit}
          editMode="row"
        />
      </Box>
    </Box>
  );
};

export default Mentors;

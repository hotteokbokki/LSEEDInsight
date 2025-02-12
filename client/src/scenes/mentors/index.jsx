import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  MenuItem,
  useTheme,
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

  // Fetch mentors from the database
  useEffect(() => {
    const fetchMentors = async () => {
      try {
        const response = await fetch("/api/mentors"); // Adjust based on your API route
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
    const newMentor = {
      mentor_id: crypto.randomUUID(), // Generate a unique UUID
      mentor_firstName: mentorData.firstName,
      mentor_lastName: mentorData.lastName,
      email: mentorData.email,
      contactNum: mentorData.contactNumber,
      number_SE_assigned: 0, // Default
    };
    try {
      const response = await fetch("/api/mentors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMentor),
      });
      if (response.ok) {
        console.log("Mentor added successfully");
        // Fetch latest data from the backend
        const updatedResponse = await fetch("/api/mentors");
        const updatedData = await updatedResponse.json();
        const formattedData = updatedData.map((mentor) => ({
          id: mentor.mentor_id,
          mentorName: `${mentor.mentor_firstName} ${mentor.mentor_lastName}`,
          email: mentor.email,
          number: mentor.contactNum,
          numberOfSEsAssigned: mentor.number_SE_assigned,
          status: "Active",
        }));
        setRows(formattedData); // Update frontend with new data
        setOpenDialog(false);
        setMentorData({
          firstName: "",
          lastName: "",
          email: "",
          contactNumber: "",
        });
      } else {
        console.error("Error adding mentor");
      }
    } catch (error) {
      console.error("Failed to add mentor:", error);
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
          Add Mentor
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
      <Dialog open={openDialog} onClose={handleDialogClose}>
        <DialogTitle>Add New Mentor</DialogTitle>
        <DialogContent>
          <TextField
            label="First Name"
            name="firstName"
            value={mentorData.firstName}
            onChange={handleInputChange}
            fullWidth
            margin="dense"
          />
          <TextField
            label="Last Name"
            name="lastName"
            value={mentorData.lastName}
            onChange={handleInputChange}
            fullWidth
            margin="dense"
          />
          <TextField
            label="Email"
            name="email"
            value={mentorData.email}
            onChange={handleInputChange}
            fullWidth
            margin="dense"
          />
          <TextField
            label="Contact Number"
            name="contactNumber"
            value={mentorData.contactNumber}
            onChange={handleInputChange}
            fullWidth
            margin="dense"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
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

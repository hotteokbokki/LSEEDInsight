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
import axios from "axios";
import { DataGrid } from "@mui/x-data-grid";
import Header from "../../components/Header";
import StatBox from "../../components/StatBox";
import EmailIcon from "@mui/icons-material/Email";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import TrafficIcon from "@mui/icons-material/Traffic";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Snackbar, Alert } from "@mui/material";

const Mentors = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [rows, setRows] = useState();
  const navigate = useNavigate();
  const [mentorshipData, setMentorshipData] = useState({
    selectedMentor: "",
    selectedSocialEnterprise: "",
  });
  const [mentorships, setMentorships] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [socialEnterprises, setSocialEnterprises] = useState([]);
  const [isSuccessPopupOpen, setIsSuccessPopupOpen] = useState(false);
  const [isSuccessEditPopupOpen, setIsSuccessEditPopupOpen] = useState(false);
  const [stats, setStats] = useState(null);

  // Fetch mentors from the database
  useEffect(() => {
    const fetchMentors = async () => {
      try {
        const response = await axios.get("http://localhost:4000/api/mentors"); // ✅ Fixed URL
        console.log("📥 API Response:", response.data); // ✅ Debugging Log

        const formattedData = response.data.map((mentor) => ({
          id: mentor.mentor_id, // ✅ Use actual UUID as ID
          mentor_firstName: mentor.mentor_firstName,
          mentor_lastName: mentor.mentor_lastName,
          mentorName: `${mentor.mentor_firstName} ${mentor.mentor_lastName}`,
          email: mentor.email,
          number: mentor.contactNum || "N/A", // ✅ Handle null values
          numberOfSEsAssigned: mentor.number_SE_assigned || 0, // ✅ Ensure it's a number
          status: "Active", // Assuming active by default
        }));

        console.log("✅ Formatted Data:", formattedData);
        setRows(formattedData); // ✅ Correctly setting state
      } catch (error) {
        console.error("❌ Error fetching mentors:", error);
      }
    };

    fetchMentors();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`http://localhost:4000/api/mentor-stats`);
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error("Error fetching analytics stats:", error);
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch active mentors
        const mentorsResponse = await fetch(
          "http://localhost:4000/api/active-mentors"
        );
        const mentorsData = await mentorsResponse.json();
        setMentors(mentorsData);

        // Fetch social enterprises without mentors
        const seResponse = await fetch(
          "http://localhost:4000/api/social-enterprises-without-mentor"
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
  const [showEditButtons, setShowEditButtons] = useState(false);

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
      const response = await fetch("http://localhost:4000/api/mentorships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mentor_id: selectedMentor,
          se_id: selectedSocialEnterprise,
        }),
      });

      if (response.ok) {
        console.log("Mentorship added successfully");

        // Close the dialog box
        setOpenDialog(false);

        // Reset the form data
        setMentorshipData({ selectedMentor: "", selectedSocialEnterprise: "" });

        // Show success popup
        setIsSuccessPopupOpen(true);

        // Fetch latest data
        await fetchLatestMentorships();

        // Refresh the page after a short delay to ensure updates are reflected
        setTimeout(() => {
          window.location.reload();
        }, 500); // Adjust delay if needed
      } else {
        console.error("Error adding mentorship");
      }
    } catch (error) {
      console.error("Failed to add mentorship:", error);
    }
  };

  const fetchLatestMentorships = async () => {
    try {
      const response = await fetch("http://localhost:4000/api/mentorships"); // Adjust the endpoint as needed
      if (response.ok) {
        const updatedMentorships = await response.json();
        // Update the state with the latest mentorship data
        setMentorships(updatedMentorships); // Assuming you have a state variable `mentorships`
      } else {
        console.error("Failed to fetch latest mentorships");
      }
    } catch (error) {
      console.error("Error fetching mentorships:", error);
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
      const response = await fetch(`http://localhost:4000/api/mentors/${id}`, {
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
    setIsEditing(true);
    setShowEditButtons(true); // Toggle button visibility
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
            title={stats?.mentorWithoutMentorshipCount[0]?.count} // Render dynamic value
            subtitle="Unassigned Mentors"
            progress={
              parseInt(stats?.mentorWithoutMentorshipCount[0]?.count) /
              parseInt(stats?.mentorCountTotal[0]?.count)
            } // Calculate percentage of unassigned mentors
            increase={`${(
              (parseInt(stats?.mentorWithoutMentorshipCount[0]?.count) /
                parseInt(stats?.mentorCountTotal[0]?.count)) *
              100
            ).toFixed(2)}%`} // Calculate percentage of mentors with mentorship
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
            title={stats?.mentorWithMentorshipCount[0]?.count}
            subtitle="Assigned Mentors"
            progress={
              parseInt(stats?.mentorWithMentorshipCount[0]?.count) /
              parseInt(stats?.mentorCountTotal[0]?.count)
            } // Calculate percentage filled
            increase={`${(
              (parseInt(stats?.mentorWithMentorshipCount[0]?.count) /
                parseInt(stats?.mentorCountTotal[0]?.count)) *
              100
            ).toFixed(2)}%`} // Calculate percentage of mentors with mentorship
            icon={
              <PointOfSaleIcon
                sx={{ fontSize: "26px", color: colors.blueAccent[500] }}
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
            title={`${stats?.mostAssignedMentor[0]?.mentor_firstname} ${stats?.mostAssignedMentor[0]?.mentor_lastname}`}
            subtitle="Most Assigned"
            progress={(
              stats?.mostAssignedMentor[0]?.num_assigned_se /
              stats?.totalSECount[0]?.count
            ).toFixed(2)} // Calculate progress (assigned SE count / total SE count)
            increase={`${(
              (stats?.mostAssignedMentor[0]?.num_assigned_se /
                stats?.totalSECount[0]?.count -
                0) *
              100
            ).toFixed(2)}%`} // Adjust to calculate increase
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
            title={`${stats?.leastAssignedMentor[0]?.mentor_firstname} ${stats?.leastAssignedMentor[0]?.mentor_lastname}`}
            subtitle="Least Assigned"
            progress={(
              stats?.leastAssignedMentor[0]?.num_assigned_se /
              stats?.totalSECount[0]?.count
            ).toFixed(2)} // Calculate progress (assigned SE count / total SE count)
            increase={`${(
              (stats?.leastAssignedMentor[0]?.num_assigned_se /
                stats?.totalSECount[0]?.count -
                0) *
              100
            ).toFixed(2)}%`} // Adjust to calculate increase
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

        <Box display="flex" alignItems="center" gap={2}>
          {!showEditButtons && (
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
              Enable Editing
            </Button>
          )}
          {/* Cancel and Save Changes Buttons */}
          {showEditButtons && (
            <>
              <Button
                variant="outlined"
                sx={{
                  backgroundColor: colors.redAccent[500],
                  color: "black",
                  "&:hover": {
                    backgroundColor: colors.redAccent[600],
                  },
                }}
                onClick={() => {
                  setIsEditing(false); // Disable editing mode
                  setShowEditButtons(false);
                  setTimeout(() => {
                    window.location.reload();
                  }, 500); // Adjust delay if needed
                }}
              >
                Cancel
              </Button>

              <Button
                variant="contained"
                sx={{
                  backgroundColor: colors.blueAccent[500],
                  color: "black",
                  "&:hover": {
                    backgroundColor: colors.blueAccent[600],
                  },
                }}
                onClick={() => {
                  setIsEditing(false); // Disable editing mode
                  setShowEditButtons(false);
                  setIsSuccessEditPopupOpen(true);
                  setTimeout(() => {
                    window.location.reload();
                  }, 500); // Adjust delay if needed
                }}
              >
                Save Changes
              </Button>
            </>
          )}
        </Box>
        <Snackbar
          open={isSuccessEditPopupOpen}
          autoHideDuration={3000} // Automatically close after 3 seconds
          onClose={() => setIsSuccessEditPopupOpen(false)} // Close on click or timeout
          anchorOrigin={{ vertical: "top", horizontal: "center" }} // Position of the popup
        >
          <Alert
            onClose={() => setIsSuccessEditPopupOpen(false)}
            severity="success"
            sx={{ width: "100%" }}
          >
            Successfully saved!
          </Alert>
        </Snackbar>
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
                onChange={(e) =>
                  setMentorshipData({
                    ...mentorshipData,
                    selectedMentor: e.target.value,
                  })
                }
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
                  "& .MuiSelect-select": {
                    color: "#000", // Ensure the selected text is black
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
                Select Social Enterprise
              </InputLabel>
              <Select
                labelId="se-label"
                name="selectedSocialEnterprise"
                value={mentorshipData.selectedSocialEnterprise}
                onChange={(e) =>
                  setMentorshipData({
                    ...mentorshipData,
                    selectedSocialEnterprise: e.target.value,
                  })
                }
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
                  "& .MuiSelect-select": {
                    color: "#000", // Ensure the selected text is black
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
            onClick={handleSubmit} // Calls the updated handleSubmit function
            variant="contained"
            disabled={
              !mentorshipData.selectedMentor ||
              !mentorshipData.selectedSocialEnterprise
            } // 🔥 Disables if either field is empty
            sx={{
              backgroundColor:
                mentorshipData.selectedMentor &&
                mentorshipData.selectedSocialEnterprise
                  ? "#1E4D2B"
                  : "#A0A0A0", // Gray when disabled
              color: "#fff",
              "&:hover": {
                backgroundColor:
                  mentorshipData.selectedMentor &&
                  mentorshipData.selectedSocialEnterprise
                    ? "#145A32"
                    : "#A0A0A0", // Keep gray on hover if disabled
              },
            }}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={isSuccessPopupOpen} // Controlled by state
        autoHideDuration={3000} // Automatically close after 3 seconds
        onClose={() => setIsSuccessPopupOpen(false)} // Close on click or timeout
        anchorOrigin={{ vertical: "top", horizontal: "center" }} // Position of the popup
      >
        <Alert
          onClose={() => setIsSuccessPopupOpen(false)}
          severity="success"
          sx={{ width: "100%" }}
        >
          Mentorship added successfully!
        </Alert>
      </Snackbar>
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

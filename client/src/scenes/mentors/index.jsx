import {
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  useTheme,
  Typography,
} from "@mui/material";
import { tokens } from "../../theme";
import axios from "axios";
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";
import PersonIcon from "@mui/icons-material/Person";
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
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [mentorSearch, setMentorSearch] = useState(""); // For autocomplete input
  const [selectedSE, setSelectedSE] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  // Fetch mentors from the database
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
        contactnum: mentor.contactNum || "N/A", // ✅ Handle null values
        numberOfSEsAssigned: mentor.number_SE_assigned || 0, // ✅ Ensure it's a number
        status: "Active", // Assuming active by default
      }));

      console.log("✅ Formatted Data:", formattedData);
      setRows(formattedData); // ✅ Correctly setting state
    } catch (error) {
      console.error("❌ Error fetching mentors:", error);
    }
  };

  useEffect(() => {
    fetchMentors();
  }, []);

  useEffect(() => {
    if (selectedMentor) {
      fetchSocialEnterprises(selectedMentor.mentor_id);
    }
  }, [selectedMentor]);

  // Function to fetch assigned social enterprises
  const fetchSocialEnterprises = async (mentorId) => {
    try {
      const response = await fetch(
        `http://localhost:4000/api/mentors/${mentorId}/social-enterprises`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json(); // ✅ Ensure response is parsed as JSON
      setSocialEnterprises(data);
      console.log("📥 Social Enterprises Data:", data);
      return data;
    } catch (error) {
      console.error("Error fetching social enterprises:", error);
    }
  };

  // Handle row updates
  const handleMentorRowUpdate = async (params) => {
    console.log("🔍 handleMentorRowUpdate received:", params);

    // Prepare updated mentor data for the API
    const updatedMentorData = {
      mentor_firstName: params.mentor_firstName,
      mentor_lastName: params.mentor_lastName,
      email: params.email,
      contactnum: params.contactnum,
      isactive: params.status === "Active" ? true : false,
    };

    // Check if params contains the expected structure
    Object.keys(params).forEach((key) => {
      console.log(`🛠 params[${key}]:`, params[key]);
    });

    setRows(updatedMentorData);

    try {
      const response = await axios.put(
        `http://localhost:4000/api/mentors/${params.id}`,
        updatedMentorData,
        { headers: { "Content-Type": "application/json" } }
      );

      if (response.status === 200) {
        console.log("✅ Mentor updated successfully:", response.data);
      } else {
        throw new Error("Failed to update mentor in database");
      }
    } catch (error) {
      console.error("❌ Error updating mentor:", error);
    }
  };

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
          "http://localhost:4000/api/mentors"
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

  const handleRemoveMentorship = async () => {
    if (!selectedMentor || !selectedSE) {
      alert("Please select a mentor and a social enterprise.");
      return;
    }
    console.log("mentorId: ", selectedMentor.mentor_id, " seId: ", selectedSE);
    try {
      const response = await fetch(
        `http://localhost:4000/api/remove-mentorship`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mentorId: selectedMentor.mentor_id,
            seId: selectedSE,
          }),
        }
      );

      if (response.ok) {
        setSnackbarOpen(true);
        setTimeout(() => {
          window.location.reload();
        }, 500); // Adjust delay if needed
        setIsModalOpen(false);
        setSelectedMentor(null);
        setSelectedSE("");
        fetchMentors(); // Refresh mentor list
      } else {
        alert("Failed to remove mentorship.");
      }
    } catch (error) {
      console.error("Error removing mentorship:", error);
    }
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

  // Toggle editing mode
  const toggleEditing = () => {
    setIsEditing(true);
    setShowEditButtons(true); // Toggle button visibility
  };

  const columns = [
    {
      field: "mentor_firstName",
      headerName: "First Name",
      flex: 1,
      cellClassName: "name-column--cell",
      renderCell: (params) => `${params.row.mentor_firstName}`,
      editable: isEditing, // Make editable when in edit mode
    },
    {
      field: "mentor_lastName",
      headerName: "Last Name",
      flex: 1,
      cellClassName: "name-column--cell",
      renderCell: (params) => `${params.row.mentor_lastName}`,
      editable: isEditing, // Make editable when in edit mode
    },
    {
      field: "email",
      headerName: "Email",
      flex: 1,
      renderCell: (params) => `${params.row.email}`,
      editable: isEditing, // Make editable when in edit mode
    },
    {
      field: "contactnum",
      headerName: "Contact Number",
      flex: 1,
      renderCell: (params) => `${params.row.contactnum}`,
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
              <PersonIcon
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
              <PersonIcon
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
              <PersonRemoveIcon
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
          {/* Remove Mentorship Button */}
          <Button
            variant="contained"
            sx={{
              backgroundColor: colors.redAccent[500],
              color: "black",
              "&:hover": { backgroundColor: colors.redAccent[600] },
            }}
            onClick={() => setIsModalOpen(true)}
          >
            Remove Mentorship
          </Button>

          {/* Remove Mentorship Modal */}
          <Dialog
            open={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            fullWidth
            maxWidth="sm"
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
              Remove Mentorship
            </DialogTitle>

            {/* Dialog Content */}
            <DialogContent
              sx={{
                padding: "24px",
                maxHeight: "70vh", // Ensure it doesn't overflow the screen
                overflowY: "auto", // Enable scrolling if content is too long
                backgroundColor: "#fff", // White background
              }}
            >
              {/* Place Fields Side by Side */}
              <Box
                display="flex"
                gap={2} // Add spacing between fields
                alignItems="center" // Align fields vertically
                mb={2} // Add margin at the bottom
                marginTop="20px"
              >
                <Typography
                  variant="subtitle1"
                  sx={{
                    color: "#000", // Black text
                    fontWeight: "bold",
                    marginBottom: "8px", // Space between label and field
                  }}
                >
                  Mentor
                </Typography>
                {/* Mentor Selection (Autocomplete) */}
                <FormControl fullWidth margin="normal">
                  <Autocomplete
                    options={mentors}
                    getOptionLabel={(mentor) =>
                      `${mentor.mentor_firstName} ${mentor.mentor_lastName}`
                    }
                    value={selectedMentor}
                    onChange={(event, newValue) => setSelectedMentor(newValue)}
                    inputValue={mentorSearch}
                    onInputChange={(event, newInputValue) =>
                      setMentorSearch(newInputValue)
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Select Mentor"
                        fullWidth
                        sx={{
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#000 !important", // Consistent border color
                          },
                          "&:hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#000 !important",
                          },
                          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#000 !important",
                          },
                          "& .Mui-disabled .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#000 !important", // Ensures border is black when disabled
                          },
                          "& .MuiInputBase-input": {
                            color: "#000 !important", // Keeps text black when enabled
                          },
                          "& .Mui-disabled .MuiInputBase-input": {
                            color: "#000 !important", // Keeps text black when disabled
                            WebkitTextFillColor: "#000 !important", // Fixes opacity issue in some browsers
                          },
                        }}
                      />
                    )}
                  />
                </FormControl>

                <Typography
                  variant="subtitle1"
                  sx={{
                    color: "#000", // Black text
                    fontWeight: "bold",
                    marginBottom: "8px", // Space between label and field
                  }}
                >
                  Social Enterprise
                </Typography>
                {/* Social Enterprise Selection */}
                <FormControl fullWidth margin="normal">
                  <TextField
                    select
                    label="Select Social Enterprise"
                    fullWidth
                    value={selectedSE}
                    onChange={(event) => setSelectedSE(event.target.value)}
                    disabled={!selectedMentor || socialEnterprises.length === 0}
                    sx={{
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#000 !important", // Keeps border black
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#000 !important",
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#000 !important",
                      },
                      "& .Mui-disabled .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#000 !important", // Ensures black border when disabled
                      },
                      "& .MuiInputBase-input": {
                        color: "#000 !important", // Keeps text black when enabled
                      },
                      "& .Mui-disabled .MuiInputBase-input": {
                        color: "#000 !important", // Ensures text stays black when disabled
                        WebkitTextFillColor: "#000 !important", // Fixes opacity issue in some browsers
                      },
                    }}
                  >
                    {socialEnterprises.length > 0 ? (
                      socialEnterprises.map((se) => (
                        <MenuItem key={se.se_id} value={se.se_id}>
                          {se.team_name}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled>No SEs assigned</MenuItem>
                    )}
                  </TextField>
                </FormControl>
              </Box>
            </DialogContent>

            {/* Dialog Actions */}
            <DialogActions
              sx={{
                padding: "16px",
                borderTop: "1px solid #000", // Separator line
                backgroundColor: "#fff",
              }}
            >
              <Button
                onClick={() => {
                  setIsModalOpen(false);
                  setTimeout(() => {
                    window.location.reload();
                  }, 500); // Adjust delay if needed
                }}
                sx={{
                  color: "#000",
                  border: "1px solid #000",
                  "&:hover": {
                    backgroundColor: "#e0e0e0", // Hover effect
                  },
                }}
              >
                Cancel
              </Button>

              <Button
                onClick={handleRemoveMentorship}
                variant="contained"
                disabled={!selectedMentor || !selectedSE} // Disables if either field is empty
                sx={{
                  backgroundColor:
                    selectedMentor && selectedSE ? "#1E4D2B" : "#A0A0A0", // Gray when disabled
                  color: "#fff",
                  "&:hover": {
                    backgroundColor:
                      selectedMentor && selectedSE ? "#145A32" : "#A0A0A0", // Keep gray on hover if disabled
                  },
                }}
              >
                Confirm
              </Button>
            </DialogActions>
          </Dialog>

          {/* Snackbar for success message */}
          <Snackbar
            open={snackbarOpen}
            autoHideDuration={3000} // Closes after 3 seconds
            onClose={() => setSnackbarOpen(false)}
            anchorOrigin={{ vertical: "top", horizontal: "center" }}
          >
            <Alert
              onClose={() => setSnackbarOpen(false)}
              severity="success"
              sx={{ width: "100%" }}
            >
              Successfully removed!
            </Alert>
          </Snackbar>

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
                onClick={async () => {
                  try {
                    const selectedRow = rows.find(
                      (row) => row.id === selectedRowId
                    ); // Replace `selectedRowId`
                    if (selectedRow) {
                      handleMentorRowUpdate({
                        id: selectedRow.id,
                        field: "email",
                        value: selectedRow.email,
                      });
                    } else {
                      console.error("No mentor selected for update");
                    }
                    setIsEditing(false);
                    setShowEditButtons(false);
                    setIsSuccessEditPopupOpen(true);
                  } catch (error) {
                    console.error("Failed to update mentor:", error);
                    alert("Failed to save changes. Please try again.");
                  }
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
                value={mentorshipData.selectedMentor || ""}
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
                  <MenuItem key={mentor.mentor_id} value={mentor.mentor_id}>
                    {mentor.mentor_firstName} {mentor.mentor_lastName}
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
            onClick={() => {
              handleDialogClose(); // Close the dialog
              setTimeout(() => {
                window.location.reload();
              }, 500); // Adjust delay if needed
            }}
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
        width="100%"
        backgroundColor={colors.primary[400]}
        padding="20px"
        marginTop="20px"
      >
        <Typography
          variant="h3"
          fontWeight="bold"
          color={colors.greenAccent[500]}
          marginBottom="15px" // Ensures a small gap between header & DataGrid
        >
          Mentors
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
              color: colors.grey[100],
            },
          }}
        >
          <DataGrid
            rows={rows}
            columns={columns}
            getRowId={(row) => row.id} // Use `id` as the unique identifier
            processRowUpdate={(params) => {
              handleMentorRowUpdate(params);
              return params;
            }}
            editMode="row"
          />
        </Box>
      </Box>
    </Box>
  );
};

export default Mentors;

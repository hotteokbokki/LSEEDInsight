import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  useTheme,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
} from "@mui/material";
import { DataGrid, GridActionsCellItem } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import Header from "../../components/Header";
import SEPerformanceTrendChart from "../../components/SEPerformanceTrendChart";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import { useNavigate } from "react-router-dom"; // For navigation
import { Snackbar, Alert } from "@mui/material";
import { JsonRequestError } from "@fullcalendar/core/index.js";

const Mentorships = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate(); // Initialize navigation
  const [socialEnterpriseData, setSocialEnterpriseData] = useState({
    name: "",
    selectedSDG: "",
    contact: "",
    numberOfMembers: "",
    selectedProgram: "",
    selectedStatus: "",
    abbr: "", // Add abbreviation field
  });

  const userSession = JSON.parse(localStorage.getItem("user"));

  const [programFormData, setProgramFormData] = useState({
    name: "",
    description: "",
  });

  const [isSuccessPopupOpen, setIsSuccessPopupOpen] = useState(false);
  // State for dialogs
  const [openAddSE, setOpenAddSE] = useState(false);
  const [openAddProgram, setOpenAddProgram] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showEditButtons, setShowEditButtons] = useState(false);
  const [isSuccessEditPopupOpen, setIsSuccessEditPopupOpen] = useState(false);

  const [sdgs, setSdgs] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);
  // State for fetched data
  const [socialEnterprises, setSocialEnterprises] = useState([]);
  const [loading, setLoading] = useState(true); // Loading state for API call

  // Handle dialog open/close
  const handleOpenAddSE = () => setOpenAddSE(true);
  const handleCloseAddSE = () => setOpenAddSE(false);
  const handleOpenAddProgram = () => setOpenAddProgram(true);
  const handleCloseAddProgram = () => setOpenAddProgram(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSocialEnterpriseData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const toggleEditing = () => {
    setIsEditing((prev) => !prev); // Toggle editing mode
    setShowEditButtons((prev) => !prev); // Show/hide the "Cancel" and "Save Changes" buttons
  };

  // Fetch social enterprises from the backend
  useEffect(() => {
    const fetchSocialEnterprise = async () => {
      try {
        const mentor_id = userSession.id; // Replace with actual mentor ID

        const response = await axios.get(
          "http://localhost:4000/getAllSocialEnterpriseswithMentorID",
          { params: { mentor_id } } // Pass mentor_id as a query parameter
        );

        const updatedSocialEnterprises = response.data.map((se) => ({
          id: se.se_id,
          name: se.team_name || "Unnamed SE",
          program: se.program_name || "No Program", // ✅ Include program name
          mentorshipStatus: se.mentors.length > 0 ? "Has Mentor" : "No Mentor",
          mentors:
            se.mentors.map((m) => m.mentor_name).join(", ") || "No mentors",
        }));

        setSocialEnterprises(updatedSocialEnterprises);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching social enterprises:", error);
        setLoading(false);
      }
    };
    fetchSocialEnterprise();
  }, []);

  useEffect(() => {
    const fetchSDGs = async () => {
      try {
        const response = await fetch("http://localhost:4000/getAllSDG"); // Call the API endpoint
        const data = await response.json();
        setSdgs(data); // Update the state with the fetched SDGs
      } catch (error) {
        console.error("Error fetching SDGs:", error);
      }
    };
    fetchSDGs();
  }, []);

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const response = await fetch("http://localhost:4000/getPrograms"); // Call the API endpoint
        const data = await response.json();
        setPrograms(data); // Update the state with the fetched programs
      } catch (error) {
        console.error("Error fetching programs:", error);
      }
    };
    fetchPrograms();
  }, []);

  const handleProgramInputChange = (e) => {
    const { name, value } = e.target;
    setProgramFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleAddProgram = async () => {
    try {
      // Basic validation
      if (!programFormData.name.trim()) {
        alert("Program name is required");
        return;
      }

      // Send the program data to the backend
      const response = await axios.post(
        "http://localhost:4000/api/programs",
        programFormData
      );

      if (response.status === 201) {
        console.log("Program added successfully:", response.data);
        setIsSuccessPopupOpen(true);
        handleCloseAddProgram(); // Close the dialog
        setProgramFormData({ name: "", description: "" }); // Reset form fields
      }
    } catch (error) {
      console.error("Failed to add program:", error);
      alert("Failed to add program. Please try again.");
    }
  };

  const handleSubmit = async () => {
    try {
      // Basic validation
      if (!socialEnterpriseData.name.trim()) {
        alert("Name is required");
        return;
      }
      if (!socialEnterpriseData.selectedSDG) {
        alert("SDG is required");
        return;
      }
      if (!socialEnterpriseData.contact.trim()) {
        alert("Contact is required");
        return;
      }
      if (!socialEnterpriseData.selectedProgram) {
        alert("Program is required");
        return;
      }
      if (!socialEnterpriseData.selectedStatus) {
        alert("Status is required");
        return;
      }

      // Proceed with submission
      const newSocialEnterprise = {
        name: socialEnterpriseData.name,
        sdg_name: socialEnterpriseData.selectedSDG, // Send SDG name
        contactnum: socialEnterpriseData.contact,
        number_of_members: socialEnterpriseData.numberOfMembers || 0, // Default to 0 if not provided
        program_name: socialEnterpriseData.selectedProgram, // Send program name
        isactive: socialEnterpriseData.selectedStatus === "Active", // Convert to boolean
        abbr: socialEnterpriseData.abbr || null, // Default to null if not provided
      };

      const response = await fetch(
        "http://localhost:4000/api/social-enterprises",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newSocialEnterprise),
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log(
          "Social Enterprise added successfully with SE ID:",
          data.se_id
        ); // Use se_id
        handleCloseAddSE(); // Close the dialog
        setSocialEnterpriseData({
          name: "",
          selectedSDG: "",
          contact: "",
          numberOfMembers: "",
          selectedProgram: "",
          selectedStatus: "",
          abbr: "",
        });
      } else {
        console.error("Error adding Social Enterprise");
      }
    } catch (error) {
      console.error("Failed to add Social Enterprise:", error);
    }
  };

  // Handle row click
  const handleRowClick = (params) => {
    if (isEditing) {
      setSelectedRow(params.row);
      setOpenEditDialog(true);
    }
  };

  const handleCloseEditDialog = () => setOpenEditDialog(false);

  const handleEditChange = (e) => {
    setSelectedRow({ ...selectedRow, [e.target.name]: e.target.value });
  };

  const columns = [
    {
      field: "name",
      headerName: "Social Enterprise",
      flex: 1,
      editable: isEditing,
    },
    { field: "program", headerName: "Program", flex: 1, editable: isEditing },
    {
      field: "mentorshipStatus",
      headerName: "Mentorship Status",
      flex: 1,
      editable: isEditing,
    },
    { field: "mentors", headerName: "Mentors", flex: 1, editable: isEditing },
    {
      field: "actions",
      headerName: "Actions",
      width: 200,
      renderCell: (params) => {
        return (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="100%"
            gap={1}
            width="100%" // Ensures full width for centering
          >
            <Button
              onClick={() => navigate(`/se-analytics/${params.row.id}`)}
              sx={{
                color: "#fff",
                backgroundColor: colors.greenAccent[500], // Custom color
                "&:hover": { backgroundColor: colors.greenAccent[700] },
              }}
            >
              View SE
            </Button>
            <Button
              onClick={() => navigate(`/se-analytics/${params.row.id}`)}
              sx={{
                color: "#fff",
                backgroundColor: colors.blueAccent[500], // Custom color
                "&:hover": { backgroundColor: colors.blueAccent[700] },
              }}
            >
              Generate OTP
            </Button>
          </Box>
        );
      },
    },
  ];

  return (
    <Box m="20px">
      <Header title="SOCIAL ENTERPRISE" subtitle="Manage Social Enterprises" />
      {/* SE Performance Trend*/}
      <Box
        gridColumn="span 12"
        gridRow="span 2"
        backgroundColor={colors.primary[400]}
        paddingTop="10px"
      >
        <SEPerformanceTrendChart />{" "}
        {/* ✅ Embed the SEPerformanceChart component here */}
      </Box>
      <Box display="flex" gap="10px" mt="20px">
        {userSession.role !== "Mentor" && (
          <Button
            variant="contained"
            sx={{ backgroundColor: colors.greenAccent[500], color: "black" }}
            onClick={handleOpenAddSE}
          >
            Add SE
          </Button>
        )}
        <Dialog
          open={openAddSE}
          onClose={handleCloseAddSE}
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
            Add Social Enterprise
          </DialogTitle>

          {/* Dialog Content */}
          <DialogContent
            sx={{
              padding: "24px",
              maxHeight: "70vh", // Ensure it doesn't overflow the screen
              overflowY: "auto", // Enable scrolling if content is too long
            }}
          >
            {/* Input Fields */}
            <Box display="flex" flexDirection="column" gap={2}>
              {/* Name Field */}
              <Box>
                {/* Name Label */}
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: "bold",
                    marginBottom: "8px", // Space between title and input
                  }}
                >
                  Name
                </Typography>

                {/* TextField */}
                <TextField
                  label="Enter Name"
                  name="name"
                  value={socialEnterpriseData.name}
                  onChange={handleInputChange}
                  fullWidth
                  margin="dense"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      border: "1px solid #000", // Consistent border color
                      borderRadius: "4px", // Rounded corners
                      "&:hover": {
                        borderColor: "#000", // Darken border on hover
                      },
                      "&.Mui-focused": {
                        borderColor: "#000", // Consistent border color when focused
                      },
                    },
                    "& .MuiInputLabel-root": {
                      backgroundColor: "#fff", // Prevent overlap with the border
                      padding: "0 4px", // Add padding for readability
                      "&.Mui-focused": {
                        backgroundColor: "#fff", // Ensure the background remains white when focused
                      },
                    },
                    "& .MuiInputBase-input": {
                      color: "#000", // Set text color to black
                    },
                  }}
                />
              </Box>

              {/* SDG Dropdown */}
              <Box>
                {/* SDG Label */}
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: "bold",
                    marginBottom: "8px", // Space between label and dropdown
                  }}
                >
                  SDG
                </Typography>

                {/* Select Dropdown */}
                <FormControl fullWidth margin="dense">
                  <InputLabel
                    id="sdg-label"
                    sx={{
                      backgroundColor: "#fff", // Prevent overlap with the border
                      padding: "0 4px", // Add padding for readability
                      "&.Mui-focused": {
                        backgroundColor: "#fff", // Ensure the background remains white when focused
                        color: "#000",
                      },
                    }}
                  >
                    Select SDG
                  </InputLabel>
                  <Select
                    labelId="sdg-label"
                    name="selectedSDG"
                    value={socialEnterpriseData.selectedSDG || ""}
                    onChange={handleInputChange}
                    label="Select SDG"
                    sx={{
                      color: "#000",
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#000",
                        borderWidth: "1px",
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#000",
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#000",
                      },
                    }}
                  >
                    {/* Placeholder Option */}
                    <MenuItem value="" disabled>
                      Select SDG
                    </MenuItem>

                    {/* Check if SDGs exist */}
                    {sdgs.length > 0 ? (
                      sdgs.map((sdg) => (
                        <MenuItem key={sdg.id} value={sdg.id}>
                          {sdg.name}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem value="" disabled>
                        No SDGs available
                      </MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Box>

              {/* Contact Field */}
              <Box>
                {/* Contact Label */}
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: "bold",
                    marginBottom: "8px", // Space between title and input
                  }}
                >
                  Contact
                </Typography>

                {/* TextField */}
                <TextField
                  name="contact"
                  value={socialEnterpriseData.contact}
                  onChange={handleInputChange}
                  label="Enter Contact"
                  fullWidth
                  margin="dense"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      border: "1px solid #000", // Consistent border color
                      borderRadius: "4px", // Rounded corners
                      "&:hover": {
                        borderColor: "#000", // Darken border on hover
                      },
                      "&.Mui-focused": {
                        borderColor: "#000", // Consistent border color when focused
                      },
                    },
                    "& .MuiInputLabel-root": {
                      backgroundColor: "#fff", // Prevent overlap with the border
                      padding: "0 4px", // Add padding for readability
                      "&.Mui-focused": {
                        backgroundColor: "#fff", // Ensure the background remains white when focused
                      },
                    },
                    "& .MuiInputBase-input": {
                      color: "#000", // Set text color to black
                    },
                  }}
                />
              </Box>

              {/* Program Dropdown */}
              <Box>
                {/* Program Label */}
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: "bold",
                    marginBottom: "8px",
                  }}
                >
                  Program
                </Typography>

                {/* Show loading state if programs are not yet fetched */}
                {loading ? (
                  <Typography>Loading programs...</Typography>
                ) : (
                  <FormControl fullWidth margin="dense">
                    <InputLabel
                      id="program-label"
                      sx={{
                        backgroundColor: "#fff",
                        padding: "0 4px",
                        "&.Mui-focused": {
                          backgroundColor: "#fff",
                        },
                      }}
                    >
                      Select Program
                    </InputLabel>
                    <Select
                      labelId="program-label"
                      name="selectedProgram"
                      value={socialEnterpriseData.selectedProgram || ""}
                      onChange={handleInputChange}
                      label="Select Program"
                      sx={{
                        color: "#000",
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#000",
                          borderWidth: "1px",
                        },
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#000",
                        },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#000",
                        },
                      }}
                    >
                      <MenuItem value="" disabled>
                        Select Program
                      </MenuItem>
                      {programs.length > 0 ? (
                        programs.map((program) => (
                          <MenuItem
                            key={program.id}
                            value={program.id}
                            title={`Program: ${program.name}`}
                          >
                            {program.name}
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem value="" disabled>
                          No programs available
                        </MenuItem>
                      )}
                    </Select>
                  </FormControl>
                )}
              </Box>

              {/* Status Dropdown */}
              <Box>
                {/* Status Label */}
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: "bold",
                    marginBottom: "8px", // Space between label and dropdown
                  }}
                >
                  Status
                </Typography>

                {/* Select Dropdown */}
                <FormControl fullWidth margin="dense">
                  <InputLabel
                    id="status-label"
                    sx={{
                      backgroundColor: "#fff", // Prevent overlap with the border
                      padding: "0 4px", // Add padding for readability
                      "&.Mui-focused": {
                        backgroundColor: "#fff", // Ensure the background remains white when focused
                      },
                    }}
                  >
                    Select Status
                  </InputLabel>
                  <Select
                    labelId="status-label"
                    name="selectedStatus"
                    value={socialEnterpriseData.selectedStatus || ""}
                    onChange={handleInputChange}
                    label="Select Status"
                    sx={{
                      color: "#000",
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#000", // Consistent border color
                        borderWidth: "1px", // Solid 1px border
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#000", // Darken border on hover
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#000", // Consistent border color when focused
                      },
                    }}
                  >
                    <MenuItem value="">Select Status</MenuItem>
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* Abbreviation Field */}
              <Box>
                {/* Abbreviation Label */}
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: "bold",
                    marginBottom: "8px", // Space between title and input
                  }}
                >
                  Abbreviation
                </Typography>

                {/* TextField */}
                <TextField
                  name="abbr"
                  value={socialEnterpriseData.abbr}
                  onChange={handleInputChange}
                  label="Enter Abbreviation"
                  fullWidth
                  margin="dense"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      border: "1px solid #000", // Consistent border color
                      borderRadius: "4px", // Rounded corners
                      "&:hover": {
                        borderColor: "#000", // Darken border on hover
                      },
                      "&.Mui-focused": {
                        borderColor: "#000", // Consistent border color when focused
                      },
                    },
                    "& .MuiInputLabel-root": {
                      backgroundColor: "#fff", // Prevent overlap with the border
                      padding: "0 4px", // Add padding for readability
                      "&.Mui-focused": {
                        backgroundColor: "#fff", // Ensure the background remains white when focused
                      },
                    },
                    "& .MuiInputBase-input": {
                      color: "#000", // Set text color to black
                    },
                  }}
                />
              </Box>
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
              onClick={handleCloseAddSE}
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
              Add
            </Button>
          </DialogActions>
        </Dialog>
        {userSession.role !== "Mentor" && (
          <Button
            variant="contained"
            sx={{ backgroundColor: colors.greenAccent[500], color: "black" }}
            onClick={handleOpenAddProgram}
          >
            Add Program
          </Button>
        )}
        <Dialog
          open={openAddProgram}
          onClose={handleCloseAddProgram}
          maxWidth="md"
          fullWidth
          PaperProps={{
            style: {
              backgroundColor: "#fff", // White background
              color: "#000", // Black text
              border: "1px solid #000", // Black border for contrast
              borderRadius: "4px", // Rounded corners for the dialog
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
              borderBottom: "1px solid #000", // Separator line below the title
            }}
          >
            Add Program
          </DialogTitle>

          {/* Dialog Content */}
          <DialogContent
            sx={{
              padding: "24px",
              maxHeight: "70vh", // Ensure it doesn't overflow the screen
              overflowY: "auto", // Enable scrolling if content is too long
            }}
          >
            {/* Input Fields */}
            <Box display="flex" flexDirection="column" gap={2}>
              {/* Program Name Field */}
              <Box>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: "bold",
                    marginBottom: "8px", // Space between label and input
                  }}
                >
                  Program Name
                </Typography>
                <TextField
                  name="name"
                  label="Enter Program Name"
                  fullWidth
                  margin="dense"
                  value={programFormData.name}
                  onChange={handleProgramInputChange}
                  sx={{
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#000", // Consistent border color
                      borderWidth: "1px", // Solid 1px border
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#000", // Darken border on hover
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#000", // Consistent border color when focused
                    },
                    "& .MuiInputBase-input": {
                      color: "#000", // Set text color to black
                    },
                  }}
                />
              </Box>

              {/* Description Field */}
              <Box>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: "bold",
                    marginBottom: "8px", // Space between label and input
                  }}
                >
                  Description
                </Typography>
                <TextField
                  name="description"
                  label="Enter Description"
                  fullWidth
                  margin="dense"
                  multiline
                  value={programFormData.description}
                  onChange={handleProgramInputChange}
                  rows={3}
                  sx={{
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#000", // Consistent border color
                      borderWidth: "1px", // Solid 1px border
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#000", // Darken border on hover
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#000", // Consistent border color when focused
                    },
                    "& .MuiInputBase-input": {
                      color: "#000", // Set text color to black
                    },
                  }}
                />
              </Box>
            </Box>
          </DialogContent>

          {/* Dialog Actions */}
          <DialogActions
            sx={{
              padding: "16px",
              borderTop: "1px solid #000", // Separator line above the actions
            }}
          >
            {/* Cancel Button */}
            <Button
              onClick={handleCloseAddProgram}
              sx={{
                color: "#000",
                border: "1px solid #000",
                borderRadius: "4px", // Rounded corners
                "&:hover": {
                  backgroundColor: "#f0f0f0", // Hover effect
                },
              }}
            >
              Cancel
            </Button>

            {/* Add Button */}
            <Button
              onClick={handleAddProgram}
              variant="contained"
              sx={{
                backgroundColor: "#1E4D2B", // DLSU Green button
                color: "#fff",
                borderRadius: "4px", // Rounded corners
                "&:hover": {
                  backgroundColor: "#145A32", // Darker green on hover
                },
              }}
            >
              Add
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
            Program added successfully!
          </Alert>
        </Snackbar>

        <Box display="flex" alignItems="center" gap={2}>
          {userSession.role !== "Mentor" && !showEditButtons && (
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
      <Box width="100%" backgroundColor={colors.primary[400]} padding="20px">
        <Typography
          variant="h3"
          fontWeight="bold"
          color={colors.greenAccent[500]}
          marginBottom="15px" // Ensures a small gap between header & DataGrid
        >
          My Mentorships
        </Typography>
        <Box
          height="400px"
          minHeight="400px"
          width="100%"
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
          {loading ? (
            <Typography>Loading...</Typography>
          ) : (
            <DataGrid
              rows={socialEnterprises}
              columns={columns}
              getRowId={(row) => row.id} // Use `id` as the unique identifier
              onRowClick={handleRowClick}
              editMode="row" // Enable row editing
            />
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default Mentorships;

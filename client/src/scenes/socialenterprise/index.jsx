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

const SocialEnterprise = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate(); // Initialize navigation
  const [socialEnterpriseData, setSocialEnterpriseData] = useState({
    name: "",
    selectedMentor: "",
    selectedSDG: "",
    contact: "",
    numberOfMembers: "",
    selectedProgram: "",
    selectedStatus: "",
  });
  // State for dialogs
  const [openAddSE, setOpenAddSE] = useState(false);
  const [openAddProgram, setOpenAddProgram] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [mentors, setMentors] = useState([]);
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

  // Fetch social enterprises from the backend
  useEffect(() => {
    const fetchSocialEnterprise = async () => {
      try {
        const response = await axios.get(
          "http://localhost:4000/getAllSocialEnterprisesWithMentorship"
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
    const fetchData = async () => {
      try {
        const mentorsResponse = await fetch("/api/mentors");
        const sdgsResponse = await fetch("/getAllSDG");
        const programsResponse = await fetch("/getPrograms");

        const mentorsData = await mentorsResponse.json();
        const sdgsData = await sdgsResponse.json();
        const programsData = await programsResponse.json();

        setMentors(
          mentorsData.map((mentor) => ({
            id: mentor.mentor_id,
            name: `${mentor.mentor_firstName} ${mentor.mentor_lastName}`,
          }))
        );
        setSdgs(sdgsData);
        setPrograms(programsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchMentors = async () => {
      try {
        const response = await fetch("/api/mentors");
        const data = await response.json();
        setMentors(
          data.map((mentor) => ({
            id: mentor.mentor_id,
            name: `${mentor.mentor_firstName} ${mentor.mentor_lastName}`,
          }))
        );
      } catch (error) {
        console.error("Error fetching mentors:", error);
      }
    };
    fetchMentors();
  }, []);

  useEffect(() => {
    const fetchSDGs = async () => {
      try {
        const response = await fetch("/getAllSDG");
        const data = await response.json();
        setSdgs(
          data.map((sdg) => ({
            id: sdg.sdg_id,
            name: sdg.sdg_name,
          }))
        );
      } catch (error) {
        console.error("Error fetching SDGs:", error);
      }
    };
    fetchSDGs();
  }, []);

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const response = await fetch("/getPrograms");
        const data = await response.json();
        setPrograms(
          data.map((program) => ({
            id: program.program_id,
            name: program.program_name,
          }))
        );
      } catch (error) {
        console.error("Error fetching programs:", error);
      }
    };
    fetchPrograms();
  }, []);

  const handleSubmit = async () => {
    try {
      const newSocialEnterprise = {
        name: socialEnterpriseData.name,
        mentor_id: socialEnterpriseData.selectedMentor,
        sdg_id: socialEnterpriseData.selectedSDG,
        contact: socialEnterpriseData.contact,
        number_of_members: socialEnterpriseData.numberOfMembers,
        program_id: socialEnterpriseData.selectedProgram,
        status: socialEnterpriseData.selectedStatus,
      };

      const response = await fetch("/api/social-enterprises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSocialEnterprise),
      });

      if (response.ok) {
        console.log("Social Enterprise added successfully");
        handleCloseAddSE(); // Close the dialog
        setSocialEnterpriseData({
          name: "",
          selectedMentor: "",
          selectedSDG: "",
          contact: "",
          numberOfMembers: "",
          selectedProgram: "",
          selectedStatus: "",
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

  const toggleEditing = () => {
    setIsEditing((prev) => !prev);
  };

  const columns = [
    { field: "name", headerName: "Social Enterprise", flex: 1 },
    { field: "program", headerName: "Program", flex: 1 }, // ✅ Added Program Name
    { field: "mentorshipStatus", headerName: "Mentorship Status", flex: 1 },
    { field: "mentors", headerName: "Mentors", flex: 1 },
    {
      field: "actions",
      headerName: "Actions",
      width: 150,
      renderCell: (params) => (
        <Button
          onClick={() => navigate(`/se-analytics/${params.row.id}`)}
          sx={{
            color: "#fff",
            backgroundColor: colors.primary[700],
            "&:hover": { backgroundColor: colors.primary[800] },
          }}
        >
          View SE
        </Button>
      ),
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
        >
          <SEPerformanceTrendChart /> {/* ✅ Embed the SEPerformanceChart component here */}
          </Box>
        <Box display="flex" gap="10px" mt="20px">
        <Button
          variant="contained"
          sx={{ backgroundColor: colors.greenAccent[500], color: "black" }}
          onClick={handleOpenAddSE}
        >
          Add SE
        </Button>
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

              {/* Mentor Dropdown */}
              <Box>
                {/* Mentor Label */}
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: "bold",
                    marginBottom: "8px", // Space between label and dropdown
                  }}
                >
                  Mentor
                </Typography>

                {/* Select Dropdown */}
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
                    value={socialEnterpriseData.selectedMentor || ""}
                    onChange={handleInputChange}
                    label="Select Mentor"
                    sx={{
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#000", // Consistent border color
                        borderWidth: "1px",
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
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#000", // Consistent border color
                        borderWidth: "1px",
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#000", // Darken border on hover
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#000", // Consistent border color when focused
                      },
                    }}
                  >
                    {sdgs.map((sdg) => (
                      <MenuItem key={sdg.id} value={sdg.id}>
                        {sdg.name}
                      </MenuItem>
                    ))}
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

              {/* No. of Members Field */}
              <Box>
                {/* No. of Members Label */}
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: "bold",
                    marginBottom: "8px", // Space between title and input
                  }}
                >
                  No. of Members
                </Typography>

                {/* TextField */}
                <TextField
                  label="Enter No. of Members"
                  type="number"
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
                    marginBottom: "8px", // Space between label and dropdown
                  }}
                >
                  Program
                </Typography>

                {/* Select Dropdown */}
                <FormControl fullWidth margin="dense">
                  <InputLabel
                    id="program-label"
                    sx={{
                      backgroundColor: "#fff", // Prevent overlap with the border
                      padding: "0 4px", // Add padding for readability
                      "&.Mui-focused": {
                        backgroundColor: "#fff", // Ensure the background remains white when focused
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
                    {programs.map((program) => (
                      <MenuItem key={program.id} value={program.id}>
                        {program.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
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
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
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

        <Button
          variant="contained"
          sx={{ backgroundColor: colors.greenAccent[500], color: "black" }}
          onClick={handleOpenAddProgram}
        >
          Add Program
        </Button>

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
                  label="Enter Program Name"
                  fullWidth
                  margin="dense"
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
                  label="Enter Description"
                  fullWidth
                  margin="dense"
                  multiline
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
              onClick={handleCloseAddProgram}
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
        <Button
          variant="contained"
          sx={{ backgroundColor: colors.blueAccent[500], color: "black" }}
          onClick={toggleEditing}
        >
          {isEditing ? "Disable Editing" : "Enable Editing"}
        </Button>
      </Box>
      <Box
        height="75vh"
        mt="20px"
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
        {loading ? (
          <Typography>Loading...</Typography>
        ) : (
          <DataGrid
            rows={socialEnterprises}
            columns={columns}
            getRowId={(row) => row.id} // Use `id` as the unique identifier
            onRowClick={handleRowClick}
            editMode="row" // Enable row editing
            autoHeight
          />
        )}
      </Box>
    </Box>
  );
};

export default SocialEnterprise;

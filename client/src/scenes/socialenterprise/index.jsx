import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  useTheme,
  IconButton,
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
import LineChart from "../../components/LineChart";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import { useNavigate } from "react-router-dom"; // For navigation

const SocialEnterprise = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate(); // Initialize navigation

  // State for dialogs
  const [openAddSE, setOpenAddSE] = useState(false);
  const [openAddProgram, setOpenAddProgram] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // State for fetched data
  const [socialEnterprises, setSocialEnterprises] = useState([]);
  const [loading, setLoading] = useState(true); // Loading state for API call

  // Handle dialog open/close
  const handleOpenAddSE = () => setOpenAddSE(true);
  const handleCloseAddSE = () => setOpenAddSE(false);
  const handleOpenAddProgram = () => setOpenAddProgram(true);
  const handleCloseAddProgram = () => setOpenAddProgram(false);

  // Fetch social enterprises from the backend
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

        // Ensure responses are arrays
        const programsData = Array.isArray(programsResponse.data)
          ? programsResponse.data
          : [];
        const mentorsData = Array.isArray(mentorResponse.data)
          ? mentorResponse.data
          : [];
        const sdgData = Array.isArray(sdgResponse.data) ? sdgResponse.data : [];

        // Create mappings for easier access
        const programsMap = {};
        programsData.forEach((program) => {
          programsMap[program.program_id] = program.name;
        });

        const mentorMap = {};
        mentorsData.forEach((mentor) => {
          mentorMap[
            mentor.mentor_id
          ] = `${mentor.mentor_firstName} ${mentor.mentor_lastName}`;
        });

        const sdgMap = {};
        sdgData.forEach((sdg) => {
          sdgMap[sdg.sdg_id] = sdg.name;
        });

        // Map social enterprises to include additional details
        const updatedSocialEnterprises = seResponse.data.map((se) => ({
          id: se.se_id, // Use `se_id` as the unique identifier
          name: se.team_name,
          mentor: mentorMap[se.mentor_id] || "No Mentor Assigned",
          program: programsMap[se.program_id] || "Unknown Program",
          sdg: Array.isArray(se.sdg_id)
            ? se.sdg_id.map((id) => sdgMap[id] || "Unknown SDG").join(", ")
            : sdgMap[se.sdg_id] || "No SDG Name",
          contact: se.contact || "No Contact Info", // Add contact field
          numMember: se.numMember || 0, // Add number of members field
          status: se.status || "Inactive", // Add status field
        }));

        setSocialEnterprises(updatedSocialEnterprises);
        setLoading(false); // Mark loading as complete
      } catch (error) {
        console.error("Error fetching social enterprises:", error);
        setLoading(false); // Mark loading as complete even if there's an error
      }
    };

    fetchSocialEnterprises();
  }, []);

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

  // Define columns without the `id` column
  const columns = [
    {
      field: "name",
      headerName: "Social Enterprise",
      flex: 1,
      cellClassName: "name-column--cell",
      editable: isEditing,
    },
    { field: "mentor", headerName: "Mentor", flex: 1, editable: isEditing },
    { field: "sdg", headerName: "SDG", flex: 1, editable: isEditing },
    { field: "contact", headerName: "Contact", flex: 1, editable: isEditing },
    {
      field: "numMember",
      headerName: "No. of Members",
      type: "number",
      headerAlign: "left",
      align: "left",
      editable: isEditing,
    },
    { field: "program", headerName: "Program", flex: 1, editable: isEditing },
    {
      field: "status",
      headerName: "Status",
      flex: 1,
      editable: isEditing,
      renderCell: (params) => <span>{params.value}</span>,
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
          onClick={() => navigate(`/se-analytics/${params.row.id}`)}
          sx={{
            color: "#fff", // White text color
            backgroundColor: colors.primary[700],
            fontWeight: "bold", // Bold font
            textTransform: "none", // Prevent uppercase transformation
            "&:hover": {
              backgroundColor: colors.primary[700], // Darker color on hover
            },
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
      <Box
        gridColumn="span 12"
        gridRow="span 2"
        backgroundColor={colors.primary[400]}
      >
        <Box
          height="100px"
          mt="25px"
          p="0 30px"
          display="flex"
          justifyContent="space-between"
          alignItems="center"
        >
          <Box>
            <Typography variant="h5" fontWeight="600" color={colors.grey[100]}>
              GEMS
            </Typography>
            <Typography
              variant="h3"
              fontWeight="bold"
              color={colors.greenAccent[500]}
            >
              Top Performer
            </Typography>
          </Box>
        </Box>
        <Box height="250px" m="-20px 0 0 0">
          <LineChart isDashboard={true} />
        </Box>
      </Box>
      <Box display="flex" gap="10px" mt="20px">
        <Button
          variant="contained"
          sx={{ backgroundColor: colors.greenAccent[500], color: "black" }}
          onClick={handleOpenAddSE}
        >
          Add SE
        </Button>
        <Dialog open={openAddSE} onClose={handleCloseAddSE}>
          <DialogTitle>Add Social Enterprise</DialogTitle>
          <DialogContent>
            <TextField label="Name" fullWidth margin="dense" />
            <TextField label="Mentor" fullWidth margin="dense" />
            <TextField label="SDG" fullWidth margin="dense" />
            <TextField label="Contact" fullWidth margin="dense" />
            <TextField
              label="No. of Members"
              type="number"
              fullWidth
              margin="dense"
            />
            <TextField label="Program" fullWidth margin="dense" />
            <TextField select label="Status" fullWidth margin="dense">
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Inactive">Inactive</MenuItem>
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseAddSE}>Cancel</Button>
            <Button
              onClick={handleCloseAddSE}
              variant="contained"
              color="primary"
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
        <Dialog open={openAddProgram} onClose={handleCloseAddProgram}>
          <DialogTitle>Add Program</DialogTitle>
          <DialogContent>
            <TextField label="Program Name" fullWidth margin="dense" />
            <TextField
              label="Description"
              fullWidth
              margin="dense"
              multiline
              rows={3}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseAddProgram}>Cancel</Button>
            <Button
              onClick={handleCloseAddProgram}
              variant="contained"
              color="primary"
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

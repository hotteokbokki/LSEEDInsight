import { useState } from "react";
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
import { mockDataSE } from "../../sampledata/mockData";
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

  // Handle dialog open/close
  const handleOpenAddSE = () => setOpenAddSE(true);
  const handleCloseAddSE = () => setOpenAddSE(false);
  const handleOpenAddProgram = () => setOpenAddProgram(true);
  const handleCloseAddProgram = () => setOpenAddProgram(false);
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
    { field: "id", headerName: "ID", editable: false },
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
      field: "members",
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
      editable: isEditing, // Make status editable
      renderCell: (params) => (
        <Box
          sx={{
            color:
              params.value === "Active"
                ? colors.greenAccent[400]
                : colors.redAccent[400],
          }}
        >
          {params.value}
        </Box>
      ),
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
          onClick={() => navigate(`/se-analytics/${params.row.id}`)}
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
        <DataGrid
          rows={mockDataSE}
          columns={columns}
          onRowClick={handleRowClick}
          editMode="row" // Enable row editing
        />
      </Box>
    </Box>
  );
};

export default SocialEnterprise;

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
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import { mockDataSE } from "../../sampledata/mockData";
import Header from "../../components/Header";
import LineChart from "../../components/LineChart";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";

const SocialEnterprise = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  // State for dialogs
  const [openAddSE, setOpenAddSE] = useState(false);
  const [openAddProgram, setOpenAddProgram] = useState(false);

  // Form data
  const [seData, setSeData] = useState({ name: "", members: "", sdg: "" });
  const [programData, setProgramData] = useState({ name: "", se: "" });

  // Handle dialog open/close
  const handleOpenAddSE = () => setOpenAddSE(true);
  const handleCloseAddSE = () => setOpenAddSE(false);
  const handleOpenAddProgram = () => setOpenAddProgram(true);
  const handleCloseAddProgram = () => setOpenAddProgram(false);

  // Data grid columns
  const columns = [
    { field: "id", headerName: "ID" },
    {
      field: "name",
      headerName: "Social Enterprise",
      flex: 1,
      cellClassName: "name-column--cell",
    },
    { field: "mentor", headerName: "Mentor", flex: 1 },
    { field: "sdg", headerName: "SDG", flex: 1 },
    { field: "contact", headerName: "Contact", flex: 1 },
    {
      field: "members",
      headerName: "No. of Members",
      type: "number",
      headerAlign: "left",
      align: "left",
    },
    { field: "program", headerName: "Program", flex: 1 },
    {
      field: "status",
      headerName: "Status",
      flex: 1,
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
    },
  ];

  return (
    <Box m="20px">
      <Header title="SOCIAL ENTERPRISE" subtitle="Manage Social Enterprises" />

      {/* ROW 1: Line Chart */}
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
          <Box>
            <IconButton>
              <DownloadOutlinedIcon
                sx={{ fontSize: "26px", color: colors.greenAccent[500] }}
              />
            </IconButton>
          </Box>
        </Box>
        <Box height="250px" m="-20px 0 0 0">
          <LineChart isDashboard={true} />
        </Box>
      </Box>

      {/* BUTTONS: Below Chart, Above Data Grid */}
      <Box display="flex" gap="10px" mt="20px">
        <Button
          variant="contained"
          sx={{ backgroundColor: colors.greenAccent[500], color: "black" }}
          onClick={handleOpenAddSE}
        >
          Add SE
        </Button>
        <Button
          variant="contained"
          sx={{ backgroundColor: colors.greenAccent[500], color: "black" }}
          onClick={handleOpenAddProgram}
        >
          Add Program
        </Button>
      </Box>

      {/* Bottom Row: Data Grid */}
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
        <DataGrid rows={mockDataSE} columns={columns} />
      </Box>

      {/* Add SE Dialog */}
      <Dialog open={openAddSE} onClose={handleCloseAddSE}>
        <DialogTitle>Add Social Enterprise</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Name"
            fullWidth
            value={seData.name}
            onChange={(e) => setSeData({ ...seData, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Number of Members"
            fullWidth
            type="number"
            value={seData.members}
            onChange={(e) => setSeData({ ...seData, members: e.target.value })}
          />
          <TextField
            margin="dense"
            label="SDGs Supported"
            fullWidth
            value={seData.sdg}
            onChange={(e) => setSeData({ ...seData, sdg: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddSE} color="primary">
            Cancel
          </Button>
          <Button onClick={handleCloseAddSE} color="secondary">
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Program Dialog */}
      <Dialog open={openAddProgram} onClose={handleCloseAddProgram}>
        <DialogTitle>Add Program</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Program Name"
            fullWidth
            value={programData.name}
            onChange={(e) =>
              setProgramData({ ...programData, name: e.target.value })
            }
          />
          <TextField
            margin="dense"
            label="Social Enterprise"
            fullWidth
            select
            value={programData.se}
            onChange={(e) =>
              setProgramData({ ...programData, se: e.target.value })
            }
          >
            {mockDataSE.map((se) => (
              <MenuItem key={se.id} value={se.name}>
                {se.name}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddProgram} color="primary">
            Cancel
          </Button>
          <Button onClick={handleCloseAddProgram} color="secondary">
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SocialEnterprise;

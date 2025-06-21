import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Typography,
  useTheme,
  Select,
  MenuItem,
} from "@mui/material";
import { tokens } from "../../theme";
import Header from "../../components/Header";
import { DataGrid } from "@mui/x-data-grid";
import { Snackbar, Alert } from "@mui/material";

const ProgramPage = () => {
  const [programs, setPrograms] = useState([]);
  const [availableLSEEDCoordinators, setAvailableLSEEDCoordinators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [isSuccessEditPopupOpen, setIsSuccessEditPopupOpen] = useState(false);
  const [showEditButtons, setShowEditButtons] = useState(false);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const programsResponse = await fetch(`http://localhost:4000/api/get-programs`);
        if (!programsResponse.ok) throw new Error("Failed to fetch programs");
        const programsData = await programsResponse.json();

        const mappedPrograms = programsData.map((item) => ({
          ...item,
          coordinator_name: item.program_coordinator?.trim() || "-- No Coordinator Assigned --",
          program_description: item.description || "—",
          coordinator_email: item.coordinator_email || "—",
          current_coordinator_id: item.coordinator_id, // Keep this to track the currently assigned ID
        }));
        setPrograms(mappedPrograms);

        const lseedCoordinatorsResponse = await fetch(`http://localhost:4000/api/get-lseed-coordinators`);
        if (!lseedCoordinatorsResponse.ok) throw new Error("Failed to fetch LSEED coordinators");
        const lseedCoordinatorsData = await lseedCoordinatorsResponse.json();
        setAvailableLSEEDCoordinators(lseedCoordinatorsData);

      } catch (error) {
        setSnackbarMessage(error.message || "Error fetching data");
        setSnackbarOpen(true);
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const toggleEditing = () => {
    setIsEditing(true);
    setShowEditButtons(true);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleRowUpdate = async (newRow) => {
    const oldRow = programs.find(p => p.program_id === newRow.id);

    try {
      let coordinatorIdToAssign = null;

      // Determine the user_id based on the selected value
      if (newRow.coordinator_name === "-- No Coordinator Assigned --" || newRow.coordinator_name === "-- No Coordinator Assigned --") {
        coordinatorIdToAssign = null; // Set to null for unassigning
      } else {
        const selectedCoordinator = availableLSEEDCoordinators.find(
          (coord) => `${coord.first_name} ${coord.last_name}` === newRow.coordinator_name
        );
        coordinatorIdToAssign = selectedCoordinator ? selectedCoordinator.user_id : null;
      }

      const payload = {
        program_id: newRow.id,
        user_id: coordinatorIdToAssign,
      };

      const response = await fetch(
        `http://localhost:4000/api/assign-program-coordinator`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to update program assignment: ${response.status} ${response.statusText}`);
      }

      // Find the actual coordinator object if assigned, to get their email
      const assignedCoordDetails = availableLSEEDCoordinators.find(
        (coord) => coord.user_id === coordinatorIdToAssign
      );


      setPrograms((prevPrograms) =>
        prevPrograms.map((program) =>
          program.program_id === newRow.id
            ? {
                ...program,
                coordinator_name: newRow.coordinator_name,
                coordinator_id: coordinatorIdToAssign,
                coordinator_email: assignedCoordDetails ? assignedCoordDetails.email : '—', // Update email dynamically
              }
            : program
        )
      );

      setSnackbarMessage("Program assignment updated successfully!");
      setSnackbarOpen(true);

      return newRow;
    } catch (error) {
      console.error("Error updating program assignment:", error);
      setSnackbarMessage(error.message || "Error updating program assignment");
      setSnackbarOpen(true);
      return oldRow;
    }
  };

  const columns = [
    {
      field: "coordinator_name",
      headerName: "Program Coordinator",
      flex: 1.5,
      editable: isEditing,
      renderEditCell: (params) => (
        <Select
          // The 'value' prop of Select should always reflect the currently displayed value
          // from the DataGrid cell (`params.value`).
          // The conditional MenuItem below will ensure the correct text is shown when the dropdown is opened.
          value={params.value}
          onChange={(e) => {
            params.api.setEditCellValue({
              id: params.id,
              field: params.field,
              value: e.target.value,
            });
          }}
          fullWidth
          sx={{
            "& .MuiOutlinedInput-notchedOutline": { border: 'none' },
            "& .MuiSelect-select": { padding: '8px 14px' },
          }}
        >
          {/* CONDITIONAL MENU ITEM FOR UNASSIGN/NO COORDINATOR */}
          {params.row.coordinator_id ? ( // Check if a coordinator IS currently assigned to this program (using the 'coordinator_id' from the row data)
            <MenuItem value="-- No Coordinator Assigned--" sx={{ color: colors.redAccent[500] }}>
              Remove Coordinator
            </MenuItem>
          ) : ( // If NO coordinator IS currently assigned to this program
            <MenuItem value="-- No Coordinator Assigned --">
              -- No Coordinator Assigned --
            </MenuItem>
          )}

          {/* Map through all available LSEED Coordinators */}
          {availableLSEEDCoordinators.map((user) => (
            <MenuItem
              key={user.user_id} // Unique key for each MenuItem
              value={`${user.first_name} ${user.last_name}`} // The value to be stored/sent
            >
              {`${user.first_name} ${user.last_name}`}
            </MenuItem>
          ))}
        </Select>
      ),
    },
    {
      field: "program_name",
      headerName: "Program",
      flex: 1,
    },
    {
      field: "program_description",
      headerName: "Description",
      flex: 2,
    },
    {
      field: "coordinator_email",
      headerName: "Email",
      flex: 2,
    },
  ];

  if (loading) {
    return (
      <Box m="20px">
        <Header title="PROGRAMS PAGE" subtitle="Loading..." />
      </Box>
    );
  }

  if (error) {
    return (
      <Box m="20px">
        <Header title="PROGRAMS PAGE" subtitle="Error loading data!" />
        <Alert severity="error">{error.message}</Alert>
      </Box>
    );
  }

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Header title="PROGRAMS PAGE" subtitle="View and Manage program assignment" />
      </Box>

      <Box display="flex" alignItems="center" gap={2} mb={2}>
        {!showEditButtons && (
          <Button
            variant="contained"
            sx={{
              backgroundColor: colors.blueAccent[500],
              color: "black",
              "&:hover": { backgroundColor: colors.blueAccent[800] },
            }}
            onClick={toggleEditing}
          >
            Enable Editing
          </Button>
        )}

        {showEditButtons && (
          <>
            <Button
              variant="outlined"
              sx={{
                backgroundColor: colors.redAccent[500],
                color: "black",
                "&:hover": { backgroundColor: colors.redAccent[600] },
              }}
              onClick={() => {
                setIsEditing(false);
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
                "&:hover": { backgroundColor: colors.blueAccent[600] },
              }}
              onClick={() => {
                setIsEditing(false);
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
        autoHideDuration={3000}
        onClose={() => setIsSuccessEditPopupOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setIsSuccessEditPopupOpen(false)}
          severity="success"
          sx={{ width: "100%" }}
        >
          Successfully saved!
        </Alert>
      </Snackbar>

      <Box width="100%" backgroundColor={colors.primary[400]} padding="20px">
        <Typography
          variant="h3"
          fontWeight="bold"
          color={colors.greenAccent[500]}
          marginBottom="15px"
        >
          Manage Programs
        </Typography>

        <Box
          height="600px"
          minHeight="600px"
          sx={{
            "& .MuiDataGrid-root": { border: "none" },
            "& .MuiDataGrid-cell": { borderBottom: "none" },
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
            rows={programs.map((item) => ({
              id: item.program_id,
              // Ensure coordinator_id from the backend response is passed to the row data
              // The backend's getProgramCoordinators query aliases u.user_id as coordinator_id
              // So, item.coordinator_id should already be available here.
              coordinator_id: item.coordinator_id,
              coordinator_name: item.coordinator_name,
              program_name: item.program_name || "—",
              program_description: item.program_description || "—",
              coordinator_email: item.coordinator_email,
            }))}
            columns={columns}
            pageSize={5}
            rowsPerPageOptions={[5, 10]}
            getRowId={(row) => row.id}
            processRowUpdate={handleRowUpdate}
            onProcessRowUpdateError={(error) => {
                console.error("DataGrid row update error:", error);
                setSnackbarMessage(error.message || "Failed to update row in DataGrid.");
                setSnackbarOpen(true);
            }}
            experimentalFeatures={{ newEditingApi: true }}
            disableSelectionOnClick
          />

          <Snackbar
            open={snackbarOpen}
            autoHideDuration={3000}
            onClose={handleSnackbarClose}
            anchorOrigin={{ vertical: "top", horizontal: "center" }}
          >
            <Alert onClose={handleSnackbarClose} severity="warning" sx={{ width: "100%" }}>
              {snackbarMessage}
            </Alert>
          </Snackbar>
        </Box>
      </Box>
    </Box>
  );
};

export default ProgramPage;
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
  const [isEditing, setIsEditing] = useState(false); // Toggle editing mode
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [isSuccessEditPopupOpen, setIsSuccessEditPopupOpen] = useState(false);
  const [showEditButtons, setShowEditButtons] = useState(false);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [selectedUser, setSelectedUser] = useState(null); // Track selected user (not directly used for row update, but good to keep if needed elsewhere)

  // Fetch programs and available LSEED coordinators on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Fetch Programs with their current assigned coordinators
        const programsResponse = await fetch(`http://localhost:4000/api/get-programs`);
        if (!programsResponse.ok) throw new Error("Failed to fetch programs");
        const programsData = await programsResponse.json();

        const mappedPrograms = programsData.map((item) => ({
          ...item,
          coordinator_name: item.program_coordinator?.trim() || "-- No Coordinator Assigned --",
          program_description: item.description || "—",
          coordinator_email: item.coordinator_email || "—",
          current_coordinator_id: item.coordinator_id,
        }));
        setPrograms(mappedPrograms);

        // 2. Fetch all available LSEED Coordinators
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
    if (!selectedUser || selectedUser.isactive) {
      setIsEditing(true);
      setShowEditButtons(true);
    } else {
      setSnackbarMessage("Account needs to be activated first.");
      setSnackbarOpen(true);
      }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // Handle inline editing update for a program's assigned coordinator
  const handleRowUpdate = async (newRow) => { // 'oldRow' is often not needed if you revert on error
    const oldRow = programs.find(p => p.program_id === newRow.id); // Find the original row

    try {
      const selectedCoordinator = availableLSEEDCoordinators.find(
        (coord) => `${coord.first_name} ${coord.last_name}` === newRow.coordinator_name
      );

      // If no coordinator is selected (e.g., "-- No Coordinator Assigned --" is picked)
      const coordinatorIdToAssign = selectedCoordinator ? selectedCoordinator.user_id : null;

      // Construct the payload for the backend API
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

      setPrograms((prevPrograms) =>
        prevPrograms.map((program) =>
          program.program_id === newRow.id
            ? {
                ...program,
                coordinator_name: newRow.coordinator_name,
                coordinator_id: coordinatorIdToAssign,
                coordinator_email: selectedCoordinator ? selectedCoordinator.email : '—',
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
          value={params.value || "-- No Coordinator Assigned --"} // Ensure value is handled if initially null
          onChange={(e) => {
            params.api.setEditCellValue({
              id: params.id,
              field: params.field,
              value: e.target.value,
            });
          }}
          fullWidth
          // Apply some styling to make the select visible
          sx={{
            "& .MuiOutlinedInput-notchedOutline": { border: 'none' }, // Remove default border
            "& .MuiSelect-select": { padding: '8px 14px' }, // Adjust padding
          }}
        >
          <MenuItem value="-- No Coordinator Assigned --">
            -- No Coordinator Assigned --
          </MenuItem>
          {availableLSEEDCoordinators.map((user) => (
            <MenuItem
              key={user.user_id} // Use user_id as key
              value={`${user.first_name} ${user.last_name}`} // Value is the full name
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
      {/* HEADER */}
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
                // Optionally re-fetch data or revert local state changes
                // setTimeout(() => window.location.reload(), 500); // Only if a full refresh is desired
              }}
            >
              Cancel
            </Button>

            {/* The "Save Changes" button is not directly saving the DataGrid edits.
                DataGrid saves row by row when you leave the cell.
                This button could trigger a final save if you accumulate changes,
                or confirm success message after individual row updates.
                For now, I'll keep the direct reload as it was, but ideally
                you'd remove it if using `processRowUpdate` for saving.
             */}
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
                // setTimeout(() => window.location.reload(), 500); // Only if a full refresh is desired
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
            rows={programs.map((item) => ({ // Use 'programs' state
              id: item.program_id, // Unique row id
              user_id: item.coordinator_id, // This is the *currently assigned* coordinator's ID
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
            experimentalFeatures={{ newEditingApi: true }}
            disableSelectionOnClick
          />

          {/* Snackbar for error */}
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
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
  const [coordinators, setCoordinators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false); // Toggle editing mode
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [isSuccessEditPopupOpen, setIsSuccessEditPopupOpen] = useState(false);
  const [showEditButtons, setShowEditButtons] = useState(false);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [selectedUser, setSelectedUser] = useState(null); // Track selected user

    // Fetch coordinators and programs on mount
  useEffect(() => {
    const fetchCoordinators = async () => {
      try {
        const response = await fetch(`http://localhost:4000/api/get-programs`);
        if (!response.ok) throw new Error("Failed to fetch coordinators");

        const data = await response.json();

        // Map data to include a coordinator_name field used by DataGrid columns
        const mappedData = data.map((item) => ({
          ...item,
          coordinator_name: item.program_coordinator?.trim() || "-- No Coordinator Assigned --",
          program_description: item.description || "—", // normalize key for description
          coordinator_email: item.coordinator_email || "—",
        }));

        setCoordinators(mappedData);
      } catch (error) {
        setSnackbarMessage(error.message || "Error fetching coordinators");
        setSnackbarOpen(true);
      }
    };

    fetchCoordinators();
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

  // Handle inline editing update for a coordinator/program
  const handleRowUpdate = async (updatedRow, oldRow) => {
    try {
      const response = await fetch(
        `http://localhost:4000/api/admin/users/${updatedRow.user_id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedRow),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update user: ${response.status} ${response.statusText}`);
      }

      const { user: updatedUser } = await response.json();

      setCoordinators((prev) =>
        prev.map((item) => (item.user_id === updatedUser.user_id ? updatedUser : item))
      );

      return updatedUser;
    } catch (error) {
      console.error("Error updating user:", error);
      // Optionally revert changes here
      return oldRow;
    }
  };

  // Define columns, note `coordinator_name` is the mapped field
  const columns = [
    {
      field: "coordinator_name",
      headerName: "Program Coordinator",
      flex: 1,
      editable: isEditing,
      renderEditCell: (params) => (
        <Select
          value={params.value}
          onChange={(e) => {
            params.api.setEditCellValue({
              id: params.id,
              field: params.field,
              value: e.target.value,
            });
          }}
          fullWidth
        >
          {/* Use coordinators to populate dropdown options for example */}
          {coordinators.map((user) => (
            <MenuItem
              key={user.coordinator_id || user.user_id}
              value={user.coordinator_name}
            >
              {user.coordinator_name}
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
                setTimeout(() => window.location.reload(), 500);
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
                setTimeout(() => window.location.reload(), 500);
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
            rows={coordinators.map((item) => ({
              id: item.program_id, // Unique row id
              user_id: item.coordinator_id, // For API calls
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

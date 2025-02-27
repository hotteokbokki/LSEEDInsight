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

const AdminPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false); // Toggle editing mode
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [isSuccessEditPopupOpen, setIsSuccessEditPopupOpen] = useState(false);
  const [showEditButtons, setShowEditButtons] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:4000/api/admin/users`);
        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }
        const data = await response.json();
        setUsers(data);
      } catch (err) {
        setError(err.message || "An error occurred while fetching users.");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  if (loading) {
    return (
      <Box m="20px">
        <Typography variant="h5">Loading users...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box m="20px">
        <Typography variant="h5" color={colors.redAccent[500]}>
          {error}
        </Typography>
      </Box>
    );
  }

  // Define DataGrid columns
  const columns = [
    {
      field: "name",
      headerName: "Name",
      flex: 1,
      renderCell: (params) =>
        `${params.row.first_name} ${params.row.last_name}`,
      editable: isEditing, // Make editable when in edit mode
    },
    {
      field: "email",
      headerName: "Email",
      flex: 1,
      editable: isEditing, // Make editable when in edit mode
    },
    {
      field: "roles",
      headerName: "Role",
      flex: 1,
      editable: isEditing, // Make editable when in edit mode
    },
    {
      field: "isActive",
      headerName: "Active Status",
      flex: 1,
      renderCell: (params) => (
        <span
          style={{
            color: params.value
              ? colors.greenAccent[500]
              : colors.redAccent[500],
          }}
        >
          {params.value ? "Active" : "Inactive"}
        </span>
      ),
      renderEditCell: (params) => (
        <Select
          value={params.value ? "Active" : "Inactive"}
          onChange={(e) =>
            params.api.setEditCellValue({
              id: params.id,
              field: params.field,
              value: e.target.value === "Active",
            })
          }
          fullWidth
        >
          <MenuItem value="Active">Active</MenuItem>
          <MenuItem value="Inactive">Inactive</MenuItem>
        </Select>
      ),
      editable: isEditing, // Make editable when in edit mode
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 1,
      renderCell: (params) => (
        <Button
          variant="contained"
          color="secondary"
          onClick={() => handleRoleChange(params.row.id)}
        >
          Change Role
        </Button>
      ),
    },
  ];

  const toggleEditing = () => {
    setIsEditing(true);
    setShowEditButtons(true); // Toggle button visibility
  };

  const handleRoleChange = (userId) => {
    console.log(`Change role for user ID: ${userId}`);
    // Implement role change logic here
  };

  const handleStatusChange = async (userId) => {
    try {
      const user = users.find((user) => user.id === userId);
      const newStatus = !user.isActive;

      // Update the status on the frontend
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, isActive: newStatus } : user
        )
      );

      // Send the updated status to the backend
      const response = await fetch(
        `http://localhost:4000/api/admin/users/${userId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isActive: newStatus }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update user status");
      }

      console.log(`User ${userId} status updated to ${newStatus}`);
    } catch (err) {
      console.error(err.message || "An error occurred while updating status.");
    }
  };

  // Handle row updates
  const handleRowEditCommit = async (params) => {
    const { id, field, value } = params;
    // Update state first for instant UI feedback
    const updatedUsers = users.map((user) =>
      user.id === id ? { ...user, [field]: value } : user
    );
    setUsers(updatedUsers);

    // Find the updated user
    const updatedUser = updatedUsers.find((user) => user.id === id);
    if (!updatedUser) return;

    // Send only the necessary fields to update
    const updatedUserData = {
      id: updatedUser.id,
      first_name: updatedUser.first_name,
      last_name: updatedUser.last_name,
      email: updatedUser.email,
      roles: updatedUser.roles,
      isActive: updatedUser.isActive,
    };
    try {
      const response = await fetch(
        `http://localhost:4000/api/admin/users/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedUserData),
        }
      );
      if (!response.ok) {
        throw new Error("Failed to update user in database");
      }
      console.log("User updated successfully");
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  return (
    <Box m="20px">
      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Header title="ADMIN PAGE" subtitle="Manage users and roles" />
      </Box>

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

      {/* GRID & TABLE */}
      <Box
        display="grid"
        gridTemplateColumns="repeat(12, 1fr)"
        gridAutoRows="140px"
        gap="20px"
      >
        {/* User Table */}
        <Box
          gridColumn="span 12"
          gridRow="span 6"
          backgroundColor={colors.primary[400]}
          sx={{
            "& .MuiDataGrid-root": {
              border: "none",
            },
            "& .MuiDataGrid-cell": {
              borderBottom: "none",
            },
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: colors.blueAccent[700],
              borderBottom: "none",
              color: colors.grey[100],
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
            rows={users.map((user, index) => ({
              ...user,
              id: user.email || index, // Use email as the unique ID, fallback to index
            }))}
            columns={columns}
            pageSize={5}
            rowsPerPageOptions={[5]}
            getRowId={(row) => row.email || row.id} // Ensure unique ID
            onCellEditCommit={handleRowEditCommit}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default AdminPage;

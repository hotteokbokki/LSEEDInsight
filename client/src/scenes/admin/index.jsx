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
      field: "first_name",
      headerName: "First Name",
      flex: 1,
      renderCell: (params) =>
        `${params.row.first_name}`,
      editable: isEditing, // Make editable when in edit mode
    },
    {
      field: "last_name",
      headerName: "Last Name",
      flex: 1,
      renderCell: (params) =>
        `${params.row.last_name}`,
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
      editable: isEditing,
      renderEditCell: (params) => (
        <Select
          value={params.value || ""}
          onChange={(e) =>
            params.api.setEditCellValue({ id: params.id, field: params.field, value: e.target.value })
          }
          fullWidth
        >
          <MenuItem value="Guest User">Guest User</MenuItem>
          <MenuItem value="Mentor">Mentor</MenuItem>
          <MenuItem value="LSEED">LSEED</MenuItem>
        </Select>
      ),
    },
    {
      field: "isactive",
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
      field: "password",
      headerName: "Change Password",
      flex: 1,
      renderCell: (params) => (
        <Button
          variant="contained"
          color="secondary"
          // onClick={() => handleRoleChange(params.row.id)}
        >
          Change Password
        </Button>
      ),
    },
  ];

  const toggleEditing = () => {
    setIsEditing(true);
    setShowEditButtons(true); // Toggle button visibility
  };

  // const handleRoleChange = (userId) => {
  //   console.log(`Change role for user ID: ${userId}`);
  //   // Implement role change logic here
  // };

  // const handleStatusChange = async (userId) => {
  //   try {
  //     const user = users.find((user) => user.id === userId);
  //     const newStatus = !user.isActive;

  //     // Update the status on the frontend
  //     setUsers((prevUsers) =>
  //       prevUsers.map((user) =>
  //         user.id === userId ? { ...user, isActive: newStatus } : user
  //       )
  //     );

  //     // Send the updated status to the backend
  //     const response = await fetch(
  //       `http://localhost:4000/api/admin/users/${userId}/status`,
  //       {
  //         method: "PATCH",
  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //         body: JSON.stringify({ isActive: newStatus }),
  //       }
  //     );

  //     if (!response.ok) {
  //       throw new Error("Failed to update user status");
  //     }

  //     console.log(`User ${userId} status updated to ${newStatus}`);
  //   } catch (err) {
  //     console.error(err.message || "An error occurred while updating status.");
  //   }
  // };

  // Handle row updates
  const handleRowUpdate = async (updatedRow, oldRow) => {
    console.log("Updating user:", updatedRow);
  
    try {
      const response = await fetch(
        `http://localhost:4000/api/admin/users/${updatedRow.user_id}`, // ✅ Use `user_id`
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
      console.log("User updated successfully:", updatedUser);

      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.user_id === updatedUser.user_id ? updatedUser : user
        )
      );
  
      return updatedUser; // Ensure the DataGrid updates immediately
    } catch (error) {
      console.error("Error updating user:", error);
      // return oldRow; // ❌ Revert changes if the update fails
    }
  };

  return (
    <Box m="20px">
      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Header title="ADMIN PAGE" subtitle="Manage users and roles" />
      </Box>

      <Box display="flex" alignItems="center" gap={2} mb={2}>
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
            rows={users.map(user => ({
              ...user,
              id: user.user_id // ✅ Ensure `id` is assigned properly
            }))}
            columns={columns}
            pageSize={5}
            rowsPerPageOptions={[5]}
            getRowId={(row) => row.user_id} // ✅ Use `user_id` as row ID
            processRowUpdate={handleRowUpdate}
            onProcessRowUpdateError={(error) => console.error("Update failed:", error)}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default AdminPage;
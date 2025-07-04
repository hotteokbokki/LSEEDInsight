import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Typography,
  useTheme,
  Select,
  MenuItem,
} from "@mui/material";
import axios from "axios";
import { tokens } from "../../theme";
import Header from "../../components/Header";
import { DataGrid } from "@mui/x-data-grid";
import { Snackbar, Alert, Dialog, DialogTitle, DialogContent, TextField, DialogActions } from "@mui/material";

const AdminPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false); // Toggle editing mode
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [isSuccessEditPopupOpen, setIsSuccessEditPopupOpen] = useState(false);
  const [showEditButtons, setShowEditButtons] = useState(false);
  const [inviteCoordinatorFormData, setInviteCoordinatorFormData] = useState({
      email: "",
  });
  const [emailError, setEmailError] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [selectedUser, setSelectedUser] = useState(null); // Track selected user
  const [openInviteCoordinator, setOpenInviteCoordinator] = useState(false);
  const handleOpenInviteCoordinator = () => setOpenInviteCoordinator(true);
  const handleCloseInviteCoordinator = () => setOpenInviteCoordinator(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/admin/users`);
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

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleInviteCoordinatorSubmit = async () => {
    try {
      // Basic validation - empty
      if (!inviteCoordinatorFormData.email || !inviteCoordinatorFormData.email.trim()) {
        setSnackbarMessage("Please input email");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        return;
      }

      // Email format validation
      if (!validateEmail(inviteCoordinatorFormData.email.trim())) {
        setSnackbarMessage("Please enter a valid email address");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        return;
      }

      // Send the invite request
      const response = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/invite-coordinator`,
        { email: inviteCoordinatorFormData.email.trim() }
      );

      if (response.status === 201) {
        console.log("Coordinator invited successfully: ", response.data);
        setSnackbarMessage("Invite sent successfully");
        setSnackbarSeverity("success");
        setSnackbarOpen(true);

        handleCloseInviteCoordinator();
        setInviteCoordinatorFormData({ email: "" });

        setTimeout(() => {
          window.location.reload();
        }, 3000);
      }
    } catch (error) {
      console.error("Failed to invite coordinator:", error);
      setSnackbarMessage("Failed to send invite");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleInviteCoordinatorInputChange = (e) => {
    const { value } = e.target;

    setInviteCoordinatorFormData(prev => ({
      ...prev,
      email: value
    }));

    if (value === "") {
      // If field is empty, clear error
      setEmailError("");
    } else if (!validateEmail(value)) {
      setEmailError("Please enter a valid email address");
    } else {
      setEmailError("");
    }
  };

  // Define DataGrid columns
  const columns = [
    {
      field: "first_name",
      headerName: "First Name",
      flex: 1,
      renderCell: (params) => `${params.row.first_name}`,
      editable: isEditing, // Make editable when in edit mode
    },
    {
      field: "last_name",
      headerName: "Last Name",
      flex: 1,
      renderCell: (params) => `${params.row.last_name}`,
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
      headerName: "Roles",
      flex: 1.5,
      // Render roles as a comma-separated string or badges
      renderCell: (params) => (
        <Box>
          {params.value && params.value.length > 0 ? (
            params.value.join(", ") // Display as "Admin, LSEED-Coordinator"
            // Or if you want badges:
            // params.value.map((role, index) => (
            //   <Chip key={index} label={role} size="small" style={{ margin: '2px' }} />
            // ))
          ) : (
            <Typography variant="body2" color="textSecondary">
              No Roles
            </Typography>
          )}
        </Box>
      ),
      editable: false, // You'll likely use a separate dialog for role editing
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
  ];

  const toggleEditing = () => {
    if (!selectedUser || selectedUser.isactive) {
      setIsEditing(true);
      setShowEditButtons(true);
    } else {
      setSnackbarMessage("Account needs to be activated first.");
      setSnackbarOpen(true);
    }
  };

  // Close Snackbar Function
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // Handle row updates
  const handleRowUpdate = async (updatedRow, oldRow) => {
    console.log("Updating user:", updatedRow);

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/admin/users/${updatedRow.user_id}`, // ✅ Use `user_id`
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedRow),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to update user: ${response.status} ${response.statusText}`
        );
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
        {/* Enable Editing Button */}
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

        {/* Cancel and Save Buttons */}
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
                "&:hover": {
                  backgroundColor: colors.blueAccent[600],
                },
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

        {/* Create LSEED-Coordinator Button */}
        <Button
          variant="contained"
          sx={{
            backgroundColor: colors.greenAccent[500],
            color: "black",
            "&:hover": {
              backgroundColor: colors.greenAccent[600],
            },
          }}
          onClick={handleOpenInviteCoordinator} 
        >
          Create LSEED-Coordinator
        </Button>
      </Box>

      <Dialog
        open={openInviteCoordinator}
        onClose={handleCloseInviteCoordinator}
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
          Invite Coordinator
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
            {/* Email Field */}
            <Box>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: "bold",
                  marginBottom: "8px", // Space between label and input
                }}
              >
                Email
              </Typography>

              <TextField
                name="email"
                type="email"
                label="Enter Email Address"
                fullWidth
                margin="dense"
                value={inviteCoordinatorFormData.email}
                onChange={handleInviteCoordinatorInputChange}
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
                error={Boolean(emailError)}
                helperText={emailError}
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
            onClick={() => {
              handleCloseInviteCoordinator(); // ✅ Closes after timeout
              setTimeout(() => {
                window.location.reload();
              }, 500); // Adjust delay if needed
            }}
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
            onClick={handleInviteCoordinatorSubmit}
            variant="contained"
            disabled={!inviteCoordinatorFormData.email} 
            sx={{
              backgroundColor:
                inviteCoordinatorFormData.email
                  ? "#1E4D2B"
                  : "#A0A0A0", // Gray if disabled
              color: "#fff",
              borderRadius: "4px", // Rounded corners
              "&:hover": {
                backgroundColor:
                  inviteCoordinatorFormData.email
                    ? "#145A32"
                    : "#A0A0A0", // Keep gray on hover when disabled
              },
            }}
          >
            Send Invite
          </Button>
        </DialogActions>
      </Dialog>

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

      {/* Manage Users */}
      <Box width="100%" backgroundColor={colors.primary[400]} padding="20px">
        <Typography
          variant="h3"
          fontWeight="bold"
          color={colors.greenAccent[500]}
          marginBottom="15px"
        >
          Manage Users
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
            rows={users.map((user) => ({
              ...user,
              id: user.user_id, // Ensure `id` is assigned properly
            }))}
            columns={columns}
            pageSize={5}
            rowsPerPageOptions={[5, 10]}
            getRowId={(row) => row.user_id} // Use `user_id` as row ID
            processRowUpdate={handleRowUpdate}
            onProcessRowUpdateError={(error) =>
              console.error("Update failed:", error)
            }
            onRowClick={(params) => setSelectedUser(params.row)}
          />

          {/* Snackbar for error messages */}
          <Snackbar
            open={snackbarOpen}
            autoHideDuration={3000}
            onClose={handleSnackbarClose}
            anchorOrigin={{ vertical: "top", horizontal: "center" }}
          >
            <Alert
              onClose={handleSnackbarClose}
              severity={snackbarSeverity}
              sx={{ width: "100%" }}
            >
              {snackbarMessage}
            </Alert>
          </Snackbar>
        </Box>
      </Box>
    </Box>
  );
};

export default AdminPage;

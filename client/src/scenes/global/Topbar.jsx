import {
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  useTheme,
  Divider,
  FormControlLabel, // 1. Import FormControlLabel for the toggle switch label
  Switch, // 2. Import Switch component
} from "@mui/material";
import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ColorModeContext, tokens } from "../../theme";
import InputBase from "@mui/material/InputBase";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import SearchIcon from "@mui/icons-material/Search";
import ExitToAppOutlinedIcon from "@mui/icons-material/ExitToAppOutlined";
import { useAuth } from "../../context/authContext";
import axios from "axios";


// 3. Destructure the new props from the function signature
const Topbar = ({ isCoordinatorView, handleViewChange, hasBothRoles }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const colorMode = useContext(ColorModeContext);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifAnchorEl, setNotifAnchorEl] = useState(null);
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [notifications, setNotifications] = useState([]);

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleNotifOpen = (event) => setNotifAnchorEl(event.currentTarget);
  const handleNotifClose = () => setNotifAnchorEl(null);

  const API_BASE_URL = "http://localhost:4000";

  const fetchNotifications = async () => {
    try {
      if (!user || !user.id) {
        console.warn("⚠️ No user ID found, skipping notification fetch.");
        return;
      }

      const requestUrl = `${API_BASE_URL}/api/notifications?receiver_id=${user.id}`;
      console.log("🔍 Making request to:", requestUrl);

      const response = await axios.get(requestUrl);

      console.log("📩 Notifications received:", response.data); // ✅ Debugging API Response
      setNotifications([...response.data]); // ✅ Force React to detect state change
      console.log("🔔 Updated notifications state:", notifications); // ✅ Check if state updates
    } catch (error) {
      console.error("❌ Error fetching notifications:", error);
    }
  };


  useEffect(() => {
    console.log("👤 User detected:", user); // ✅ Log user info
    if (user && user.id) {
      console.log("🔄 Fetching notifications for:", user.id);
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 5000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    console.log("🔥 Notifications state updated:", notifications);
  }, [notifications]); // ✅ Ensure React tracks updates

  return (
    <Box display="flex" justifyContent="space-between" p={2}>
      {/* Search Bar */}
      <Box
        display="flex"
        backgroundColor={colors.primary[400]}
        borderRadius="3px"
      >
        <InputBase sx={{ ml: 2, flex: 1 }} placeholder="Search" />
        <IconButton type="button" sx={{ p: 1 }}>
          <SearchIcon />
        </IconButton>
      </Box>

      {/* Icons */}
      <Box display="flex">
        {/* Toggle Switch - Only visible if the user has both roles */}
        {hasBothRoles && (
          <Box display="flex" alignItems="center" mr={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={isCoordinatorView}
                  onChange={handleViewChange}
                  color="secondary" // Uses your theme's secondary color
                />
              }
              label={
                <Typography variant="body1" color={colors.grey[100]}>
                  {isCoordinatorView ? "Coordinator View" : "Mentor View"}
                </Typography>
              }
            />
          </Box>
        )}

        <IconButton onClick={colorMode.toggleColorMode}>
          {theme.palette.mode === "dark" ? (
            <DarkModeOutlinedIcon />
          ) : (
            <LightModeOutlinedIcon />
          )}
        </IconButton>

        {/* Notifications Button */}
        <IconButton onClick={handleNotifOpen}>
          <NotificationsOutlinedIcon />
        </IconButton>

        {/* Notifications Menu */}
        <Menu
          anchorEl={notifAnchorEl}
          open={Boolean(notifAnchorEl)}
          onClose={handleNotifClose}
          sx={{
            "& .MuiPaper-root": {
              width: "300px",
              backgroundColor: "#fff",
              color: "#000",
              border: "1px solid #000",
              boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)",
              maxHeight: "300px", // ✅ This limits height before scrolling
              overflowY: "auto",
            },
          }}
        >
          {/* Header */}
          <Typography
            sx={{
              backgroundColor: "#1E4D2B",
              color: "#fff",
              textAlign: "center",
              fontSize: "1.2rem",
              fontWeight: "bold",
              padding: "10px",
            }}
          >
            Notifications
          </Typography>

          {/* Debug JSX */}
          {console.log("🛠 Rendering Notifications:", notifications)}

          {/* Notification Items */}
          {notifications.length > 0 ? (
            notifications.map((notif, index) => (
              <Box key={notif.notification_id}>
                <MenuItem
                  onClick={handleNotifClose}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    padding: "12px",
                    "&:hover": { backgroundColor: "#f0f0f0" },
                  }}
                >
                  <Typography sx={{ fontWeight: "bold" }}>
                    {notif.title}
                  </Typography>

                  {/* ✅ Display different messages based on status */}
                  <Typography variant="body2">
                    {notif.title === "Scheduling Approval Needed"
                      ? `${notif.sender_name} created a schedule for ${notif.se_name}.` // ✅ LSEED users see this
                      : notif.title === "LSEED Approval"
                      ? `Your desired schedule for ${notif.se_name} is already accepted by the LSEED.`
                      : notif.title === "Social Enterprise Approval"
                      ? `The ${notif.se_name} has agreed to your desired schedule.`
                      : notif.title}
                  </Typography>

                  <Typography variant="caption" color="gray">
                    {new Date(notif.created_at).toLocaleString()}
                  </Typography>
                </MenuItem>

                {index < notifications.length - 1 && <Divider />}
              </Box>
            ))
          ) : (
            <MenuItem sx={{ textAlign: "center", padding: "15px" }}>
              No new notifications
            </MenuItem>
          )}
        </Menu>

        {/* <IconButton>
  <SettingsOutlinedIcon />
</IconButton> 
*/}

        <IconButton onClick={handleMenuOpen}>
          <PersonOutlinedIcon />
        </IconButton>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleMenuClose}>Profile</MenuItem>
          <MenuItem
            onClick={() => {
              logout(); // Logout user
              navigate("/"); // Redirect to login
            }}
            icon={<ExitToAppOutlinedIcon />}
            style={{
              color: colors.redAccent[400],
              marginTop: "20px",
            }}
          >
            <Typography>Logout</Typography>
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
};

export default Topbar;
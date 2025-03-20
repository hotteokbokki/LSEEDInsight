import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  useTheme,
  Divider,
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

const Topbar = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const colorMode = useContext(ColorModeContext);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifAnchorEl, setNotifAnchorEl] = useState(null);
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleNotifOpen = (event) => setNotifAnchorEl(event.currentTarget);
  const handleNotifClose = () => setNotifAnchorEl(null);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get("/api/notifications");
      setNotifications(response.data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Refresh every 5 seconds
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, []);

  const [notifications, setNotifications] = useState([]);

  // const notifications = [
  //   {
  //     id: 1,
  //     title: "New Mentorship",
  //     message: "John Doe has been assigned.",
  //     time: "5m ago",
  //   },
  //   {
  //     id: 2,
  //     title: "System Update",
  //     message: "System maintenance at 2 AM.",
  //     time: "1h ago",
  //   },
  //   {
  //     id: 3,
  //     title: "Reminder",
  //     message: "Monthly report due tomorrow.",
  //     time: "1d ago",
  //   },
  // ];

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
                  <Typography variant="body2">
                    {notif.user_name} created a schedule.
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

        {/* 
<IconButton>
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

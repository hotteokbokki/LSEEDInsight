import { useState } from "react";
import { ProSidebar, Menu, MenuItem } from "react-pro-sidebar";
import "react-pro-sidebar/dist/css/styles.css";
import {
  Box,
  IconButton,
  Typography,
  useTheme,
  Dialog,
  DialogTitle,
  DialogActions,
  Button,
} from "@mui/material";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { tokens } from "../../theme";
import HowToRegOutlinedIcon from "@mui/icons-material/HowToRegOutlined";
import GridViewOutlinedIcon from "@mui/icons-material/GridViewOutlined";
import SupervisorAccountOutlinedIcon from "@mui/icons-material/SupervisorAccountOutlined";
import Diversity2OutlinedIcon from "@mui/icons-material/Diversity2Outlined";
import SettingsAccessibilityOutlinedIcon from "@mui/icons-material/SettingsAccessibilityOutlined";
import AnalyticsOutlinedIcon from "@mui/icons-material/AnalyticsOutlined";
import GradingOutlinedIcon from "@mui/icons-material/GradingOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import ExitToAppOutlinedIcon from "@mui/icons-material/ExitToAppOutlined";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import { useAuth } from "../../context/authContext";
import { createCalendarEvents } from "../../components/googleCalendar";
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";

const Item = ({ title, to, icon, selected, setSelected }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  return (
    <MenuItem
      active={selected === title}
      style={{
        color: colors.grey[100],
        fontWeight: selected === title ? "bold" : "normal",
      }}
      onClick={() => setSelected(title)}
      icon={icon}
    >
      <Typography variant="body1">{title}</Typography>
      <Link to={to} />
    </MenuItem>
  );
};

const Sidebar = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [googleUser, setGoogleUser] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  // Determine the default selected item based on the current route
  const getSelectedTitle = () => {
    const routeMap = {
      "/dashboard": "Dashboard",
      "/assess": "Assess SE",
      "/socialenterprise": "Manage SE",
      "/mentors": "LSEED Mentors",
      "/analytics": "Show Analytics",
      "/reports": "Show Reports",
      "/scheduling": "Scheduling Matrix",
      "/admin": "Admin Page",
      "/mentorships": "Manage Mentorships",
      "/analytics-mentorship": "Show Analytics",
      "/programs": "Manage Programs",
      "/signup": "Register Mentor",
      "/financial-analytics": "Financial Analytics",
    };
    return routeMap[location.pathname] || "Dashboard";
  };

  const login = useGoogleLogin({
    onSuccess: (response) => {
      console.log("Google Login Success:", response);
      setGoogleUser(response); // ✅ Store Google user separately
    },
    onError: (error) => console.error("Google Login Failed", error),
    scope: "https://www.googleapis.com/auth/calendar.events",
  });

  // Function to handle dialog close
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // Function to confirm navigation
  const handleConfirmNavigation = async () => {
    if (!googleUser) {
      login(); // Prompt Google login if not logged in
    } else {
      await createCalendarEvents(googleUser, user); // ✅ Use googleUser for Calendar API
      navigate("/scheduling");
      handleCloseDialog();
    }
  };

  const confirmNavNoSync = async () => {
    navigate("/scheduling");
    handleCloseDialog();
  };

  const [selected, setSelected] = useState(getSelectedTitle());

  return (
    <Box
      sx={{
        height: "100vh", // Ensures sidebar reaches the bottom
        position: "sticky", // Keeps it fixed on scroll
        top: 0,
        left: 0,
        background: colors.primary[400],
        "& .pro-sidebar-inner": {
          background: `${colors.primary[400]} !important`,
        },
        "& .pro-icon-wrapper": {
          backgroundColor: "transparent !important",
        },
        "& .pro-inner-item": {
          padding: "4px 25px 8px 20px !important",
          borderRadius: "8px",
          transition: "all 0.3s ease-in-out",
        },
        "& .pro-inner-item:hover": {
          backgroundColor: colors.grey[700],
          color: "#fff !important",
        },
        "& .pro-menu-item.active": {
          backgroundColor: colors.greenAccent[600],
          color: "#fff !important",
          borderRadius: "8px",
        },
      }}
    >
      <ProSidebar collapsed={isCollapsed}>
        <Menu iconShape="square">
          {/* Header Section */}
          <MenuItem
            onClick={() => setIsCollapsed(!isCollapsed)}
            icon={isCollapsed ? <MenuOutlinedIcon /> : undefined}
            style={{ margin: "15px 0", color: colors.grey[100] }}
          >
            {!isCollapsed && (
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                ml="15px"
              >
                <Typography variant="h3" color={colors.grey[100]}>
                  LSEED INSIGHT
                </Typography>
                <IconButton onClick={() => setIsCollapsed(!isCollapsed)}>
                  <MenuOutlinedIcon />
                </IconButton>
              </Box>
            )}
          </MenuItem>

          {/* Profile Section */}
          {!isCollapsed && user && (
            <Box textAlign="center" p="10px">
              <Box display="flex" justifyContent="center" alignItems="center">
                <img
                  alt="profile-user"
                  width="90px"
                  height="90px"
                  src="/assets/picture.png"
                  style={{
                    borderRadius: "50%",
                    border: `2px solid ${colors.grey[100]}`,
                    boxShadow: "0px 4px 10px rgba(0,0,0,0.2)",
                  }}
                />
              </Box>
              <Typography
                variant="h5"
                color={colors.grey[100]}
                fontWeight="bold"
                mt={1}
              >
                {user.firstname || "User"} {user.lastname || "User"}
              </Typography>
              <Typography variant="body2" color={colors.greenAccent[500]}>
                {user.role || "LSEED User"}
              </Typography>
            </Box>
          )}

          {/* Navigation Items */}
          <Box paddingLeft={isCollapsed ? undefined : "10%"}>
            {user?.role === "Mentor" && (
              <>
                <Item
                  title="Dashboard"
                  to="/dashboard"
                  icon={<GridViewOutlinedIcon />}
                  selected={selected}
                  setSelected={setSelected}
                />
                <Item
                  title="Evaluate"
                  to="/assess"
                  icon={<AssignmentTurnedInOutlinedIcon />}
                  selected={selected}
                  setSelected={setSelected}
                />
                <Item
                  title="Manage Mentorships"
                  to="/mentorships"
                  icon={<SupervisorAccountOutlinedIcon />}
                  selected={selected}
                  setSelected={setSelected}
                />

                <MenuItem
                  active={selected === "Scheduling Matrix"}
                  icon={<CalendarMonthOutlinedIcon />}
                  onClick={() => setOpenDialog(true)} // Open the pop-up
                  style={{
                    color: colors.grey[100],
                    fontWeight:
                      selected === "Scheduling Matrix" ? "bold" : "normal",
                  }}
                >
                  <Typography variant="body1">Scheduling Matrix</Typography>
                </MenuItem>
              </>
            )}

            {user?.role?.startsWith("LSEED") && (
              <>
                <Item
                  title="Dashboard"
                  to="/dashboard"
                  icon={<GridViewOutlinedIcon />}
                  selected={selected}
                  setSelected={setSelected}
                />
                <Item
                  title="Evaluate"
                  to="/assess"
                  icon={<AssignmentTurnedInOutlinedIcon />}
                  selected={selected}
                  setSelected={setSelected}
                />
                <Item
                  title="Manage SE"
                  to="/socialenterprise"
                  icon={<Diversity2OutlinedIcon />}
                  selected={selected}
                  setSelected={setSelected}
                />
                <Item
                  title="LSEED Mentors"
                  to="/mentors"
                  icon={<SettingsAccessibilityOutlinedIcon />}
                  selected={selected}
                  setSelected={setSelected}
                />
                <Item
                  title="Show Analytics"
                  to="/analytics"
                  icon={<AnalyticsOutlinedIcon />}
                  selected={selected}
                  setSelected={setSelected}
                />
                <Item
                  title="Financial Analytics"
                  to="/financial-analytics"
                  icon={<AccountBalanceOutlinedIcon />}
                  selected={selected}
                  setSelected={setSelected}
                />

                <Item
                  title="Show Reports"
                  to="/reports"
                  icon={<GradingOutlinedIcon />}
                  selected={selected}
                  setSelected={setSelected}
                />
                
                <Item
                  title="Scheduling Matrix"
                  to="/scheduling"
                  icon={<CalendarMonthOutlinedIcon />}
                  selected={selected}
                  setSelected={setSelected}
                />
                {/* TODO*/}
                <Item
                  title="Manage Programs"
                  to="/programs"
                  icon={<FactCheckOutlinedIcon />}
                  selected={selected}
                  setSelected={setSelected}
                />
                <Item
                  title="Manage Users"
                  to="/admin"
                  icon={<AdminPanelSettingsOutlinedIcon />}
                  selected={selected}
                  setSelected={setSelected}
                />
              </>
            )}
          </Box>
        </Menu>
      </ProSidebar>

      {/* MUI Dialog for Confirmation */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>
          Logging in to google. This will sync mentorship schedules with your
          Google Calendar. Continue?
        </DialogTitle>
        <DialogActions>
          <Button
            onClick={handleCloseDialog}
            sx={{
              color: "white",
              backgroundColor: "red",
              "&:hover": { backgroundColor: "darkred" },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmNavNoSync}
            sx={{
              color: "white",
              backgroundColor: "green",
              "&:hover": { backgroundColor: "darkgreen" },
            }}
          >
            Continue without Sync
          </Button>
          <Button
            onClick={handleConfirmNavigation}
            sx={{
              color: "white",
              backgroundColor: "green",
              "&:hover": { backgroundColor: "darkgreen" },
            }}
          >
            Continue
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Sidebar;

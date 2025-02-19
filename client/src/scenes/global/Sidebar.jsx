import { useState } from "react";
import { ProSidebar, Menu, MenuItem } from "react-pro-sidebar";
import "react-pro-sidebar/dist/css/styles.css";
import { Box, IconButton, Typography, useTheme } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { tokens } from "../../theme";
import GridViewOutlinedIcon from "@mui/icons-material/GridViewOutlined";
import Diversity2OutlinedIcon from "@mui/icons-material/Diversity2Outlined";
import SettingsAccessibilityOutlinedIcon from "@mui/icons-material/SettingsAccessibilityOutlined";
import AnalyticsOutlinedIcon from "@mui/icons-material/AnalyticsOutlined";
import GradingOutlinedIcon from "@mui/icons-material/GradingOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import ExitToAppOutlinedIcon from "@mui/icons-material/ExitToAppOutlined";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import { useAuth } from "../../context/authContext";
import { useEffect } from "react";

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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selected, setSelected] = useState("Dashboard");
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        height: "100vh",
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
            style={{ margin: "15px 0", color: colors.grey[100], }}
          >
            {!isCollapsed && (
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                ml="15px"
              >
                <Typography variant="h3" color={colors.grey[100]}>
                  LSEED Insight
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
                  src="/assets/user.png"
                  style={{ borderRadius: "50%", border: `2px solid ${colors.grey[100]}`, boxShadow: "0px 4px 10px rgba(0,0,0,0.2)" }}
                />
              </Box>

              <Typography variant="h5" color={colors.grey[100]} fontWeight="bold" mt={1}>
                {user.firstname || "User"}
              </Typography>
              <Typography variant="body2" color={colors.greenAccent[500]}>
                {user.role || "LSEED User"}
              </Typography>
            </Box>
          )}

          {/* Navigation Items */}
          <Box paddingLeft={isCollapsed ? undefined : "10%"}>
            <Item
              title="Dashboard"
              to="/dashboard"
              icon={<GridViewOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
            />

            {user?.role === "Mentor" && (
              <Item
                title="Assess SE"
                to="/assess"
                icon={<AssignmentTurnedInOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
            )}

            {user?.role === "LSEED" && (
              <>
                <Item title="Manage Social Enterprise" to="/socialenterprise" icon={<Diversity2OutlinedIcon />} selected={selected} setSelected={setSelected} />
                <Item title="LSEED Mentors" to="/mentors" icon={<SettingsAccessibilityOutlinedIcon />} selected={selected} setSelected={setSelected} />
                <Item title="Show Analytics" to="/analytics" icon={<AnalyticsOutlinedIcon />} selected={selected} setSelected={setSelected} />
                <Item title="Show Reports" to="/reports" icon={<GradingOutlinedIcon />} selected={selected} setSelected={setSelected} />
                <Item title="Scheduling Matrix" to="/scheduling" icon={<CalendarMonthOutlinedIcon />} selected={selected} setSelected={setSelected} />
              </>
            )}

            {user?.role === "Mentor" && (
              <Item title="Scheduling Matrix" to="/scheduling" icon={<CalendarMonthOutlinedIcon />} selected={selected} setSelected={setSelected} />
            )}
          </Box>
        </Menu>
      </ProSidebar>
    </Box>
  );
};

export default Sidebar;

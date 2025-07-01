import React from "react";
import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import Sidebar from "../scenes/global/Sidebar";
import Topbar from "../scenes/global/Topbar";
import ScrollToTop from "../components/ScrollToTop";
import { useAuth } from "../context/authContext";

const AppLayout = () => {
  const { user, isMentorView } = useAuth();

  return (
    <Box sx={{ display: "flex", width: "100%", minHeight: "100vh" }}>
      <Sidebar isMentorView={isMentorView} />
      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          overflowY: "auto",
          padding: "20px",
        }}
      >
        <Topbar />
        <ScrollToTop />
        <Outlet />
      </Box>
    </Box>
  );
};

export default AppLayout;
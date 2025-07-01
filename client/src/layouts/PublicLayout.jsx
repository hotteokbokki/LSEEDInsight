import React from "react";
import { Outlet } from "react-router-dom";
import { Box } from "@mui/material";

const PublicLayout = () => {
  return (
    <Box
      sx={{
        width: "100vw",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Outlet />
    </Box>
  );
};

export default PublicLayout;

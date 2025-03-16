import React from "react";
import { Box, Typography, Chip, Button, useTheme } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import StatBox from "../../components/StatBox";
import {
  Assessment,
  Star,
  Business,
  EventAvailable,
} from "@mui/icons-material";
import { tokens } from "../../theme";

const mockStats = {
  totalEvaluations: 25,
  averageRating: 4.3,
  mostCommonRating: 5,
  socialEnterprisesHandled: 10,
};

const mockEvaluations = [
  {
    id: 1,
    date: "2025-03-10",
    enterprise: "GreenFuture SE",
    status: "Acknowledged",
  },
  { id: 2, date: "2025-03-08", enterprise: "EcoSavers", status: "Pending" },
  {
    id: 3,
    date: "2025-03-05",
    enterprise: "BlueWater Solutions",
    status: "Acknowledged",
  },
];

const mockSessions = [
  {
    id: 1,
    date: "2025-03-20",
    enterprise: "GreenFuture SE",
    status: "Confirmed",
  },
  {
    id: 2,
    date: "2025-03-22",
    enterprise: "EcoSavers",
    status: "Pending Approval",
  },
];

const MentorDashboard = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  return (
    <Box m="20px">
      {/* HEADER */}
      <Typography variant="h4" fontWeight="bold">
        Mentor Dashboard
      </Typography>

      {/* Row 1 - StatBoxes */}
      <Box
        display="flex"
        flexWrap="wrap"
        gap="20px"
        justifyContent="space-between"
        mt="20px"
      >
        {/* Total Evaluations Submitted */}
        <Box
          flex="1 1 22%" // Responsive width for each StatBox
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
          p="20px"
        >
          <StatBox
            title={mockStats.totalEvaluations}
            subtitle="Total Evaluations Submitted"
            progress={mockStats.totalEvaluations / 50} // Placeholder percentage
            increase={`${((mockStats.totalEvaluations / 50) * 100).toFixed(
              2
            )}%`}
            icon={
              <Assessment
                sx={{ fontSize: "26px", color: colors.blueAccent[500] }}
              />
            }
          />
        </Box>

        {/* Average Rating Given to SEs */}
        <Box
          flex="1 1 22%"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
          p="20px"
        >
          <StatBox
            title={mockStats.averageRating}
            subtitle="Average Rating Given to SEs"
            progress={mockStats.averageRating / 5} // Placeholder progress
            increase={`${((mockStats.averageRating / 5) * 100).toFixed(2)}%`}
            icon={
              <Star sx={{ fontSize: "26px", color: colors.blueAccent[500] }} />
            }
          />
        </Box>

        {/* Most Common Rating */}
        <Box
          flex="1 1 22%"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
          p="20px"
        >
          <StatBox
            title={mockStats.mostCommonRating}
            subtitle="Most Common Rating"
            progress={mockStats.mostCommonRating / 5} // Placeholder progress
            increase={`${((mockStats.mostCommonRating / 5) * 100).toFixed(2)}%`}
            icon={
              <Star sx={{ fontSize: "26px", color: colors.blueAccent[500] }} />
            }
          />
        </Box>

        {/* Social Enterprises Handled */}
        <Box
          flex="1 1 22%"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
          p="20px"
        >
          <StatBox
            title={mockStats.socialEnterprisesHandled}
            subtitle="Social Enterprises Handled"
            progress={mockStats.socialEnterprisesHandled / 20} // Placeholder percentage
            increase={`${(
              (mockStats.socialEnterprisesHandled / 20) *
              100
            ).toFixed(2)}%`}
            icon={
              <Business
                sx={{ fontSize: "26px", color: colors.blueAccent[500] }}
              />
            }
          />
        </Box>
      </Box>

      {/* Evaluation History */}
      <Box mt={4}>
        <Typography variant="h6" gutterBottom>
          Recent Evaluations
        </Typography>
        {mockEvaluations.length > 0 ? (
          <Box
            sx={{
              height: 400,
              width: "100%",
              overflowX: "auto",
              "& .MuiDataGrid-root": {
                border: "none",
              },
              "& .MuiDataGrid-cell": {
                borderBottom: "none",
              },
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
              rows={mockEvaluations}
              columns={[
                { field: "date", headerName: "Date", flex: 1 },
                {
                  field: "enterprise",
                  headerName: "Social Enterprise",
                  flex: 2,
                },
                {
                  field: "status",
                  headerName: "Acknowledgment",
                  flex: 1,
                  renderCell: (params) => (
                    <Chip
                      label={params.value}
                      color={
                        params.value === "Acknowledged" ? "success" : "warning"
                      }
                    />
                  ),
                },
                {
                  field: "actions",
                  headerName: "Actions",
                  flex: 1,
                  renderCell: () => (
                    <Button variant="contained" size="small">
                      View Details
                    </Button>
                  ),
                },
              ]}
              pageSize={5}
              rowsPerPageOptions={[5, 10]}
            />
          </Box>
        ) : (
          <Typography>No evaluations available.</Typography>
        )}
      </Box>

      {/* Upcoming Mentoring Sessions */}
      <Box mt={4}>
        <Typography variant="h6" gutterBottom>
          Upcoming Mentoring Sessions
        </Typography>
        {mockSessions.length > 0 ? (
          <Box
            sx={{
              height: 400,
              width: "100%",
              overflowX: "auto",
              "& .MuiDataGrid-root": {
                border: "none",
              },
              "& .MuiDataGrid-cell": {
                borderBottom: "none",
              },
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
              rows={mockSessions}
              columns={[
                { field: "date", headerName: "Date & Time", flex: 1 },
                {
                  field: "enterprise",
                  headerName: "Social Enterprise",
                  flex: 2,
                },
                {
                  field: "status",
                  headerName: "Status",
                  flex: 1,
                  renderCell: (params) => (
                    <Chip
                      label={params.value}
                      color={
                        params.value === "Confirmed" ? "success" : "warning"
                      }
                    />
                  ),
                },
              ]}
              pageSize={5}
              rowsPerPageOptions={[5, 10]}
            />
          </Box>
        ) : (
          <Typography>No mentoring sessions scheduled.</Typography>
        )}
      </Box>
    </Box>
  );
};

export default MentorDashboard;

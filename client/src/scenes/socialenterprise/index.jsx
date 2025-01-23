import { Box, Typography, useTheme, IconButton } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import { mockDataSE } from "../../sampledata/mockData";
import Header from "../../components/Header";
import LineChart from "../../components/LineChart";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";

const SocialEnterprise = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const columns = [
    { field: "id", headerName: "ID" },
    { field: "name", headerName: "Name", flex: 1, cellClassName: "name-column--cell" },
    { field: "mentor", headerName: "Mentor", flex: 1 },
    { field: "sdg", headerName: "SDG", flex: 1 },
    { field: "contact", headerName: "Contact", flex: 1 },
    { field: "members", headerName: "No. of Members", type: "number", headerAlign: "left", align: "left" },
    { field: "program", headerName: "Program", flex: 1 },
    { field: "status", headerName: "Status", flex: 1 },
  ];

  return (
    <Box m="20px">
      <Header title="SOCIAL ENTERPRISE" subtitle="Manage Social Enterprises" />

      {/* ROW 1: Line Chart */}
      <Box
        gridColumn="span 12"
        gridRow="span 2"
        backgroundColor={colors.primary[400]}
      >
        <Box
          height="100px"
          mt="25px"
          p="0 30px"
          display="flex"
          justifyContent="space-between"
          alignItems="center"
        >
          <Box>
            <Typography variant="h5" fontWeight="600" color={colors.grey[100]}>
              GEMS
            </Typography>
            <Typography variant="h3" fontWeight="bold" color={colors.greenAccent[500]}>
              Top Performer
            </Typography>
          </Box>
          <Box>
            <IconButton>
              <DownloadOutlinedIcon sx={{ fontSize: "26px", color: colors.greenAccent[500] }} />
            </IconButton>
          </Box>
        </Box>
        <Box height="250px" m="-20px 0 0 0">
          <LineChart isDashboard={true} />
        </Box>
      </Box>

      {/* Bottom Row: Data Grid */}
      <Box
        height="75vh"
        sx={{
          "& .MuiDataGrid-root": {
            border: "none",
          },
          "& .MuiDataGrid-cell": {
            borderBottom: "none",
          },
          "& .name-column--cell": {
            color: colors.greenAccent[300],
          },
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: colors.blueAccent[700],
            borderBottom: "none",
          },
          "& .MuiDataGrid-virtualScroller": {
            backgroundColor: colors.primary[400],
          },
          "& .MuiDataGrid-footerContainer": {
            borderTop: "none",
            backgroundColor: colors.blueAccent[700],
          },
        }}
      >
        <DataGrid
          rows={mockDataSE}
          columns={columns}
        />
      </Box>
    </Box>
  );
};

export default SocialEnterprise;

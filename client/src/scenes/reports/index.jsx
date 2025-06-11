import { Box } from "@mui/material";
import Header from "../../components/Header";

const Reports = () => {
  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Header title="Reports" subtitle="Generate Reports" />
      </Box>
      {/* Add report */}
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        gap={4}
        mt={4}
      >
        <Box
          width="100%"
          bgcolor={colors.primary[400]}
          display="flex"
          padding={2}
          gap={2}
        >
          <Button
            onClick={handleMentorshipSignup}
            variant="contained"
            color="secondary"
            sx={{ fontSize: "16px", py: "10px", flexGrow: 1 }}
          >
            Add report
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default Reports;

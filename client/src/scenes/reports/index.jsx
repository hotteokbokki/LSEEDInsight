import { Box, Button, useTheme } from "@mui/material";
import Header from "../../components/Header";
import { tokens } from "../../theme";

const Reports = () => {
  const theme = useTheme(); // Access the theme
  const colors = tokens(theme.palette.mode); // Get your color tokens based on the current theme mode
  
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

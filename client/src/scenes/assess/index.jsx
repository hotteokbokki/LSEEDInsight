import { Box, Button, Typography, useTheme } from "@mui/material";
import Header from "../../components/Header";
import { tokens } from "../../theme";

const AssessSEPage = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  return (
    <Box m="20px">
      {/* Header */}
      <Header title="ASSESS SE" subtitle="Evaluate and manage SE performance" />

      {/* Main Content */}
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="60vh"
        gap={4} // Adds spacing between the boxes
      >
        {/* Left Side - Evaluate SE */}
        <Box
          width="45%" // Adjusted for better spacing
          p={3}
          textAlign="center"
          border={`1px solid ${colors.grey[500]}`}
          borderRadius={2}
          bgcolor={colors.primary[400]}
          height="250px" // Increased height
        >
          <Button
            variant="contained"
            color="secondary"
            sx={{ fontSize: "20px", padding: "20px", width: "100%" }}
          >
            Evaluate SE
          </Button>
          <Typography mt={2} variant="body1">
            Used for mentors to evaluate the performance of the SE they are
            handling.
          </Typography>
        </Box>

        {/* Right Side - File LOM */}
        <Box
          width="45%" // Adjusted for better spacing
          p={3}
          textAlign="center"
          border={`1px solid ${colors.grey[500]}`}
          borderRadius={2}
          bgcolor={colors.primary[400]}
          height="250px" // Increased height
        >
          <Button
            variant="contained"
            color="secondary"
            sx={{ fontSize: "20px", padding: "20px", width: "100%" }}
          >
            FILE LOM
          </Button>
          <Typography mt={2} variant="body1">
            Redirects to a page that allows the mentor to file LOM (LSEED Online
            Mentoring).
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default AssessSEPage;

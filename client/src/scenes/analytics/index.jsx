import { Box } from "@mui/material";
import Header from "../../components/Header";
import LineChart from "../../components/LineChart";
import PieChart from "../../components/PieChart";

const Analytics = () => {
  return (
    <Box m="20px">
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Header title="Analytics" subtitle="Welcome to Analytics" />
      </Box>

      {/* Analytics Charts */}
      <Box
        mt="20px"
        display="grid"
        gridTemplateColumns="repeat(12, 1fr)"
        gap="20px"
      >
        {/* Row 1 */}
        <Box
          gridColumn="span 6"
          height="300px"
          backgroundColor="#1e293b"
          p="20px"
          borderRadius="8px"
        >
          <LineChart />
        </Box>
        <Box
          gridColumn="span 6"
          height="300px"
          backgroundColor="#1e293b"
          p="20px"
          borderRadius="8px"
        >
          <PieChart />
        </Box>

        {/* Row 2 */}
        <Box
          gridColumn="span 6"
          height="300px"
          backgroundColor="#1e293b"
          p="20px"
          borderRadius="8px"
        >
          <LineChart />
        </Box>
        <Box
          gridColumn="span 6"
          height="300px"
          backgroundColor="#1e293b"
          p="20px"
          borderRadius="8px"
        >
          <PieChart />
        </Box>
      </Box>
    </Box>
  );
};

export default Analytics;

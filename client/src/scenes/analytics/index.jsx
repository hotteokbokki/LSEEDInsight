import { Box } from "@mui/material";
import Header from "../../components/Header";
import PieChart from "../../components/PieChart";
import StatBox from "../../components/StatBox";
import EmailIcon from "@mui/icons-material/Email";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import TrafficIcon from "@mui/icons-material/Traffic";

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
        {/* Row 1 - StatBoxes */}
        <Box
          gridColumn="span 3"
          backgroundColor="#1e293b"
          display="flex"
          alignItems="center"
          justifyContent="center"
          p="20px"
          borderRadius="8px"
        >
          <StatBox
            title="13"
            subtitle="SE's Enrolled"
            progress="0.75"
            increase="+14%"
            icon={<EmailIcon sx={{ fontSize: "26px" }} />}
          />
        </Box>
        <Box
          gridColumn="span 3"
          backgroundColor="#1e293b"
          display="flex"
          alignItems="center"
          justifyContent="center"
          p="20px"
          borderRadius="8px"
        >
          <StatBox
            title="44"
            subtitle="SE's with Mentors"
            progress="0.50"
            increase="+21%"
            icon={<PointOfSaleIcon sx={{ fontSize: "26px" }} />}
          />
        </Box>
        <Box
          gridColumn="span 3"
          backgroundColor="#1e293b"
          display="flex"
          alignItems="center"
          justifyContent="center"
          p="20px"
          borderRadius="8px"
        >
          <StatBox
            title="20"
            subtitle="SEs without mentors"
            progress="0.30"
            increase="+5%"
            icon={<PersonAddIcon sx={{ fontSize: "26px" }} />}
          />
        </Box>
        <Box
          gridColumn="span 3"
          backgroundColor="#1e293b"
          display="flex"
          alignItems="center"
          justifyContent="center"
          p="20px"
          borderRadius="8px"
        >
          <StatBox
            title="44"
            subtitle="Most Growth by SE"
            progress="0.80"
            increase="+43%"
            icon={<TrafficIcon sx={{ fontSize: "26px" }} />}
          />
        </Box>

        {/* Row 2 - Pie Charts */}
        <Box
          gridColumn="span 6"
          height="300px"
          backgroundColor="#1e293b"
          p="20px"
          borderRadius="8px"
        >
          {" "}
          Average SE improvement Score
          <PieChart />
        </Box>
        <Box
          gridColumn="span 6"
          height="300px"
          backgroundColor="#1e293b"
          p="20px"
          borderRadius="8px"
        >
          {" "}
          Top 3 Challenges for SE
          <PieChart />
        </Box>
      </Box>
    </Box>
  );
};

export default Analytics;

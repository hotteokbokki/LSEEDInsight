import { Box, useTheme, Typography } from "@mui/material";
import Header from "../../components/Header";
import PieChart from "../../components/PieChart";
import StatBox from "../../components/StatBox";
import EmailIcon from "@mui/icons-material/Email";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import TrafficIcon from "@mui/icons-material/Traffic";
import { tokens } from "../../theme";

const Analytics = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const dummyPieData = [
    { id: "Category A", label: "Category A", value: 30, color: "hsl(230, 70%, 50%)" },
    { id: "Category B", label: "Category B", value: 40, color: "hsl(170, 70%, 50%)" },
    { id: "Category C", label: "Category C", value: 50, color: "hsl(50, 70%, 50%)" },
  ];

  return (
    <Box m="20px">
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Header title="Analytics" subtitle="Welcome to Analytics" />
      </Box>

      {/* Analytics Charts */}
      <Box
        mt="20px"
        display="flex"
        flexWrap="wrap"
        gap="20px"
        justifyContent="space-between"
      >
        {/* Row 1 - StatBoxes */}
        <Box
          flex="1 1 18%"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
          p="20px"
        >
          <StatBox
            title="13"
            subtitle="SE's Enrolled"
            progress="0.75"
            increase="+14%"
            icon={
              <EmailIcon
                sx={{ fontSize: "26px", color: colors.greenAccent[500] }}
              />
            }
          />
        </Box>
        <Box
          flex="1 1 18%"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
          p="20px"
        >
          <StatBox
            title="44"
            subtitle="SE's with Mentors"
            progress="0.50"
            increase="+21%"
            icon={
              <PointOfSaleIcon
                sx={{ fontSize: "26px", color: colors.blueAccent[500] }}
              />
            }
          />
        </Box>
        <Box
          flex="1 1 18%"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
          p="20px"
        >
          <StatBox
            title="20"
            subtitle="SEs without mentors"
            progress="0.30"
            increase="+5%"
            icon={
              <PersonAddIcon
                sx={{ color: colors.redAccent[500], fontSize: "26px" }}
              />
            }
          />
        </Box>
        <Box
          flex="1 1 18%"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
          p="20px"
        >
          <StatBox
            title="44"
            subtitle="Most Growth by SE"
            progress="0.80"
            increase="+43%"
            icon={
              <TrafficIcon
                sx={{ fontSize: "26px", color: colors.blueAccent[500] }}
              />
            }
          />
        </Box>
        <Box
          flex="1 1 18%"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
          p="20px"
        >
          <StatBox
            title="32"
            subtitle="Average SE business performance score"
            progress="0.60"
            increase="+10%"
            icon={
              <EmailIcon
                sx={{ fontSize: "26px", color: colors.greenAccent[500] }}
              />
            }
          />
        </Box>

        {/* Row 2 - Pie Charts */}
        <Box
          flex="1 1 48%"
          height="300px"
          backgroundColor={colors.primary[400]}
          p="20px"
        >
          <Typography
            variant="h3"
            fontWeight="bold"
            color={colors.greenAccent[500]}
          >
            Common Challenges
          </Typography>
          <PieChart
            title="Average SE Improvement Score"
            titleColor={colors.greenAccent[500]}
            data={dummyPieData}
          />
        </Box>
        <Box
          flex="1 1 48%"
          height="300px"
          backgroundColor={colors.primary[400]}
          p="20px"
        >
          <Typography
            variant="h3"
            fontWeight="bold"
            color={colors.greenAccent[500]}
          >
            Average improvement Score
          </Typography>
          <PieChart
            title="Top 3 Challenges for SE"
            titleColor={colors.greenAccent[500]}
            data={dummyPieData}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default Analytics;

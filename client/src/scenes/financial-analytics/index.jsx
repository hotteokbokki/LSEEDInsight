import { Box, useTheme, Typography } from "@mui/material";
import Header from "../../components/Header";
import StatBox from "../../components/StatBox";
import LineChart from "../../components/LineChart";
import BarChart from "../../components/BarChart";
import PieChart from "../../components/PieChart";
import { tokens } from "../../theme";

const FinancialAnalytics = ({ userRole }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  // Mock data representing multiple Social Enterprises (SEs)
  const socialEnterprises = [
    {
      name: "SE A",
      totalRevenue: 1250000,
      totalExpenses: 850000,
      netIncome: 400000,
      totalAssets: 2000000,
      netProfitMargin: 32,
      grossProfitMargin: 45,
      debtToAssetRatio: 0.35,
      equityRatio: 0.65,
      revenueVsExpenses: [
        { x: "Jan", revenue: 100000, expenses: 70000 },
        { x: "Feb", revenue: 120000, expenses: 80000 },
        { x: "Mar", revenue: 110000, expenses: 75000 },
        { x: "Apr", revenue: 130000, expenses: 90000 },
      ],
      cashFlow: [
        { x: "Jan", inflow: 90000, outflow: 60000 },
        { x: "Feb", inflow: 95000, outflow: 65000 },
        { x: "Mar", inflow: 100000, outflow: 70000 },
      ],
      inventoryBreakdown: [
        { name: "Raw Materials", value: 400 },
        { name: "Work-in-Progress", value: 300 },
        { name: "Finished Goods", value: 300 },
      ],
      equityTrend: [
        { x: "Q1", equity: 500000 },
        { x: "Q2", equity: 600000 },
        { x: "Q3", equity: 700000 },
        { x: "Q4", equity: 800000 },
      ],
    },
    {
      name: "SE B",
      totalRevenue: 950000,
      totalExpenses: 700000,
      netIncome: 250000,
      totalAssets: 1500000,
      netProfitMargin: 26,
      grossProfitMargin: 40,
      debtToAssetRatio: 0.4,
      equityRatio: 0.6,
      revenueVsExpenses: [
        { x: "Jan", revenue: 80000, expenses: 60000 },
        { x: "Feb", revenue: 90000, expenses: 65000 },
        { x: "Mar", revenue: 85000, expenses: 62000 },
        { x: "Apr", revenue: 90000, expenses: 70000 },
      ],
      cashFlow: [
        { x: "Jan", inflow: 70000, outflow: 50000 },
        { x: "Feb", inflow: 75000, outflow: 55000 },
        { x: "Mar", inflow: 72000, outflow: 53000 },
      ],
      inventoryBreakdown: [
        { name: "Raw Materials", value: 300 },
        { name: "Work-in-Progress", value: 250 },
        { name: "Finished Goods", value: 450 },
      ],
      equityTrend: [
        { x: "Q1", equity: 400000 },
        { x: "Q2", equity: 450000 },
        { x: "Q3", equity: 480000 },
        { x: "Q4", equity: 520000 },
      ],
    },
  ];

  // Helper to calculate averages for StatBoxes (or sums where applicable)
  const avg = (arr, key) =>
    (arr.reduce((acc, item) => acc + item[key], 0) / arr.length).toFixed(2);

  // Prepare combined data for charts comparing SEs:
  // For LineChart: we create one series per SE with their revenue and expenses or equity trend

  // Format revenue vs expenses as separate series per SE for line chart
  const revenueVsExpensesData = socialEnterprises
    .map((se) => ({
      id: `${se.name} Revenue`,
      data: se.revenueVsExpenses.map((point) => ({
        x: point.x,
        y: point.revenue,
      })),
    }))
    .concat(
      socialEnterprises.map((se) => ({
        id: `${se.name} Expenses`,
        data: se.revenueVsExpenses.map((point) => ({
          x: point.x,
          y: point.expenses,
        })),
      }))
    );

  // Format equity trend per SE for line chart
  const equityTrendData = socialEnterprises.map((se) => ({
    id: se.name,
    data: se.equityTrend.map((point) => ({ x: point.x, y: point.equity })),
  }));

  // For cash flow bar chart, similar approach:
  // Create two series: inflow and outflow per SE, combine as grouped bar chart
  const cashFlowData = socialEnterprises.flatMap((se) => [
    {
      id: `${se.name} Inflow`,
      data: se.cashFlow.map((point) => ({ x: point.x, y: point.inflow })),
    },
    {
      id: `${se.name} Outflow`,
      data: se.cashFlow.map((point) => ({ x: point.x, y: point.outflow })),
    },
  ]);

  // For inventory pie chart, aggregate all SEs' inventories for overall breakdown
  const aggregateInventory = {};
  socialEnterprises.forEach((se) => {
    se.inventoryBreakdown.forEach(({ name, value }) => {
      aggregateInventory[name] = (aggregateInventory[name] || 0) + value;
    });
  });
  const inventoryBreakdownData = Object.entries(aggregateInventory).map(
    ([name, value]) => ({ name, value })
  );

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Header
          title="Financial Analytics"
          subtitle="Welcome to Financial Analytics"
        />
      </Box>

      {/* Row 1 - Aggregate Financial StatBoxes */}
      <Box
        display="flex"
        flexWrap="wrap"
        gap="20px"
        justifyContent="space-between"
        mt="20px"
      >
        <Box
          flex="1 1 22%"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
          p="20px"
        >
          <StatBox
            title={`₱${socialEnterprises
              .reduce((a, b) => a + b.totalRevenue, 0)
              .toLocaleString()}`}
            subtitle="Total Revenue (All SEs)"
            progress={1}
            increase="N/A"
            icon={<></>}
          />
        </Box>
        <Box
          flex="1 1 22%"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
          p="20px"
        >
          <StatBox
            title={`₱${socialEnterprises
              .reduce((a, b) => a + b.totalExpenses, 0)
              .toLocaleString()}`}
            subtitle="Total Expenses (All SEs)"
            progress={1}
            increase="N/A"
            icon={<></>}
          />
        </Box>
        <Box
          flex="1 1 22%"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
          p="20px"
        >
          <StatBox
            title={`₱${socialEnterprises
              .reduce((a, b) => a + b.netIncome, 0)
              .toLocaleString()}`}
            subtitle="Net Income (All SEs)"
            progress={1}
            increase="N/A"
            icon={<></>}
          />
        </Box>
        <Box
          flex="1 1 22%"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
          p="20px"
        >
          <StatBox
            title={`₱${socialEnterprises
              .reduce((a, b) => a + b.totalAssets, 0)
              .toLocaleString()}`}
            subtitle="Total Assets (All SEs)"
            progress={1}
            increase="N/A"
            icon={<></>}
          />
        </Box>
      </Box>

      {/* Row 2 - Revenue vs Expenses Over Time */}
      <Box backgroundColor={colors.primary[400]} p="20px" mt="20px">
        <Typography
          variant="h3"
          fontWeight="bold"
          color={colors.greenAccent[500]}
        >
          Revenue vs Expenses Over Time (by Social Enterprise)
        </Typography>
        <Box height="400px">
          <LineChart data={revenueVsExpensesData} />
        </Box>
      </Box>

      {/* Row 3 - Cash Flow Analysis */}
      <Box backgroundColor={colors.primary[400]} p="20px" mt="20px">
        <Typography
          variant="h3"
          fontWeight="bold"
          color={colors.greenAccent[500]}
        >
          Cash Flow Comparison (Inflow vs Outflow)
        </Typography>
        <Box height="400px">
          <BarChart data={cashFlowData} />
        </Box>
      </Box>

      {/* Row 4 - Inventory Distribution (Aggregated) */}
      <Box backgroundColor={colors.primary[400]} p="20px" mt="20px">
        <Typography
          variant="h3"
          fontWeight="bold"
          color={colors.greenAccent[500]}
        >
          Aggregate Inventory Distribution
        </Typography>
        <Box height="400px">
          <PieChart data={inventoryBreakdownData} />
        </Box>
      </Box>

      {/* Row 5 - Average Financial Ratios Across SEs */}
      <Box
        display="flex"
        flexWrap="wrap"
        gap="20px"
        justifyContent="space-between"
        mt="20px"
      >
        <Box
          flex="1 1 22%"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
          p="20px"
        >
          <StatBox
            title={`${avg(socialEnterprises, "netProfitMargin")}%`}
            subtitle="Avg Net Profit Margin"
            progress={1}
            increase="N/A"
            icon={<></>}
          />
        </Box>
        <Box
          flex="1 1 22%"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
          p="20px"
        >
          <StatBox
            title={`${avg(socialEnterprises, "grossProfitMargin")}%`}
            subtitle="Avg Gross Profit Margin"
            progress={1}
            increase="N/A"
            icon={<></>}
          />
        </Box>
        <Box
          flex="1 1 22%"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
          p="20px"
        >
          <StatBox
            title={`${avg(socialEnterprises, "debtToAssetRatio")}`}
            subtitle="Avg Debt to Asset Ratio"
            progress={1}
            increase="N/A"
            icon={<></>}
          />
        </Box>
        <Box
          flex="1 1 22%"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
          p="20px"
        >
          <StatBox
            title={`${avg(socialEnterprises, "equityRatio")}`}
            subtitle="Avg Equity Ratio"
            progress={1}
            increase="N/A"
            icon={<></>}
          />
        </Box>
      </Box>

      {/* Row 6 - Equity Trend Comparison */}
      <Box backgroundColor={colors.primary[400]} p="20px" mt="20px">
        <Typography
          variant="h3"
          fontWeight="bold"
          color={colors.greenAccent[500]}
        >
          Equity Trend by Social Enterprise
        </Typography>
        <Box height="400px">
          <LineChart data={equityTrendData} />
        </Box>
      </Box>
    </Box>
  );
};

export default FinancialAnalytics;

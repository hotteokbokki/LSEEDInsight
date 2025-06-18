import { Box, useTheme, Typography } from "@mui/material";
import Header from "../../components/Header";
import StatBox from "../../components/StatBox";
import LineChart from "../../components/LineChart";
import BarChart from "../../components/BarChart";
import FinancialBarChart from "../../components/FinancialBarChart";
import PieChart from "../../components/PieChart";
import { tokens } from "../../theme";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { DataGrid } from "@mui/x-data-grid";

const FinancialAnalytics = ({ userRole }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [financialData, setFinancialData] = useState([]);

  /* Mock data representing multiple Social Enterprises (SEs)
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
*/

  // Connect to the DB

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          "http://localhost:4000/api/financial-statements"
        );
        setFinancialData(response.data);
      } catch (error) {
        console.error("Failed to fetch financial data:", error);
      }
    };

    fetchData();
  }, []);

  /* Convert database rows into format compatible with your charts
  const socialEnterprises = financialData.map((item, index) => {
  const parsedDate = item.date ? new Date(item.date).toLocaleDateString() : `Unknown ${index + 1}`;

  return {
    name: item.se_abbr ?? `SE ${index + 1}`,
    totalRevenue: item.total_revenue ?? 0,
    totalExpenses: item.total_expenses ?? 0,
    netIncome: item.net_income ?? 0,
    totalAssets: item.total_assets ?? 0,
    netProfitMargin: item.total_revenue ? ((item.net_income / item.total_revenue) * 100).toFixed(2) : "0.00",
    grossProfitMargin: item.total_revenue
      ? ((item.total_revenue - item.total_expenses) / item.total_revenue * 100).toFixed(2)
      : "0.00",
    debtToAssetRatio: item.total_assets ? (item.total_liabilities / item.total_assets).toFixed(2) : "0.00",
    equityRatio: item.total_assets ? (item.owner_equity / item.total_assets).toFixed(2) : "0.00",
    revenueVsExpenses: [
      { x: parsedDate, revenue: item.total_revenue ?? 0, expenses: item.total_expenses ?? 0 },
    ],
    cashFlow: [
      { x: parsedDate, inflow: item.total_revenue ?? 0, outflow: item.total_expenses ?? 0 },
    ],
    inventoryBreakdown: [],
    equityTrend: [
      { x: parsedDate, equity: item.owner_equity ?? 0 },
    ],
  };
});
*/

  const seMap = new Map();
  financialData.forEach((item) => {
    const abbr = item.se_abbr ?? "Unknown";
    const parsedDate = item.date
      ? new Date(item.date).toLocaleDateString()
      : "Unknown Date";

    const dataPoint = {
      date: parsedDate,
      totalRevenue: Number(item.total_revenue ?? 0),
      totalExpenses: Number(item.total_expenses ?? 0),
      netIncome: Number(item.net_income ?? 0),
      totalAssets: Number(item.total_assets ?? 0),
      totalLiabilities: Number(item.total_liabilities ?? 0),
      ownerEquity: Number(item.owner_equity ?? 0),
    };

    if (!seMap.has(abbr)) {
      seMap.set(abbr, {
        name: abbr,
        totalRevenue: 0,
        totalExpenses: 0,
        netIncome: 0,
        totalAssets: 0,
        revenueVsExpenses: [],
        cashFlow: [],
        equityTrend: [],
        inventoryBreakdown: [],
      });
    }

    const se = seMap.get(abbr);
    se.totalRevenue += dataPoint.totalRevenue;
    se.totalExpenses += dataPoint.totalExpenses;
    se.netIncome += dataPoint.netIncome;
    se.totalAssets += dataPoint.totalAssets;

    se.revenueVsExpenses.push({
      x: dataPoint.date,
      revenue: dataPoint.totalRevenue,
      expenses: dataPoint.totalExpenses,
    });

    se.cashFlow.push({
      x: dataPoint.date,
      inflow: dataPoint.totalRevenue,
      outflow: dataPoint.totalExpenses,
    });

    se.equityTrend.push({
      x: dataPoint.date,
      equity: dataPoint.ownerEquity,
    });

    se.netProfitMargin = se.totalRevenue
      ? ((se.netIncome / se.totalRevenue) * 100).toFixed(2)
      : "0.00";
    se.grossProfitMargin = se.totalRevenue
      ? (
          ((se.totalRevenue - se.totalExpenses) / se.totalRevenue) *
          100
        ).toFixed(2)
      : "0.00";
    se.debtToAssetRatio = se.totalAssets
      ? (dataPoint.totalLiabilities / dataPoint.totalAssets).toFixed(2)
      : "0.00";
    se.equityRatio = se.totalAssets
      ? (dataPoint.ownerEquity / dataPoint.totalAssets).toFixed(2)
      : "0.00";
  });

  const socialEnterprises = Array.from(seMap.values());

  const highestExpenseSE = socialEnterprises.reduce(
    (max, se) => (se.totalExpenses > (max?.totalExpenses || 0) ? se : max),
    null
  );

  const getExpenseLevel = (amount) => {
    if (amount > 100000) return "High";
    if (amount > 50000) return "Medium";
    return "Low";
  };

  const getExpenseLevelColor = (amount) => {
    if (amount > 100000) return colors?.redAccent?.[400] ?? "#ff5252"; // red
    if (amount > 50000) return colors?.yellowAccent?.[400] ?? "#EDED00"; // yellow
    return colors?.greenAccent?.[400] ?? "#4caf50"; // green
  };

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

  const mockPrograms = [
    { id: 1, name: "AgriBiz", mentor: "John Doe", status: "Active" },
    { id: 2, name: "EcoCrafts", mentor: "Jane Smith", status: "Pending" },
    // more mock entries...
  ];

  const mockProgramColumns = [
    { field: "name", headerName: "Program Name", flex: 1 },
    { field: "mentor", headerName: "Assigned Mentor", flex: 1 },
    { field: "status", headerName: "Status", flex: 1 },
  ];

  const profitOverTimeData = [
    { name: "Jan", profit: 50000 },
    { name: "Feb", profit: 60000 },
    { name: "Mar", profit: 45000 },
    // ...more monthly data
  ];

  const topRevenueSEsData = [
    { name: "SE A", revenue: 1200000 },
    { name: "SE B", revenue: 1100000 },
    { name: "SE C", revenue: 950000 },
    { name: "SE D", revenue: 870000 },
    { name: "SE E", revenue: 850000 },
    { name: "SE F", revenue: 800000 },
    { name: "SE G", revenue: 750000 },
    { name: "SE H", revenue: 700000 },
    { name: "SE I", revenue: 680000 },
    { name: "SE J", revenue: 650000 },
  ];

  const individualInventoryData = [
    { name: "Item A", value: 400 },
    { name: "Item B", value: 300 },
    { name: "Item C", value: 300 },
    { name: "Item D", value: 200 },
  ];

  const mostProfitSEsData = [
    { name: "SE X", profit: 500000 },
    { name: "SE Y", profit: 450000 },
    { name: "SE Z", profit: 400000 },
    // Top 10 SEs
  ];

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
              .reduce((sum, se) => sum + Number(se.totalRevenue || 0), 0)
              .toLocaleString()}`}
            subtitle="Total Revenue (All SEs)"
            progress={1}
            increase="N/A"
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
              .reduce((sum, se) => sum + Number(se.totalExpenses || 0), 0)
              .toLocaleString()}`}
            subtitle="Total Expenses (All SEs)"
            progress={1}
            increase="N/A"
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
              .reduce((sum, se) => sum + Number(se.netIncome || 0), 0)
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
              .reduce((sum, se) => sum + Number(se.totalAssets || 0), 0)
              .toLocaleString()}`}
            subtitle="Total Assets (All SEs)"
            progress={1}
            increase="N/A"
            icon={<></>}
          />
        </Box>

        <Box
          flex="1 1 100%"
          backgroundColor={getExpenseLevelColor(
            highestExpenseSE?.totalExpenses || 0
          )}
          display="flex"
          alignItems="center"
          justifyContent="center"
          p="20px"
          mt="20px"
        >
          <StatBox
            title={`₱${Number(
              highestExpenseSE?.totalExpenses || 0
            ).toLocaleString()}`}
            subtitle={`Highest Expenses: ${
              highestExpenseSE?.name || "N/A"
            } (${getExpenseLevel(highestExpenseSE?.totalExpenses)})`}
            progress={0.9}
            increase={`↑ ${getExpenseLevel(highestExpenseSE?.totalExpenses)}`}
            icon={<></>}
          />
        </Box>
      </Box>
      {/* Row 2 - LSEED Programs DataGrid */}
      <Box backgroundColor={colors.primary[400]} p="20px" mt="20px">
        <Typography
          variant="h3"
          fontWeight="bold"
          color={colors.greenAccent[500]}
          mb="10px"
        >
          LSEED Programs Overview
        </Typography>
        <Box height="400px">
          <DataGrid rows={mockPrograms} columns={mockProgramColumns} />
        </Box>
      </Box>

      {/* Row 3 - Profit Over Time */}
      <Box backgroundColor={colors.primary[400]} p="20px" mt="20px">
        <Typography
          variant="h3"
          fontWeight="bold"
          color={colors.greenAccent[500]}
        >
          Profit Over Time (by Social Enterprise)
        </Typography>
        <Box height="400px">
          <LineChart
            data={[
              {
                id: "Profit",
                data: profitOverTimeData.map((item) => ({
                  x: item.name,
                  y: item.profit,
                })),
              },
            ]}
          />
        </Box>
      </Box>

      {/* Row 4 - Cash Flow Analysis */}
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

      {/* Row 5 - Inventory Distribution (Aggregated) */}
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

      {/* Row 6 - Individual Inventory Reports */}
      <Box backgroundColor={colors.primary[400]} p="20px" mt="20px">
        <Typography
          variant="h3"
          fontWeight="bold"
          color={colors.greenAccent[500]}
        >
          Individual Inventory Reports by Item
        </Typography>
        <Box height="400px">
          <PieChart data={individualInventoryData} />
        </Box>
      </Box>

      {/* Row 7 - Average Financial Ratios Across SEs */}
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

      {/* Row 8 - Equity Trend Comparison */}
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

      {/* Top 10 SEs by Revenue */}
      <Box backgroundColor={colors.primary[400]} p="40px" mt="20px">
        <Typography
          variant="h3"
          fontWeight="bold"
          color={colors.greenAccent[500]}
        >
          Top 10 Social Enterprises by Revenue
        </Typography>
        <Box height="400px">
          <FinancialBarChart
            data={topRevenueSEsData}
            dataKey="revenue"
            label="Top Revenue"
          />
        </Box>
      </Box>

      {/* Most Profitable SEs */}
      <Box backgroundColor={colors.primary[400]} p="40px" mt="20px">
        <Typography
          variant="h3"
          fontWeight="bold"
          color={colors.greenAccent[500]}
        >
          Leaderboard: Most Profitable Social Enterprises
        </Typography>
        <Box height="400px">
          <FinancialBarChart
            data={mostProfitSEsData}
            dataKey="profit"
            label="Most Profit"
          />
        </Box>
      </Box>
    </Box>
  );
};

export default FinancialAnalytics;

import { Box, useTheme, Typography } from "@mui/material";
import Header from "../../components/Header";
import StatBox from "../../components/StatBox";
import LineChart from "../../components/LineChart";
import BarChart from "../../components/BarChart";
import FinancialBarChart from "../../components/FinancialBarChart";
import CashFlowBarChart from "../../components/CashflowBarChart.jsx";
import PieChart from "../../components/PieChart";
import { tokens } from "../../theme";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { DataGrid } from "@mui/x-data-grid";
import { FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import MoneyOffOutlinedIcon from "@mui/icons-material/MoneyOffOutlined";

const FinancialAnalytics = ({ userRole }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [financialData, setFinancialData] = useState([]);
  const [cashFlowRaw, setCashFlowRaw] = useState([]);

  // Connect to the DB

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [financialResponse, cashFlowResponse] = await Promise.all([
          axios.get("http://localhost:4000/api/financial-statements"),
          axios.get("http://localhost:4000/api/cashflow"),
        ]);
        setFinancialData(financialResponse.data);
        setCashFlowRaw(cashFlowResponse.data);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };

    fetchData();
  }, []);

  const [inventoryData, setInventoryData] = useState([]);

useEffect(() => {
  const fetchData = async () => {
    try {
      const response = await axios.get("http://localhost:4000/api/inventory-distribution");
      setInventoryData(response.data);
    } catch (error) {
      console.error("Error fetching inventory data:", error);
    }
  };

  fetchData();
}, []);

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

  const profitOverTimeSeries = socialEnterprises.map((se) => {
    const seenMonths = new Map();

    se.revenueVsExpenses.forEach((point) => {
      const date = new Date(point.x);
      const monthKey = date.toLocaleString("default", { month: "long" }); // e.g., "July"
      const year = date.getFullYear();
      const key = `${monthKey} ${year}`;

      const profit = point.revenue - point.expenses;

      // Keep only the latest profit for the month or aggregate if needed
      if (!seenMonths.has(key)) {
        seenMonths.set(key, { x: key, y: profit });
      } else {
        const existing = seenMonths.get(key);
        existing.y += profit; // accumulate profit if duplicate month exists
      }
    });

    // Sort by month chronologically
    const sortedData = Array.from(seenMonths.values()).sort((a, b) => {
      const dateA = new Date(`1 ${a.x}`); // "1 July 2024"
      const dateB = new Date(`1 ${b.x}`);
      return dateA - dateB;
    });

    return {
      id: se.name,
      data: sortedData,
    };
  });

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
  const cashFlowMap = new Map();
  const [selectedSE1, setSelectedSE1] = useState("");
  const [selectedSE2, setSelectedSE2] = useState("");

  cashFlowRaw.forEach((item) => {
    const name = item.se_abbr ?? item.se_id;
    const date = new Date(item.date).toLocaleDateString();

    if (!cashFlowMap.has(name)) {
      cashFlowMap.set(name, {
        inflow: [],
        outflow: [],
      });
    }

    const entry = cashFlowMap.get(name);
    entry.inflow.push({ x: date, y: Number(item.inflow) });
    entry.outflow.push({ x: date, y: Number(item.outflow) });
  });

  const cashFlowData = [];

  if (selectedSE1 && cashFlowMap.has(selectedSE1)) {
    const value = cashFlowMap.get(selectedSE1);
    cashFlowData.push(
      { id: `${selectedSE1} Inflow`, data: value.inflow },
      { id: `${selectedSE1} Outflow`, data: value.outflow }
    );
  }

  if (
    selectedSE2 &&
    cashFlowMap.has(selectedSE2) &&
    selectedSE2 !== selectedSE1
  ) {
    const value = cashFlowMap.get(selectedSE2);
    cashFlowData.push(
      { id: `${selectedSE2} Inflow`, data: value.inflow },
      { id: `${selectedSE2} Outflow`, data: value.outflow }
    );
  }

  // For inventory pie chart, aggregate all SEs' inventories for overall breakdown
  const inventoryPerSE = {};
  inventoryData.forEach(({ se_abbr, item_name, qty }) => {
    if (!inventoryPerSE[se_abbr]) {
      inventoryPerSE[se_abbr] = 0;
    }
    inventoryPerSE[se_abbr] += qty;
  });

  const inventoryBreakdownData = Object.entries(inventoryPerSE)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10) // Take top 10
  .map(([se_abbr, qty]) => ({
    name: se_abbr,
    value: qty,
  }));

  // Safely compute the latest valid date in YYYY-MM-DD format
  const validDates = financialData
    .map((item) => item.date)
    .filter((date) => date != null)
    .map((date) => new Date(date).toISOString().split("T")[0]);

  const latestDateOnly =
    validDates.length > 0
      ? validDates.sort().reverse()[0] // latest date in YYYY-MM-DD format
      : null;

  // Get all records from latest date (ignoring time)
  const latestRecordsMap = new Map();

  financialData.forEach((item) => {
    const name = item.se_abbr ?? item.se_id;
    const date = new Date(item.date);

    if (
      !latestRecordsMap.has(name) ||
      date > new Date(latestRecordsMap.get(name).date)
    ) {
      latestRecordsMap.set(name, item);
    }
  });

  const latestRecords = Array.from(latestRecordsMap.values());

  const latestRevenueRecords = latestRecords.map((item) => ({
    name: item.se_abbr ?? item.se_id,
    revenue: Number(item.total_revenue || 0),
  }));

  const aggregatedLatestSEs = new Map();

  latestRecords.forEach((item) => {
    const name = item.se_abbr ?? item.se_id;
    const revenue = Number(item.total_revenue || 0);
    const expenses = Number(item.total_expenses || 0);

    if (!aggregatedLatestSEs.has(name)) {
      aggregatedLatestSEs.set(name, {
        name,
        revenue,
        profit: revenue - expenses,
      });
    } else {
      const existing = aggregatedLatestSEs.get(name);
      existing.revenue += revenue;
      existing.profit += revenue - expenses;
    }
  });

  const topRevenueSEsData = [...aggregatedLatestSEs.values()]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  const latestProfitRecords = latestRecords.map((item) => ({
    name: item.se_abbr ?? item.se_id,
    profit: Number(item.total_revenue || 0) - Number(item.total_expenses || 0),
  }));

  const mostProfitSEsData = latestProfitRecords
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 3);

  const mockPrograms = [
    { id: 1, name: "AgriBiz", mentor: "John Doe", status: "Active" },
    { id: 2, name: "EcoCrafts", mentor: "Jane Smith", status: "Pending" },
    // more mock entries...
  ];

  const mockProgramColumns = [
    { field: "name", headerName: "Program", flex: 1 },
    { field: "mentor", headerName: "Assigned Mentor", flex: 1 },
    { field: "status", headerName: "Status", flex: 1 },
  ];

  const profitOverTimeData = [
    { name: "Jan", profit: 50000 },
    { name: "Feb", profit: 60000 },
    { name: "Mar", profit: 45000 },
    // ...more monthly data
  ];

  const individualInventoryData = [
    { name: "Item A", value: 400 },
    { name: "Item B", value: 300 },
    { name: "Item C", value: 300 },
    { name: "Item D", value: 200 },
  ];

  console.log("Inventory Pie Chart Data:", inventoryBreakdownData);

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
          flex="1 1 22%"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
          p="20px"
        >
          <StatBox
            title={`₱${Number(
              highestExpenseSE?.totalExpenses || 0
            ).toLocaleString()}`}
            subtitle={`Highest Expenses: ${
              highestExpenseSE?.name || "N/A"
            } (${getExpenseLevel(highestExpenseSE?.totalExpenses)})`}
            progress={0.9}
            increase={
              <Typography
                sx={{
                  color: getExpenseLevelColor(
                    highestExpenseSE?.totalExpenses || 0
                  ),
                  fontWeight: "bold",
                }}
              >
                ↑ {getExpenseLevel(highestExpenseSE?.totalExpenses)}
              </Typography>
            }
            icon={
              <MoneyOffOutlinedIcon
                sx={{
                  fontSize: "32px",
                  color: getExpenseLevelColor(
                    highestExpenseSE?.totalExpenses || 0
                  ),
                }}
              />
            }
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
          <LineChart data={profitOverTimeSeries} />
        </Box>
      </Box>

      {/* Row 4 - Cash Flow Analysis */}
      <Box
        backgroundColor={colors.primary[400]}
        p="20px"
        paddingBottom={8}
        mt="20px"
      >
        <Typography
          variant="h3"
          fontWeight="bold"
          color={colors.greenAccent[500]}
        >
          Cash Flow Comparison (Inflow vs Outflow)
        </Typography>
        <Box height="400px">
          <CashFlowBarChart data={cashFlowData} />
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

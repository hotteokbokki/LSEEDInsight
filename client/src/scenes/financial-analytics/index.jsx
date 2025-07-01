import { Box, useTheme, Typography } from "@mui/material";
import Header from "../../components/Header";
import StatBox from "../../components/StatBox";
import LineChart from "../../components/LineChart";
import BarChart from "../../components/BarChart";
import FinancialBarChart from "../../components/FinancialBarChart";
import CashFlowBarChart from "../../components/CashflowBarChart.jsx";
import POTLineChart from "../../components/ProfitOTLineChart.jsx";
import PieChart from "../../components/PieChart";
import { tokens } from "../../theme";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { DataGrid } from "@mui/x-data-grid";
import { FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import MoneyOffOutlinedIcon from "@mui/icons-material/MoneyOffOutlined";
import InventoryValuePie from "../../components/TotalInventoryPieChart.jsx";
import InventoryTurnoverBar from "../../components/InventoryTurnoverBarChart.jsx";
import { useAuth } from "../../context/authContext";

const FinancialAnalytics = ({}) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [financialData, setFinancialData] = useState([]);
  const [cashFlowRaw, setCashFlowRaw] = useState([]);
  const { user } = useAuth();

  // Connect to the DB

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [financialResponse, cashFlowResponse] = await Promise.all([
          axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/financial-statements`),
          axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/cashflow`),
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
        const response = await axios.get(
          `${process.env.REACT_APP_API_BASE_URL}/api/inventory-distribution`
        );
        console.log("1. Raw Inventory Data Fetched from API:", response.data);
        setInventoryData(response.data);
      } catch (error) {
        console.error("Error fetching inventory data:", error);
      }
    };

    fetchData();
  }, []); // The empty dependency array ensures this runs once on component mount

  // Compute totals for inventory based on fetched data
  const inventoryBySE = {};

  inventoryData.forEach(({ se_abbr, qty, price, amount }) => {
    const priceNum = Number(price);
    const amountNum = Number(amount);
    if (!inventoryBySE[se_abbr]) {
      inventoryBySE[se_abbr] = { totalValue: 0, totalCOGS: 0 };
    }
    inventoryBySE[se_abbr].totalValue += qty * priceNum;
    inventoryBySE[se_abbr].totalCOGS += amountNum;
  });

  const inventoryValueData = Object.entries(inventoryBySE)
    .map(([se_id, data]) => ({
      id: se_id,
      value: data.totalValue,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const inventoryTurnoverData = Object.entries(inventoryBySE)
    .map(([se_id, data]) => {
      const cogs = data.totalCOGS;
      const avgInventory = data.totalValue;
      const turnover =
        avgInventory === 0 ? 0 : parseFloat((cogs / avgInventory).toFixed(2));
      return { name: se_id, turnover };
    })
    .sort((a, b) => b.turnover - a.turnover)
    .slice(0, 5);

    const worstinventoryTurnoverData = Object.entries(inventoryBySE)
    .map(([se_id, data]) => {
      const cogs = data.totalCOGS;
      const avgInventory = data.totalValue;
      const turnover =
        avgInventory === 0 ? 0 : parseFloat((cogs / avgInventory).toFixed(2));
      return { name: se_id, turnover };
    })
    .sort((a, b) => a.turnover - b.turnover) // Change to ascending order
    .slice(0, 5); // Keep the slice to get the bottom 5 (worst)

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
  const equityTrendData = socialEnterprises.map((se) => {
    const sortedEquity = [...se.equityTrend].sort((a, b) => {
      const dateA = new Date(a.x);
      const dateB = new Date(b.x);
      return dateA - dateB;
    });

    return {
      id: se.name,
      data: sortedEquity.map((point) => ({
        x: point.x,
        y: point.equity,
      })),
    };
  });

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
    .sort((a, b) => b[1] - a[1]) // Sort descending by quantity
    .slice(0, 10) // Take top 10
    .map(([se_abbr, qty]) => ({
      id: se_abbr,
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
    .slice(0, 5);

    const worstRevenueSEsData = [...aggregatedLatestSEs.values()]
    .sort((a, b) => a.revenue - b.revenue)
    .slice(0, 5);

  const latestProfitRecords = latestRecords.map((item) => ({
    name: item.se_abbr ?? item.se_id,
    profit: Number(item.total_revenue || 0) - Number(item.total_expenses || 0),
  }));

  const mostProfitSEsData = latestProfitRecords
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 3);

  const individualInventoryData = Object.entries(
    inventoryData.reduce((acc, { item_name, qty }) => {
      if (item_name && typeof qty === "number" && !isNaN(qty)) {
        acc[item_name] = (acc[item_name] || 0) + qty;
      }
      return acc;
    }, {})
  )
    .map(([name, value]) => ({
      id: name,
      value: typeof value === "number" && !isNaN(value) ? value : 0,
    }))
    .filter((item) => item.value > 0) // remove invalid or 0 values
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

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
          <POTLineChart data={profitOverTimeSeries} />
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

      {/* Row 5 - Total Inventory Value by SE */}
      <Box backgroundColor={colors.primary[400]} p="20px" mt="20px">
        <Typography
          variant="h3"
          fontWeight="bold"
          color={colors.greenAccent[500]}
        >
          Total Inventory Value by Social Enterprise
        </Typography>
        <Box height="400px">
          <InventoryValuePie data={inventoryValueData} />
        </Box>
      </Box>

      {/* Row 6 - Inventory Turnover Ratio by SE */}
      <Box backgroundColor={colors.primary[400]} p="20px" mt="20px">
        <Typography
          variant="h3"
          fontWeight="bold"
          color={colors.greenAccent[500]}
        >
          Inventory Turnover Ratio (Top 5)
        </Typography>
        <Box height="400px">
          <InventoryTurnoverBar data={inventoryTurnoverData} />
        </Box>
      </Box>

      {/* Row 7 - Inventory Turnover Ratio by SE */}
      <Box backgroundColor={colors.primary[400]} p="20px" mt="20px">
        <Typography
          variant="h3"
          fontWeight="bold"
          color={colors.greenAccent[500]}
        >
          Inventory Turnover Ratio (Worst 5)
        </Typography>
        <Box height="400px">
          <InventoryTurnoverBar data={worstinventoryTurnoverData} />
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

      {/* Top 5 SEs by Revenue */}
      <Box backgroundColor={colors.primary[400]} p="40px" mt="20px">
        <Typography
          variant="h3"
          fontWeight="bold"
          color={colors.greenAccent[500]}
        >
          Top 5 Social Enterprises by Revenue
        </Typography>
        <Box height="400px">
          <FinancialBarChart
            data={topRevenueSEsData}
            dataKey="revenue"
            label="Top Revenue"
          />
        </Box>
      </Box>

      {/* Worst 5 SEs by Revenue */}
      <Box backgroundColor={colors.primary[400]} p="40px" mt="20px">
        <Typography
          variant="h3"
          fontWeight="bold"
          color={colors.greenAccent[500]}
        >
          Worst 5 Social Enterprises by Revenue
        </Typography>
        <Box height="400px">
          <FinancialBarChart
            data={worstRevenueSEsData}
            dataKey="revenue"
            label="Worst Revenue"
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

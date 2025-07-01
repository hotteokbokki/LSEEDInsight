import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Chip,
} from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import AssignmentIcon from "@mui/icons-material/Assignment";
import { tokens } from "../../theme";
import SEPerformanceTrendChart from "../../components/SEPerformanceTrendChart";
import PieChart from "../../components/PieChart";
import LikertChart from "../../components/LikertChart";
import RadarChart from "../../components/RadarChart";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import { DataGrid } from "@mui/x-data-grid";
import StatBox from "../../components/StatBox";
import DualAxisLineChart from "../../components/DualAxisLineChart";
import ScatterPlot from "../../components/ScatterPlot";
import PeopleIcon from "@mui/icons-material/People";
import InventoryValuePie from "../../components/TotalInventoryPieChart.jsx";
import InventoryTurnoverBar from "../../components/InventoryTurnoverBarChart.jsx";

const SEAnalytics = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { id } = useParams(); // Extract the `id` from the URL
  const [selectedSEId, setSelectedSEId] = useState(id); // State to manage selected SE
  const [socialEnterprises, setSocialEnterprises] = useState([]); // List of all social enterprises
  const [selectedSE, setSelectedSE] = useState(null); // Selected social enterprise object
  const [pieData, setPieData] = useState([]); // Real common challenges data
  const [likertData, setLikertData] = useState([]); // Real Likert scale data
  const [radarData, setRadarData] = useState([]); // Real radar chart data
  const [isLoadingEvaluations, setIsLoadingEvaluations] = useState(false);
  const [evaluationsData, setEvaluationsData] = useState([]);
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const navigate = useNavigate(); // Initialize useNavigate
  const [stats, setStats] = useState({
    registeredUsers: 0,
    totalEvaluations: 0,
    pendingEvaluations: 0,
    avgRating: 0,
    acknowledgedEvaluations: 0,
  });
  const [criticalAreas, setCriticalAreas] = useState([]);

  // Financial Analytics States
  const [financialData, setFinancialData] = useState([]);
  const [cashFlowRaw, setCashFlowRaw] = useState([]);
  const [inventoryData, setInventoryData] = useState([]);

  // Fetch all necessary data for the page
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch social enterprises list
        const seResponse = await fetch("http://localhost:4000/getAllSocialEnterprises");
        const seData = await seResponse.json();
        const formattedSEData = seData.map((se) => ({
          id: se.se_id,
          name: se.team_name,
          abbr: se.abbr // Ensure abbreviation is available for financial data processing
        }));
        setSocialEnterprises(formattedSEData);

        // Set the initial selected SE if `id` is provided
        if (id) {
          const initialSE = formattedSEData.find((se) => se.id === id);
          setSelectedSE(initialSE);
          setSelectedSEId(id); // Ensure selectedSEId is set from URL param
        }

        // Fetch financial statements, cash flow, and inventory data
        const [financialResponse, cashFlowResponse, inventoryResponse] = await Promise.all([
          axios.get("http://localhost:4000/api/financial-statements"),
          axios.get("http://localhost:4000/api/cashflow"),
          axios.get("http://localhost:4000/api/inventory-distribution"),
        ]);
        setFinancialData(financialResponse.data);
        setCashFlowRaw(cashFlowResponse.data);
        setInventoryData(inventoryResponse.data);

        // Fetch SE-specific analytics data
        if (id) {
          const [statsResponse, criticalAreasResponse, pieResponse, likertResponse, radarResponse, evaluationsResponse] = await Promise.all([
            fetch(`http://localhost:4000/api/se-analytics-stats/${id}`),
            fetch(`http://localhost:4000/api/critical-areas/${id}`),
            fetch(`http://localhost:4000/api/common-challenges/${id}`),
            fetch(`http://localhost:4000/api/likert-data/${id}`),
            fetch(`http://localhost:4000/api/radar-data/${id}`),
            axios.get("http://localhost:4000/getMentorEvaluationsBySEID", { params: { se_id: id } }),
          ]);

          const statsData = await statsResponse.json();
          setStats({
            registeredUsers: Number(statsData.registeredUsers?.[0]?.total_users) || 0,
            totalEvaluations: statsData.totalEvaluations?.[0]?.total_evaluations || "0",
            pendingEvaluations: statsData.pendingEvaluations?.[0]?.pending_evaluations || "0",
            acknowledgedEvaluations: statsData.acknowledgedEvaluations?.[0]?.acknowledged_evaluations || "0",
            avgRating: statsData.avgRating?.[0]?.avg_rating || "N/A",
          });

          const criticalAreasData = await criticalAreasResponse.json();
          setCriticalAreas(criticalAreasData);

          const rawPieData = await pieResponse.json();
          const formattedPieData = Array.from(
            new Map(
              rawPieData.map((item, index) => [
                item.category || `Unknown-${index}`,
                {
                  id: item.category || `Unknown-${index}`,
                  label: item.percentage && !isNaN(item.percentage) ? `${parseInt(item.percentage, 10)}%` : "0%",
                  value: item.count && !isNaN(item.count) ? parseInt(item.count, 10) : 0,
                  comment: item.comment || "No comment available",
                },
              ])
            ).values()
          );
          setPieData(formattedPieData);

          const rawLikertData = await likertResponse.json();
          setLikertData(rawLikertData);

          const radarChartData = await radarResponse.json();
          if (Array.isArray(radarChartData)) {
            setRadarData(radarChartData);
          } else {
            console.error("Invalid radar data format", radarChartData);
          }

          const formattedEvaluationsData = evaluationsResponse.data.map((evaluation) => ({
            id: evaluation.evaluation_id,
            evaluation_id: evaluation.evaluation_id,
            evaluator_name: evaluation.evaluator_name,
            social_enterprise: evaluation.social_enterprise,
            evaluation_date: evaluation.evaluation_date,
            acknowledged: evaluation.acknowledged ? "Yes" : "No",
          }));
          setEvaluationsData(formattedEvaluationsData);
        }

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoadingEvaluations(false);
      }
    };

    fetchData();
  }, [id]); // Re-fetch all data when the ID changes

  // Filter financial data for the currently selected SE
  const selectedSEFinancialData = financialData.filter(
    (item) => item.se_id === selectedSEId
  );

  // Process financial data for StatBoxes and charts specific to the selected SE
  const currentSEFinancialMetrics = {
    totalRevenue: 0,
    totalExpenses: 0,
    netIncome: 0,
    totalAssets: 0,
    totalLiabilities: 0,
    ownerEquity: 0,
    revenueVsExpenses: [],
    equityTrend: [],
  };

  selectedSEFinancialData.forEach((item) => {
    const parsedDate = item.date
      ? new Date(item.date).toLocaleDateString()
      : "Unknown Date";

    currentSEFinancialMetrics.totalRevenue += Number(item.total_revenue ?? 0);
    currentSEFinancialMetrics.totalExpenses += Number(item.total_expenses ?? 0);
    currentSEFinancialMetrics.netIncome += Number(item.net_income ?? 0);
    currentSEFinancialMetrics.totalAssets += Number(item.total_assets ?? 0);
    currentSEFinancialMetrics.totalLiabilities += Number(item.total_liabilities ?? 0);
    currentSEFinancialMetrics.ownerEquity += Number(item.owner_equity ?? 0);

    currentSEFinancialMetrics.revenueVsExpenses.push({
      x: parsedDate,
      revenue: Number(item.total_revenue ?? 0),
      expenses: Number(item.total_expenses ?? 0),
    });

    currentSEFinancialMetrics.equityTrend.push({
      x: parsedDate,
      y: Number(item.owner_equity ?? 0),
    });
  });

  // Calculate financial ratios for the selected SE
  const netProfitMargin = currentSEFinancialMetrics.totalRevenue
    ? ((currentSEFinancialMetrics.netIncome / currentSEFinancialMetrics.totalRevenue) * 100).toFixed(2)
    : "0.00";
  const grossProfitMargin = currentSEFinancialMetrics.totalRevenue
    ? (
        ((currentSEFinancialMetrics.totalRevenue - currentSEFinancialMetrics.totalExpenses) /
          currentSEFinancialMetrics.totalRevenue) *
        100
      ).toFixed(2)
    : "0.00";
  const debtToAssetRatio = currentSEFinancialMetrics.totalAssets
    ? (currentSEFinancialMetrics.totalLiabilities / currentSEFinancialMetrics.totalAssets).toFixed(2)
    : "0.00";

  // Format revenue vs expenses for DualAxisLineChart (for selected SE)
  const selectedSERevenueVsExpensesData = [
    {
      id: "Revenue",
      color: colors.greenAccent[500],
      data: currentSEFinancialMetrics.revenueVsExpenses.map(d => ({ x: d.x, y: d.revenue }))
    },
    {
      id: "Expenses",
      color: colors.redAccent[500],
      data: currentSEFinancialMetrics.revenueVsExpenses.map(d => ({ x: d.x, y: d.expenses }))
    },
  ];

  // Format owner's equity for DualAxisLineChart (for selected SE)
  const sortedEquityTrend = [...currentSEFinancialMetrics.equityTrend].sort(
    (a, b) => new Date(a.x) - new Date(b.x)
  );

  // Then format for the chart
  const selectedSEEquityTrendData = [
    {
      id: "Owner's Equity",
      color: colors.blueAccent[500],
      data: sortedEquityTrend.map(d => ({
        x: new Date(d.x).toLocaleString('default', { month: 'short', year: 'numeric' }),
        y: d.y
      }))
    },
  ];

  // Process cash flow data for the selected SE for ScatterPlot
  const selectedSECashFlowRaw = cashFlowRaw.filter(
    (item) => item.se_id === selectedSEId
  );

  const selectedSECashFlowData = [
    {
      id: "Inflow",
      data: selectedSECashFlowRaw.map(item => ({
        x: new Date(item.date).toLocaleString('default', { month: 'short', year: 'numeric' }),
        y: Number(item.inflow)
      }))
    },
    {
      id: "Outflow",
      data: selectedSECashFlowRaw.map(item => ({
        x: new Date(item.date).toLocaleString('default', { month: 'short', year: 'numeric' }),
        y: Number(item.outflow)
      }))
    }
  ];

  const filteredInventoryData = inventoryData.filter(
  (item) => item.se_abbr === selectedSE?.abbr
  );

  // Total Inventory Value by Item (filtered by SE)
  const allItemsInventoryTotalValue = {};
  filteredInventoryData.forEach(({ item_name, qty, price }) => {
    const priceNum = Number(price);
    const qtyNum = Number(qty);
    const totalValue = qtyNum * priceNum;

    if (!allItemsInventoryTotalValue[item_name]) {
      allItemsInventoryTotalValue[item_name] = { totalValue: 0, totalQty: 0 };
    }
    allItemsInventoryTotalValue[item_name].totalValue += totalValue;
    allItemsInventoryTotalValue[item_name].totalQty += qtyNum;
  });


  const inventoryValueByItemData = Object.entries(allItemsInventoryTotalValue)
    .map(([itemName, data]) => ({
      id: itemName,
      value: data.totalValue,
      label: `${itemName} (₱${data.totalValue.toLocaleString()})`
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const allItemsInventoryTurnover = {};
  filteredInventoryData.forEach(({ item_name, qty, price, amount }) => {
    const priceNum = Number(price);
    const qtyNum = Number(qty);
    const totalValue = qtyNum * priceNum; // This is average inventory value for the item

    if (!allItemsInventoryTurnover[item_name]) {
      allItemsInventoryTurnover[item_name] = { totalCOGS: 0, totalInventoryValue: 0 };
    }
    allItemsInventoryTurnover[item_name].totalCOGS += Number(amount); // Sum of 'amount' as COGS
    allItemsInventoryTurnover[item_name].totalInventoryValue += totalValue; // Sum of inventory value
  });

  const inventoryTurnoverByItemData = Object.entries(allItemsInventoryTurnover)
    .map(([itemName, data]) => {
      const cogs = data.totalCOGS;
      const avgInventory = data.totalInventoryValue; // Using total inventory value as avg for simplicity
      const turnover = avgInventory === 0 ? 0 : parseFloat((cogs / avgInventory).toFixed(2));
      return { name: itemName, turnover };
    })
    .sort((a, b) => b.turnover - a.turnover)
    .slice(0, 5); // Top 5 items by turnover


  const columns = [
    { field: "social_enterprise", headerName: "Social Enterprise", flex: 1 },
    { field: "evaluator_name", headerName: "Evaluator", flex: 1 },
    { field: "acknowledged", headerName: "Acknowledged", flex: 1 },
    { field: "evaluation_date", headerName: "Evaluation Date", flex: 1 },
    {
      field: "action",
      headerName: "Action",
      flex: 1,
      renderCell: (params) => (
        <Button
          variant="contained"
          style={{ backgroundColor: colors.primary[600], color: "white" }}
          onClick={() => handleViewExistingEvaluation(params.row.evaluation_id)}
        >
          View
        </Button>
      ),
    },
  ];

  const handleViewExistingEvaluation = async (evaluation_id) => {
    console.log("📌 Evaluation ID Passed:", evaluation_id);

    try {
      const response = await axios.get(
        "http://localhost:4000/getEvaluationDetails",
        {
          params: { evaluation_id },
        }
      );

      if (!response.data || response.data.length === 0) {
        console.warn("⚠️ No evaluation details found.");
        return;
      }

      const groupedEvaluation = response.data.reduce((acc, evalItem) => {
        const {
          evaluation_date,
          evaluator_name,
          social_enterprise,
          category_name,
          star_rating,
          selected_comments,
          additional_comment,
        } = evalItem;

        if (!acc.id) {
          acc.id = evaluation_id;
          acc.evaluator_name = evaluator_name;
          acc.social_enterprise = social_enterprise;
          acc.evaluation_date = evaluation_date;
          acc.categories = [];
        }

        acc.categories.push({
          category_name,
          star_rating,
          selected_comments: Array.isArray(selected_comments)
            ? selected_comments
            : [],
          additional_comment,
        });

        return acc;
      }, {});

      console.log("✅ Processed Evaluation Data:", groupedEvaluation);
      setSelectedEvaluation(groupedEvaluation);
      setOpenDialog(true);
    } catch (error) {
      console.error("❌ Error fetching evaluation details:", error);
    }
  };

  // If no social enterprise is found, show an error message
  if (!selectedSE && socialEnterprises.length > 0) {
    return <Box>No Social Enterprise found</Box>;
  }

  return (
    <Box m="20px">
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        {/* Back Button and Dropdown Container */}
        <Box display="flex" alignItems="center" gap="10px">
          {/* Page Title */}
          <Typography variant="h4" fontWeight="bold" color={colors.grey[100]}>
            {selectedSE ? `${selectedSE.name} Analytics` : "Loading..."}
          </Typography>
        </Box>
      </Box>

      {/* Row 1 - StatBoxes */}
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
          <Chip
            label={`${stats.registeredUsers} ${
              stats.registeredUsers === 1 ? "User" : "Users"
            }`}
            icon={
              <PeopleIcon
                sx={{ fontSize: "26px", color: colors.greenAccent[500] }}
              />
            }
            sx={{
              fontSize: "20px",
              p: "10px",
              backgroundColor: colors.primary[400],
              color: colors.grey[100],
              "& .MuiChip-icon": { color: colors.greenAccent[500] },
            }}
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
            title={stats.acknowledgedEvaluations}
            subtitle="Acknowledged Evaluations"
            progress={
              stats.acknowledgedEvaluations / (stats.totalEvaluations || 1)
            }
            increase={`${(
              (stats.acknowledgedEvaluations / (stats.totalEvaluations || 1)) *
              100
            ).toFixed(2)}%`}
            icon={
              <AssignmentIcon
                sx={{ fontSize: "26px", color: colors.blueAccent[500] }}
              />
            }
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
            title={stats.pendingEvaluations}
            subtitle="Pending Evaluations"
            progress={stats.pendingEvaluations / (stats.totalEvaluations || 1)}
            increase={`${(
              (stats.pendingEvaluations / (stats.totalEvaluations || 1)) *
              100
            ).toFixed(2)}%`}
            icon={
              <AssignmentIcon
                sx={{ fontSize: "26px", color: colors.redAccent[500] }}
              />
            }
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
            title={stats.avgRating}
            subtitle="Average rating"
            progress={null}
            sx={{ "& .MuiBox-root.css-1ntui4p": { display: "none" } }}
            icon={
              <StarIcon
                sx={{ fontSize: "26px", color: colors.blueAccent[500]} }
              />
            }
          />
        </Box>
      </Box>

      <Box
        display="flex"
        flexDirection="column"
        gap={3}
        marginBottom={2}
        marginTop={2}
      >
        <SEPerformanceTrendChart selectedSEId={selectedSEId} />
      </Box>

      <Box display="flex" gap="20px" width="100%" mt="20px">
        {/* Evaluations Table */}
        <Box
          sx={{
            backgroundColor: colors.primary[400],
            padding: "20px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            minHeight: "400px",
            flex: "2",
            flexDirection: "column",
            overflow: "hidden",
            "& .MuiDataGrid-root": { border: "none" },
            "& .MuiDataGrid-cell": { borderBottom: "none" },
            "& .name-column--cell": { color: colors.greenAccent[300] },
            "& .MuiDataGrid-columnHeaders, & .MuiDataGrid-columnHeader": {
              backgroundColor: colors.blueAccent[700] + " !important",
            },
            "& .MuiDataGrid-virtualScroller": {
              backgroundColor: colors.primary[400],
            },
            "& .MuiDataGrid-footerContainer": {
              borderTop: "none",
              backgroundColor: colors.blueAccent[700],
            },
          }}
        >
          <Typography
            variant="h5"
            fontWeight="bold"
            color={colors.grey[100]}
            mb={2}
          >
            Evaluations
          </Typography>
          <DataGrid
            rows={evaluationsData}
            columns={columns}
            getRowId={(row) => row.id}
          />
        </Box>
        {/* AREAS OF FOCUS TABLE */}
        <Box flex="1" backgroundColor={colors.primary[400]} overflow="auto">
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            borderBottom={`4px solid ${colors.primary[500]}`}
            p="15px"
          >
            <Typography
              color={colors.greenAccent[500]}
              variant="h3"
              fontWeight="600"
            >
              Critical Areas of Focus
            </Typography>
          </Box>

          {criticalAreas.map((area, i) => (
            <Box
              key={i}
              display="flex"
              alignItems="center"
              borderBottom={`4px solid ${colors.primary[500]}`}
              p="15px"
            >
              {/* Icon */}
              <Box sx={{ pr: 2, fontSize: "24px" }}>📌</Box>

              {/* Area Name */}
              <Typography
                color={colors.grey[100]}
                variant="h5"
                fontWeight="500"
                sx={{
                  whiteSpace: "normal",
                  wordBreak: "break-word",
                }}
              >
                {area}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
      {/* Evaluation Details Dialog - Read-Only */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          style: {
            backgroundColor: "#fff",
            color: "#000",
            border: "1px solid #000",
          },
        }}
      >
        {/* Title with DLSU Green Background */}
        <DialogTitle
          sx={{
            backgroundColor: "#1E4D2B",
            color: "#fff",
            textAlign: "center",
            fontSize: "1.5rem",
            fontWeight: "bold",
          }}
        >
          View Evaluation
        </DialogTitle>

        {/* Content Section */}
        <DialogContent
          sx={{
            padding: "24px",
            maxHeight: "70vh",
            overflowY: "auto",
          }}
        >
          {selectedEvaluation ? (
            <>
              {/* Evaluator, Social Enterprise, and Evaluation Date */}
              <Box
                sx={{
                  marginBottom: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: "bold",
                    borderBottom: "1px solid #000",
                    paddingBottom: "8px",
                  }}
                >
                  Evaluator: {selectedEvaluation.evaluator_name}{" "}
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: "bold",
                    borderBottom: "1px solid #000",
                    paddingBottom: "8px",
                  }}
                >
                  Social Enterprise Evaluated:{" "}
                  {selectedEvaluation.social_enterprise}
                </Typography>
                <Typography variant="subtitle1" sx={{ color: "#000" }}>
                  Evaluation Date: {selectedEvaluation.evaluation_date}
                </Typography>
              </Box>

              {/* Categories Section */}
              {selectedEvaluation.categories &&
              selectedEvaluation.categories.length > 0 ? (
                selectedEvaluation.categories.map((category, index) => (
                  <Box
                    key={index}
                    sx={{
                      marginBottom: "24px",
                      padding: "16px",
                      border: "1px solid #000",
                      borderRadius: "8px",
                    }}
                  >
                    {/* Category Name and Rating */}
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: "bold",
                        marginBottom: "8px",
                      }}
                    >
                      {category.category_name} - Rating: {category.star_rating}{" "}
                      ★
                    </Typography>

                    {/* Selected Comments */}
                    <Typography variant="body1" sx={{ marginBottom: "8px" }}>
                      Comments:{" "}
                      {category.selected_comments.length > 0 ? (
                        category.selected_comments.join(", ")
                      ) : (
                        <i>No comments</i>
                      )}
                    </Typography>

                    {/* Additional Comment */}
                    <Typography variant="body1">
                      Additional Comment:{" "}
                      {category.additional_comment || (
                        <i>No additional comments</i>
                      )}
                    </Typography>
                  </Box>
                ))
              ) : (
                <Typography variant="body1" sx={{ fontStyle: "italic" }}>
                  No categories found for this evaluation.
                </Typography>
              )}
            </>
          ) : (
            <Typography variant="body1" sx={{ fontStyle: "italic" }}>
              Loading evaluation details...
            </Typography>
          )}
        </DialogContent>

        {/* Action Buttons */}
        <DialogActions sx={{ padding: "16px", borderTop: "1px solid #000" }}>
          <Button
            onClick={() => setOpenDialog(false)}
            sx={{
              color: "#000",
              border: "1px solid #000",
              "&:hover": { backgroundColor: "#f0f0f0" },
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Common Challenges & Performance Score */}
      <Box
        mt="20px"
        sx={{
          backgroundColor: colors.primary[400],
          padding: "20px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Typography variant="h5" fontWeight="bold" color={colors.grey[100]}>
          Recurring Issues
        </Typography>
        <Box
          height="250px"
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
          {pieData.length === 0 ? (
            <Typography variant="h6" color={colors.grey[300]}>
              No common challenges found.
            </Typography>
          ) : (
            <PieChart data={pieData} />
          )}
        </Box>
      </Box>
      {/* Performance Score */}
      <Box
        mt="20px"
        sx={{
          backgroundColor: colors.primary[400],
          padding: "20px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Typography variant="h5" fontWeight="bold" color={colors.grey[100]}>
          Performance Score
        </Typography>
        <Box
          height="250px"
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
          {likertData.length === 0 ? (
            <Typography variant="h6" color={colors.grey[300]}>
              No performance ratings available.
            </Typography>
          ) : (
            <LikertChart data={likertData} />
          )}
        </Box>
      </Box>

      {/* Performance Overview */}
      <Box
        mt="20px"
        sx={{
          backgroundColor: colors.primary[400],
          padding: "20px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Typography variant="h5" fontWeight="bold" color={colors.grey[100]}>
          Performance Overview
        </Typography>
        <Box
          height="300px"
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
          {radarData.length === 0 ? (
            <Typography variant="h6" color={colors.grey[300]}>
              Performance Overview Unavailable.
            </Typography>
          ) : (
            <RadarChart radarData={radarData} />
          )}
        </Box>
      </Box>
      {/* Financial Analytics Section for Single SE */}
      <Box mt="40px" display="flex" flexDirection="column" gap="20px">
        {/* Section Header */}
        <Typography
          variant="h2"
          fontWeight="bold"
          color={colors.greenAccent[500]}
        >
          Financial Analytics
        </Typography>

        {/* Stat Boxes for Selected SE */}
        <Box
          display="flex"
          flexWrap="wrap"
          gap="20px"
          justifyContent="space-between"
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
              title={`₱${currentSEFinancialMetrics.totalRevenue.toLocaleString()}`}
              subtitle="Total Revenue"
              progress={1}
              increase="N/A" // Can calculate percentage change if historical data is available
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
              title={`₱${currentSEFinancialMetrics.totalExpenses.toLocaleString()}`}
              subtitle="Total Expenses"
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
              title={`₱${currentSEFinancialMetrics.netIncome.toLocaleString()}`}
              subtitle="Net Income"
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
              title={`₱${currentSEFinancialMetrics.totalAssets.toLocaleString()}`}
              subtitle="Total Assets"
              progress={1}
              increase="N/A"
              icon={<></>}
            />
          </Box>
        </Box>

        {/* Revenue vs Expenses Line Chart for Selected SE */}
        <Box backgroundColor={colors.primary[400]} p="20px">
          <Typography
            variant="h3"
            fontWeight="bold"
            color={colors.greenAccent[500]}
            mb={2}
          >
            Revenue vs Expenses Over Time
          </Typography>
          <Box height="400px">
            {selectedSERevenueVsExpensesData[0]?.data?.length > 0 ? (
              <DualAxisLineChart data={selectedSERevenueVsExpensesData} />
            ) : (
              <Typography variant="h6" color={colors.grey[300]} textAlign="center">
                No revenue vs expenses data available for this SE.
              </Typography>
            )}
          </Box>
        </Box>

        {/* Cash Flow Scatter Plot for Selected SE */}
        <Box backgroundColor={colors.primary[400]} p="20px">
          <Typography
            variant="h3"
            fontWeight="bold"
            color={colors.greenAccent[500]}
            mb={2}
          >
            Cash Flow (Inflow vs Outflow)
          </Typography>
          <Box height="400px">
            {selectedSECashFlowData[0]?.data?.length > 0 ? (
              <ScatterPlot data={selectedSECashFlowData} />
            ) : (
              <Typography variant="h6" color={colors.grey[300]} textAlign="center">
                No cash flow data available for this SE.
              </Typography>
            )}
          </Box>
        </Box>

        {/* Owner’s Equity Trend for Selected SE */}
        <Box backgroundColor={colors.primary[400]} p="20px">
          <Typography
            variant="h3"
            fontWeight="bold"
            color={colors.greenAccent[500]}
            mb={2}
          >
            Owner's Equity Over Time
          </Typography>
          <Box height="400px">
            {selectedSEEquityTrendData[0]?.data?.length > 0 ? (
              <DualAxisLineChart data={selectedSEEquityTrendData} />
            ) : (
              <Typography variant="h6" color={colors.grey[300]} textAlign="center">
                No owner's equity data available for this SE.
              </Typography>
            )}
          </Box>
        </Box>

        {/* Financial Ratios for Selected SE */}
        <Box display="flex" flexWrap="wrap" gap="20px">
          <Box
            flex="1 1 30%"
            backgroundColor={colors.primary[400]}
            p="20px"
            display="flex"
            flexDirection="column"
          >
            <Typography
              variant="h4"
              fontWeight="bold"
              color={colors.greenAccent[500]}
            >
              Net Profit Margin
            </Typography>
            <Typography variant="h3" color={colors.grey[100]}>
              {netProfitMargin}%
            </Typography>
          </Box>
          <Box
            flex="1 1 30%"
            backgroundColor={colors.primary[400]}
            p="20px"
            display="flex"
            flexDirection="column"
          >
            <Typography
              variant="h4"
              fontWeight="bold"
              color={colors.greenAccent[500]}
            >
              Gross Profit Margin
            </Typography>
            <Typography variant="h3" color={colors.grey[100]}>
              {grossProfitMargin}%
            </Typography>
          </Box>
          <Box
            flex="1 1 30%"
            backgroundColor={colors.primary[400]}
            p="20px"
            display="flex"
            flexDirection="column"
          >
            <Typography
              variant="h4"
              fontWeight="bold"
              color={colors.greenAccent[500]}
            >
              Debt-to-Asset Ratio
            </Typography>
            <Typography variant="h3" color={colors.grey[100]}>
              {debtToAssetRatio}
            </Typography>
          </Box>
        </Box>

        {/* Total Inventory Value by Item (Across All SEs) */}
        <Box backgroundColor={colors.primary[400]} p="20px" mt="20px">
          <Typography
            variant="h3"
            fontWeight="bold"
            color={colors.greenAccent[500]}
          >
            Total Inventory Value by Item
          </Typography>
          <Box height="400px">
            {inventoryValueByItemData.length > 0 ? (
              <InventoryValuePie data={inventoryValueByItemData} />
            ) : (
              <Typography variant="h6" color={colors.grey[300]} textAlign="center">
                No inventory value data available for any item.
              </Typography>
            )}
          </Box>
        </Box>

        {/* Inventory Turnover Ratio by Item (Across All SEs) */}
        <Box backgroundColor={colors.primary[400]} p="20px" mt="20px">
          <Typography
            variant="h3"
            fontWeight="bold"
            color={colors.greenAccent[500]}
          >
            Inventory Turnover Ratio by Item
          </Typography>
          <Box height="400px">
            {inventoryTurnoverByItemData.length > 0 ? (
              <InventoryTurnoverBar data={inventoryTurnoverByItemData} />
            ) : (
              <Typography variant="h6" color={colors.grey[300]} textAlign="center">
                No inventory turnover data available for any item.
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      {/* Back Button with Spacing */}
      <Box mt="20px" display="flex" justifyContent="start">
        <Button
          variant="contained"
          sx={{
            backgroundColor: colors.blueAccent[500],
            color: "black",
            "&:hover": {
              backgroundColor: colors.blueAccent[800],
            },
            width: "2/12",
            maxWidth: "150px",
          }}
          onClick={() => navigate(-1)}
        >
          Back
        </Button>
      </Box>
    </Box>
  );
};

export default SEAnalytics;
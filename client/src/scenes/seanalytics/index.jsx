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
  TableContainer,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Grid,
  Divider,
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
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
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
  const [seApplication, setSEApplication] = useState(null);
  const [seList, setSEList] = useState([]);
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
  const [moreOpen, setMoreOpen] = useState(false);
  // Financial Analytics States
  const [financialData, setFinancialData] = useState([]);
  const [cashFlowRaw, setCashFlowRaw] = useState([]);
  const [inventoryData, setInventoryData] = useState([]);

  useEffect(() => {
    const fetchApplicationDetails = async () => {
      if (!selectedSE || !selectedSE.accepted_application_id) {
        setSEApplication(null);
        return;
      }

      try {
        const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/get-accepted-application/${selectedSE.accepted_application_id}`);
        if (!res.ok) throw new Error("Failed to fetch application details");

        const data = await res.json();
        setSEApplication(data);
      } catch (error) {
        console.error("Error fetching application details:", error);
        setSEApplication(null);
      }
    };

    fetchApplicationDetails();
  }, [selectedSE]);

  // Fetch all necessary data for the page
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch SE list
        const seResponse = await fetch(`${process.env.REACT_APP_API_BASE_URL}/getAllSocialEnterprises`);
        const seData = await seResponse.json();

        const formattedSEData = seData.map((se) => ({
          id: se?.se_id ?? "",
          name: se?.team_name ?? "Unnamed SE",
          abbr: se?.abbr ?? "",
          description: se?.description ?? "",
          sdgs: Array.isArray(se?.sdgs) && se.sdgs.length > 0
            ? se.sdgs
            : ["No SDG listed"],
          accepted_application_id: se?.accepted_application_id ?? "",
        }));

        // Set selected SE
        if (id) {
          const initialSE = formattedSEData.find((se) => se.id === id);
          setSelectedSE(initialSE);
          setSelectedSEId(id);
        }
        //DEBUG
        // JM Check mo toh, kasi sa current Promise mo once nag error ung isang API error na kaagad yung whole code.

        // ✅ Use Promise.all when the calls are all required together and you want to stop if any fails:

        // "I can't render the financial section unless all parts load successfully."

        // ✅ Use Promise.allSettled when partial data is OK:

        // "If cash flow fails, show inventory and financial statements anyway."

        // Fetch financial-related data (still use Promise.all since all must succeed)
        const [financialResponse, cashFlowResponse, inventoryResponse] = await Promise.all([
          axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/financial-statements`),
          axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/cashflow`),
          axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/inventory-distribution`),
        ]);
        setFinancialData(financialResponse.data);
        setCashFlowRaw(cashFlowResponse.data);
        setInventoryData(inventoryResponse.data);

        // Fetch SE-specific analytics (with fallbacks)
        if (id) {
          const analyticsResults = await Promise.allSettled([
            fetch(`${process.env.REACT_APP_API_BASE_URL}/api/se-analytics-stats/${id}`),
            fetch(`${process.env.REACT_APP_API_BASE_URL}/api/critical-areas/${id}`),
            fetch(`${process.env.REACT_APP_API_BASE_URL}/api/common-challenges/${id}`),
            fetch(`${process.env.REACT_APP_API_BASE_URL}/api/likert-data/${id}`),
            fetch(`${process.env.REACT_APP_API_BASE_URL}/api/radar-data/${id}`),
            fetch(`${process.env.REACT_APP_API_BASE_URL}/getMentorEvaluationsBySEID/${id}`),
          ]);

          const [
            statsResult,
            criticalAreasResult,
            pieResult,
            likertResult,
            radarResult,
            evaluationsResult
          ] = analyticsResults;

          console.log("analyticsResults:", analyticsResults);

          // Evaluations
          if (evaluationsResult.status === "fulfilled") {
            const rawEvaluations = await evaluationsResult.value.json();
            console.log("Raw Evaluations", rawEvaluations);

            const formattedEvaluationsData = rawEvaluations.map((evaluation) => ({
              id: evaluation.evaluation_id,
              evaluator_id: evaluation.evaluation_id,
              evaluator_name: evaluation.evaluator_name,
              social_enterprise: evaluation.social_enterprise,
              evaluation_date: evaluation.evaluation_date,
              acknowledged: evaluation.acknowledged ? "Yes" : "No",
            }));

            console.log("Evaluation Data", formattedEvaluationsData);
            setEvaluationsData(formattedEvaluationsData);
          } else {
            console.warn("No evaluations found or failed to fetch.");
          }

          // Stats
          if (statsResult.status === "fulfilled") {
            const statsData = await statsResult.value.json();
            setStats({
              registeredUsers: Number(statsData.registeredUsers?.[0]?.total_users) || 0,
              totalEvaluations: statsData.totalEvaluations?.[0]?.total_evaluations || "0",
              pendingEvaluations: statsData.pendingEvaluations?.[0]?.pending_evaluations || "0",
              acknowledgedEvaluations: statsData.acknowledgedEvaluations?.[0]?.acknowledged_evaluations || "0",
              avgRating: statsData.avgRating?.[0]?.avg_rating || "N/A",
            });
          } else {
            console.warn("Stats data failed:", statsResult.reason);
          }

          // Critical Areas
          if (criticalAreasResult.status === "fulfilled") {
            const criticalAreasData = await criticalAreasResult.value.json();
            setCriticalAreas(criticalAreasData);
          }

          // Pie Chart
          if (pieResult.status === "fulfilled") {
            const rawPieData = await pieResult.value.json();
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
          }

          // Likert
          if (likertResult.status === "fulfilled") {
            const rawLikertData = await likertResult.value.json();
            setLikertData(rawLikertData);
          }

          // Radar
          if (radarResult.status === "fulfilled") {
            const radarChartData = await radarResult.value.json();
            if (Array.isArray(radarChartData)) {
              setRadarData(radarChartData);
            } else {
              console.error("Invalid radar data format", radarChartData);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoadingEvaluations(false);
      }
    };

    fetchData();
  }, [id]);

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
    { field: "social_enterprise", headerName: "Social Enterprise", flex: 1, minWidth: 150 },
    { field: "evaluator_name", headerName: "Evaluator", flex: 1, minWidth: 150  },
    { field: "acknowledged", headerName: "Acknowledged", flex: 1, minWidth: 150  },
    { field: "evaluation_date", headerName: "Evaluation Date", flex: 1, minWidth: 150  },
    {
      field: "action",
      headerName: "Action",
      flex: 1,
      minWidth: 150,
      renderCell: (params) => (
        <Button
          variant="contained"
          style={{ backgroundColor: colors.primary[600], color: "white" }}
          onClick={() => handleViewExistingEvaluation(params.row.id)}
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
        `${process.env.REACT_APP_API_BASE_URL}/getEvaluationDetails`,
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

      <Box mt="10px" p="10px" backgroundColor={colors.primary[500]} borderRadius="8px">
    
      {/* Description Section */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h6"
          color={colors.grey[100]}
          gutterBottom
          sx={{ fontWeight: 'bold' }}
        >
          Description
        </Typography>
        <Typography
          variant="body1"
          color={colors.grey[300]}
          sx={{ lineHeight: 1.6 }}
        >
          {selectedSE?.description?.trim()
            ? selectedSE.description
            : "No description provided."}
        </Typography>
      </Box>

      {/* SDGs Involved */}
      {selectedSE?.sdgs?.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h6"
            color={colors.grey[100]}
            gutterBottom
            sx={{ fontWeight: 'bold' }}
          >
            SDGs Involved
          </Typography>
          <TableContainer
            sx={{
              maxWidth: 400,
              backgroundColor: colors.primary[500],
              borderRadius: 2,
              boxShadow: 2,
            }}
          >
            <Table size="small">
              <TableBody>
                {selectedSE.sdgs.map((sdg, index) => (
                  <TableRow key={index}>
                    <TableCell
                      sx={{
                        color: colors.grey[100],
                        borderBottom: 'none',
                        py: 1.5,
                      }}
                    >
                      {sdg}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* More Info Button */}
      <Box sx={{ mt: 2 }}>
        <Button
          variant="outlined"
          color="secondary"
          onClick={() => setMoreOpen(true)}
          sx={{
            borderColor: colors.grey[300],
            color: colors.grey[100],
            '&:hover': {
              backgroundColor: colors.grey[800],
              borderColor: colors.grey[100],
            },
            textTransform: 'none',
            fontWeight: 'bold',
            px: 3,
            py: 1,
          }}
        >
          More Info
        </Button>
      </Box>

        <Dialog
          open={moreOpen}
          onClose={() => setMoreOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              backgroundColor: "#fff",
              color: "#000",
              border: "2px solid #1E4D2B",
              borderRadius: "12px"
            },
          }}
        >
          <DialogTitle
            sx={{
              backgroundColor: "#1E4D2B",
              color: "#fff",
              textAlign: "center",
              fontSize: "1.75rem",
              fontWeight: "bold",
              py: 2
            }}
          >
            More Information
          </DialogTitle>

          <DialogContent
            sx={{
              padding: 3,
              maxHeight: "70vh",
              overflowY: "auto",
              backgroundColor: "#f9f9f9"
            }}
          >
            {seApplication ? (
              <Grid container spacing={2}>
                {/* Meta */}
                <Grid item xs={12}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    textAlign="right"
                  >
                    Submitted At: {new Date(seApplication.submitted_at).toLocaleString()}
                  </Typography>
                </Grid>

                {/* SECTION: About the Team */}
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ color: "#1E4D2B", fontWeight: 700 }} gutterBottom>
                    🧭 About the Team
                  </Typography>
                </Grid>
                <Grid item xs={6}><strong>Team Name:</strong> {seApplication.team_name}</Grid>
                <Grid item xs={6}><strong>Abbreviation:</strong> {seApplication.abbr}</Grid>
                <Grid item xs={12}><strong>Description:</strong> {seApplication.description || <i>Not provided</i>}</Grid>
                <Grid item xs={6}><strong>Started:</strong> {seApplication.enterprise_idea_start}</Grid>
                <Grid item xs={6}><strong>Meeting Frequency:</strong> {seApplication.meeting_frequency}</Grid>
                <Grid item xs={12}><strong>Communication Modes:</strong> {(seApplication.communication_modes || []).join(", ")}</Grid>

                <Grid item xs={12}><Divider /></Grid>

                {/* SECTION: Problem & Solution */}
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ color: "#1E4D2B", fontWeight: 700 }} gutterBottom>
                    🎯 Problem & Solution
                  </Typography>
                </Grid>
                <Grid item xs={12}><strong>Social Problem:</strong> {seApplication.social_problem || <i>Not provided</i>}</Grid>
                <Grid item xs={12}><strong>Nature:</strong> {seApplication.se_nature}</Grid>
                <Grid item xs={12}><strong>Critical Areas:</strong> {(seApplication.critical_areas || []).join(", ")}</Grid>
                <Grid item xs={12}><strong>Action Plans:</strong> {seApplication.action_plans}</Grid>

                <Grid item xs={12}><Divider /></Grid>

                {/* SECTION: Team Details */}
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ color: "#1E4D2B", fontWeight: 700 }} gutterBottom>
                    👥 Team Details
                  </Typography>
                </Grid>
                <Grid item xs={12}><strong>Team Characteristics:</strong> {seApplication.team_characteristics}</Grid>
                <Grid item xs={12}><strong>Challenges:</strong> {seApplication.team_challenges}</Grid>

                <Grid item xs={12}><Divider /></Grid>

                {/* SECTION: Mentoring Preferences */}
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ color: "#1E4D2B", fontWeight: 700 }} gutterBottom>
                    📌 Mentoring Details
                  </Typography>
                </Grid>
                <Grid item xs={12}><strong>Team Members:</strong> {seApplication.mentoring_team_members}</Grid>
                <Grid item xs={6}><strong>Preferred Time:</strong> {(seApplication.preferred_mentoring_time || []).join(", ")}</Grid>
                <Grid item xs={6}><strong>Time Notes:</strong> {seApplication.mentoring_time_note}</Grid>

                <Grid item xs={12}><Divider /></Grid>

                {/* SECTION: Contact */}
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ color: "#1E4D2B", fontWeight: 700 }} gutterBottom>
                    📞 Contact Information
                  </Typography>
                </Grid>
                <Grid item xs={6}><strong>Email:</strong> {seApplication.focal_email || <i>Not provided</i>}</Grid>
                <Grid item xs={6}><strong>Phone:</strong> {seApplication.focal_phone || <i>Not provided</i>}</Grid>
                <Grid item xs={12}><strong>Social Media:</strong> {seApplication.social_media_link}</Grid>
                <Grid item xs={12}><strong>Focal Person Contact:</strong> {seApplication.focal_person_contact}</Grid>

                <Grid item xs={12}><Divider /></Grid>

                {/* SECTION: Pitch Deck */}
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ color: "#1E4D2B", fontWeight: 700 }} gutterBottom>
                    📄 Pitch Deck
                  </Typography>
                  {seApplication.pitch_deck_url ? (
                    <a
                      href={seApplication.pitch_deck_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "#1E4D2B",
                        fontWeight: "bold",
                        textDecoration: "underline"
                      }}
                    >
                      View Document
                    </a>
                  ) : (
                    <i>No pitch deck provided</i>
                  )}
                </Grid>
              </Grid>
            ) : (
              <Typography>Loading...</Typography>
            )}
          </DialogContent>

          <DialogActions sx={{ padding: 2, borderTop: "1px solid #1E4D2B", justifyContent: "center" }}>
            <Button
              onClick={() => setMoreOpen(false)}
              variant="outlined"
              sx={{
                color: "#1E4D2B",
                borderColor: "#1E4D2B",
                "&:hover": { backgroundColor: "#E0F2E9" },
              }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

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
            label={
              <Box sx={{ textAlign: "center" }}>
                <Typography sx={{ fontSize: "20px", lineHeight: 1.2 }}>
                  {stats.registeredUsers}
                </Typography>
                <Typography sx={{ fontSize: "16px", lineHeight: 1.2 }}>
                  Registered
                </Typography>
                <Typography sx={{ fontSize: "16px", lineHeight: 1.2 }}>
                  Telegram {stats.registeredUsers === 1 ? "User" : "Users"}
                </Typography>
              </Box>
            }
            icon={
              <PeopleIcon
                sx={{ fontSize: "26px", color: colors.greenAccent[500] }}
              />
            }
            sx={{
              p: "10px",
              backgroundColor: colors.primary[400],
              color: colors.grey[100],
              "& .MuiChip-icon": { color: colors.greenAccent[500] },
              maxWidth: "160px",
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
            increase={
              isNaN(stats.acknowledgedEvaluations / stats.totalEvaluations)
                ? "0%"
                : `${((stats.acknowledgedEvaluations / stats.totalEvaluations) * 100).toFixed(2)}%`
            }
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
            progress={
              stats.totalEvaluations > 0
                ? stats.pendingEvaluations / stats.totalEvaluations
                : 0
            }
            increase={
              stats.totalEvaluations > 0
                ? `${((stats.pendingEvaluations / stats.totalEvaluations) * 100).toFixed(2)}%`
                : "0%"
            }
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

      <Box display="flex" gap="20px" width="100%" mt="20px" height="500px">
        {/* Evaluations Table */}
        <Box
          sx={{
            backgroundColor: colors.primary[400],
            padding: "20px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            display: "flex",
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
            getRowHeight={() => 'auto'}
            sx={{
                "& .MuiDataGrid-cell": {
                  display: "flex",
                  alignItems: "center", // vertical centering
                  paddingTop: "12px",
                  paddingBottom: "12px",
                },
                "& .MuiDataGrid-columnHeader": {
                  alignItems: "center", // optional: center header label vertically
                },
                "& .MuiDataGrid-cellContent": {
                  whiteSpace: "normal",
                  wordBreak: "break-word",
                  overflowWrap: "break-word",
                },
                "& .MuiDataGrid-toolbarContainer .MuiButton-text": {
                color: `${colors.grey[100]} !important`,
                },
              }}
              slots={{ toolbar: GridToolbar }}
          />
        </Box>
        {/* AREAS OF FOCUS TABLE */}
        <Box
          flex="1"
          backgroundColor={colors.primary[400]}
          height="500px"
          display="flex"
          flexDirection="column"
        >
          {/* Fixed Header */}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            borderBottom={`4px solid ${colors.primary[500]}`}
            p="15px"
            flexShrink={0}
          >
            <Typography
              color={colors.greenAccent[500]}
              variant="h3"
              fontWeight="600"
            >
              Critical Areas of Focus
            </Typography>
          </Box>

          {/* Scrollable List */}
          <Box
            sx={{
              flex: 1,
              overflowY: "auto",
            }}
          >
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
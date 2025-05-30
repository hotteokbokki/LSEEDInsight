import {
  Box,
  Button,
  IconButton,
  Typography,
  useTheme,
  Chip,
  Snackbar,
  Alert,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
} from "@mui/material";
import { tokens } from "../../theme";
import PersonIcon from "@mui/icons-material/Person";

import SchoolIcon from "@mui/icons-material/School";
import { mockTransactions } from "../../sampledata/mockData";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import EmailIcon from "@mui/icons-material/Email";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import AcknowledgmentChart from "../../components/AcknowledgmentChart";
import TrafficIcon from "@mui/icons-material/Traffic";
import Header from "../../components/Header";
import { useNavigate } from "react-router-dom";
import SEPerformanceTrendChart from "../../components/SEPerformanceTrendChart";
import StatBox from "../../components/StatBox";
import ProgressCircle from "../../components/ProgressCircle";
import FullCalendar from "@fullcalendar/react";
import { formatDate } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import { useState, useEffect } from "react";
import { DataGrid } from "@mui/x-data-grid";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import Diversity2OutlinedIcon from "@mui/icons-material/Diversity2Outlined";
import AnalyticsOutlinedIcon from "@mui/icons-material/AnalyticsOutlined";
import BusinessIcon from "@mui/icons-material/Business";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import {
  Assessment,
  Star,
  Business,
  EventAvailable,
} from "@mui/icons-material";
import axios from "axios";

const Dashboard = ({ userRole }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [currentEvents, setCurrentEvents] = useState([]);
  const [lowPerformingSEs, setLowPerformingSEs] = useState([]);
  const [mentorSchedules, setMentorSchedules] = useState([]);
  const [socialEnterprises, setSocialEnterprises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [evaluations, setEvaluations] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [mentorEvaluations, setmentorEvaluations] = useState([]);
  const [upcomingSchedules, setupcomingSchedules] = useState([]);
  const [isLoadingEvaluations, setIsLoadingEvaluations] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const userSession = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    mentorWithoutMentorshipCount: [{ count: "0" }], // Default structure to prevent undefined errors
    mentorWithMentorshipCount: [{ count: "0" }],
    mentorCountTotal: [{ count: "1" }], // Avoid division by zero
    unassignedMentors: 0,
    assignedMentors: 0,
    totalSocialEnterprises: 0,
    totalPrograms: 0,
    previousUnassignedMentors: 0,
  });
  const [percentageIncrease, setPercentageIncrease] = useState("0%");

  const mockStats = {
    totalEvaluations: 25,
    averageRating: 4.3,
    mostCommonRating: 5,
    socialEnterprisesHandled: 10,
  };

  const mockEvaluations = [
    {
      id: 1,
      date: "2025-03-10",
      enterprise: "GreenFuture SE",
      status: "Acknowledged",
    },
    { id: 2, date: "2025-03-08", enterprise: "EcoSavers", status: "Pending" },
    {
      id: 3,
      date: "2025-03-05",
      enterprise: "BlueWater Solutions",
      status: "Acknowledged",
    },
  ];

  const mockSessions = [
    {
      id: 1,
      date: "2025-03-20",
      enterprise: "GreenFuture SE",
      status: "Confirmed",
    },
    {
      id: 2,
      date: "2025-03-22",
      enterprise: "EcoSavers",
      status: "Pending Approval",
    },
  ];

  const alertColumns = [
    { field: "seName", headerName: "SE Name", flex: 2 },
    {
      field: "averageScore",
      headerName: "Avg Score",
      flex: 1,
      renderCell: (params) => (
        <Typography
          sx={{
            color:
              params.value === 0
                ? "gray"
                : params.value < 1.5
                ? colors.redAccent[500]
                : "black",
            display: "flex",
            fontWeight: "bold",
            alignItems: "center",
            justifyContent: "flex-start",
            height: "100%",
          }}
        >
          {params.value === 0 ? "No Evaluations" : params.value}
        </Typography>
      ),
    },
    {
      field: "lastEvaluated",
      headerName: "Last Evaluated",
      flex: 2,
      renderCell: (params) => (
        <Typography
          sx={{
            color:
              params.value === "No Evaluations" ? "gray" : colors.grey[100],
            display: "flex",
            fontWeight: "bold",
            alignItems: "center",
            justifyContent: "flex-start",
            height: "100%",
          }}
        >
          {params.value}
        </Typography>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 2,
      renderCell: (params) => (
        <Button
          variant="contained"
          sx={{
            backgroundColor: colors.redAccent[500] + " !important", // Force color
            color: colors.grey[100], // Ensure text is visible
            "&:hover": {
              backgroundColor: colors.redAccent[700] + " !important", // Darker red on hover
            },
          }}
          onClick={() => handleAction(params.row.id)}
        >
          View SE
        </Button>
      ),
    },
  ];

  useEffect(() => {
    const fetchEvaluations = async () => {
      try {
        setIsLoadingEvaluations(true);

        let response;
        if (userRole === "Mentor") {
          response = await axios.get(
            "http://localhost:4000/getRecentMentorEvaluations",
            {
              params: { mentor_id: userSession.id },
            }
          );
        }
        // Ensure evaluation_id is included and set as `id`
        const formattedData = response.data.map((evaluation) => ({
          id: evaluation.evaluation_id, // Use evaluation_id as the unique ID
          evaluation_id: evaluation.evaluation_id, // Explicitly include evaluation_id
          evaluator_name: evaluation.evaluator_name,
          social_enterprise: evaluation.social_enterprise,
          evaluation_date: evaluation.evaluation_date,
          acknowledged: evaluation.acknowledged ? "Yes" : "No",
        }));

        console.log("✅ Formatted EvaluationsData:", formattedData); // Debugging
        setmentorEvaluations(formattedData);
      } catch (error) {
        console.error("❌ Error fetching evaluations:", error);
      } finally {
        setIsLoadingEvaluations(false);
      }
    };

    fetchEvaluations();
  }, [userSession.id]);

  useEffect(() => {
    const fetchUpcomingSchedule = async () => {
      try {
        setIsLoadingEvaluations(true);

        let response;
        if (userRole === "Mentor") {
          response = await axios.get(
            "http://localhost:4000/getUpcomingSchedulesForMentor",
            {
              params: { mentor_id: userSession.id },
            }
          );
        }
        // Ensure evaluation_id is included and set as `id`
        const formattedData = response.data.map((schedule) => ({
          id: schedule.mentoring_session_id, // Use evaluation_id as the unique ID
          team_name: schedule.social_enterprise, // Use evaluation_id as the unique ID
          date: schedule.session_datetime, // Use evaluation_id as the unique ID
          link: schedule.zoom_link, // Use evaluation_id as the unique ID
          status: schedule.status, // Use evaluation_id as the unique ID
        }));
        setupcomingSchedules(formattedData);
      } catch (error) {
        console.error("❌ Error fetching evaluations:", error);
      } finally {
        setIsLoadingEvaluations(false);
      }
    };

    fetchUpcomingSchedule();
  }, [userSession.id]);

  const mentorColumns = [
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
          onClick={() => handleViewExistingEvaluation(params.row.evaluation_id)} // Pass only evaluation_id
        >
          View
        </Button>
      ),
    },
  ];

  const handleAcceptClick = async (schedule) => {
    try {
      const {
        id: mentoring_session_id,
        mentorship_id,
        date: mentorship_date,
        time: mentorship_time,
        zoom: zoom_link,
      } = schedule;

      console.log("Approving mentorship with details:", {
        mentoring_session_id,
        mentorship_id,
        mentorship_date,
        mentorship_time,
        zoom_link,
      });

      const response = await fetch("http://localhost:4000/approveMentorship", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mentoring_session_id,
          mentorship_id,
          mentorship_date,
          mentorship_time,
          zoom_link,
        }),
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(`Failed to approve mentorship: ${errorMessage}`);
      }

      console.log("Mentorship approved successfully");

      // Show success message
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Error approving mentorship:", error);
    }
  };

  const handleDeclineClick = async (schedule) => {
    try {
      const { id: mentoring_session_id } = schedule; // Extract ID

      console.log("Declining schedule with ID:", mentoring_session_id);

      const response = await fetch("http://localhost:4000/declineMentorship", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mentoring_session_id }),
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(`Failed to decline mentorship: ${errorMessage}`);
      }

      console.log("Mentorship declined successfully");

      // Show success message
      setSnackbarOpen(true); // Ensure setSnackbarOpen is defined
    } catch (error) {
      console.error("Error declining mentorship:", error);
    }
  };

  const pendingScheduleColumns = [
    {
      field: "sessionDetails",
      headerName: "Mentoring Session Information",
      flex: 1,
      minWidth: 200,
    },
    { field: "date", headerName: "Scheduled Date", flex: 1, minWidth: 200 },
    {
      field: "status",
      headerName: "Status",
      flex: 1,
      minWidth: 150,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={
            params.value === "Pending" ? "warning" : colors.greenAccent[600]
          }
        />
      ),
    },
    {
      field: "actions",
      headerName: "Action",
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <div>
          <Button
            variant="contained"
            style={{
              backgroundColor: colors.greenAccent[500],
              marginRight: "8px",
            }}
            onClick={() => handleAcceptClick(params.row)}
          >
            Accept
          </Button>
          <Button
            variant="contained"
            style={{ backgroundColor: colors.redAccent[500] }}
            onClick={() => handleDeclineClick(params.row)}
          >
            Decline
          </Button>
        </div>
      ),
    },
  ];

  useEffect(() => {
    const fetchFlaggedSE = async () => {
      try {
        const response = await axios.get(
          "http://localhost:4000/api/flagged-ses"
        );
        const data = response.data; // No need for .json() with axios

        if (Array.isArray(data)) {
          const formattedSEs = data.map((se) => ({
            id: se.se_id, // Assuming se_id is unique
            seName: se.team_name,
            averageScore: se.avg_rating || 0, // Default to 0 if no rating
            lastEvaluated: se.evaluation_status, // "No Evaluations" or "Evaluated"
          }));

          setLowPerformingSEs(formattedSEs);
        } else {
          console.error("❌ Invalid mentor schedule format:", data);
        }
      } catch (error) {
        console.error("❌ Error fetching mentor schedules:", error);
        setLowPerformingSEs([]);
      }
    };

    fetchFlaggedSE();
  }, []);

  useEffect(() => {
    const fetchMentorSchedules = async () => {
      try {
        const response = await axios.get(
          "http://localhost:4000/api/pending-schedules"
        );
        const data = response.data; // No need for .json() with axios

        console.log("📅 Mentor Schedules Data:", data); // ✅ Debugging log

        if (Array.isArray(data)) {
          setMentorSchedules(data);
        } else {
          console.error("❌ Invalid mentor schedule format:", data);
        }
      } catch (error) {
        console.error("❌ Error fetching mentor schedules:", error);
        setMentorSchedules([]);
      }
    };

    fetchMentorSchedules();
  }, []);

  const handleAction = (id) => {
    navigate(`/se-analytics/${id}`);
  };

  const columns = [
    {
      field: "socialEnterprise",
      headerName: "Social Enterprise",
      flex: 1,
      cellClassName: "name-column--cell",
    },
    {
      field: "mentor",
      headerName: "Mentor",
      flex: 1,
    },
  ];

  const handleViewExistingEvaluation = async (evaluation_id) => {
    console.log("📌 Evaluation ID Passed:", evaluation_id); // Debugging log

    try {
      const response = await axios.get(
        "http://localhost:4000/getEvaluationDetails",
        {
          params: { evaluation_id },
        }
      );

      console.log("📥 Raw API Response:", response); // Log raw response
      console.log("📥 API Response Data:", response.data); // Log parsed response

      if (!response.data || response.data.length === 0) {
        console.warn("⚠️ No evaluation details found.");
        return;
      }

      // Process evaluation details
      const groupedEvaluation = response.data.reduce((acc, evalItem) => {
        const {
          evaluation_date,
          evaluator_name, // ✅ Added evaluator name
          social_enterprise,
          category_name,
          star_rating,
          selected_comments,
          additional_comment,
        } = evalItem;

        if (!acc.id) {
          acc.id = evaluation_id;
          acc.evaluator_name = evaluator_name; // ✅ Store evaluator (SE) name
          acc.social_enterprise = social_enterprise; // ✅ Store evaluated SE
          acc.evaluation_date = evaluation_date;
          acc.categories = [];
        }

        acc.categories.push({
          category_name,
          star_rating,
          selected_comments: Array.isArray(selected_comments)
            ? selected_comments
            : [], // Ensure selected_comments is always an array
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

  useEffect(() => {
    const fetchEvaluationStats = async () => {
      try {
        const response = await fetch(
          "http://localhost:4000/api/evaluation-stats"
        );
        const data = await response.json();

        console.log("Evaluation Stats Data:", data); // Log API response
        setEvaluations({
          total: data[0]?.totalevaluations ?? 0,
          acknowledged: data[0]?.acknowledgedevaluations ?? 0,
        });

        console.log("Updated Evaluations State:", {
          total: data.totalevaluations,
          acknowledged: data.acknowledgedevaluations,
        }); // Log the updated state
      } catch (error) {
        console.error("Error fetching evaluation stats:", error);
      }
    };
    fetchEvaluationStats();
  }, []);

  const acknowledgedPercentage =
    evaluations.total > 0
      ? ((evaluations.acknowledged / evaluations.total) * 100).toFixed(1) + "%"
      : "0%";

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true); // ✅ Set loading state before fetching

        const response = await fetch(
          "http://localhost:4000/api/dashboard-stats"
        );
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        setStats(data);

        // ✅ Calculate percentage increase for unassigned mentors safely
        if (
          data.previousUnassignedMentors !== undefined &&
          data.previousUnassignedMentors > 0
        ) {
          const change =
            ((data.unassignedMentors - data.previousUnassignedMentors) /
              data.previousUnassignedMentors) *
            100;
          setPercentageIncrease(`${change.toFixed(1)}%`);
        } else if (data.unassignedMentors > 0) {
          setPercentageIncrease("100%"); // First-time assignments
        } else {
          setPercentageIncrease("0%");
        }
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false); // ✅ Ensure loading state is reset
      }
    };

    fetchDashboardStats();
  }, []);

  useEffect(() => {
    const fetchSocialEnterprises = async () => {
      try {
        const response = await fetch(
          "http://localhost:4000/getAllSocialEnterprisesWithMentorship"
        );
        const data = await response.json();

        // Format the data for the DataGrid
        const formattedData = data.map((se) => ({
          id: se.se_id,
          socialEnterprise: se.team_name || "Unnamed SE",
          mentor:
            se.mentors.length > 0 ? se.mentors[0].mentor_name : "No Mentor",
        }));

        setSocialEnterprises(formattedData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching social enterprises:", error);
        setLoading(false);
      }
    };
    fetchSocialEnterprises();
  }, []);

  const handleDateClick = (selected) => {
    const title = prompt("Please enter a new title for your event");
    const calendarApi = selected.view.calendar;
    calendarApi.unselect();

    if (title) {
      calendarApi.addEvent({
        id: `${selected.dateStr}-${title}`,
        title,
        start: selected.startStr,
        end: selected.endStr,
        allDay: selected.allDay,
      });
    }
  };

  const handleEventClick = (selected) => {
    if (
      window.confirm(
        `Are you sure you want to delete the event '${selected.event.title}'`
      )
    ) {
      selected.event.remove();
    }
  };

  return (
    <Box m="20px">
      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Header
          title="Dashboard"
          subtitle={
            userRole?.startsWith("LSEED")
              ? "Welcome to LSEED Dashboard"
              : "Welcome to Mentor Dashboard"
          }
        />
      </Box>

      {userRole?.startsWith("LSEED")  && (
        <>
          <Box
            display="grid"
            gridTemplateColumns="repeat(12, 1fr)"
            gridAutoRows="140px"
            gap="20px"
          >
            {/* Unassigned Mentors */}
            <Box
              gridColumn="span 3"
              display="flex"
              alignItems="center"
              justifyContent="center"
              bgcolor={colors.primary[400]}
            >
              <StatBox
                title={stats?.mentorWithoutMentorshipCount[0]?.count}
                subtitle="Unassigned Mentors"
                progress={
                  parseInt(stats?.mentorWithoutMentorshipCount[0]?.count) /
                  parseInt(stats?.mentorCountTotal[0]?.count)
                }
                increase={`${(
                  (parseInt(stats?.mentorWithoutMentorshipCount[0]?.count) /
                    parseInt(stats?.mentorCountTotal[0]?.count)) *
                  100
                ).toFixed(2)}%`}
                icon={
                  <PersonIcon
                    sx={{ color: colors.greenAccent[600], fontSize: "26px" }} // 🔄 Updated to PersonIcon
                  />
                }
              />
            </Box>

            {/* Assigned Mentors */}
            <Box
              gridColumn="span 3"
              display="flex"
              alignItems="center"
              justifyContent="center"
              bgcolor={colors.primary[400]}
            >
              <StatBox
                title={stats?.mentorWithMentorshipCount[0]?.count}
                subtitle="Assigned Mentors"
                progress={
                  parseInt(stats?.mentorWithMentorshipCount[0]?.count) /
                  parseInt(stats?.mentorCountTotal[0]?.count)
                }
                increase={`${(
                  (parseInt(stats?.mentorWithMentorshipCount[0]?.count) /
                    parseInt(stats?.mentorCountTotal[0]?.count)) *
                  100
                ).toFixed(2)}%`}
                icon={
                  <PersonIcon
                    sx={{ fontSize: "26px", color: colors.blueAccent[500] }} // 🔄 Updated to PersonIcon
                  />
                }
              />
            </Box>

            {/* Total Social Enterprises */}
            <Box
              gridColumn="span 3"
              display="flex"
              alignItems="center"
              justifyContent="center"
              bgcolor={colors.primary[400]}
            >
              <Chip
                label={`${stats.totalSocialEnterprises} involved ${
                  stats.totalSocialEnterprises === 1
                    ? "Social Enterprise"
                    : "Social Enterprises"
                }`}
                icon={
                  <BusinessIcon
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

            {/* Total Programs (LSEED) */}
            <Box
              gridColumn="span 3"
              display="flex"
              alignItems="center"
              justifyContent="center"
              bgcolor={colors.primary[400]}
            >
              <Chip
                label={`${stats.totalPrograms} LSEED ${
                  stats.totalPrograms === 1 ? "Program" : "Programs"
                }`}
                icon={
                  <SchoolIcon
                    sx={{ fontSize: "26px", color: colors.greenAccent[500] }} // 🔄 Updated to SchoolIcon
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

            {/* SE Performance Trend Chart */}
            <Box
              gridColumn="span 12"
              gridRow="span 3"
              bgcolor={colors.primary[400]}
              paddingTop={2}
              paddingLeft={2}
              paddingright={2}
            >
              <SEPerformanceTrendChart userRole={userRole}/>
            </Box>

            {/* Left Section (Stat Boxes) */}
            <Box
              gridColumn="span 3"
              gridRow="span 2"
              display="grid"
              gridTemplateRows="1fr 1fr"
              gap={3} // Adjust the gap between stat boxes
              borderRadius="8px" // Optional: To match the child boxes' rounded corners
            >
              {/* Total Evaluations */}
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                bgcolor={colors.primary[400]}
                p={2}
              >
                <Chip
                  label={`${evaluations.total} Total Evaluations`}
                  icon={
                    <PendingActionsIcon
                      sx={{ fontSize: "26px", color: colors.blueAccent[500] }}
                    />
                  }
                  sx={{
                    fontSize: "20px",
                    p: "10px",
                    backgroundColor: colors.primary[400],
                    color: colors.grey[100],
                    "& .MuiChip-icon": { color: colors.blueAccent[500] },
                  }}
                />
              </Box>

              {/* Acknowledged Evaluations */}
              <Box
                bgcolor={colors.primary[400]}
                display="flex"
                alignItems="center"
                justifyContent="center"
                p={2}
              >
                <StatBox
                  title={evaluations.acknowledged}
                  subtitle="Acknowledged Evaluations"
                  increase={acknowledgedPercentage}
                  icon={
                    <AssignmentTurnedInIcon
                      sx={{ fontSize: "26px", color: colors.greenAccent[500] }}
                    />
                  }
                />
              </Box>
            </Box>

            {/* Right Section (Chart) */}
            <Box
              gridColumn="span 9"
              gridRow="span 2"
              bgcolor={colors.primary[400]}
              p={2}
              display="flex"
              alignItems="center"
              justifyContent="center"
              height="100%"
              minHeight="300px"
              overflow="hidden"
            >
              <AcknowledgmentChart
                style={{
                  width: "200px", // Reduce width slightly to fit better
                  height: "200px", // Reduce height slightly
                  maxWidth: "400px", // Keep it from getting too large
                  maxHeight: "300px", // Adjust height to fit
                  objectFit: "contain",
                }}
              />
            </Box>

            {/* Alert & Schedule Sections */}
            <Box
              gridColumn="span 12"
              gridRow="span 3"
              display="grid"
              gridTemplateColumns="repeat(12, 1fr)"
              gap="20px"
            >
              {/* SEs Requiring Immediate Attention 🚨 */}
              <Box
                gridColumn="span 6"
                backgroundColor={colors.primary[400]}
                padding="20px"
              >
                <Typography
                  variant="h3"
                  fontWeight="bold"
                  color={colors.redAccent[500]}
                  marginBottom="15px" // Ensures a small gap between header & DataGrid
                >
                  SEs Requiring Immediate Attention
                </Typography>
                <Box
                  sx={{
                    height: "400px",
                    minHeight: "400px", // Ensures it does not shrink with missing data
                    backgroundColor: colors.primary[400],

                    "& .MuiDataGrid-root": { border: "none" },
                    "& .MuiDataGrid-cell": { borderBottom: "none" },
                    "& .MuiDataGrid-columnHeaders, & .MuiDataGrid-columnHeader":
                      {
                        backgroundColor: colors.blueAccent[700] + " !important",
                      },
                    "& .MuiDataGrid-virtualScroller": {
                      backgroundColor: colors.primary[400],
                    },
                    "& .MuiDataGrid-footerContainer": {
                      borderTop: "none",
                      backgroundColor: colors.blueAccent[700],
                      color: colors.grey[100],
                    },
                  }}
                >
                  {loading ? (
                    <Typography>Loading...</Typography>
                  ) : (
                    <DataGrid rows={lowPerformingSEs} columns={alertColumns} />
                  )}
                </Box>
              </Box>

              {/* Pending Mentoring Schedules 🕒 */}
              <Box
                gridColumn="span 6"
                backgroundColor={colors.primary[400]}
                padding="20px"
              >
                <Typography
                  variant="h3"
                  fontWeight="bold"
                  color={colors.blueAccent[500]}
                  marginBottom="15px"
                >
                  Pending Mentoring Schedules
                </Typography>
                <Box
                  sx={{
                    height: "400px",
                    minHeight: "400px", // Ensures it does not shrink with missing data
                    backgroundColor: colors.primary[400],

                    "& .MuiDataGrid-root": { border: "none" },
                    "& .MuiDataGrid-cell": { borderBottom: "none" },
                    "& .MuiDataGrid-columnHeaders, & .MuiDataGrid-columnHeader":
                      {
                        backgroundColor: colors.blueAccent[700] + " !important",
                      },
                    "& .MuiDataGrid-virtualScroller": {
                      backgroundColor: colors.primary[400],
                    },
                    "& .MuiDataGrid-footerContainer": {
                      borderTop: "none",
                      backgroundColor: colors.blueAccent[700],
                      color: colors.grey[100],
                    },
                  }}
                >
                  {loading ? (
                    <Typography>Loading...</Typography>
                  ) : mentorSchedules.length > 0 ? (
                    <DataGrid
                      rows={mentorSchedules.map((schedule) => ({
                        id: schedule.mentoring_session_id, // Unique ID
                        sessionDetails: `Mentoring Session for ${
                          schedule.team_name || "Unknown SE"
                        } with Mentor ${
                          schedule.mentor_name || "Unknown Mentor"
                        }`,
                        date:
                          `${schedule.mentoring_session_date}, ${schedule.mentoring_session_time}` ||
                          "N/A",
                        time: schedule.mentoring_session_time || "N/A",
                        zoom: schedule.zoom_link || "N/A",
                        mentorship_id: schedule.mentorship_id,
                        status: schedule.status || "Pending",
                      }))}
                      columns={pendingScheduleColumns}
                      pageSize={5}
                      rowsPerPageOptions={[5, 10]}
                    />
                  ) : (
                    <Typography>No pending schedules available.</Typography>
                  )}
                </Box>
              </Box>
            </Box>

            {/* Quick Action Panel */}
            <Box
              gridColumn="span 12"
              gridRow="span 1"
              bgcolor={colors.primary[400]}
              padding="20px"
              marginTop={3}
            >
              <Typography
                variant="h4"
                fontWeight="bold"
                color={colors.greenAccent[500]}
                marginBottom="15px"
              >
                Quick Actions Panel
              </Typography>

              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                gap={2}
                width="100%"
              >
                <Button
                  variant="contained"
                  startIcon={<AnalyticsOutlinedIcon />}
                  onClick={() => navigate("/analytics")}
                  sx={{
                    flexGrow: 1,
                    backgroundColor: colors.blueAccent[800], // Custom Background Color
                    color: colors.grey[100], // Custom Text Color
                    "&:hover": {
                      backgroundColor: colors.blueAccent[900], // Darker shade on hover
                    },
                  }}
                >
                  View Analytics
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Diversity2OutlinedIcon />}
                  onClick={() => navigate("/socialenterprise")}
                  sx={{
                    flexGrow: 1,
                    backgroundColor: colors.blueAccent[600], // Custom Background Color
                    color: colors.grey[100], // Custom Text Color
                    "&:hover": {
                      backgroundColor: colors.blueAccent[700], // Darker shade on hover
                    },
                  }}
                >
                  Social Enterprises
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AssignmentTurnedInOutlinedIcon />}
                  onClick={() => navigate("/assess")}
                  sx={{
                    flexGrow: 1,
                    backgroundColor: colors.greenAccent[600], // Custom Background Color
                    color: colors.grey[100], // Custom Text Color
                    "&:hover": {
                      backgroundColor: colors.greenAccent[800], // Darker shade on hover
                    },
                  }}
                >
                  Evaluate Mentor
                </Button>
              </Box>
            </Box>

            {/* Mentorships Section */}
            <Box gridColumn="span 12" gridRow="span 3" display="grid">
              <Box
                gridColumn="span 12"
                backgroundColor={colors.primary[400]}
                padding="20px"
              >
                <Typography
                  variant="h3"
                  fontWeight="bold"
                  color={colors.greenAccent[500]}
                  marginBottom="15px" // Ensures a small gap between header & DataGrid
                >
                  Mentorships
                </Typography>
                <Box
                  sx={{
                    height: "400px",
                    minHeight: "400px", // Ensures it does not shrink with missing data
                    backgroundColor: colors.primary[400],

                    "& .MuiDataGrid-root": { border: "none" },
                    "& .MuiDataGrid-cell": { borderBottom: "none" },
                    "& .name-column--cell": { color: colors.greenAccent[300] },
                    "& .MuiDataGrid-columnHeaders, & .MuiDataGrid-columnHeader":
                      {
                        backgroundColor: colors.blueAccent[700] + " !important",
                      },
                    "& .MuiDataGrid-virtualScroller": {
                      backgroundColor: colors.primary[400],
                    },
                    "& .MuiDataGrid-footerContainer": {
                      borderTop: "none",
                      backgroundColor: colors.blueAccent[700],
                      color: colors.grey[100],
                    },
                  }}
                >
                  {loading ? (
                    <Typography>Loading...</Typography>
                  ) : (
                    <DataGrid rows={socialEnterprises} columns={columns} />
                  )}
                </Box>
              </Box>
            </Box>
          </Box>
        </>
      )}

      {userRole === "Mentor" && (
        <>
          {/* Row 1 - StatBoxes */}
          <Box
            display="flex"
            flexWrap="wrap"
            gap="20px"
            justifyContent="space-between"
            mt="20px"
          >
            {/* Total Evaluations Submitted */}
            <Box
              flex="1 1 22%" // Responsive width for each StatBox
              backgroundColor={colors.primary[400]}
              display="flex"
              alignItems="center"
              justifyContent="center"
              p="20px"
            >
              <StatBox
                title={mockStats.totalEvaluations}
                subtitle="Total Evaluations Submitted"
                progress={mockStats.totalEvaluations / 50} // Placeholder percentage
                increase={`${((mockStats.totalEvaluations / 50) * 100).toFixed(
                  2
                )}%`}
                icon={
                  <Assessment
                    sx={{ fontSize: "26px", color: colors.blueAccent[500] }}
                  />
                }
              />
            </Box>

            {/* Average Rating Given to SEs */}
            <Box
              flex="1 1 22%"
              backgroundColor={colors.primary[400]}
              display="flex"
              alignItems="center"
              justifyContent="center"
              p="20px"
            >
              <StatBox
                title={mockStats.averageRating}
                subtitle="Average Rating Given to SEs"
                progress={mockStats.averageRating / 5} // Placeholder progress
                increase={`${((mockStats.averageRating / 5) * 100).toFixed(
                  2
                )}%`}
                icon={
                  <Star
                    sx={{ fontSize: "26px", color: colors.blueAccent[500] }}
                  />
                }
              />
            </Box>

            {/* Most Common Rating */}
            <Box
              flex="1 1 22%"
              backgroundColor={colors.primary[400]}
              display="flex"
              alignItems="center"
              justifyContent="center"
              p="20px"
            >
              <StatBox
                title={mockStats.mostCommonRating}
                subtitle="Most Common Rating"
                progress={mockStats.mostCommonRating / 5} // Placeholder progress
                increase={`${((mockStats.mostCommonRating / 5) * 100).toFixed(
                  2
                )}%`}
                icon={
                  <Star
                    sx={{ fontSize: "26px", color: colors.blueAccent[500] }}
                  />
                }
              />
            </Box>

            {/* Social Enterprises Handled */}
            <Box
              flex="1 1 22%"
              backgroundColor={colors.primary[400]}
              display="flex"
              alignItems="center"
              justifyContent="center"
              p="20px"
            >
              <StatBox
                title={mockStats.socialEnterprisesHandled}
                subtitle="Social Enterprises Handled"
                progress={mockStats.socialEnterprisesHandled / 20} // Placeholder percentage
                increase={`${(
                  (mockStats.socialEnterprisesHandled / 20) *
                  100
                ).toFixed(2)}%`}
                icon={
                  <Business
                    sx={{ fontSize: "26px", color: colors.blueAccent[500] }}
                  />
                }
              />
            </Box>
          </Box>

          {/* Recent Evaluations */}
          <Box
            width="100%"
            backgroundColor={colors.primary[400]}
            padding="20px"
            mt={4}
          >
            <Typography
              variant="h3"
              fontWeight="bold"
              color={colors.greenAccent[500]}
              marginBottom="15px"
            >
              Recent Evaluations
            </Typography>

            {mentorEvaluations.length > 0 ? (
              <Box
                height="400px"
                minHeight="400px"
                sx={{
                  "& .MuiDataGrid-root": { border: "none" },
                  "& .MuiDataGrid-cell": { borderBottom: "none" },
                  "& .MuiDataGrid-columnHeaders, & .MuiDataGrid-columnHeader": {
                    backgroundColor: colors.blueAccent[700] + " !important",
                  },
                  "& .MuiDataGrid-virtualScroller": {
                    backgroundColor: colors.primary[400],
                  },
                  "& .MuiDataGrid-footerContainer": {
                    borderTop: "none",
                    backgroundColor: colors.blueAccent[700],
                    color: colors.grey[100],
                  },
                }}
              >
                <DataGrid
                  rows={mentorEvaluations}
                  columns={mentorColumns}
                  pageSize={5}
                  rowsPerPageOptions={[5, 10]}
                />
              </Box>
            ) : (
              <Typography>No evaluations available.</Typography>
            )}
          </Box>

          {/* Evaluation Details Dialog - Read-Only */}
          <Dialog
            open={openDialog}
            onClose={() => setOpenDialog(false)}
            maxWidth="md"
            fullWidth
            PaperProps={{
              style: {
                backgroundColor: "#fff", // White background
                color: "#000", // Black text
                border: "1px solid #000", // Black border for contrast
              },
            }}
          >
            {/* Title with DLSU Green Background */}
            <DialogTitle
              sx={{
                backgroundColor: "#1E4D2B", // DLSU Green header
                color: "#fff", // White text
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
                maxHeight: "70vh", // Ensure it doesn't overflow the screen
                overflowY: "auto", // Enable scrolling if content is too long
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
                        borderBottom: "1px solid #000", // Separator line
                        paddingBottom: "8px",
                      }}
                    >
                      Evaluator: {selectedEvaluation.evaluator_name}{" "}
                      {/* ✅ Added Evaluator Name */}
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: "bold",
                        borderBottom: "1px solid #000", // Separator line
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
                          border: "1px solid #000", // Border for each category
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
                          {category.category_name} - Rating:{" "}
                          {category.star_rating} ★
                        </Typography>

                        {/* Selected Comments */}
                        <Typography
                          variant="body1"
                          sx={{ marginBottom: "8px" }}
                        >
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
            <DialogActions
              sx={{ padding: "16px", borderTop: "1px solid #000" }}
            >
              <Button
                onClick={() => setOpenDialog(false)}
                sx={{
                  color: "#000",
                  border: "1px solid #000",
                  "&:hover": { backgroundColor: "#f0f0f0" }, // Hover effect
                }}
              >
                Close
              </Button>
            </DialogActions>
          </Dialog>

          {/* Quick Action Panel */}
          <Box
            gridColumn="span 12"
            gridRow="span 1"
            bgcolor={colors.primary[400]}
            padding="20px"
            marginTop={3}
          >
            <Typography
              variant="h4"
              fontWeight="bold"
              color={colors.greenAccent[500]}
              marginBottom="15px"
            >
              Quick Actions Panel
            </Typography>

            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              gap={2}
              width="100%"
            >
              <Button
                variant="contained"
                startIcon={<AnalyticsOutlinedIcon />}
                onClick={() => navigate("/scheduling")}
                sx={{
                  flexGrow: 1,
                  backgroundColor: colors.blueAccent[800], // Custom Background Color
                  color: colors.grey[100], // Custom Text Color
                  "&:hover": {
                    backgroundColor: colors.blueAccent[900], // Darker shade on hover
                  },
                }}
              >
                Schedule Mentoring Session
              </Button>
              <Button
                variant="contained"
                startIcon={<Diversity2OutlinedIcon />}
                onClick={() => navigate("/mentorships")}
                sx={{
                  flexGrow: 1,
                  backgroundColor: colors.blueAccent[600], // Custom Background Color
                  color: colors.grey[100], // Custom Text Color
                  "&:hover": {
                    backgroundColor: colors.blueAccent[700], // Darker shade on hover
                  },
                }}
              >
                Manage Mentorships
              </Button>
              <Button
                variant="contained"
                startIcon={<AssignmentTurnedInOutlinedIcon />}
                onClick={() => navigate("/assess")}
                sx={{
                  flexGrow: 1,
                  backgroundColor: colors.greenAccent[600], // Custom Background Color
                  color: colors.grey[100], // Custom Text Color
                  "&:hover": {
                    backgroundColor: colors.greenAccent[800], // Darker shade on hover
                  },
                }}
              >
                Evaluate SE
              </Button>
            </Box>
          </Box>

          {/* Upcoming Mentoring Sessions */}
          <Box
            width="100%"
            backgroundColor={colors.primary[400]}
            padding="20px"
            mt={4}
          >
            <Typography
              variant="h3"
              fontWeight="bold"
              color={colors.greenAccent[500]}
              marginBottom="15px"
            >
              Upcoming Mentoring Sessions
            </Typography>

            {upcomingSchedules.length > 0 ? (
              <Box
                height="400px"
                minHeight="400px"
                sx={{
                  "& .MuiDataGrid-root": { border: "none" },
                  "& .MuiDataGrid-cell": { borderBottom: "none" },
                  "& .MuiDataGrid-columnHeaders, & .MuiDataGrid-columnHeader": {
                    backgroundColor: colors.blueAccent[700] + " !important",
                  },
                  "& .MuiDataGrid-virtualScroller": {
                    backgroundColor: colors.primary[400],
                  },
                  "& .MuiDataGrid-footerContainer": {
                    borderTop: "none",
                    backgroundColor: colors.blueAccent[700],
                    color: colors.grey[100],
                  },
                }}
              >
                <DataGrid
                  rows={upcomingSchedules}
                  columns={[
                    {
                      field: "team_name",
                      headerName: "Social Enterprise",
                      flex: 1,
                      minWidth: 150,
                    },
                    {
                      field: "date",
                      headerName: "Date",
                      width: 150,
                    },
                    {
                      field: "link",
                      headerName: "Zoom Link",
                      width: 250,
                      renderCell: (params) => {
                        const { row } = params;
                        return row.status === "Accepted" && row.link ? (
                          <a
                            href={row.link}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Chip label="Join" color="primary" />
                          </a>
                        ) : (
                          "N/A"
                        );
                      },
                    },
                  ]}
                  pageSize={5}
                  rowsPerPageOptions={[5, 10]}
                />
              </Box>
            ) : (
              <Typography>No mentoring sessions scheduled.</Typography>
            )}
          </Box>
        </>
      )}

      {/* Snackbar for Success Alert */}
      <Snackbar
        open={snackbarOpen} // Controlled by state
        autoHideDuration={3000} // Automatically close after 3 seconds
        onClose={() => setSnackbarOpen(false)} // Close on click or timeout
        anchorOrigin={{ vertical: "top", horizontal: "center" }} // Position of the popup
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="success"
          sx={{ width: "100%" }}
        >
          Acknowledged Schedule
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Dashboard;

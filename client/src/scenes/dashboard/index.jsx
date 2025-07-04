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
  Switch,
  FormControlLabel,
} from "@mui/material";
import { tokens } from "../../theme";
import PersonIcon from "@mui/icons-material/Person";
import { useAuth } from "../../context/authContext"; 
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
import { useState, useEffect, useContext } from "react";
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

const Dashboard = ({ }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { user, isMentorView, toggleView, loading: authLoading } = useAuth();
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
  const navigate = useNavigate();
  const [mentorDashboardStats, setMentorDashboardStats] = useState(null);
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

  const hasMentorRole = user?.roles?.includes("Mentor");
  const isLSEEDUser = user?.roles?.some(role => role === "LSEED-Coordinator" || role === "Administrator");
  const isCoordinator = user?.roles?.includes("LSEED-Coordinator");
  const hasBothRoles = hasMentorRole && isLSEEDUser;
  const isCoordinatorView = !isMentorView;

  const mockStats = {
    totalEvaluations: 25,
    averageRating: 4.3,
    mostCommonRating: 5,
    socialEnterprisesHandled: 10,
  };

  useEffect(() => {
    const fetchMentorDashboardStats = async () => {
      try {

        const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/fetch-mentor-dashboard-stats`, {
          withCredentials: true,
        });

        const data = response.data; 

        const formattedData = {
          totalEvalMade: parseInt(data.totalEvalMade?.[0]?.evaluation_count ?? "0", 10),
          avgRatingGiven: parseFloat(data.avgRatingGiven?.[0]?.average_rating ?? "0"),
          mostCommonRating: parseInt(data.mostCommonRating?.[0]?.rating ?? "0", 10),
          mentorshipsCount: parseInt(data.mentorshipsCount?.[0]?.mentorship_count ?? "0", 10),
        };

        console.log("DATA DEBUG:", formattedData);

        setMentorDashboardStats(formattedData);
      } catch (error) {
        console.error("❌ Error fetching mentor dashboard stats:", error);
      } 
    };

    if (user?.roles?.includes("Mentor")) {
      fetchMentorDashboardStats();
    } else if (user) {
      // ✅ clear old mentor-specific stats
      setMentorDashboardStats({});
    }
  }, [user]);


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
        
        if (hasMentorRole) {
          response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/getRecentMentorEvaluations`, {
            withCredentials: true,
          });
        } else {
          setmentorEvaluations([]); // clear any old data
          return;
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

        console.log("✅ Post Data:", formattedData); // Debugging
        setmentorEvaluations(formattedData);
      } catch (error) {
        console.error("❌ Error fetching evaluations:", error);
      } finally {
        setIsLoadingEvaluations(false);
      }
    };

    // ✅ Add user to the dependency array to re-run when user data is available
    if (user) {
      fetchEvaluations();
    }
    fetchEvaluations();
  }, [user]);

  useEffect(() => {
    const fetchUpcomingSchedule = async () => {
      try {
        setIsLoadingEvaluations(true);

        let response;
        
        if (hasMentorRole) {
          response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/getUpcomingSchedulesForMentor`, {
            withCredentials: true,
          });
        } else {
          console.log("User is not a Mentor → skipping mentor evaluations fetch.");
          setmentorEvaluations([]); // clear any old data
          return;
        }

        setupcomingSchedules(response.data);
      } catch (error) {
        console.error("❌ Error fetching evaluations:", error);
      } finally {
        setIsLoadingEvaluations(false);
      }
    };

    // ✅ Add user to the dependency array
    if (user) {
      fetchUpcomingSchedule();
    }
  }, [user]);

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

      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/approveMentorship`, {
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

      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/declineMentorship`, {
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
      renderCell: (params) => (
        <Typography
          variant="body2"
          sx={{
            whiteSpace: "normal",
            wordBreak: "break-word",
            lineHeight: 1.4,
            width: "100%",
          }}
        >
          {params.value}
        </Typography>
      ),
    },
    {
      field: "date",
      headerName: "Scheduled Date",
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Typography
          variant="body2"
          sx={{
            whiteSpace: "normal",
            wordBreak: "break-word",
            lineHeight: 1.4,
            width: "100%",
          }}
        >
          {params.value}
        </Typography>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      flex: 1,
      minWidth: 150,
      renderCell: (params) => (
        <Box
          sx={{
            width: "100%",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Chip
            label={params.value}
            color={
              params.value === "Pending" ? "warning" : colors.greenAccent[600]
            }
            sx={{ width: "fit-content" }}
          />
        </Box>
      ),
    },
    {
      field: "actions",
      headerName: "Action",
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Box
          sx={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Button
            variant="contained"
            sx={{
              backgroundColor: colors.greenAccent[500],
              "&:hover": { backgroundColor: colors.greenAccent[600] },
            }}
            onClick={() => handleAcceptClick(params.row)}
          >
            Accept
          </Button>
          <Button
            variant="contained"
            sx={{
              backgroundColor: colors.redAccent[500],
              "&:hover": { backgroundColor: colors.redAccent[600] },
            }}
            onClick={() => handleDeclineClick(params.row)}
          >
            Decline
          </Button>
        </Box>
      ),
    },
  ];

  const upcomingAcceptedSchedColumn = [
    {
      field: "sessionDetails",
      headerName: "Mentoring Session Information",
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Typography
          variant="body2"
          sx={{
            whiteSpace: "normal",
            wordBreak: "break-word",
            lineHeight: 1.4,
            width: "100%",
          }}
        >
          {params.value}
        </Typography>
      ),
    },
    {
      field: "date",
      headerName: "Scheduled Date",
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Typography
          variant="body2"
          sx={{
            whiteSpace: "normal",
            wordBreak: "break-word",
            lineHeight: 1.4,
            width: "100%",
          }}
        >
          {params.value}
        </Typography>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      width: 150,
      renderCell: (params) => {
        let color = "default";
        if (params.value === "Pending SE") color = "warning";
        if (params.value === "Accepted") color = "success";
        if (params.value === "Declined") color = "error";
        if (params.value === "Evaluated") color = "info";
        if (params.value === "Completed") color = "primary";

        return <Chip label={params.value} color={color} />;
      },
    },
    {
      field: "zoom",
      headerName: "Zoom Link",
      flex: 1,
      minWidth: 150,
      renderCell: (params) => (
        params.value && params.value !== "N/A" ? (
          <a
            href={params.value}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: "none" }}
          >
            <Chip label="Join" color="primary" clickable />
          </a>
        ) : (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            N/A
          </Typography>
        )
      ),
    },
  ];

  // If will double check if this is for LSEED only
  //   useEffect(() => {
  //   const fetchFlaggedSE = async () => {
  //     try {
  //       let response;
        
  //       // ✅ REVISED: Check both the user's role AND the active view
  //       if (isCoordinatorView && user?.roles?.some(role => role?.startsWith("LSEED"))) {
  //         const res = await fetch("http://localhost:4000/api/get-program-coordinator", {
  //           method: "GET",
  //           credentials: "include",
  //         });
  //         const data = await res.json();
  //         const program = data[0]?.name;

  //         response = await fetch(
  //           `http://localhost:4000/api/flagged-ses?program=${program}`
  //         );
  //         const data = await response.json();
  //         if (Array.isArray(data)) {
  //           const formattedSEs = data.map((se) => ({
  //             id: se.se_id,
  //             seName: se.team_name,
  //             averageScore: se.avg_rating || 0,
  //             lastEvaluated: se.evaluation_status,
  //           }));
  //           setLowPerformingSEs(formattedSEs);
  //         } else {
  //           console.error("❌ Invalid mentor schedule format:", data);
  //         }
  //       }
  //     } catch (error) {
  //       console.error("❌ Error fetching mentor schedules:", error);
  //       setLowPerformingSEs([]);
  //     }
  //   };
    
  //   // ✅ Add isCoordinatorView to the dependency array
  //   if (user) {
  //       fetchFlaggedSE();
  //   }
  // }, [user, isCoordinatorView]); // ✅ Add isCoordinatorView here

  //DEBUG::

  useEffect(() => {
    const fetchFlaggedSE = async () => {
      try {
        let response;

        if (isCoordinator) {
          const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/get-program-coordinator`, {
            method: "GET",
            credentials: "include", // Required to send session cookie
          });
          const data = await res.json();
          const program = data[0]?.name;

          response = await fetch(
            `${process.env.REACT_APP_API_BASE_URL}/api/flagged-ses?program=${program}`
          );
        } else {
          response = await fetch(
            `${process.env.REACT_APP_API_BASE_URL}/api/flagged-ses`
          );
        }
        const data = await response.json(); // No need for .json() with axios

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
        let response;

        if (isCoordinator) {
          const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/get-program-coordinator`, {
            method: "GET",
            credentials: "include", // Required to send session cookie
          });

          const data = await res.json();
          const program = data[0]?.name;

          response = await fetch(
            `${process.env.REACT_APP_API_BASE_URL}/api/pending-schedules?program=${program}`
          );
        }
        else {
          response = await fetch(
            `${process.env.REACT_APP_API_BASE_URL}/api/pending-schedules`
          );
        }
        const data = await response.json();

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

    if (user) {
      fetchMentorSchedules();
    }
  }, [user]);

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
        `${process.env.REACT_APP_API_BASE_URL}/getEvaluationDetails`,
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
        let response;
        
        if (isCoordinator) {
          const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/get-program-coordinator`, {
            method: "GET",
            credentials: "include", // Required to send session cookie
          });

          const data = await res.json();
          const program = data[0]?.name;

          response = await fetch(
            `${process.env.REACT_APP_API_BASE_URL}/api/evaluation-stats?program=${program}`
          );
        }
        else {
          response = await fetch(
            `${process.env.REACT_APP_API_BASE_URL}/api/evaluation-stats`
          );
        }
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

    if (user) {
      fetchEvaluationStats();
    }
  }, [user]);

  const acknowledgedPercentage =
    evaluations.total > 0
      ? ((evaluations.acknowledged / evaluations.total) * 100).toFixed(1) + "%"
      : "0%";

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true); // ✅ Set loading state before fetching

        let response;
        if (isCoordinator) {
          const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/get-program-coordinator`, {
            method: "GET",
            credentials: "include", // Required to send session cookie
          });
          const data = await res.json();
          const program = data[0]?.name;

          response = await fetch(
          `${process.env.REACT_APP_API_BASE_URL}/api/dashboard-stats?program=${program}`
          );
        }
        else {
          response = await fetch(
            `${process.env.REACT_APP_API_BASE_URL}/api/dashboard-stats`
          );
        }
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false); // ✅ Ensure loading state is reset
      }
    };

    if (user) {
      fetchDashboardStats();
    }
  }, [user]);

  useEffect(() => {
    const fetchSocialEnterprises = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_BASE_URL}/getAllSocialEnterprisesWithMentorship`
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

  console.log("View: ", isCoordinatorView)

  return (
    <Box m="20px">
        {/* HEADER and TOGGLE SWITCH */}
        <Box display="flex" justifyContent="space-between" alignItems="center">
            <Header
                title={
                    isCoordinatorView
                        ? "LSEED Dashboard"
                        : "Mentor Dashboard"
                }
                subtitle={
                    isCoordinatorView
                        ? "Welcome to LSEED Dashboard"
                        : "Welcome to Mentor Dashboard"
                }
            />
            {/* ⭐️ STEP 4: Render the toggle switch only if the user has both roles
            {hasBothRoles && (
              <FormControlLabel
                control={
                  <Switch
                    checked={isMentorView}
                    onChange={toggleView}
                    color="success"
                  />
                }
                label={isMentorView ? "Mentor View" : "LSEED Coordinator View"}
                labelPlacement="start"
              />
            )} */}
        </Box>

        {/* --- */}

        {/* CONDITIONAL RENDERING OF DASHBOARD LAYOUTS */}
        {isCoordinatorView ? (
            // === LSEED-COORDINATOR VIEW LAYOUT ===
            <>
                <Box
                    display="grid"
                    gridTemplateColumns="repeat(12, 1fr)"
                    gridAutoRows="140px"
                    gap="20px"
                >
                    {/* StatBoxes for Coordinator View */}
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
                            increase={
                              isNaN(parseInt(stats?.mentorWithoutMentorshipCount[0]?.count) /
                                parseInt(stats?.mentorCountTotal[0]?.count))
                              ? "0%"
                              :
                              `${((parseInt(stats?.mentorWithoutMentorshipCount[0]?.count) /
                                    parseInt(stats?.mentorCountTotal[0]?.count)) *
                                    100
                                ).toFixed(2)}%`
                            }
                            icon={
                                <PersonIcon
                                    sx={{ color: colors.greenAccent[600], fontSize: "26px" }}
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
                            increase={
                              isNaN(parseInt(stats?.mentorWithMentorshipCount[0]?.count) /
                                parseInt(stats?.mentorCountTotal[0]?.count))
                                ? "0%" :
                                `${((parseInt(stats?.mentorWithMentorshipCount[0]?.count) /
                                      parseInt(stats?.mentorCountTotal[0]?.count)) *
                                  100
                              ).toFixed(2)}%`}
                            icon={
                                <PersonIcon
                                    sx={{ fontSize: "26px", color: colors.blueAccent[500] }}
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
                        label={
                          <Box sx={{ textAlign: "center" }}>
                            <Typography sx={{ fontSize: "20px", lineHeight: 1.2 }}>
                              {stats.totalSocialEnterprises}
                            </Typography>
                            <Typography sx={{ fontSize: "16px", lineHeight: 1.2 }}>
                              involved
                            </Typography>
                            <Typography
                              sx={{
                                fontSize: "16px",
                                lineHeight: 1.2,
                                wordBreak: "keep-all", // prevent mid-word breaks
                                whiteSpace: "nowrap",  // keep full phrase on one line
                              }}
                            >
                              {stats.totalSocialEnterprises === 1
                                ? "Social Enterprise"
                                : "Social Enterprises"}
                            </Typography>
                          </Box>
                        }
                        icon={
                          <BusinessIcon
                            sx={{ fontSize: "26px", color: colors.greenAccent[500] }}
                          />
                        }
                        sx={{
                          p: "10px",
                          backgroundColor: colors.primary[400],
                          color: colors.grey[100],
                          "& .MuiChip-icon": { color: colors.greenAccent[500] },
                          maxWidth: "200px", // more width to fit longer words
                          whiteSpace: "normal", // allow wrapping between lines
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

                    {/* SE Performance Trend Chart */}
                    <Box
                        gridColumn="span 12"
                        gridRow="span 3"
                        bgcolor={colors.primary[400]}
                        paddingTop={2}
                        paddingLeft={2}
                        paddingright={2}
                    >
                        <SEPerformanceTrendChart userRole={user?.roles} />
                    </Box>

                    {/* Left Section (Stat Boxes) */}
                    <Box
                        gridColumn="span 3"
                        gridRow="span 2"
                        display="grid"
                        gridTemplateRows="1fr 1fr"
                        gap={3}
                        borderRadius="8px"
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
                                width: "200px",
                                height: "200px",
                                maxWidth: "400px",
                                maxHeight: "300px",
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
                                marginBottom="15px"
                            >
                                SEs Requiring Immediate Attention
                            </Typography>
                            <Box
                                sx={{
                                    height: "400px",
                                    minHeight: "400px",
                                    backgroundColor: colors.primary[400],
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
                                    minHeight: "400px",
                                    backgroundColor: colors.primary[400],
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
                                {loading ? (
                                    <Typography>Loading...</Typography>
                                ) : mentorSchedules.length > 0 ? (
                                    <DataGrid
                                        rows={mentorSchedules.map((schedule) => ({
                                            id: schedule.mentoring_session_id,
                                            sessionDetails: `Mentoring Session for ${
                                                schedule.team_name || "Unknown SE"
                                            } with Mentor ${
                                                schedule.mentor_name || "Unknown Mentor"
                                            }`,
                                            date: `${schedule.mentoring_session_date}, ${schedule.mentoring_session_time}` || "N/A",
                                            time: schedule.mentoring_session_time || "N/A",
                                            zoom: schedule.zoom_link || "N/A",
                                            mentorship_id: schedule.mentorship_id,
                                            status: schedule.status || "Pending",
                                        }))}
                                        sx={{
                                          "& .MuiDataGrid-cell": {
                                            display: "flex",
                                            alignItems: "center",
                                            paddingTop: "12px",
                                            paddingBottom: "12px",
                                          },
                                          "& .MuiDataGrid-cellContent": {
                                            whiteSpace: "normal",
                                            wordBreak: "break-word",
                                          },
                                        }}
                                        getRowHeight={() => 'auto'}
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
                                    backgroundColor: colors.blueAccent[800],
                                    color: colors.grey[100],
                                    "&:hover": {
                                        backgroundColor: colors.blueAccent[900],
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
                                    backgroundColor: colors.blueAccent[600],
                                    color: colors.grey[100],
                                    "&:hover": {
                                        backgroundColor: colors.blueAccent[700],
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
                                    backgroundColor: colors.greenAccent[600],
                                    color: colors.grey[100],
                                    "&:hover": {
                                        backgroundColor: colors.greenAccent[800],
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
                                marginBottom="15px"
                            >
                                Mentorships
                            </Typography>
                            <Box
                                sx={{
                                    height: "400px",
                                    minHeight: "400px",
                                    backgroundColor: colors.primary[400],
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
        ) : (
            // =========================
            // === MENTOR VIEW LAYOUT ===
            // =========================
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
                    flex="1 1 22%"
                    backgroundColor={colors.primary[400]}
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    p="20px"
                  >
                    <AssignmentTurnedInOutlinedIcon sx={{ fontSize: 40, color: colors.greenAccent[500], mb: 1 }} />
                    <Typography variant="h4" fontWeight="bold" color={colors.grey[100]}>
                      {mentorDashboardStats?.totalEvalMade ?? 0}
                    </Typography>
                    <Typography variant="subtitle2" color={colors.grey[300]}>
                      Total Evaluations Submitted
                    </Typography>
                  </Box>

                  {/* Average Rating Given to SEs */}
                  <Box
                    flex="1 1 22%"
                    backgroundColor={colors.primary[400]}
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    p="20px"
                  >
                    <Star sx={{ fontSize: 40, color: colors.blueAccent[500], mb: 1 }} />
                    <Typography variant="h4" fontWeight="bold" color={colors.grey[100]}>
                      {(mentorDashboardStats?.avgRatingGiven ?? 0).toFixed(2)}
                    </Typography>
                    <Typography variant="subtitle2" color={colors.grey[300]}>
                      Average Rating Given to SEs
                    </Typography>
                  </Box>

                  {/* Most Common Rating */}
                  <Box
                    flex="1 1 22%"
                    backgroundColor={colors.primary[400]}
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    p="20px"
                  >
                    <Star sx={{ fontSize: 40, color: colors.redAccent[500], mb: 1 }} />
                    <Typography variant="h4" fontWeight="bold" color={colors.grey[100]}>
                      {mentorDashboardStats?.mostCommonRating ?? 0}
                    </Typography>
                    <Typography variant="subtitle2" color={colors.grey[300]}>
                      Most Common Rating
                    </Typography>
                  </Box>

                  {/* Social Enterprises Handled */}
                  <Box
                    flex="1 1 22%"
                    backgroundColor={colors.primary[400]}
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    p="20px"
                  >
                    <Diversity2OutlinedIcon sx={{ fontSize: 40, color: colors.blueAccent[500], mb: 1 }} />
                    <Typography variant="h4" fontWeight="bold" color={colors.grey[100]}>
                      {mentorDashboardStats?.mentorshipsCount ?? 0}
                    </Typography>
                    <Typography variant="subtitle2" color={colors.grey[300]}>
                      Social Enterprises Handled
                    </Typography>
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
                    <Box
                        sx={{
                            height: "400px",
                            minHeight: "400px",
                            backgroundColor: colors.primary[400],
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
                        {loading ? (
                            <Typography>Loading...</Typography>
                        ) : upcomingSchedules.length > 0 ? (
                            <DataGrid
                                rows={upcomingSchedules.map((schedule) => ({
                                    id: schedule.mentoring_session_id,
                                    sessionDetails: `Mentoring Session for ${
                                        schedule.team_name || "Unknown SE"
                                    } with Mentor ${
                                        schedule.mentor_name || "Unknown Mentor"
                                    }`,
                                    date: `${schedule.mentoring_session_date}, ${schedule.mentoring_session_time}` || "N/A",
                                    time: schedule.mentoring_session_time || "N/A",
                                    zoom: schedule.zoom_link || "N/A",
                                    mentorship_id: schedule.mentorship_id,
                                    status: schedule.status || "Pending",
                                }))}
                                sx={{
                                  "& .MuiDataGrid-cell": {
                                    display: "flex",
                                    alignItems: "center",
                                    paddingTop: "12px",
                                    paddingBottom: "12px",
                                  },
                                  "& .MuiDataGrid-cellContent": {
                                    whiteSpace: "normal",
                                    wordBreak: "break-word",
                                  },
                                }}
                                getRowHeight={() => 'auto'}
                                columns={upcomingAcceptedSchedColumn}
                                pageSize={5}
                                rowsPerPageOptions={[5, 10]}
                            />
                        ) : (
                            <Typography>No pending schedules available.</Typography>
                        )}
                    </Box>
                </Box>
            </>
        )}

        {/* --- */}

        {/* COMMON DIALOGS AND SNACKBARS (rendered outside the conditional logic) */}
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
                        "&:hover": { backgroundColor: "#f0f0f0" },
                    }}
                >
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    </Box>
);
};

export default Dashboard;

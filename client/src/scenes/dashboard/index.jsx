import { Box, Button, IconButton, Typography, useTheme, Chip, Snackbar, Alert } from "@mui/material";
import { tokens } from "../../theme";
import { mockTransactions } from "../../sampledata/mockData";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import EmailIcon from "@mui/icons-material/Email";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import AcknowledgmentChart from "../../components/AcknowledgmentChart";
import TrafficIcon from "@mui/icons-material/Traffic";
import Header from "../../components/Header";
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
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import axios from "axios";

const Dashboard = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [currentEvents, setCurrentEvents] = useState([]);
  const [lowPerformingSEs, setLowPerformingSEs] = useState([]);
  const [mentorSchedules, setMentorSchedules] = useState([]);
  const [socialEnterprises, setSocialEnterprises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [evaluations, setEvaluations] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
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

  const alertColumns = [
    { field: "seName", headerName: "SE Name", flex: 2 },
    { field: "averageScore", headerName: "Avg Score", flex: 1 },
    { field: "lastEvaluated", headerName: "Last Evaluated", flex: 2 },
    { 
      field: "actions", 
      headerName: "Actions", 
      flex: 2,
      renderCell: (params) => (
        <Button variant="contained" color="error" onClick={() => handleAction(params.row.id)}>
          Take Action
        </Button>
      )
    }
  ];

  const handleAcceptClick = async (schedule) => {
    try {
      const { 
        id: mentoring_session_id, 
        mentorship_id, 
        date: mentorship_date, 
        time: mentorship_time, 
        zoom: zoom_link 
      } = schedule; 
  
      console.log("Approving mentorship with details:", {
        mentoring_session_id,
        mentorship_id,
        mentorship_date,
        mentorship_time,
        zoom_link
      });
  
      const response = await fetch("http://localhost:4000/approveMentorship", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mentoring_session_id, mentorship_id, mentorship_date, mentorship_time, zoom_link }), 
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
    { field: "sessionDetails", headerName: "Mentoring Session Information", flex: 1, minWidth: 200 },
    { field: "date", headerName: "Scheduled Date", flex: 1, minWidth: 200 },
    { 
      field: "status", 
      headerName: "Status", 
      flex: 1, 
      minWidth: 150,
      renderCell: (params) => (
        <Chip 
          label={params.value} 
          color={params.value === "Pending" ? "warning" : "success"} 
        />
      ) 
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
            style={{ backgroundColor: colors.greenAccent[500], marginRight: "8px" }}
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
    }
  ];

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
    console.log("Taking action on SE:", id);
    // Implement logic (e.g., send support recommendation)
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

  useEffect(() => {
    const fetchEvaluationStats = async () => {
      try {
        const response = await fetch("http://localhost:4000/api/evaluation-stats");
        const data = await response.json();
        
        console.log("Evaluation Stats Data:", data); // Log API response
        setEvaluations({ 
          total: data[0]?.totalevaluations ?? 0, 
          acknowledged: data[0]?.acknowledgedevaluations ?? 0 
        });
  
        console.log("Updated Evaluations State:", {
          total: data.totalevaluations,
          acknowledged: data.acknowledgedevaluations
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
        <Header title="DASHBOARD" subtitle="Welcome to your dashboard" />
      </Box>

      {/* GRID & CHARTS */}
      <Box
        display="grid"
        gridTemplateColumns="repeat(12, 1fr)"
        gridAutoRows="140px"
        gap="20px"
      >
        {/* Unassigned Mentors */}
        <Box gridColumn="span 3" display="flex" alignItems="center" justifyContent="center" bgcolor={colors.primary[400]}>
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
            icon={<EmailIcon sx={{ color: colors.greenAccent[600], fontSize: "26px" }} />}
          />
        </Box>

        {/* Assigned Mentors */}
        <Box gridColumn="span 3" display="flex" alignItems="center" justifyContent="center" bgcolor={colors.primary[400]}>
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
            icon={<PointOfSaleIcon sx={{ fontSize: "26px", color: colors.blueAccent[500] }} />}
          />
        </Box>

        {/* Total Social Enterprises */}
        <Box gridColumn="span 3" display="flex" alignItems="center" justifyContent="center" bgcolor={colors.primary[400]}>
          <StatBox title={stats.totalSocialEnterprises} subtitle="Total SEs" progress={1} increase="+0%" icon={<PersonAddIcon sx={{ color: colors.greenAccent[600], fontSize: "26px" }} />} />
        </Box>

        {/* Total Programs */}
        <Box gridColumn="span 3" display="flex" alignItems="center" justifyContent="center" bgcolor={colors.primary[400]}>
          <StatBox title={stats.totalPrograms} subtitle="No. of Programs" progress={1} increase="+0%" icon={<TrafficIcon sx={{ color: colors.greenAccent[600], fontSize: "26px" }} />} />
        </Box>

        {/* SE Performance Trend Chart */}
        <Box gridColumn="span 12" gridRow="span 3" bgcolor={colors.primary[400]} p={2}>
          <SEPerformanceTrendChart />
        </Box>

        {/* Left Section (Stat Boxes) */}
        <Box gridColumn="span 4" gridRow="span 2" display="grid" gridTemplateRows="1fr 1fr" gap={2} bgcolor={colors.primary[400]}>
          {/* Total Evaluations */}
          <Box 
            bgcolor={colors.primary[400]} 
            display="flex" 
            alignItems="center" 
            justifyContent="center" 
            p={2} 
            borderRadius="8px"
          >
            <StatBox 
              title={evaluations.total} 
              subtitle="Total Evaluations" 
              icon={<PendingActionsIcon sx={{ fontSize: "26px", color: colors.blueAccent[500] }} />} 
            />
          </Box>

          {/* Acknowledged Evaluations */}
          <Box 
            bgcolor={colors.primary[400]} 
            display="flex" 
            alignItems="center" 
            justifyContent="center" 
            p={2} 
            borderRadius="8px"
          >
            <StatBox 
              title={evaluations.acknowledged} 
              subtitle="Acknowledged Evaluations" 
              increase={acknowledgedPercentage} 
              icon={<AssignmentTurnedInIcon sx={{ fontSize: "26px", color: colors.greenAccent[500] }} />} 
            />
          </Box>
        </Box>

        {/* Right Section (Chart) */}
        <Box 
          gridColumn="span 8" 
          gridRow="span 2" 
          bgcolor={colors.primary[400]} 
          p={2} 
          display="flex" 
          alignItems="center" 
          justifyContent="center" 
        >
          <AcknowledgmentChart style={{ width: "100%", height: "100%" }} />
        </Box>
        
        {/* Alert & Schedule Sections */}
        <Box 
          gridColumn="span 12" 
          gridRow="span 4" // Increase row span to give it more space
          display="grid" 
          gridTemplateColumns="repeat(12, 1fr)" 
          gap="20px" 
          marginTop="20px" // Increase margin to avoid overlap
        >
          
          {/* SEs Requiring Immediate Attention 🚨 */}
          <Box gridColumn="span 6" bgcolor={colors.primary[400]} p={2} borderRadius="8px">
            <Typography variant="h4" fontWeight="bold" color={colors.redAccent[500]}>
              SEs Requiring Immediate Attention 🚨
            </Typography>
            <Box sx={{
              height: "auto",
              "& .MuiDataGrid-root": { border: "none" },
              "& .MuiDataGrid-cell": { borderBottom: "none" },
              "& .MuiDataGrid-columnHeaders": { backgroundColor: colors.blueAccent[700] },
              "& .MuiDataGrid-virtualScroller": { backgroundColor: colors.primary[400] },
              "& .MuiDataGrid-footerContainer": { borderTop: "none", backgroundColor: colors.blueAccent[700], color: colors.grey[100] },
            }}>
              {loading ? <Typography>Loading...</Typography> : <DataGrid rows={lowPerformingSEs} columns={alertColumns} />}
            </Box>
          </Box>

          {/* Pending Mentoring Schedules 🕒 */}
          <Box gridColumn="span 6" bgcolor={colors.primary[400]} p={2} borderRadius="8px">
            <Typography variant="h4" fontWeight="bold" color={colors.blueAccent[500]}>
              Pending Mentoring Schedules 🕒
            </Typography>
            <Box
              sx={{
                height: "auto",
                "& .MuiDataGrid-root": { border: "none" },
                "& .MuiDataGrid-cell": { borderBottom: "none" },
                "& .MuiDataGrid-columnHeaders": { backgroundColor: colors.blueAccent[700] },
                "& .MuiDataGrid-virtualScroller": { backgroundColor: colors.primary[400] },
                "& .MuiDataGrid-footerContainer": { borderTop: "none", backgroundColor: colors.blueAccent[700], color: colors.grey[100] },
              }}
            >
              {loading ? (
                <Typography>Loading...</Typography>
              ) : mentorSchedules.length > 0 ? (
                  <DataGrid
                    rows={mentorSchedules.map((schedule) => ({
                      id: schedule.mentoring_session_id, // Unique ID
                      sessionDetails: `Mentoring Session for ${schedule.team_name || "Unknown SE"} with Mentor ${schedule.mentor_name || "Unknown Mentor"}`,
                      date: `${schedule.mentoring_session_date}, ${schedule.mentoring_session_time}`  || "N/A",
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

        {/* Mentorships Section */}
        <Box gridColumn="span 12" gridRow="span 3" display="grid" gridTemplateColumns="repeat(12, 1fr)" gap="20px">
          <Typography variant="h3" fontWeight="bold" color={colors.greenAccent[500]} gridColumn="span 12">
            Mentorships
          </Typography>
          <Box gridColumn="span 12" sx={{
            height: "auto",
            "& .MuiDataGrid-root": { border: "none" },
            "& .MuiDataGrid-cell": { borderBottom: "none" },
            "& .name-column--cell": { color: colors.greenAccent[300] },
            "& .MuiDataGrid-columnHeaders, & .MuiDataGrid-columnHeader": { backgroundColor: colors.blueAccent[700] + " !important" },
            "& .MuiDataGrid-virtualScroller": { backgroundColor: colors.primary[400] },
            "& .MuiDataGrid-footerContainer": { borderTop: "none", backgroundColor: colors.blueAccent[700], color: colors.grey[100] },
          }}>
            {loading ? <Typography>Loading...</Typography> : <DataGrid rows={socialEnterprises} columns={columns} autoHeight />}
          </Box>
        </Box>
      </Box>
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
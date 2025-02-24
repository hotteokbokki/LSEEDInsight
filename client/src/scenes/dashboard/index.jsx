import { Box, Button, IconButton, Typography, useTheme } from "@mui/material";
import { tokens } from "../../theme";
import { mockTransactions } from "../../sampledata/mockData";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import EmailIcon from "@mui/icons-material/Email";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import TrafficIcon from "@mui/icons-material/Traffic";
import Header from "../../components/Header";
import LineChart from "../../components/LineChart";
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

const Dashboard = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [currentEvents, setCurrentEvents] = useState([]);
  const [unassignedMentors, setUnassignedMentors] = useState(0);
  const [totalMentors, setTotalMentors] = useState(1); // Avoid division by zero
  const [topPerformers, setTopPerformers] = useState([]);
  const [socialEnterprises, setSocialEnterprises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    unassignedMentors: 0,
    assignedMentors: 0,
    totalSocialEnterprises: 0,
    totalPrograms: 0,
    previousUnassignedMentors: 0,
  });
  const [percentageIncrease, setPercentageIncrease] = useState("0%");
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
    const fetchTopPerformers = async () => {
        try {
            const response = await fetch("http://localhost:4000/api/top-se-performance");
            const data = await response.json();

            console.log("Fetched Data:", data); // ✅ Debugging step

            if (!Array.isArray(data) || !data.length) {
                console.warn("Unexpected response:", data);
                setTopPerformers([]); // Always set an array
                return;
            }
          
            setTopPerformers(data);
        } catch (error) {
            console.error("Error fetching top SE performance:", error);
            setTopPerformers([]);
        }
    };

    fetchTopPerformers();
}, []);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const response = await fetch("http://localhost:4000/api/dashboard-stats");
        const data = await response.json();

        setStats(data);

        // ✅ Calculate percentage increase for unassigned mentors
        if (data.previousUnassignedMentors > 0) {
          const change = ((data.unassignedMentors - data.previousUnassignedMentors) / data.previousUnassignedMentors) * 100;
          setPercentageIncrease(`${change.toFixed(1)}%`);
        } else if (data.unassignedMentors > 0) {
            setPercentageIncrease("100%"); // First-time assignments
        } else {
            setPercentageIncrease("0%");
        }
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
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

  const formatChartData = (data) => {
    const groupedData = {};

    // Step 1: Get Today's Date & Next 60 Days
    const today = new Date();
    const next60Days = new Date();
    next60Days.setDate(today.getDate() + 60);

    // Step 2: Generate Only Assigned X-Axis Range (Fixed)
    const allMonths = [];
    let current = new Date(today.getFullYear(), today.getMonth(), 1); // Start at first day of this month
    while (current <= next60Days) {
        allMonths.push(current.toISOString().substring(0, 7)); // Format "YYYY-MM"
        current.setMonth(current.getMonth() + 1); // Move to next month
    }

    // Step 3: Initialize SEs and Assign a Fixed X-Axis Range
    data.forEach((se) => {
        if (!se || !se.social_enterprise || !se.month) return; // ✅ Avoid undefined values

        if (!groupedData[se.social_enterprise]) {
            groupedData[se.social_enterprise] = allMonths.map((month) => ({ x: month, y: 0 }));
        }

        // ✅ Ensure groupedData[se.social_enterprise] exists before mapping
        if (Array.isArray(groupedData[se.social_enterprise])) {
            groupedData[se.social_enterprise] = groupedData[se.social_enterprise].map((point) =>
                point.x === se.month.substring(0, 7) ? { x: point.x, y: parseFloat(se.avg_rating) || 0 } : point
            );
        }
    });

    // Step 4: Convert to LineChart Format
    return Object.keys(groupedData).map((seName) => ({
        id: seName,
        color: `hsl(${Math.random() * 360}, 70%, 50%)`, // Assign a unique color
        data: groupedData[seName] || [], // ✅ Ensure data is an array
    }));
};

// Apply formatting to fetched data
const chartData = formatChartData(topPerformers);

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
        <Box gridColumn="span 3" backgroundColor={colors.primary[400]} display="flex" alignItems="center" justifyContent="center">
          <StatBox
            title={stats.unassignedMentors}
            subtitle="Unassigned Mentors"
            progress={stats.unassignedMentors / (stats.unassignedMentors + stats.assignedMentors)}
            increase={percentageIncrease}
            icon={<EmailIcon sx={{ color: colors.greenAccent[600], fontSize: "26px" }} />}
          />
        </Box>

        {/* Assigned Mentors */}
        <Box gridColumn="span 3" backgroundColor={colors.primary[400]} display="flex" alignItems="center" justifyContent="center">
          <StatBox
            title={stats.assignedMentors}
            subtitle="Assigned Mentors"
            progress={stats.assignedMentors / (stats.unassignedMentors + stats.assignedMentors)}
            increase="+0%" // Static for now, can be dynamically calculated
            icon={<PointOfSaleIcon sx={{ color: colors.greenAccent[600], fontSize: "26px" }} />}
          />
        </Box>

        {/* Total Social Enterprises */}
        <Box gridColumn="span 3" backgroundColor={colors.primary[400]} display="flex" alignItems="center" justifyContent="center">
          <StatBox
            title={stats.totalSocialEnterprises}
            subtitle="Total SEs"
            progress={1}
            increase="+0%" // Static for now
            icon={<PersonAddIcon sx={{ color: colors.greenAccent[600], fontSize: "26px" }} />}
          />
        </Box>

        {/* Total Programs */}
        <Box gridColumn="span 3" backgroundColor={colors.primary[400]} display="flex" alignItems="center" justifyContent="center">
          <StatBox
            title={stats.totalPrograms}
            subtitle="No. of Programs"
            progress={1}
            increase="+0%" // Static for now
            icon={<TrafficIcon sx={{ color: colors.greenAccent[600], fontSize: "26px" }} />}
          />
        </Box>


        {/* ROW 2 */}
        <Box
          gridColumn="span 12"
          gridRow="span 2"
          backgroundColor={colors.primary[400]}
        >
          <Box
            mt="25px"
            p="0 30px"
            display="flex "
            justifyContent="space-between"
            alignItems="center"
          >
            <Box>
              <Typography
                variant="h5"
                fontWeight="600"
                color={colors.grey[100]}
              >
                GEMS
              </Typography>
              <Typography
                variant="h3"
                fontWeight="bold"
                color={colors.greenAccent[500]}
              >
                Top Performer
              </Typography>
            </Box>
          </Box>
          <Box height="250px" m="-20px 0 0 0">
              <LineChart isDashboard={true} data={chartData} />
          </Box>
        </Box>

        {/* ROW 3 */}
        <Box
          gridColumn="span 12"
          gridRow="span 2"
          display="grid"
          gridTemplateColumns="repeat(12, 1fr)"
          gap="20px"
        >
          {/* Left: Data Grid */}
          <Box
            gridColumn="span 6"
            height="100%" // Match height to the parent's gridRow span
            sx={{
              "& .MuiDataGrid-root": {
                border: "none",
              },
              "& .MuiDataGrid-cell": {
                borderBottom: "none",
              },
              "& .name-column--cell": {
                color: colors.greenAccent[300],
              },
              "& .MuiDataGrid-columnHeaders": {
                backgroundColor: colors.blueAccent[700], // Header background color
                borderBottom: "none",
                color: colors.grey[100],
              },
              "& .MuiDataGrid-virtualScroller": {
                backgroundColor: colors.primary[400],
              },
              "& .MuiDataGrid-footerContainer": {
                borderTop: "none",
                backgroundColor: colors.blueAccent[700], // Footer background color
                color: colors.grey[100],
              },
            }}
          >
            {loading ? (
              <Typography>Loading...</Typography>
            ) : (
              <DataGrid rows={socialEnterprises} columns={columns} autoHeight />
            )}
          </Box>

          {/* Right: Calendar */}
          <Box
            gridColumn="span 6"
            backgroundColor={colors.primary[400]}
            display="flex"
            flexDirection="column"
            alignItems="stretch"
            justifyContent="stretch"
            height="100%" // Match height to the parent's gridRow span
          >
            <FullCalendar
              height="100%"
              plugins={[
                dayGridPlugin,
                timeGridPlugin,
                interactionPlugin,
                listPlugin,
              ]}
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay,listMonth",
              }}
              initialView="dayGridMonth"
              editable={true}
              selectable={true}
              selectMirror={true}
              dayMaxEvents={true}
              select={handleDateClick}
              eventClick={handleEventClick}
              eventsSet={(events) => setCurrentEvents(events)}
              initialEvents={[
                {
                  id: "12315",
                  title: "All-day event",
                  date: "2022-09-14",
                },
                {
                  id: "5123",
                  title: "Timed event",
                  date: "2022-09-28",
                },
              ]}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;

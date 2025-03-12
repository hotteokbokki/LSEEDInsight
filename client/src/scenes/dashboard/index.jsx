import { Box, Button, IconButton, Typography, useTheme } from "@mui/material";
import { tokens } from "../../theme";
import { mockTransactions } from "../../sampledata/mockData";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import EmailIcon from "@mui/icons-material/Email";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
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
        <Box
          gridColumn="span 3"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <StatBox
            title={stats?.mentorWithoutMentorshipCount[0]?.count} // Render dynamic value
            subtitle="Unassigned Mentors"
            progress={
              parseInt(stats?.mentorWithoutMentorshipCount[0]?.count) /
              parseInt(stats?.mentorCountTotal[0]?.count)
            } // Calculate percentage of unassigned mentors
            increase={`${(
              (parseInt(stats?.mentorWithoutMentorshipCount[0]?.count) /
                parseInt(stats?.mentorCountTotal[0]?.count)) *
              100
            ).toFixed(2)}%`} // Calculate percentage of mentors with mentorship
            icon={
              <EmailIcon
                sx={{ color: colors.greenAccent[600], fontSize: "26px" }}
              />
            }
          />
        </Box>

        <Box
          gridColumn="span 3"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <StatBox
            title={stats?.mentorWithMentorshipCount[0]?.count}
            subtitle="Assigned Mentors"
            progress={
              parseInt(stats?.mentorWithMentorshipCount[0]?.count) /
              parseInt(stats?.mentorCountTotal[0]?.count)
            } // Calculate percentage filled
            increase={`${(
              (parseInt(stats?.mentorWithMentorshipCount[0]?.count) /
                parseInt(stats?.mentorCountTotal[0]?.count)) *
              100
            ).toFixed(2)}%`} // Calculate percentage of mentors with mentorship
            icon={
              <PointOfSaleIcon
                sx={{ fontSize: "26px", color: colors.blueAccent[500] }}
              />
            }
          />
        </Box>

        {/* Total Social Enterprises */}
        <Box
          gridColumn="span 3"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <StatBox
            title={stats.totalSocialEnterprises}
            subtitle="Total SEs"
            progress={1}
            increase="+0%" // Static for now
            icon={
              <PersonAddIcon
                sx={{ color: colors.greenAccent[600], fontSize: "26px" }}
              />
            }
          />
        </Box>

        {/* Total Programs */}
        <Box
          gridColumn="span 3"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <StatBox
            title={stats.totalPrograms}
            subtitle="No. of Programs"
            progress={1}
            increase="+0%" // Static for now
            icon={
              <TrafficIcon
                sx={{ color: colors.greenAccent[600], fontSize: "26px" }}
              />
            }
          />
        </Box>

        {/* SE Performance Trend*/}
        <Box
          gridColumn="span 12"
          gridRow="span 3"
          backgroundColor={colors.primary[400]}
          marginBottom="10px"
        >
          <SEPerformanceTrendChart />{" "}
          {/* ✅ Embed the SEPerformanceChart component here */}
        </Box>

        {/* ROW 3 */}
        <Box
          gridColumn="span 12"
          gridRow="span 3"
          display="grid"
          gridTemplateColumns="repeat(12, 1fr)"
          gap="20px"
          margintop="10px"
        >
          {/* Data Grid */}
          <Box
            gridColumn="span 12"
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
              "& .MuiDataGrid-columnHeaders, & .MuiDataGrid-columnHeader": {
                backgroundColor: colors.blueAccent[700] + " !important",
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
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;

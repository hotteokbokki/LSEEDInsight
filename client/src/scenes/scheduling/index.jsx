// Sample LSEED Insight Google Calendar
// https://calendar.google.com/calendar/u/0?cid=MWJlZDcwNTZhNzNhOGRhZGU0MjZkZjI2MzMyMTYzNDBjMDE3OWJhZGJmMjUyMGYyMjI0NmVlMTkyMzg2OTBiY0Bncm91cC5jYWxlbmRhci5nb29nbGUuY29t

import { tokens } from "../../theme";
import React, { useEffect, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { TimePicker } from "@mui/x-date-pickers";
import Calendar from "../../components/calendar";
import {
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Typography,
  Stack,
  Chip,
  Snackbar,
  TextField,
  Alert,
  useTheme,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers";
import { useAuth } from "../../context/authContext";
import Header from "../../components/Header";
import axios from "axios";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const Scheduling = ({ userRole }) => {
  const [openModal, setOpenModal] = useState(false);
  const [openSEModal, setOpenSEModal] = useState(false);
  const [mentors, setMentors] = useState([]);
  const [socialEnterprises, setSocialEnterprises] = useState([]);
  const [selectedSE, setSelectedSE] = useState(null);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [isLoading, setIsLoading] = useState(false);
  const [mentorshipDates, setMentorshipDates] = useState([]);
  const { user } = useAuth();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [selectedTime, setSelectedTime] = useState(dayjs().startOf("hour"));
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [zoomLink, setZoomLink] = useState("");
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [error, setError] = useState("");
  const handleRedirect = () =>
    window.open("https://calendar.google.com", "_blank");
  const handleOpenModal = () => setOpenModal(true);
  const handleCloseModal = () => setOpenModal(false);
  const handleOpenSEModal = () => {
    fetchSocialEnterprises();
    setOpenSEModal(true);
  };
  const handleCloseSEModal = () => setOpenSEModal(false);
  const handleSelectSE = (se) => setSelectedSE(se);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [mentorSchedules, setMentorSchedules] = useState([]);
  const [mentorHistory, setMentorHistory] = useState([]);

  const handleAcceptClick = async (schedule) => {
    try {
      const { id: mentoring_session_id, mentorship_id, mentorship_date, mentorship_time, zoom_link } = schedule; // Rename for clarity

      const response = await fetch("http://localhost:4000/approveMentorship", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mentoring_session_id, mentorship_id, mentorship_date, mentorship_time, zoom_link}), // Ensure backend expects this key
      });
  
      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(`Failed to approve mentorship: ${errorMessage}`);
      }
  
      console.log("Mentorship approved successfully");
  
      // Show success message
      setSnackbarOpen(true); // Ensure setSnackbarOpen is defined
  
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

  const handleStartTimeChange = (newStartTime) => {
    setStartTime(newStartTime);
    if (endTime && newStartTime && newStartTime.isAfter(endTime)) {
      setError("End time must be later than start time.");
      setEndTime(null);
    } else {
      setError("");
    }
  };

  const handleEndTimeChange = (newEndTime) => {
    if (newEndTime && startTime && newEndTime.isBefore(startTime)) {
      setError("End time must be later than start time.");
    } else {
      setError("");
      setEndTime(newEndTime);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedRowId(null);
  };

  const handleAccept = () => {
    console.log(`Accepted mentor schedule with ID: ${selectedRowId}`);
    handleCloseDialog();
  };

  const handleDecline = () => {
    console.log(`Declined mentor schedule with ID: ${selectedRowId}`);
    handleCloseDialog();
  };

  // Function to handle Snackbar close
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  useEffect(() => {
    const fetchMentorshipDates = async () => {
      try {
        console.log("mentor_id: ", user.id)
        const response = await axios.get(
          "http://localhost:4000/getMentorshipDates",
          {
            params: { mentor_id: user.id }, // Fetch mentorships for this mentor
          }
        );
        console.log("📅 Mentorship Dates:", response.data);
        setMentorshipDates(response.data || []);
      } catch (error) {
        console.error("Error fetching mentorship dates:", error);
        setMentorshipDates([]);
      }
    };

    fetchMentorshipDates();
  }, [user.id]); // Refetch when the user changes

  useEffect(() => {
    const fetchScheduleHistory = async () => {
      try {
        console.log("Fetching all mentor schedules...");
        const response = await axios.get("http://localhost:4000/api/mentorSchedules");
        console.log("📅 History Schedules:", response.data);
        setMentorHistory(response.data || []);
      } catch (error) {
        console.error("❌ Error fetching mentor schedules:", error);
        setMentorHistory([]);
      }
    };
  
    fetchScheduleHistory();
  }, []); // Runs once when the component mounts

  const rows = mentorshipDates.map((mentorship) => {
    const formattedDate = new Date(mentorship.mentoring_session_date).toLocaleDateString("en-US", {
      month: "long",
      day: "2-digit",
      year: "numeric",
    });
  
    return {
      id: mentorship.mentoring_session_id, // Unique identifier (session-based)
      team_name: mentorship.team_name || "N/A",
      mentor_name: mentorship.mentor_name || "N/A",
      program_name: mentorship.program_name || "N/A",
      mentoring_session_date: formattedDate,
      mentoring_session_time: mentorship.mentoring_session_time || "N/A",
      status: mentorship.status || "N/A",
      zoom_link: mentorship.zoom_link || "N/A",
    };
  });

  const historyRows = mentorHistory.map((mentorship) => {
    const formattedDate = new Date(mentorship.mentoring_session_date).toLocaleDateString("en-US", {
      month: "long",
      day: "2-digit",
      year: "numeric",
    });
  
    return {
      id: mentorship.mentoring_session_id, // Unique identifier (session-based)
      team_name: mentorship.team_name || "N/A",
      mentor_name: mentorship.mentor_name || "N/A",
      program_name: mentorship.program_name || "N/A",
      mentoring_session_date: formattedDate,
      mentoring_session_time: mentorship.mentoring_session_time || "N/A",
      status: mentorship.status || "N/A",
      zoom_link: mentorship.zoom_link || "N/A",
    };
  });

  const fetchSocialEnterprises = async () => {
    try {
      setIsLoading(true);

      console.log("Fetching SEs for Mentor ID:", user?.id);
      const response = await fetch(
        `http://localhost:4000/getMentorshipsbyID?mentor_id=${encodeURIComponent(
          user.id
        )}`
      );
      const data = await response.json();

      console.log("📥 Received Data in Scheduling:", data);

      if (!Array.isArray(data)) {
        console.error("Invalid data format:", data);
        setSocialEnterprises([]);
        return;
      }

      // Transform if needed (like in assess.js)
      const updatedSocialEnterprises = data.map((se) => ({
        id: se.id,
        mentor_id: se.mentor_id,
        se_id: se.se_id,
        team_name: se.se || "Unknown Team",
        program_name: se.program || "Unknown Program",
        sdg_name: se.sdgs || "No SDG Name",
      }));

      setSocialEnterprises(updatedSocialEnterprises);
    } catch (error) {
      console.error("❌ Error fetching social enterprises:", error);
    } finally {
      setIsLoading(false);
    }
  };

const handleConfirmDate = async () => {
  if (!selectedSE || !selectedDate) return;
  else if (!zoomLink) {
    alert("Please enter a valid Zoom link.");
    return;
  }

  try {
    setIsLoading(true);
    const formattedDate = selectedDate ? selectedDate.format("YYYY-MM-DD") : null;
    const formattedStartTime = startTime ? startTime.format("HH:mm") : null;
    const formattedEndTime = endTime ? endTime.format("HH:mm") : null;

    const response = await fetch("http://localhost:4000/updateMentorshipDate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mentorship_id: selectedSE.id,
        mentoring_session_date: formattedDate, // Match backend field name
        start_time: formattedStartTime, // Ensure this is properly formatted
        end_time: formattedEndTime, // Ensure this is properly formatted
        zoom_link: zoomLink,
      }),
    });

    if (!response.ok) throw new Error("Failed to update mentorship date");

    // Show success Snackbar
    setSnackbarOpen(true);

    // Close the dialog
    handleCloseSEModal();

    setTimeout(() => {
      window.location.reload();
    }, 500); // Adjust delay if needed
  } catch (error) {
    console.error("❌ Error updating mentorship date:", error);
  } finally {
    setIsLoading(false);
  }
};

  useEffect(() => {
    fetch("/auth/session-check", {
      method: "GET",
      credentials: "include", // ✅ Required for sending cookies
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => console.log("[Frontend] Session Check Response:", data))
      .catch((error) =>
        console.error("[Frontend] Session Check Error:", error)
      );
  }, []);

  useEffect(() => {
    const fetchMentorSchedules = async () => {
      try {
        const response = await axios.get(
          "http://localhost:4000/api/pending-schedules"
        );
        const data = response.data; // no need for .json() when using axios

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

    if (user.role === "LSEED") {
      console.log("✅ Fetching Mentor Schedules for LSEED User");
      fetchMentorSchedules();
    }
  }, [user.role]);

  return (
    <Box m="20px">
      {/* Header */}
      <Header
        title="Scheduling Matrix"
        subtitle={
          userRole === "LSEED"
            ? "View and Manage the schedule of the mentors"
            : "Find the Appropriate Schedule"
        }
      />

      {userRole === "Mentor" ? (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          gap={4}
          mt={2}
        >
          <Box
            width="80%"
            p={3}
            bgcolor={colors.primary[400]}
            display="flex"
            justifyContent="space-between"
          >
            <Button
              variant="contained"
              color="secondary"
              sx={{ fontSize: "20px", padding: "20px", width: "48%" }}
              onClick={handleRedirect}
            >
              Open LSEED Calendar
            </Button>
            <Button
              variant="contained"
              color="secondary"
              sx={{ fontSize: "20px", padding: "20px", width: "48%" }}
              onClick={handleOpenSEModal}
            >
              Schedule a Mentoring Session
            </Button>
          </Box>
        </Box>
      ) : (
        <Box mt={2}>
          <List>
            {mentors.map((mentor) => (
              <ListItem key={mentor.mentor_id}>
                <ListItemText primary={mentor.name} />
                <Button
                  variant="contained"
                  color={mentor.calendarlink ? "secondary" : "inherit"}
                  sx={{
                    fontSize: "16px",
                    padding: "10px",
                    backgroundColor: mentor.calendarlink
                      ? colors.primary[500]
                      : "#B0B0B0",
                    color: "white",
                    "&:hover": {
                      backgroundColor: mentor.calendarlink
                        ? colors.primary[700]
                        : "#A0A0A0",
                    },
                  }}
                  onClick={() =>
                    mentor.calendarlink &&
                    window.open(mentor.calendarlink, "_blank")
                  }
                  disabled={!mentor.calendarlink}
                >
                  {mentor.calendarlink
                    ? "View Calendar"
                    : "No Calendar Available"}
                </Button>
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      <Box mt={4}>
        <Typography variant="h6" gutterBottom>
          Mentor Scheduling Calendar
        </Typography>

        {/* ✅ Add Calendar Component Here */}
        <Calendar isDashboard={true} />
      </Box>

      {user.role === "LSEED" && (
        <Box mt={4} display="flex" flexDirection="column" gap={2}>
          {/* Mentor Schedules */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Pending Schedules
            </Typography>
            <Box
              sx={{
                height: 400,
                width: "100%",
                overflowX: "auto",
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
              {mentorSchedules.length > 0 ? (
                <DataGrid
                  rows={mentorSchedules.map((schedule) => ({
                    id: schedule.mentoring_session_id, // Use mentoring_session_id as unique ID
                    mentor_name: schedule.mentor_name || "Unknown Mentor",
                    mentorship_id: schedule.mentorship_id,
                    se_name: schedule.team_name || "Unknown SE", // Use team_name from SQL
                    mentorship_date: schedule.mentoring_session_date, // Already formatted in SQL
                    mentorship_time: schedule.mentoring_session_time, // Already formatted in SQL
                    telegramstatus: schedule.status || "Pending",
                    zoom_link: schedule.zoom_link || "N/A",
                  }))}
                  columns={[
                    { field: "mentor_name", headerName: "Mentor Name", flex: 1, minWidth: 200 },
                    { field: "se_name", headerName: "Social Enterprise", flex: 1, minWidth: 200 },
                    { field: "mentorship_date", headerName: "Mentoring Session Date", flex: 1, minWidth: 200 }, // Increased width for longer text format
                    { field: "mentorship_time", headerName: "Mentoring Session Time", flex: 1, minWidth: 150 },
                    { field: "telegramstatus", headerName: "Status", flex: 1, minWidth: 100 },
                    {
                      field: "zoom_link",
                      headerName: "Zoom Link",
                      flex: 1,
                      minWidth: 200,
                      renderCell: (params) => (
                        <a href={params.value} target="_blank" rel="noopener noreferrer">
                          {params.value !== "N/A" ? "Join Meeting" : "No Link"}
                        </a>
                      ),
                    },
                    {
                      field: "action",
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
                    },
                  ]}
                  pageSize={5}
                  rowsPerPageOptions={[5, 10]}
                />
              ) : (
                <p>No schedules available.</p>
              )}
            </Box>
          </Box>

          {/* Mentorship History */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Mentoring Sessions History
            </Typography>
            {mentorHistory.length > 0 ? (
              <Box
                sx={{
                  height: 400,
                  width: "100%",
                  overflowX: "auto",
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
                  rows={historyRows}
                  columns={[
                    {
                      field: "team_name",
                      headerName: "Social Enterprise",
                      flex: 1,
                      minWidth: 200,
                    },
                    {
                      field: "mentor_name",
                      headerName: "Mentor",
                      width: 200,
                    },
                    {
                      field: "program_name",
                      headerName: "Program",
                      width: 150,
                    },
                    {
                      field: "mentoring_session_date",
                      headerName: "Date",
                      width: 150,
                    },
                    {
                      field: "mentoring_session_time",
                      headerName: "Time",
                      width: 150,
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

                        return <Chip label={params.value} color={color} />;
                      },
                    },
                    {
                      field: "zoom_link",
                      headerName: "Zoom Link",
                      width: 250,
                      renderCell: (params) => {
                        const { row } = params;
                        return row.status === "Accepted" && row.zoom_link ? (
                          <a href={row.zoom_link} target="_blank" rel="noopener noreferrer">
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
              <Typography>No mentorship history available.</Typography>
            )}
          </Box>
        </Box>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Manage Mentor Schedule</DialogTitle>
        <DialogContent>
          <Typography>
            Do you want to accept or decline this mentor schedule?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAccept} color="success">
            Accept
          </Button>
          <Button onClick={handleDecline} color="error">
            Decline
          </Button>
        </DialogActions>
      </Dialog>

      {userRole === "Mentor" && (
        <Box mt={4}>
          <Typography variant="h6" gutterBottom>
            Your Scheduled Mentorship Dates
          </Typography>
          {mentorshipDates.length > 0 ? (
            <Box
              sx={{
                height: 400,
                width: "100%", // ✅ Ensures full DataGrid width
                overflowX: "auto", // ✅ Enables global left-right scrolling
                "& .MuiDataGrid-root": {
                  border: "none",
                },
                "& .MuiDataGrid-cell": {
                  borderBottom: "none",
                },
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
                  rows={rows}
                  columns={[
                    {
                      field: "team_name",
                      headerName: "Social Enterprise",
                      flex: 1,
                      minWidth: 200,
                    },
                    {
                      field: "mentor_name",
                      headerName: "Mentor",
                      width: 200,
                    },
                    {
                      field: "program_name",
                      headerName: "Program",
                      width: 150,
                    },
                    {
                      field: "mentoring_session_date",
                      headerName: "Date",
                      width: 150,
                    },
                    {
                      field: "mentoring_session_time",
                      headerName: "Time",
                      width: 150,
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

                        return <Chip label={params.value} color={color} />;
                      },
                    },
                    {
                      field: "zoom_link",
                      headerName: "Zoom Link",
                      width: 250,
                      renderCell: (params) => {
                        const { row } = params;
                        return row.status === "Accepted" && row.zoom_link ? (
                          <a href={row.zoom_link} target="_blank" rel="noopener noreferrer">
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
            <Typography>No mentorship dates scheduled.</Typography>
          )}
        </Box>
      )}

      <Dialog
        open={openSEModal}
        onClose={handleCloseSEModal}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          style: {
            backgroundColor: "#fff", // White background
            color: "#000", // Black text
            border: "1px solid #000", // Black border for contrast
          },
        }}
      >
        {/* Dialog Title */}
        <DialogTitle
          sx={{
            backgroundColor: "#1E4D2B", // DLSU Green header
            color: "#fff", // White text
            textAlign: "center",
            fontSize: "1.5rem",
            fontWeight: "bold",
          }}
        >
          Select a Social Enterprise
        </DialogTitle>

        {/* Dialog Content */}
        <DialogContent
          sx={{
            padding: "24px",
            maxHeight: "70vh", // Ensure it doesn't overflow the screen
            overflowY: "auto", // Enable scrolling if content is too long
          }}
        >
          {/* Loading Indicator */}
          {isLoading ? (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              height="100%"
            >
              <CircularProgress />
            </Box>
          ) : (
            <List>
              {socialEnterprises.map((se) => (
                <ListItem key={se.id} disablePadding>
                  <ListItemButton
                    onClick={() => handleSelectSE(se)}
                    sx={{
                      border:
                        selectedSE?.id === se.id ? "2px solid #000" : "none", // Add black outline for selected SE
                      borderRadius: "4px", // Rounded corners for better aesthetics
                      "&:hover": {
                        backgroundColor: "#f0f0f0", // Hover effect
                      },
                    }}
                  >
                    <ListItemText
                      primary={se.team_name}
                      secondary={se.program_name}
                      primaryTypographyProps={{
                        fontWeight:
                          selectedSE?.id === se.id ? "bold" : "normal", // Bold text for selected SE
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}

          {/* Date & Time Selection Section */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {/* Date Selection */}
            {/* Date Selection Section */}
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Select Date"
                value={selectedDate}
                onChange={(newDate) => setSelectedDate(newDate)}
                slotProps={{
                  textField: {
                    sx: {
                      "& .MuiOutlinedInput-root": {
                        "& fieldset": { borderColor: "#000" },
                        "&:hover fieldset": { borderColor: "#000" },
                        "&.Mui-focused fieldset": { borderColor: "#000" },
                      },
                      "& .MuiInputBase-input": { color: "#000" },
                      "& .MuiInputLabel-root": { color: "#000" },
                      "& .MuiInputLabel-root.Mui-focused": { color: "#000" },
                    },
                    InputProps: {
                      sx: {
                        "& .MuiSvgIcon-root": { color: "#000" },
                      },
                    },
                  },
                  popper: {
                    sx: {
                      "& .MuiPaper-root": {
                        backgroundColor: "#1E4D2B", // Green background
                        color: "#fff",
                      },
                      "& .MuiPickersDay-root": { color: "#fff" },
                      "& .MuiPickersDay-root.Mui-selected": {
                        backgroundColor: "#fff !important",
                        color: "#1E4D2B",
                      },
                      "& .MuiIconButton-root": { color: "#fff" },
                      "& .MuiTypography-root": { color: "#fff" },
                      "& .MuiOutlinedInput-root": { borderColor: "#fff" },
                    },
                  },
                }}
              />
            </LocalizationProvider>

            {/* Time Selection */}
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Stack spacing={2}>
                <Stack spacing={2} direction="row">
                  {/* Start Time Picker */}
                  <TimePicker
                    label="Start Time"
                    value={startTime}
                    onChange={handleStartTimeChange}
                    slotProps={{
                      textField: {
                        error: !!error,
                        helperText: error,
                        sx: {
                          "& .MuiOutlinedInput-root": {
                            "& fieldset": { borderColor: "#000" },
                            "&:hover fieldset": { borderColor: "#000" },
                            "&.Mui-focused fieldset": { borderColor: "#000" },
                          },
                          "& .MuiInputBase-input": { color: "#000" },
                          "& .MuiInputLabel-root": { color: "#000" },
                          "& .MuiInputLabel-root.Mui-focused": { color: "#000" },
                        },
                      },
                    }}
                  />

                  {/* End Time Picker */}
                  <TimePicker
                    label="End Time"
                    value={endTime}
                    minTime={startTime} // Ensures end time is not before start time
                    onChange={handleEndTimeChange}
                    slotProps={{
                      textField: {
                        error: !!error,
                        helperText: error,
                        sx: {
                          "& .MuiOutlinedInput-root": {
                            "& fieldset": { borderColor: "#000" },
                            "&:hover fieldset": { borderColor: "#000" },
                            "&.Mui-focused fieldset": { borderColor: "#000" },
                          },
                          "& .MuiInputBase-input": { color: "#000" },
                          "& .MuiInputLabel-root": { color: "#000" },
                          "& .MuiInputLabel-root.Mui-focused": { color: "#000" },
                        },
                      },
                    }}
                  />
                </Stack>

                {/* Error Message */}
                {error && (
                  <Typography color="error" sx={{ fontSize: "14px" }}>
                    {error}
                  </Typography>
                )}
              </Stack>
            </LocalizationProvider>
          </Box>

          {/* Zoom Link Section */}
          {selectedSE && (
            <>
              <Typography
                variant="h6"
                sx={{
                  marginTop: "20px",
                  marginBottom: "10px",
                  fontWeight: "bold",
                }}
              >
                Enter Zoom Link for Mentoring
              </Typography>
              <TextField
                label="Zoom Link"
                value={zoomLink}
                onChange={(e) => setZoomLink(e.target.value)}
                fullWidth
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: "#000", // Black border
                    },
                    "&:hover fieldset": {
                      borderColor: "#000", // Black border on hover
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#000", // Black border when focused
                    },
                  },
                  "& .MuiInputBase-input": {
                    color: "#000", // Black text
                  },
                  "& .MuiInputLabel-root": {
                    color: "#000", // Black label text
                  },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: "#000", // Black label text when focused
                  },
                }}
              />
            </>
          )}
        </DialogContent>
        {/* Dialog Actions */}
        <DialogActions
          sx={{
            padding: "16px",
            borderTop: "1px solid #000", // Separator line
          }}
        >
          <Button
            onClick={() => {
              handleCloseSEModal(); // Close the modal
              setTimeout(() => {
                window.location.reload(); // Reload after 500ms
              }, 500);
            }}
            sx={{
              color: "#000",
              border: "1px solid #000",
              "&:hover": {
                backgroundColor: "#f0f0f0", // Hover effect
              },
            }}
          >
            Cancel
          </Button>

          <Button
            onClick={handleConfirmDate}
            disabled={!selectedSE || isLoading}
            sx={{
              backgroundColor: "#1E4D2B", // DLSU Green button
              color: "#fff",
              "&:hover": {
                backgroundColor: "#145A32", // Darker green on hover
              },
            }}
          >
            {isLoading ? "Updating..." : "Confirm"}
          </Button>
        </DialogActions>
      </Dialog>
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
          Scheduled successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Scheduling;

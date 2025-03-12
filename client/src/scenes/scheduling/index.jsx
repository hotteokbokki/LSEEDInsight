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
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
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

  const [mentorHistory, setMentorHistory] = useState([
    {
      mentor_name: "John Doe",
      social_enterprise: "GreenTech Solutions",
      mentorship_dates: ["2025-02-27", "2025-03-10", "2025-04-05"],
    },
    {
      mentor_name: "Jane Smith",
      social_enterprise: "EcoInnovate Hub",
      mentorship_dates: ["2025-03-15", "2025-04-20"],
    },
    {
      mentor_name: "Michael Johnson",
      social_enterprise: "Solar Future Foundation",
      mentorship_dates: ["2025-01-05", "2025-02-15", "2025-03-30"],
    },
  ]);

  // Function to handle Snackbar close
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  useEffect(() => {
    const fetchMentorshipDates = async () => {
      try {
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
      const formattedTime = selectedTime ? selectedTime.format("HH:mm") : null;
      const response = await fetch(
        "http://localhost:4000/updateMentorshipDate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mentorship_id: selectedSE.id,
            mentorship_date: selectedDate.format("YYYY-MM-DD"),
            mentorship_time: formattedTime,
            zoom_link: zoomLink,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to update mentorship date");

      // Show success Snackbar
      setSnackbarOpen(true);

      // Close the dialog
      handleCloseSEModal();

      setTimeout(() => {
        window.location.reload();
      }, 500); // Adjust delay if needed
    } catch (error) {
      console.error("Error updating mentorship date:", error);
    } finally {
      setIsLoading(false);
    }
  };

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

  const [mentorSchedules, setMentorSchedules] = useState([]);

  useEffect(() => {
    const fetchMentorSchedules = async () => {
      try {
        const response = await fetch("/api/mentorSchedules");
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
              All Mentor Schedules
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
              <DataGrid
                rows={[
                  {
                    id: "1",
                    mentor_name: "John Doe",
                    social_enterprise: "Green Solutions",
                    scheduled_date: "May 5, 2025",
                    scheduled_time: "6:00 PM",
                  },
                  {
                    id: "2",
                    mentor_name: "Jane Smith",
                    social_enterprise: "Eco Warriors",
                    scheduled_date: "May 5, 2025",
                    scheduled_time: "7:00 PM",
                  },
                  {
                    id: "3",
                    mentor_name: "Alex Johnson",
                    social_enterprise: "Renewable Future",
                    scheduled_date: "May 6, 2025",
                    scheduled_time: "10:00 AM",
                  },
                ]}
                columns={[
                  {
                    field: "mentor_name",
                    headerName: "Mentor Name",
                    flex: 1,
                    minWidth: 200,
                  },
                  {
                    field: "social_enterprise",
                    headerName: "Social Enterprise",
                    flex: 1,
                    minWidth: 200,
                  },
                  {
                    field: "scheduled_date",
                    headerName: "Scheduled Date",
                    flex: 1,
                    minWidth: 200,
                  },
                  {
                    field: "scheduled_time",
                    headerName: "Scheduled Time",
                    flex: 1,
                    minWidth: 200,
                  },
                ]}
                pageSize={5}
                rowsPerPageOptions={[5, 10]}
                autoHeight
              />
            </Box>
          </Box>

          {/* Mentorship History */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Mentorship History
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
                  rows={mentorHistory.flatMap((history, index) =>
                    history.mentorship_dates.map((date, i) => ({
                      id: `${index}-${i}`,
                      mentor_name: history.mentor_name,
                      social_enterprise: history.social_enterprise,
                      mentorship_date: new Date(date).toLocaleDateString(
                        "en-US",
                        {
                          month: "long",
                          day: "2-digit",
                          year: "numeric",
                        }
                      ),
                    }))
                  )}
                  columns={[
                    {
                      field: "mentor_name",
                      headerName: "Mentor Name",
                      flex: 1,
                      minWidth: 200,
                    },
                    {
                      field: "social_enterprise",
                      headerName: "Social Enterprise",
                      flex: 1,
                      minWidth: 200,
                    },
                    {
                      field: "mentorship_date",
                      headerName: "Mentorship Date",
                      flex: 1,
                      minWidth: 200,
                    },
                  ]}
                  pageSize={5}
                  rowsPerPageOptions={[5, 10]}
                  autoHeight
                />
              </Box>
            ) : (
              <Typography>No mentorship history available.</Typography>
            )}
          </Box>
        </Box>
      )}

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
                rows={mentorshipDates.map((mentorship, index) => ({
                  id: index,
                  team_name: mentorship.team_name || "N/A",
                  program_name: mentorship.name || "N/A",
                  mentorship_date:
                    Array.isArray(mentorship.mentorship_date) &&
                    Array.isArray(mentorship.mentorship_time)
                      ? mentorship.mentorship_date.map((date, idx) => {
                          if (!date) return "N/A"; // ✅ Handle missing dates

                          const formattedDate = new Date(
                            date
                          ).toLocaleDateString("en-US", {
                            month: "long",
                            day: "2-digit",
                            year: "numeric",
                          });

                          // ✅ Fix: Use raw PostgreSQL time instead of `new Date()`
                          const formattedTime =
                            Array.isArray(mentorship.mentorship_time) &&
                            mentorship.mentorship_time.length > idx &&
                            mentorship.mentorship_time[idx]
                              ? new Date(
                                  `1970-01-01T${mentorship.mentorship_time[idx]}`
                                ).toLocaleTimeString("en-US", {
                                  hour: "numeric",
                                  minute: "2-digit",
                                  hour12: true, // ✅ Convert to 12-hour format with AM/PM
                                })
                              : "N/A";

                          return formattedTime !== "N/A"
                            ? `${formattedDate} - ${formattedTime}`
                            : formattedDate;
                        })
                      : ["N/A"],

                  // ✅ Fix Approved Dates: Same logic as Pending Dates
                  accepted_dates:
                    Array.isArray(mentorship.accepted_dates) &&
                    Array.isArray(mentorship.mentorship_time)
                      ? mentorship.accepted_dates.map((date, idx) => {
                          if (!date) return "N/A"; // ✅ Handle missing dates

                          const formattedDate = new Date(
                            date
                          ).toLocaleDateString("en-US", {
                            month: "long",
                            day: "2-digit",
                            year: "numeric",
                          });

                          // ✅ Fix: Use raw PostgreSQL time instead of `new Date()`
                          const formattedTime =
                            Array.isArray(mentorship.mentorship_time) &&
                            mentorship.mentorship_time.length > idx &&
                            mentorship.mentorship_time[idx]
                              ? new Date(
                                  `1970-01-01T${mentorship.mentorship_time[idx]}`
                                ).toLocaleTimeString("en-US", {
                                  hour: "numeric",
                                  minute: "2-digit",
                                  hour12: true, // ✅ Convert to 12-hour format with AM/PM
                                })
                              : "N/A";

                          return formattedTime !== "N/A"
                            ? `${formattedDate} - ${formattedTime}`
                            : formattedDate;
                        })
                      : ["N/A"],
                }))}
                columns={[
                  {
                    field: "team_name",
                    headerName: "Social Enterprise",
                    flex: 1,
                    minWidth: 200,
                  },
                  {
                    field: "program_name",
                    headerName: "Program",
                    width: 150, //
                  },
                  {
                    field: "mentorship_date",
                    headerName: "Pending Dates",
                    width: 500,
                    renderCell: (params) => (
                      <Box
                        sx={{
                          display: "flex",
                          overflowX: "auto",
                          maxWidth: "100%",
                          whiteSpace: "nowrap",
                          padding: "4px",
                        }}
                      >
                        {Array.isArray(params.value) && params.value.length > 0
                          ? params.value.map((entry, idx) => (
                              <Chip
                                key={idx}
                                label={entry}
                                sx={{ marginRight: "4px" }}
                              />
                            ))
                          : "N/A"}
                      </Box>
                    ),
                  },
                  {
                    field: "accepted_dates",
                    headerName: "Approved Dates",
                    width: 350, // ✅ Same width as Pending Dates
                    renderCell: (params) => (
                      <Box
                        sx={{
                          display: "flex",
                          overflowX: "auto", // ✅ Enables scrolling inside the cell
                          maxWidth: "100%",
                          whiteSpace: "nowrap",
                          padding: "4px",
                        }}
                      >
                        {params.value.length > 0
                          ? params.value.map((date, idx) => (
                              <Chip
                                key={idx}
                                label={date}
                                sx={{ marginRight: "4px" }}
                              />
                            ))
                          : "N/A"}
                      </Box>
                    ),
                  },
                ]}
                pageSize={5}
                rowsPerPageOptions={[5, 10]}
                autoHeight
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
              <TimePicker
                label="Select Time"
                value={selectedTime}
                onChange={(newTime) => setSelectedTime(newTime)}
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
                        backgroundColor: "#1E4D2B",
                        color: "#fff",
                      },
                      "& .MuiClock-root": { backgroundColor: "#1E4D2B" },
                      "& .MuiClockNumber-root": { color: "#fff" },
                      "& .MuiClockPointer-root": { backgroundColor: "#fff" },
                      "& .MuiClockPointer-thumb": { backgroundColor: "#fff" },
                      "& .MuiIconButton-root": { color: "#fff" },
                      "& .MuiTypography-root": { color: "#fff" },
                      "& .Mui-selected": {
                        backgroundColor: "#fff !important", // White background for selected time
                        color: "#1E4D2B !important", // Green text to match theme
                      },
                    },
                  },
                  actionBar: {
                    actions: ["cancel", "accept"],
                    sx: {
                      "& .MuiButton-root": {
                        color: "#fff", // White "OK" button
                      },
                    },
                  },
                }}
              />
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

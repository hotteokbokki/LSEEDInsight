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
  MenuItem,
  FormControl,
  InputLabel,
  Select,
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
import { saveAs } from "file-saver";

dayjs.extend(utc);
dayjs.extend(timezone);

const Scheduling = ({}) => {
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
  const [mentorOwnHistory, setMentorOwnHistory] = useState([]);
  const [lseedHistory, setLseedHistory] = useState([]);


  const generateTimeSlots = () => {
    const slots = [];
    let time = dayjs().startOf("day"); // Start at 00:00
    for (let i = 0; i < 48; i++) {
      // 48 half-hour slots in a day
      slots.push(time.format("hh:mm A"));
      time = time.add(30, "minute");
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const handleAcceptClick = async (schedule) => {
    try {
      const {
        id: mentoring_session_id,
        mentorship_id,
        mentorship_date,
        mentorship_time,
        zoom_link,
      } = schedule; // Rename for clarity

      const response = await fetch("http://localhost:4000/approveMentorship", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mentoring_session_id,
          mentorship_id,
          mentorship_date,
          mentorship_time,
          zoom_link,
        }), // Ensure backend expects this key
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

  const isConfirmDisabled =
    !selectedSE ||
    !selectedDate ||
    !startTime ||
    !endTime ||
    !zoomLink ||
    isLoading;

  const generateICS = () => {
    if (mentorshipDates.length === 0) {
      alert("No scheduled mentorship dates to export.");
      return;
    }

    let icsContent =
      "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//SEED Insight//Mentorship Schedule//EN\r\n";

    mentorshipDates.forEach((session) => {
      if (session.status !== "Accepted") {
        return; // Skip non-accepted sessions
      }

      const [year, month, day] = session.mentoring_session_date
        .split("T")[0]
        .split("-")
        .map(Number);
      const [hour, minute] = session.mentoring_session_time
        .split(" - ")[0]
        .split(":")
        .map(Number);

      // Construct date using local time (prevents timezone shift)
      const parsedDate = new Date(year, month - 1, day + 1, hour, minute);

      if (isNaN(parsedDate.getTime())) {
        console.error(
          "Invalid date:",
          session.mentoring_session_date,
          session.mentoring_session_time
        );
        return;
      }

      const startDate =
        parsedDate.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
      const endDate =
        new Date(parsedDate.getTime() + 60 * 60 * 1000) // 1-hour session
          .toISOString()
          .replace(/[-:]/g, "")
          .split(".")[0] + "Z";

      icsContent += `BEGIN:VEVENT\r\n`;
      icsContent += `UID:${session.team_name}-${startDate}\r\n`;
      icsContent += `SUMMARY:Mentorship Session with ${session.team_name}\r\n`;
      icsContent += `DESCRIPTION:Mentor: ${session.mentor_name}\\nProgram: ${session.program_name}\\nStatus: ${session.status}\r\n`;
      icsContent += `DTSTART:${startDate}\r\n`;
      icsContent += `DTEND:${endDate}\r\n`;
      icsContent += `LOCATION:${
        session.zoom_link ? session.zoom_link : "TBD"
      }\r\n`;
      icsContent += `STATUS:CONFIRMED\r\n`;
      icsContent += `END:VEVENT\r\n`;
    });

    icsContent += "END:VCALENDAR\r\n";

    if (!icsContent.includes("BEGIN:VEVENT")) {
      alert("No Accepted mentorship schedules to export.");
      return;
    }

    // Create a Blob and trigger download
    const blob = new Blob([icsContent], { type: "text/calendar" });
    saveAs(blob, "mentorship_schedule.ics");
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
        console.log("mentor_id: ", user.id);
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

  // useEffect(() => {
  //   const fetchScheduleHistory = async () => {
  //     try {
        
  //       let response;
        
  //       if (user?.roles.includes("Mentor")) {
  //         console.log("hello")
  //         response = await axios.get("http://localhost:4000/api/mentorSchedulesByID", {
  //           withCredentials: true, // Equivalent to credentials: "include"
  //         });
  //       } else if (user?.roles.some(role => role.startsWith("LSEED"))) {
  //         if (user?.roles.includes("LSEED-Coordinator")) {
  //           const res = await axios.get("http://localhost:4000/api/get-program-coordinator", {
  //             withCredentials: true, // Equivalent to credentials: "include"
  //           });

  //           const program = res.data[0]?.name;
           
  //           response = await axios.get(
  //             "http://localhost:4000/api/mentorSchedules",
  //             { params: { program } }
  //           );
  //         }
  //         else {
  //           response = await axios.get(
  //             "http://localhost:4000/api/mentorSchedules"
  //           );
  //         }
  //       }

  //       setMentorHistory(response.data || []);
  //     } catch (error) {
  //       console.error("❌ Error fetching mentor schedules:", error);
  //       setMentorHistory([]);
  //     }
  //   };

  //   fetchScheduleHistory();
  // }, []); // Runs once when the component mounts

  useEffect(() => {
    const fetchScheduleHistory = async () => {
      try {
        const roles = user?.roles || [];
        const isMentor = roles.includes("Mentor");
        const isLSEEDUser = roles.some(role => role.startsWith("LSEED"));

        if (isMentor) {
          const mentorRes = await axios.get("http://localhost:4000/api/mentorSchedulesByID", {
            withCredentials: true,
          });
          setMentorOwnHistory(mentorRes.data || []);
        }

        if (isLSEEDUser) {
          let lseedResponse;
          if (roles.includes("LSEED-Coordinator")) {
            const programRes = await axios.get("http://localhost:4000/api/get-program-coordinator", {
              withCredentials: true,
            });
            const program = programRes.data[0]?.name;
            lseedResponse = await axios.get(
              "http://localhost:4000/api/mentorSchedules",
              { params: { program } }
            );
          } else {
            lseedResponse = await axios.get("http://localhost:4000/api/mentorSchedules");
          }
          setLseedHistory(lseedResponse.data || []);
        }
      } catch (error) {
        console.error("❌ Error fetching mentor schedules:", error);
        setMentorOwnHistory([]);
        setLseedHistory([]);
      }
    };

    if (user) {
      fetchScheduleHistory();
    }
  }, [user]);


  const formatRows = (data) =>
    data.map((mentorship) => ({
      id: mentorship.mentoring_session_id,
      team_name: mentorship.team_name || "N/A",
      mentor_name: mentorship.mentor_name || "N/A",
      program_name: mentorship.program_name || "N/A",
      mentoring_session_date: new Date(
        mentorship.mentoring_session_date
      ).toLocaleDateString("en-US", {
        month: "long",
        day: "2-digit",
        year: "numeric",
      }),
      mentoring_session_time: mentorship.mentoring_session_time || "N/A",
      status: mentorship.status || "N/A",
      zoom_link: mentorship.zoom_link || "N/A",
  }));


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

      const updatedSocialEnterprises = data.map((se) => ({
        id: se.id, // Correctly map `se_id` from API response
        mentor_id: se.mentor_id,
        se_id: se.se_id, // Ensure this is correctly assigned
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
    console.log("SE ID:", selectedSE?.id);
    console.log("Date:", selectedDate?.format?.("YYYY-MM-DD"));
    console.log("Start Time:", startTime?.format?.("HH:mm"));
    console.log("End Time:", endTime?.format?.("HH:mm"));
    console.log("Zoom Link:", zoomLink);

    // Ensure all fields are filled before proceeding
    if (
      !selectedSE?.id ||
      !selectedDate ||
      !startTime ||
      !endTime ||
      !zoomLink
    ) {
      alert(
        "All fields are required: SE, Date, Start Time, End Time, Zoom Link."
      );
      return;
    }

    try {
      setIsLoading(true);

      // ✅ Ensure `selectedDate`, `startTime`, and `endTime` are dayjs objects before formatting
      const formattedDate = selectedDate?.isValid?.()
        ? selectedDate.format("YYYY-MM-DD")
        : null;
      const formattedStartTime =
        selectedDate?.isValid?.() && startTime?.isValid?.()
          ? `${selectedDate.format("YYYY-MM-DD")} ${startTime.format(
              "HH:mm:ss"
            )}`
          : null;

      const formattedEndTime =
        selectedDate?.isValid?.() && endTime?.isValid?.()
          ? `${selectedDate.format("YYYY-MM-DD")} ${endTime.format("HH:mm:ss")}`
          : null;

      if (!formattedDate || !formattedStartTime || !formattedEndTime) {
        throw new Error("Invalid date or time format.");
      }

      const requestBody = {
        mentorship_id: selectedSE.id,
        mentoring_session_date: formattedDate,
        start_time: formattedStartTime,
        end_time: formattedEndTime,
        zoom_link: zoomLink,
      };

      console.log("📤 Sending Data:", requestBody);

      const response = await fetch(
        "http://localhost:4000/updateMentorshipDate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        // ✅ Get detailed error response (JSON or text)
        const errorMessage = await response.json().catch(() => response.text());
        throw new Error(`Failed to update: ${JSON.stringify(errorMessage)}`);
      }

      setSnackbarOpen(true); // ✅ Show success message
      handleCloseSEModal(); // ✅ Close modal

      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error("❌ Error updating mentorship date:", error.message);
      alert(error.message);
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
        let response;

        if (user?.roles.includes("LSEED-Coordinator")) {
          const res = await axios.get("http://localhost:4000/api/get-program-coordinator", {
            withCredentials: true, // Equivalent to credentials: "include"
          });

          const program = res.data[0]?.name;

          response = await axios.get(
            "http://localhost:4000/api/pending-schedules",
            { params: { program } }
          );
        }
        else {
          response = await axios.get(
            "http://localhost:4000/api/pending-schedules"
          );
        }
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

    fetchMentorSchedules();
  }, []);

  return (
    <Box m="20px">
      {/* Header */}
      <Header
        title="Scheduling Matrix"
        subtitle={
          user?.roles.some(role => role.startsWith("LSEED"))
            ? "View and Manage the schedule of the mentors"
            : "Find the Appropriate Schedule"
        }
      />

      {user?.roles.includes("Mentor") ? (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          gap={2}
          mt={2}
          marginBottom="20px"
        >
          <Box
            width="100%"
            p={3}
            bgcolor={colors.primary[400]}
            display="flex"
            gap={2}
          >
            {/* Open LSEED Calendar Button */}
            <Button
              variant="contained"
              color="secondary"
              sx={{ fontSize: "16px", py: "10px", flexGrow: 1, minWidth: 0 }}
              onClick={handleRedirect}
            >
              Open LSEED Calendar
            </Button>

            {/* Schedule a Mentoring Session Button */}
            <Button
              variant="contained"
              color="secondary"
              sx={{ fontSize: "16px", py: "10px", flexGrow: 1, minWidth: 0 }}
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

      <Box width="100%" backgroundColor={colors.primary[400]} padding="20px">
        <Typography
          variant="h3"
          fontWeight="bold"
          color={colors.greenAccent[500]}
          marginBottom="15px"
        >
          Mentor Scheduling Calendar
        </Typography>

        <Calendar isDashboard={true} />
      </Box>

      {user.roles?.some(r => r.startsWith("LSEED")) && (
        <Box mt={4} display="flex" flexDirection="column" gap={2}>
          {/* Mentor Schedules */}
          <Box
            width="100%"
            backgroundColor={colors.primary[400]}
            padding="20px"
          >
            <Typography
              variant="h3"
              fontWeight="bold"
              color={colors.greenAccent[500]}
              marginBottom="15px"
            >
              Pending Schedules
            </Typography>

            <Box
              width="100%"
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
              {mentorSchedules.length > 0 ? (
                <DataGrid
                  rows={mentorSchedules.map((schedule) => ({
                    id: schedule.mentoring_session_id,
                    mentor_name: schedule.mentor_name || "Unknown Mentor",
                    mentorship_id: schedule.mentorship_id,
                    se_name: schedule.team_name || "Unknown SE",
                    mentorship_date: schedule.mentoring_session_date,
                    mentorship_time: schedule.mentoring_session_time,
                    telegramstatus: schedule.status || "Pending",
                    zoom_link: schedule.zoom_link || "N/A",
                  }))}
                  columns={[
                    {
                      field: "mentor_name",
                      headerName: "Mentor Name",
                      flex: 1,
                      minWidth: 200,
                    },
                    {
                      field: "se_name",
                      headerName: "Social Enterprise",
                      flex: 1,
                      minWidth: 200,
                    },
                    {
                      field: "mentorship_date",
                      headerName: "Mentoring Session Date",
                      flex: 1,
                      minWidth: 200,
                    },
                    {
                      field: "mentorship_time",
                      headerName: "Mentoring Session Time",
                      flex: 1,
                      minWidth: 150,
                    },
                    {
                      field: "telegramstatus",
                      headerName: "Status",
                      flex: 1,
                      minWidth: 100,
                    },
                    {
                      field: "zoom_link",
                      headerName: "Zoom Link",
                      flex: 1,
                      minWidth: 200,
                      renderCell: (params) => {
                        const { row } = params;
                        return row.zoom_link && row.zoom_link !== "N/A" ? (
                          <a
                            href={row.zoom_link}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Chip label="Join" color="primary" clickable />
                          </a>
                        ) : (
                          "No Link"
                        );
                      },
                    },

                    {
                      field: "action",
                      headerName: "Action",
                      flex: 1,
                      minWidth: 200,
                      renderCell: (params) => (
                        <Box
                          display="flex"
                          justifyContent="center" // Centers horizontally
                          alignItems="center" // Centers vertically
                          width="100%" // Ensures it spans full width of the column
                          height="100%" // Ensures it spans full height of the cell
                          gap={1} // Adds spacing between buttons
                        >
                          <Button
                            variant="contained"
                            sx={{ backgroundColor: colors.greenAccent[500] }}
                            onClick={() => handleAcceptClick(params.row)}
                          >
                            Accept
                          </Button>
                          <Button
                            variant="contained"
                            sx={{ backgroundColor: colors.redAccent[500] }}
                            onClick={() => handleDeclineClick(params.row)}
                          >
                            Decline
                          </Button>
                        </Box>
                      ),
                    },
                  ]}
                  pageSize={5}
                  rowsPerPageOptions={[5, 10]}
                />
              ) : (
                <Typography color={colors.grey[300]}>
                  No schedules available.
                </Typography>
              )}
            </Box>
          </Box>

          {/* Mentorship History */}
          <Box
            width="100%"
            backgroundColor={colors.primary[400]}
            padding="20px"
          >
            <Typography
              variant="h3"
              fontWeight="bold"
              color={colors.greenAccent[500]}
              marginBottom="15px"
            >
              Mentoring Sessions History
            </Typography>

            {lseedHistory.length > 0 ? (
              <Box
                width="100%"
                height="400px"
                minHeight="400px"
                sx={{
                  "& .MuiDataGrid-scrollbarFiller, & .MuiDataGrid-scrollbarFiller--header":
                    {
                      backgroundColor: colors.blueAccent[700] + " !important",
                    },
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
                  rows={formatRows(lseedHistory)}
                  columns={[
                    {
                      field: "team_name",
                      headerName: "Social Enterprise",
                      flex: 1,
                      minWidth: 250,
                    },
                    {
                      field: "mentor_name",
                      headerName: "Mentor",
                      width: 250,
                    },
                    {
                      field: "program_name",
                      headerName: "Program",
                      width: 250,
                    },
                    {
                      field: "mentoring_session_date",
                      headerName: "Date",
                      width: 250,
                    },
                    {
                      field: "mentoring_session_time",
                      headerName: "Time",
                      width: 250,
                    },
                    {
                      field: "status",
                      headerName: "Status",
                      width: 200,
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
                      field: "zoom_link",
                      headerName: "Zoom Link",
                      flex: 1,
                      minWidth: 50,
                      renderCell: (params) => {
                        const { row } = params;
                        return row.zoom_link && row.zoom_link !== "N/A" ? (
                          <a
                            href={row.zoom_link}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Chip label="Join" color="primary" clickable />
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

      {user?.roles.includes("Mentor") && (
        <Box mt={4}>
          {/* Export Button Positioned Outside DataGrid */}
          <Box mb={2}>
            <Button
              variant="contained"
              sx={{
                backgroundColor: colors.greenAccent[600],
                color: colors.grey[100],
                "&:hover": { backgroundColor: colors.greenAccent[700] },
              }}
              onClick={generateICS}
            >
              Export Calendar
            </Button>
          </Box>

          <Box
            width="100%"
            backgroundColor={colors.primary[400]}
            padding="20px"
          >
            <Typography
              variant="h3"
              fontWeight="bold"
              color={colors.greenAccent[500]}
              marginBottom="15px"
            >
              Mentoring Sessions History
            </Typography>

            {mentorOwnHistory.length > 0 ? (
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
                  rows={formatRows(mentorOwnHistory)}
                  columns={[
                    {
                      field: "team_name",
                      headerName: "Social Enterprise",
                      flex: 1,
                      minWidth: 200,
                    },
                    { field: "mentor_name", headerName: "Mentor", width: 200 },
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
                        if (params.value === "Evaluated") color = "info";
                        if (params.value === "Completed") color = "primary";
                        return <Chip label={params.value} color={color} />;
                      },
                    },
                    {
                      field: "zoom_link",
                      headerName: "Zoom Link",
                      width: 250,
                      renderCell: (params) => {
                        const { row } = params;
                        return row.zoom_link && row.zoom_link !== "N/A" ? (
                          <a
                            href={row.zoom_link}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Chip label="Join" color="primary" clickable />
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
                      marginBottom: "6px", // Add spacing between items
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

            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Stack spacing={2}>
                <Stack spacing={2} direction="row" sx={{ width: "100%" }}>
                  {/* Start Time Picker */}
                  <TimePicker
                    label="Start Time"
                    value={startTime}
                    onChange={handleStartTimeChange}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        sx: {
                          "& .MuiOutlinedInput-root": {
                            "& fieldset": { borderColor: "#000" },
                            "&:hover fieldset": { borderColor: "#000" },
                            "&.Mui-focused fieldset": { borderColor: "#000" },
                          },
                          "& .MuiInputBase-input": { color: "#000" },
                          "& .MuiInputLabel-root": { color: "#000" },
                          "& .MuiInputLabel-root.Mui-focused": {
                            color: "#000",
                          },
                          "& .MuiSvgIcon-root": { color: "#000" }, // Icon color black
                        },
                      },
                      popper: {
                        sx: {
                          "& .MuiPaper-root": {
                            backgroundColor: "#1E4D2B", // Green dropdown background
                            color: "#fff", // White text
                          },
                          "& .MuiMenuItem-root": { color: "#fff" }, // Default item color
                          "& .MuiMenuItem-root.Mui-selected": {
                            backgroundColor: "#fff !important",
                            color: "#1E4D2B", // Green text for selected item
                          },
                        },
                      },
                      actionBar: {
                        actions: ["cancel", "accept"],
                        sx: {
                          "& .MuiButton-root": {
                            color: colors.grey[100], // Change OK button text color to white
                          },
                        },
                      },
                    }}
                  />

                  {/* End Time Picker */}
                  <TimePicker
                    label="End Time"
                    value={endTime}
                    minTime={startTime} // Prevents selecting a time before the start
                    onChange={handleEndTimeChange}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        sx: {
                          "& .MuiOutlinedInput-root": {
                            "& fieldset": { borderColor: "#000" },
                            "&:hover fieldset": { borderColor: "#000" },
                            "&.Mui-focused fieldset": { borderColor: "#000" },
                          },
                          "& .MuiInputBase-input": { color: "#000" },
                          "& .MuiInputLabel-root": { color: "#000" },
                          "& .MuiInputLabel-root.Mui-focused": {
                            color: "#000",
                          },
                          "& .MuiSvgIcon-root": { color: "#000" }, // Icon color black
                        },
                      },
                      popper: {
                        sx: {
                          "& .MuiPaper-root": {
                            backgroundColor: "#1E4D2B", // Green dropdown background
                            color: "#fff", // White text
                          },
                          "& .MuiMenuItem-root": { color: "#fff" }, // Default item color
                          "& .MuiMenuItem-root.Mui-selected": {
                            backgroundColor: "#fff !important",
                            color: "#1E4D2B", // Green text for selected item
                          },
                        },
                      },
                      actionBar: {
                        actions: ["cancel", "accept"],
                        sx: {
                          "& .MuiButton-root": {
                            color: colors.grey[100], // Change OK button text color to white
                          },
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
            disabled={isConfirmDisabled}
            sx={{
              backgroundColor: isConfirmDisabled ? "#A9A9A9" : "#1E4D2B", // Grey out if disabled
              color: "#fff",
              "&:hover": {
                backgroundColor: isConfirmDisabled ? "#A9A9A9" : "#145A32", // Only hover effect when enabled
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
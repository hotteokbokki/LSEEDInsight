// Sample LSEED Insight Google Calendar
// https://calendar.google.com/calendar/u/0?cid=MWJlZDcwNTZhNzNhOGRhZGU0MjZkZjI2MzMyMTYzNDBjMDE3OWJhZGJmMjUyMGYyMjI0NmVlMTkyMzg2OTBiY0Bncm91cC5jYWxlbmRhci5nb29nbGUuY29t

import React, { useEffect, useState } from "react";
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
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers";
import { useAuth } from "../../context/authContext";
import Header from "../../components/Header";
import axios from "axios";
import dayjs from "dayjs";

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
  
  useEffect(() => {
    const fetchMentorshipDates = async () => {
      try {
        const response = await axios.get("http://localhost:4000/getMentorshipDates", {
          params: { mentor_id: user.id }, // Fetch mentorships for this mentor
        });
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
      const response = await fetch(`http://localhost:4000/getMentorshipsbyID?mentor_id=${encodeURIComponent(user.id)}`);
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
  
    try {
      setIsLoading(true);
      const response = await fetch("http://localhost:4000/updateMentorshipDate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mentorship_id: selectedSE.id,
          mentorship_date: selectedDate.format("YYYY-MM-DD"),
        }),
      });
  
      if (!response.ok) throw new Error("Failed to update mentorship date");
      alert("Mentorship date updated successfully!");
    } catch (error) {
      console.error("Error updating mentorship date:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRedirect = () => window.open("https://calendar.google.com", "_blank");
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
      .then(response => response.json())
      .then(data => console.log("[Frontend] Session Check Response:", data))
      .catch(error => console.error("[Frontend] Session Check Error:", error));
  }, []);
  

  return (
    <Box m="20px">
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Header title="Scheduling Matrix" subtitle={user.role === "LSEED" ? "See the schedule of the mentors" : "Find the Appropriate Schedule"}  />
      </Box>

      {user.role === "Mentor" ? (
        <Box display="flex" justifyContent="center" mt={2}>
          <Button variant="contained" sx={{ backgroundColor: "#1976D2", color: "white" }} onClick={handleRedirect}>
            Open LSEED Calendar
          </Button>
          <Button
            variant="contained"
            sx={{ backgroundColor: "#4caf50", color: "white", marginLeft: "10px" }}
            onClick={handleOpenSEModal}
          >
            Schedule a Mentoring Session
          </Button>
        </Box>
      ) : (
        <Box mt={2}>
          <List>
            {mentors.map((mentor) => (
              <ListItem key={mentor.mentor_id}>
                <ListItemText primary={mentor.name} />
                <Button
                  variant="contained"
                  sx={{ backgroundColor: mentor.calendarlink ? "#1976D2" : "#B0B0B0", color: "white" }}
                  onClick={() => mentor.calendarlink && window.open(mentor.calendarlink, "_blank")}
                  disabled={!mentor.calendarlink}
                >
                  {mentor.calendarlink ? "View Calendar" : "No Calendar Available"}
                </Button>
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {user.role === "Mentor" && (
        <Box mt={4}>
          <Typography variant="h6" gutterBottom>
            Your Scheduled Mentorship Dates
          </Typography>
          {mentorshipDates.length > 0 ? (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Social Enterprise</strong></TableCell>
                    <TableCell><strong>Program</strong></TableCell>
                    <TableCell><strong>Mentorship Dates</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Array.isArray(mentorshipDates) &&
                    mentorshipDates.map((mentorships) => (
                      <TableRow key={mentorships.se_id}>
                        <TableCell>{mentorships.team_name}</TableCell>
                        <TableCell>{mentorships.name}</TableCell>
                        <TableCell>
                          {Array.isArray(mentorships.mentorship_date) &&
                            mentorships.mentorship_date.map((date) => (
                              <Chip
                                key={date}
                                label={new Date(date).toLocaleDateString("en-US", {
                                  month: "long",
                                  day: "2-digit",
                                  year: "numeric",
                                })}
                                sx={{ margin: "2px" }}
                              />
                            ))}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography>No mentorship dates scheduled.</Typography>
          )}
        </Box>
      )}

      <Dialog open={openSEModal} onClose={handleCloseSEModal} fullWidth maxWidth="sm">
        <DialogTitle sx={{ backgroundColor: "#1E4D2B", color: "#fff", textAlign: "center", fontSize: "1.5rem", fontWeight: "bold" }}>
          Select a Social Enterprise
        </DialogTitle>
        <DialogContent>
          {isLoading ? (
            <CircularProgress />
          ) : (
            <List>
              {socialEnterprises.map((se) => (
                <ListItem key={se.id} disablePadding>
                  <ListItemButton onClick={() => handleSelectSE(se)}>
                    <ListItemText primary={se.team_name} secondary={se.program_name} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}

          {selectedSE && (
              <>
                <DialogTitle>Select a Date for Mentoring</DialogTitle>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker value={selectedDate} onChange={(newDate) => setSelectedDate(newDate)} />
                  </LocalizationProvider>
              </>
          )}
        </DialogContent>
        <DialogActions>
          <Button sx={{ color: "#fff", textAlign: "center", fontWeight: "bold" }} onClick={handleCloseSEModal}>Cancel</Button>
          <Button sx={{ color: "#fff", textAlign: "center", fontWeight: "bold" }} onClick={handleConfirmDate} disabled={!selectedSE || isLoading}>
            {isLoading ? "Updating..." : "Confirm"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Scheduling;

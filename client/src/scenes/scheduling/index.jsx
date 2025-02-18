// Sample LSEED Insight Google Calendar
// https://calendar.google.com/calendar/u/0?cid=MWJlZDcwNTZhNzNhOGRhZGU0MjZkZjI2MzMyMTYzNDBjMDE3OWJhZGJmMjUyMGYyMjI0NmVlMTkyMzg2OTBiY0Bncm91cC5jYWxlbmRhci5nb29nbGUuY29t

import React, { useEffect, useState } from "react";
import { Box, Button, List, ListItem, ListItemText, Modal, TextField} from "@mui/material";
import Header from "../../components/Header";
import { useAuth } from "../../context/authContext";

const Scheduling = ({ userRole }) => {
  const [openModal, setOpenModal] = useState(false); 
  const [mentors, setMentors] = useState([]);
  const [calendarLink, setCalendarLink] = useState("");
  const { user } = useAuth();
  
  // Fetch mentors data from the backend
  useEffect(() => {
    const fetchMentors = async () => {
      try {
        const response = await fetch("/api/mentors");  // Adjust URL according to your backend routing
        const data = await response.json();
        setMentors(data);
      } catch (error) {
        console.error("Error fetching mentors:", error);
      }
    };

    fetchMentors();
  }, []);
  
  const handleRedirect = () => {
    window.open("https://calendar.google.com", "_blank");
  };

  const handleOpenModal = () => setOpenModal(true);
  const handleCloseModal = () => setOpenModal(false);

  const handleUploadLink = async () => {
    if (calendarLink) {
      try {
        // Assuming you have an API to handle the mentor link update
        const response = await fetch("/api/mentors/updateCalendarLink", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ calendarLink, userRole }),
        });

        if (response.ok) {
          alert("Calendar link updated successfully!");
          setCalendarLink("");
          handleCloseModal(); // Close modal after successful update
        } else {
          alert("Failed to update calendar link. Please try again.");
        }
      } catch (error) {
        console.error("Error uploading link:", error);
        alert("There was an error uploading the calendar link.");
      }
    } else {
      alert("Please provide a valid calendar link.");
    }
  };

  return (
    <Box m="20px">
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Header title="Scheduling Matrix" subtitle={user.role === "LSEED" ? "See the schedule of the mentors" : "Find the Appropriate Schedule"}  />
      </Box>

      {user.role === "Mentor" ? (
        <Box display="flex" justifyContent="center" mt={2}>
          <Button variant="contained" sx={{ backgroundColor: "#1976D2" , color: "white" }} onClick={handleRedirect}>
            Open LSEED Calendar
          </Button>
          <Button
            variant="contained"
            sx={{ backgroundColor: "#4caf50", color: "white", marginLeft: "10px" }}
            onClick={handleOpenModal}
          >
            Upload Calendar Link
          </Button>
        </Box>
      ) : (
        <Box mt={2}>
          {mentors.length > 0 ? (
            <List>
              {mentors.map((mentor) => (
                <ListItem key={mentor.mentor_id}>
                  <ListItemText primary={`${mentor.mentor_firstname} ${mentor.mentor_lastname}`} />
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
          ) : (
            <Box display="flex" justifyContent="center" mt={2}>
              <p>No mentors available.</p>
            </Box>
          )}
        </Box>
      )}

      {/* Modal for uploading the calendar link */}
      <Modal open={openModal} onClose={handleCloseModal} disableEnforceFocus BackdropProps={{ invisible: true }}>
        <Box sx={{ width: "300px", padding: "20px", margin: "50px auto", backgroundColor: "white", borderRadius: "5px" }}>
          <TextField
            label="Calendar Link"
            variant="outlined"
            fullWidth
            value={calendarLink}
            onChange={(e) => setCalendarLink(e.target.value)}
            sx={{ marginBottom: "15px", "& .MuiInputBase-input": { color: "black" } }}  // Set text color to black
          />
          <Box display="flex" justifyContent="space-between">
            <Button variant="contained" onClick={handleUploadLink}>Upload</Button>
            <Button variant="outlined" onClick={handleCloseModal}>Cancel</Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default Scheduling;

// Sample LSEED Insight Google Calendar
// https://calendar.google.com/calendar/u/0?cid=MWJlZDcwNTZhNzNhOGRhZGU0MjZkZjI2MzMyMTYzNDBjMDE3OWJhZGJmMjUyMGYyMjI0NmVlMTkyMzg2OTBiY0Bncm91cC5jYWxlbmRhci5nb29nbGUuY29t

import { Box, Button } from "@mui/material";
import Header from "../../components/Header";

const Scheduling = () => {
  const handleRedirect = () => {
    // NOTE: This link must be changed to the official link from LSEED.
    window.open("https://calendar.google.com/calendar/u/0?cid=MWJlZDcwNTZhNzNhOGRhZGU0MjZkZjI2MzMyMTYzNDBjMDE3OWJhZGJmMjUyMGYyMjI0NmVlMTkyMzg2OTBiY0Bncm91cC5jYWxlbmRhci5nb29nbGUuY29t", "_blank");
  };

  return (
    <Box m="20px">
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Header title="Scheduling Matrix" subtitle="Find the Appropriate Schedule" />
      </Box>

      {/* Google Calendar Redirect Button */}
      <Box display="flex" justifyContent="center" mt={2}>
      <Button variant="contained" sx={{ backgroundColor: "#B0B0B0", color: "white" }} onClick={handleRedirect}>
          Open Google Calendar
        </Button>
      </Box>
    </Box>
  );
};

export default Scheduling;

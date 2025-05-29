import React, { useState } from "react";
import {
  Box,
  Button,
  Typography,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Alert,
  Snackbar,
} from "@mui/material";
import { tokens } from "../../theme";
import Header from "../../components/Header";

const SignupPage = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [openDialog, setOpenDialog] = useState(false);
  const [isSuccessEditPopupOpen, setIsSuccessEditPopupOpen] = useState(false); // Snackbar state

  // Form state
  const [form, setForm] = useState({
    agree: false,
    fullName: "",
    email: "",
    affiliation: "",
    motivation: "",
    expertise: "",
    businessAreas: [],
    preferredTime: "",
    specificTime: "",
    communicationMode: [],
  });

  const [error, setError] = useState("");

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleMentorshipSignup = () => {
    setOpenDialog(true);
  };

  const handleClose = () => {
    setOpenDialog(false);
    setError("");
    window.location.reload(); // Refresh on cancel
  };

  const isFormValid = () => {
    const requiredFields = [
      form.agree,
      form.fullName,
      form.email,
      form.affiliation,
      form.motivation,
      form.expertise,
      form.businessAreas.length > 0,
      form.preferredTime,
      form.communicationMode.length > 0,
    ];
    return requiredFields.every(Boolean);
  };

  const handleSubmit = () => {
    if (!isFormValid()) {
      setError("Please fill out all required fields.");
      return;
    }

    console.log("Form submitted:", form);
    setIsSuccessEditPopupOpen(true);

    setTimeout(() => {
      window.location.reload(); // Refresh after success
    }, 1000); // Match Snackbar duration
  };
  return (
    <Box m="20px">
      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Header title="Mentor Signup" subtitle="Sign up page for Mentors" />
      </Box>

      {/* Signup Button Box */}
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        gap={4}
        mt={4}
      >
        <Box
          width="100%"
          bgcolor={colors.primary[400]}
          display="flex"
          padding={2}
          gap={2}
        >
          <Button
            onClick={handleMentorshipSignup}
            variant="contained"
            color="secondary"
            sx={{ fontSize: "16px", py: "10px", flexGrow: 1 }}
          >
            Mentorship Sign up
          </Button>
        </Box>
      </Box>

      {/* Dialog Box */}
      <Dialog
        open={openDialog}
        onClose={handleClose}
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
        <DialogTitle
          sx={{
            backgroundColor: "#1E4D2B",
            color: "#fff",
            textAlign: "center",
            fontSize: "1.5rem",
            fontWeight: "bold",
          }}
        >
          LSEED Mentoring Signup Form
        </DialogTitle>
        <DialogContent
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: "24px", // Increased spacing between all elements
            py: 2,
            color: "#000",
          }}
        >
          {/* Agreement Section */}
          <Box>
            <Typography
              variant="body2"
              color="black"
              sx={{ mb: 1, mt: 1, textAlign: "justify" }}
            >
              Good day, Volunteer Mentors! Thank you once again for your
              interest in joining our panel of mentors for LSEED Mentoring. We
              truly appreciate it! For an overview, LSEED Mentoring is a
              three-phase online coaching & mentoring initiative of the
              Lasallian Social Enterprise for Economic Development (LSEED)
              Center, for Lasallian social entrepreneurs and partners. It also
              serves as a strategy to help Lasallian social enterprises to
              develop new mechanisms in order to adapt to the ever changing
              landscape of SE in the country. In order to properly coordinate
              mentoring session schedules, we would like to inquire of your
              availability this Academic Year. Your response to this survey will
              serve as options of our students/mentees when choosing a schedule
              for the mentoring sessions. For questions and/or clarifications,
              you may get in touch with us through email: lseed@dlsu.edu.ph
              norby.salonga@dlsu.edu.ph
            </Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.agree}
                  onChange={(e) => handleChange("agree", e.target.checked)}
                  sx={{ color: "#000", "&.Mui-checked": { color: "#000" } }}
                />
              }
              label={<Typography color="#000">I agree</Typography>}
            />
          </Box>

          {/* Text Fields */}
          {[
            { label: "Full Name", key: "fullName" },
            { label: "Email", key: "email" },
            {
              label: "Affiliation (Position/Organization)",
              key: "affiliation",
            },
            {
              label: "Reason/Motivation to volunteer",
              key: "motivation",
              multiline: true,
            },
            { label: "Areas of Expertise", key: "expertise" },
          ].map((field) => (
            <TextField
              key={field.key}
              label={field.label}
              fullWidth
              required
              multiline={field.multiline}
              minRows={field.multiline ? 2 : undefined}
              value={form[field.key]}
              onChange={(e) => handleChange(field.key, e.target.value)}
              InputProps={{ style: { color: "#000" } }}
              InputLabelProps={{ style: { color: "#000" } }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "#000" },
                  "&:hover fieldset": { borderColor: "#000" },
                  "&.Mui-focused fieldset": { borderColor: "#000" },
                },
              }}
            />
          ))}

          {/* Business Areas Multi-Select */}
          <FormControl fullWidth required>
            <InputLabel sx={{ color: "#000" }}>
              Business Areas (select multiple)
            </InputLabel>
            <Select
              multiple
              value={form.businessAreas}
              onChange={(e) => handleChange("businessAreas", e.target.value)}
              renderValue={(selected) => selected.join(", ")}
              sx={{
                color: "#000",
                "& .MuiOutlinedInput-notchedOutline": { borderColor: "#000" },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#000",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#000",
                },
              }}
            >
              {[
                "Application Development",
                "Business Registration Process",
                "Community Development",
                "Expansion/Acceleration",
                "Finance",
                "Human Resource",
                "Intellectual Property",
                "Legal Aspects and Compliance",
                "Management",
                "Marketing",
                "Online engagement",
                "Operations",
                "Product Development",
                "Sales",
                "Supply Chain and Logistics",
                "Technology Development",
                "Social Impact",
              ].map((area) => (
                <MenuItem key={area} value={area}>
                  <Checkbox checked={form.businessAreas.includes(area)} />
                  <Typography color="white">{area}</Typography>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Preferred Time */}
          <FormControl fullWidth required>
            <InputLabel sx={{ color: "#000" }}>Preferred Time</InputLabel>
            <Select
              value={form.preferredTime}
              onChange={(e) => handleChange("preferredTime", e.target.value)}
              sx={{
                color: "#000",
                "& .MuiOutlinedInput-notchedOutline": { borderColor: "#000" },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#000",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#000",
                },
              }}
            >
              <MenuItem value="Weekday (Morning)">
                Weekday (Morning) 8AM - 12NN
              </MenuItem>
              <MenuItem value="Weekday (Afternoon)">
                Weekday (Afternoon) 1PM - 5PM
              </MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </Select>
          </FormControl>

          {/* Specific Time (conditional) */}
          {form.preferredTime === "Other" && (
            <TextField
              label="Specify preferred time"
              fullWidth
              value={form.specificTime}
              onChange={(e) => handleChange("specificTime", e.target.value)}
              InputProps={{ style: { color: "#000" } }}
              InputLabelProps={{ style: { color: "#000" } }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "#000" },
                  "&:hover fieldset": { borderColor: "#000" },
                  "&.Mui-focused fieldset": { borderColor: "#000" },
                },
              }}
            />
          )}

          {/* Communication Modes */}
          <FormControl fullWidth required>
            <InputLabel sx={{ color: "#000" }}>Communication Modes</InputLabel>
            <Select
              multiple
              value={form.communicationMode}
              onChange={(e) =>
                handleChange("communicationMode", e.target.value)
              }
              renderValue={(selected) => selected.join(", ")}
              sx={{
                color: "#000",
                "& .MuiOutlinedInput-notchedOutline": { borderColor: "#000" },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#000",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#000",
                },
              }}
            >
              {[
                "Face to Face",
                "Facebook Messenger",
                "Google Meet",
                "Zoom",
                "Other",
              ].map((mode) => (
                <MenuItem key={mode} value={mode}>
                  <Checkbox checked={form.communicationMode.includes(mode)} />
                  <Typography color="white">{mode}</Typography>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {error && <Alert severity="error">{error}</Alert>}
        </DialogContent>

        <DialogActions
          sx={{
            padding: "16px",
            borderTop: "1px solid #000",
          }}
        >
          <Button
            onClick={handleClose}
            sx={{
              color: "#000",
              border: "1px solid #000",
              "&:hover": {
                backgroundColor: "#f0f0f0",
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!isFormValid()}
            sx={{
              backgroundColor: isFormValid() ? "#1E4D2B" : "#A0A0A0",
              color: "#fff",
              "&:hover": {
                backgroundColor: isFormValid() ? "#145A32" : "#A0A0A0",
              },
            }}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar Success Message */}
      <Snackbar
        open={isSuccessEditPopupOpen}
        autoHideDuration={3000}
        onClose={() => setIsSuccessEditPopupOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setIsSuccessEditPopupOpen(false)}
          severity="success"
          sx={{ width: "100%" }}
        >
          Successfully submitted!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SignupPage;

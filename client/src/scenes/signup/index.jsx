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

  const [openMentorDialog, setOpenMentorDialog] = useState(false);
  const [isMentorSuccessPopupOpen, setIsMentorSuccessPopupOpen] =
    useState(false);

  const [mentorForm, setMentorForm] = useState({
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

  const [mentorFormError, setMentorFormError] = useState("");

  const handleMentorFormChange = (field, value) => {
    setMentorForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleMentorSignupClick = () => {
    setOpenMentorDialog(true);
  };

  const handleMentorFormClose = () => {
    setOpenMentorDialog(false);
    setMentorFormError("");
    window.location.reload();
  };

  const isMentorFormValid = () => {
    const requiredFields = [
      mentorForm.agree,
      mentorForm.fullName,
      mentorForm.email,
      mentorForm.affiliation,
      mentorForm.motivation,
      mentorForm.expertise,
      mentorForm.businessAreas.length > 0,
      mentorForm.preferredTime,
      mentorForm.communicationMode.length > 0,
    ];
    return requiredFields.every(Boolean);
  };

  const handleMentorFormSubmit = () => {
    if (!isMentorFormValid()) {
      setMentorFormError("Please fill out all required fields.");
      return;
    }

    console.log("Mentor Form submitted:", mentorForm);
    setIsMentorSuccessPopupOpen(true);

    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Header title="Mentor Signup" subtitle="Sign up page for Mentors" />
      </Box>

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
            onClick={handleMentorSignupClick}
            variant="contained"
            color="secondary"
            sx={{ fontSize: "16px", py: "10px", flexGrow: 1 }}
          >
            Mentorship Sign up
          </Button>
        </Box>
      </Box>

      <Dialog
        open={openMentorDialog}
        onClose={handleMentorFormClose}
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
            gap: "24px",
            py: 2,
            color: "#000",
          }}
        >
          <Box>
            <Typography
              variant="body2"
              color="black"
              sx={{ mb: 1, mt: 1, textAlign: "justify" }}
            >
              Good day, Volunteer Mentors! Thank you once again for your
              interest in joining our panel of mentors for LSEED Mentoring. We
              truly appreciate it! ...
            </Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={mentorForm.agree}
                  onChange={(e) =>
                    handleMentorFormChange("agree", e.target.checked)
                  }
                  sx={{ color: "#000", "&.Mui-checked": { color: "#000" } }}
                />
              }
              label={<Typography color="#000">I agree</Typography>}
            />
          </Box>

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
              value={mentorForm[field.key]}
              onChange={(e) =>
                handleMentorFormChange(field.key, e.target.value)
              }
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

          <FormControl fullWidth required>
            <InputLabel sx={{ color: "#000" }}>
              Business Areas (select multiple)
            </InputLabel>
            <Select
              multiple
              value={mentorForm.businessAreas}
              onChange={(e) =>
                handleMentorFormChange("businessAreas", e.target.value)
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
                  <Checkbox checked={mentorForm.businessAreas.includes(area)} />
                  <Typography color="white">{area}</Typography>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth required>
            <InputLabel sx={{ color: "#000" }}>Preferred Time</InputLabel>
            <Select
              value={mentorForm.preferredTime}
              onChange={(e) =>
                handleMentorFormChange("preferredTime", e.target.value)
              }
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

          {mentorForm.preferredTime === "Other" && (
            <TextField
              label="Specify preferred time"
              fullWidth
              value={mentorForm.specificTime}
              onChange={(e) =>
                handleMentorFormChange("specificTime", e.target.value)
              }
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

          <FormControl fullWidth required>
            <InputLabel sx={{ color: "#000" }}>Communication Modes</InputLabel>
            <Select
              multiple
              value={mentorForm.communicationMode}
              onChange={(e) =>
                handleMentorFormChange("communicationMode", e.target.value)
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
                  <Checkbox
                    checked={mentorForm.communicationMode.includes(mode)}
                  />
                  <Typography color="white">{mode}</Typography>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {mentorFormError && <Alert severity="error">{mentorFormError}</Alert>}
        </DialogContent>

        <DialogActions sx={{ padding: "16px", borderTop: "1px solid #000" }}>
          <Button
            onClick={handleMentorFormClose}
            sx={{
              color: "#000",
              border: "1px solid #000",
              "&:hover": { backgroundColor: "#f0f0f0" },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleMentorFormSubmit}
            variant="contained"
            disabled={!isMentorFormValid()}
            sx={{
              backgroundColor: isMentorFormValid() ? "#1E4D2B" : "#A0A0A0",
              color: "#fff",
              "&:hover": {
                backgroundColor: isMentorFormValid() ? "#145A32" : "#A0A0A0",
              },
            }}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={isMentorSuccessPopupOpen}
        autoHideDuration={3000}
        onClose={() => setIsMentorSuccessPopupOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setIsMentorSuccessPopupOpen(false)}
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

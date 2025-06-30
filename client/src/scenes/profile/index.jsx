import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  TextField,
  Checkbox,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Snackbar,
  Alert,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../theme";
import Header from "../../components/Header";

const ProfilePage = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  // User role could come from auth/user context
  const userRole = "Mentor"; // Example hard-coded role for demo

  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
    contactnum: "",
    businessAreas: [],
    preferredTime: "",
    specificTime: "",
    communicationMode: [],
    bio: "",
  });

  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Example of fetched data
    const fetchedData = {
      fullName: "Flore Cientech",
      email: "florecientech@gmail.com",
      contactnum: "09950965570",
      businessAreas: ["Marketing", "Operations"],
      preferredTime: "Weekday (Morning)",
      specificTime: "",
      communicationMode: ["Facebook Messenger", "Zoom"],
      bio: "Passionate about mentoring and social impact.",
    };
    setProfileData(fetchedData);
  }, []);

  const handleChange = (field, value) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // TODO: Save logic (API)
    console.log("Updated Profile:", profileData);
    setIsSuccess(true);
  };

  return (
    <Box m="20px">
      <Header title="User Profile" subtitle="View and update your profile details" />

      <Box mt={4} display="flex" flexDirection="column" gap={3} maxWidth="600px">
        <TextField
          label="Full Name"
          fullWidth
          value={profileData.fullName}
          onChange={(e) => handleChange("fullName", e.target.value)}
          InputProps={{ style: { color: "#000" } }}
          InputLabelProps={{ style: { color: "#000" } }}
          sx={inputStyle}
        />

        <TextField
          label="Email"
          fullWidth
          value={profileData.email}
          disabled
          InputProps={{ style: { color: "#000" } }}
          InputLabelProps={{ style: { color: "#000" } }}
          sx={inputStyle}
        />

        <TextField
          label="Contact Number"
          fullWidth
          value={profileData.contactnum}
          onChange={(e) => handleChange("contactnum", e.target.value)}
          InputProps={{ style: { color: "#000" } }}
          InputLabelProps={{ style: { color: "#000" } }}
          sx={inputStyle}
        />

        {userRole === "Mentor" && (
          <>
            <FormControl fullWidth>
              <InputLabel sx={{ color: "#000" }}>Business Areas</InputLabel>
              <Select
                multiple
                value={profileData.businessAreas}
                onChange={(e) => handleChange("businessAreas", e.target.value)}
                renderValue={(selected) => selected.join(", ")}
                sx={selectStyle}
              >
                {businessAreaOptions.map((area) => (
                  <MenuItem key={area} value={area}>
                    <Checkbox checked={profileData.businessAreas.includes(area)} />
                    <Typography color="white">{area}</Typography>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel sx={{ color: "#000" }}>Preferred Mentoring Time</InputLabel>
              <Select
                value={profileData.preferredTime}
                onChange={(e) => handleChange("preferredTime", e.target.value)}
                sx={selectStyle}
              >
                <MenuItem value="Weekday (Morning)">Weekday (Morning) 8AM - 12NN</MenuItem>
                <MenuItem value="Weekday (Afternoon)">Weekday (Afternoon) 1PM - 5PM</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>

            {profileData.preferredTime === "Other" && (
              <TextField
                label="Specify preferred time"
                fullWidth
                value={profileData.specificTime}
                onChange={(e) => handleChange("specificTime", e.target.value)}
                InputProps={{ style: { color: "#000" } }}
                InputLabelProps={{ style: { color: "#000" } }}
                sx={inputStyle}
              />
            )}

            <FormControl fullWidth>
              <InputLabel sx={{ color: "#000" }}>Communication Modes</InputLabel>
              <Select
                multiple
                value={profileData.communicationMode}
                onChange={(e) => handleChange("communicationMode", e.target.value)}
                renderValue={(selected) => selected.join(", ")}
                sx={selectStyle}
              >
                {communicationModeOptions.map((mode) => (
                  <MenuItem key={mode} value={mode}>
                    <Checkbox checked={profileData.communicationMode.includes(mode)} />
                    <Typography color="white">{mode}</Typography>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Short Bio / Experience"
              multiline
              rows={3}
              fullWidth
              value={profileData.bio}
              onChange={(e) => handleChange("bio", e.target.value)}
              InputProps={{ style: { color: "#000" } }}
              InputLabelProps={{ style: { color: "#000" } }}
              sx={inputStyle}
            />
          </>
        )}

        {error && <Alert severity="error">{error}</Alert>}

        <Box display="flex" justifyContent="flex-end" gap={2}>
          <Button
            variant="outlined"
            sx={buttonOutlinedStyle}
            onClick={() => window.location.reload()}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            sx={buttonContainedStyle}
          >
            Save Changes
          </Button>
        </Box>
      </Box>

      <Snackbar
        open={isSuccess}
        autoHideDuration={3000}
        onClose={() => setIsSuccess(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setIsSuccess(false)}
          severity="success"
          sx={{ width: "100%" }}
        >
          Profile updated successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
};

// Styles
const inputStyle = {
  "& .MuiOutlinedInput-root": {
    "& fieldset": { borderColor: "#000" },
    "&:hover fieldset": { borderColor: "#000" },
    "&.Mui-focused fieldset": { borderColor: "#000" },
  },
};

const selectStyle = {
  color: "#000",
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#000" },
  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#000" },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#000" },
};

const buttonOutlinedStyle = {
  color: "#000",
  border: "1px solid #000",
  "&:hover": { backgroundColor: "#f0f0f0" },
};

const buttonContainedStyle = {
  backgroundColor: "#1E4D2B",
  color: "#fff",
  "&:hover": { backgroundColor: "#145A32" },
};

// Options
const businessAreaOptions = [
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
];

const communicationModeOptions = [
  "Face to Face",
  "Facebook Messenger",
  "Google Meet",
  "Zoom",
  "Other",
];

export default ProfilePage;
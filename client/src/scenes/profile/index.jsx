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
  Card,
  CardContent,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../theme";
import Header from "../../components/Header";

const ProfilePage = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    contactnum: "",
    businessAreas: [],
    preferredTime: "",
    specificTime: "",
    communicationMode: [],
    bio: "",
    role: "",
  });

  const [originalData, setOriginalData] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("http://localhost:4000/api/profile", {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch profile: ${response.status}`);
        }

        const data = await response.json();
        const profileInfo = {
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          email: data.email || "",
          contactnum: data.contactnum || "",
          businessAreas: data.businessAreas || [],
          preferredTime: "",
          specificTime: "",
          communicationMode: [],
          bio: "",
          role: data.role || "",
        };

        setProfileData(profileInfo);
        setOriginalData(profileInfo);
      } catch (err) {
        setError(`Failed to load profile: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (field, value) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setError("");
      const response = await fetch("http://localhost:4000/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `Server error: ${response.status}`
        );
      }

      setIsSuccess(true);
      setIsEditing(false);
      setOriginalData({ ...profileData });
    } catch (err) {
      setError(err.message || "Failed to save changes");
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError("");
    if (originalData) {
      setProfileData({ ...originalData });
    }
  };

  if (loading) {
    return (
      <Box m="20px">
        <Typography>Loading profile...</Typography>
      </Box>
    );
  }

  return (
    <Box m="20px">
      <Header
        title="USER PROFILE"
        subtitle="View and edit your profile details"
      />

      {/* Role Badge */}
      <Box mb={3}>
        <Typography
          variant="h6"
          sx={{
            display: "inline-block",
            px: 3,
            py: 1,
            backgroundColor: colors.primary[400],
            color: colors.grey[100],
            borderRadius: "20px",
            fontWeight: "bold",
          }}
        >
          Role: {profileData.role}
        </Typography>
      </Box>

      {/* Action Buttons */}
      <Box display="flex" gap={2} mb={3} justifyContent="left">
        {!isEditing ? (
          <Button
            variant="contained"
            onClick={() => setIsEditing(true)}
            sx={{
              backgroundColor: colors.blueAccent[600],
              color: "white",
              "&:hover": { backgroundColor: colors.blueAccent[700] },
            }}
          >
            Edit Profile
          </Button>
        ) : (
          <>
            <Button
              variant="outlined"
              onClick={handleCancel}
              sx={{
                color: colors.grey[100],
                borderColor: colors.grey[400],
                "&:hover": { borderColor: colors.grey[300] },
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              sx={{
                backgroundColor: colors.greenAccent[600],
                color: "white",
                "&:hover": { backgroundColor: colors.greenAccent[700] },
              }}
            >
              Save Changes
            </Button>
          </>
        )}
      </Box>

      {/* Profile Card */}
      <Card sx={{ backgroundColor: colors.primary[400], mb: 3 }}>
        <CardContent>
          <Typography variant="h5" color={colors.grey[100]} mb={3}>
            Basic Information
          </Typography>

          <Box display="flex" flexDirection="column" gap={2.5}>
            <Box display="flex" gap={2}>
              <TextField
                label="First Name"
                fullWidth
                value={profileData.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
                disabled={!isEditing}
                sx={{
                  "& .MuiInputLabel-root": { color: colors.grey[100] },
                  "& .MuiOutlinedInput-root": {
                    color: colors.grey[100],
                    "& fieldset": { borderColor: colors.grey[400] },
                    "&:hover fieldset": { borderColor: colors.grey[300] },
                    "&.Mui-focused fieldset": {
                      borderColor: colors.blueAccent[500],
                    },
                  },
                }}
              />
              <TextField
                label="Last Name"
                fullWidth
                value={profileData.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
                disabled={!isEditing}
                sx={{
                  "& .MuiInputLabel-root": { color: colors.grey[100] },
                  "& .MuiOutlinedInput-root": {
                    color: colors.grey[100],
                    "& fieldset": { borderColor: colors.grey[400] },
                    "&:hover fieldset": { borderColor: colors.grey[300] },
                    "&.Mui-focused fieldset": {
                      borderColor: colors.blueAccent[500],
                    },
                  },
                }}
              />
            </Box>

            <TextField
              label="Email Address"
              fullWidth
              value={profileData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              disabled={!isEditing}
              sx={{
                "& .MuiInputLabel-root": { color: colors.grey[100] },
                "& .MuiOutlinedInput-root": {
                  color: colors.grey[100],
                  "& fieldset": { borderColor: colors.grey[400] },
                  "&:hover fieldset": { borderColor: colors.grey[300] },
                  "&.Mui-focused fieldset": {
                    borderColor: colors.blueAccent[500],
                  },
                },
              }}
            />

            <TextField
              label="Contact Number"
              fullWidth
              value={profileData.contactnum}
              onChange={(e) => handleChange("contactnum", e.target.value)}
              disabled={!isEditing}
              sx={{
                "& .MuiInputLabel-root": { color: colors.grey[100] },
                "& .MuiOutlinedInput-root": {
                  color: colors.grey[100],
                  "& fieldset": { borderColor: colors.grey[400] },
                  "&:hover fieldset": { borderColor: colors.grey[300] },
                  "&.Mui-focused fieldset": {
                    borderColor: colors.blueAccent[500],
                  },
                },
              }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Mentor-specific fields */}
      {profileData.role === "Mentor" && (
        <Card sx={{ backgroundColor: colors.primary[400], mb: 3 }}>
          <CardContent>
            <Typography variant="h5" color={colors.grey[100]} mb={3}>
              Mentor Specialization
            </Typography>

            <Box display="flex" flexDirection="column" gap={2.5}>
              <FormControl fullWidth disabled={!isEditing}>
                <InputLabel sx={{ color: colors.grey[100] }}>
                  Business Areas
                </InputLabel>
                <Select
                  multiple
                  value={profileData.businessAreas}
                  onChange={(e) =>
                    handleChange("businessAreas", e.target.value)
                  }
                  renderValue={(selected) => selected.join(", ")}
                  sx={{
                    color: colors.grey[100],
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: colors.grey[400],
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: colors.grey[300],
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: colors.blueAccent[500],
                    },
                  }}
                >
                  {businessAreaOptions.map((area) => (
                    <MenuItem key={area} value={area}>
                      <Checkbox
                        checked={profileData.businessAreas.includes(area)}
                        sx={{ color: colors.greenAccent[500] }}
                      />
                      <Typography>{area}</Typography>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth disabled={!isEditing}>
                <InputLabel sx={{ color: colors.grey[100] }}>
                  Preferred Mentoring Time
                </InputLabel>
                <Select
                  value={profileData.preferredTime}
                  onChange={(e) =>
                    handleChange("preferredTime", e.target.value)
                  }
                  sx={{
                    color: colors.grey[100],
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: colors.grey[400],
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: colors.grey[300],
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: colors.blueAccent[500],
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

              {profileData.preferredTime === "Other" && (
                <TextField
                  label="Specify preferred time"
                  fullWidth
                  value={profileData.specificTime}
                  onChange={(e) => handleChange("specificTime", e.target.value)}
                  disabled={!isEditing}
                  sx={{
                    "& .MuiInputLabel-root": { color: colors.grey[100] },
                    "& .MuiOutlinedInput-root": {
                      color: colors.grey[100],
                      "& fieldset": { borderColor: colors.grey[400] },
                      "&:hover fieldset": { borderColor: colors.grey[300] },
                      "&.Mui-focused fieldset": {
                        borderColor: colors.blueAccent[500],
                      },
                    },
                  }}
                />
              )}

              <FormControl fullWidth disabled={!isEditing}>
                <InputLabel sx={{ color: colors.grey[100] }}>
                  Communication Modes
                </InputLabel>
                <Select
                  multiple
                  value={profileData.communicationMode}
                  onChange={(e) =>
                    handleChange("communicationMode", e.target.value)
                  }
                  renderValue={(selected) => selected.join(", ")}
                  sx={{
                    color: colors.grey[100],
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: colors.grey[400],
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: colors.grey[300],
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: colors.blueAccent[500],
                    },
                  }}
                >
                  {communicationModeOptions.map((mode) => (
                    <MenuItem key={mode} value={mode}>
                      <Checkbox
                        checked={profileData.communicationMode.includes(mode)}
                        sx={{ color: colors.greenAccent[500] }}
                      />
                      <Typography>{mode}</Typography>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Short Bio / Experience"
                multiline
                rows={4}
                fullWidth
                value={profileData.bio}
                onChange={(e) => handleChange("bio", e.target.value)}
                disabled={!isEditing}
                placeholder="Tell us about your experience and expertise..."
                sx={{
                  "& .MuiInputLabel-root": { color: colors.grey[100] },
                  "& .MuiOutlinedInput-root": {
                    color: colors.grey[100],
                    "& fieldset": { borderColor: colors.grey[400] },
                    "&:hover fieldset": { borderColor: colors.grey[300] },
                    "&.Mui-focused fieldset": {
                      borderColor: colors.blueAccent[500],
                    },
                  },
                }}
              />
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Success Snackbar */}
      <Snackbar
        open={isSuccess}
        autoHideDuration={4000}
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

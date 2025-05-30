import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../../styles/Login.css";
import { useAuth } from "../../context/authContext";
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

const Login = () => {
  const { login } = useAuth();
  const [isFlipped, setIsFlipped] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [openDialog, setOpenDialog] = useState(false);

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

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    try {
      const response = await fetch("http://localhost:4000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        login(data.user);
        window.location.href = data.redirect || "/dashboard";
      } else {
        setErrorMessage(data.message || "Login failed");
      }
    } catch (error) {
      setErrorMessage("An error occurred. Please try again.");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:4000/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (response.ok) {
        alert("Signup successful! Please log in.");
        setIsFlipped(false);
      } else {
        setErrorMessage(data.message || "Signup failed");
      }
    } catch (error) {
      setErrorMessage("An error occurred. Please try again.");
    }
  };

  return (
    <div className="container">
      <input
        type="checkbox"
        id="flip"
        checked={isFlipped}
        onChange={handleFlip}
        style={{ display: "none" }}
      />
      <div className="cover">
        <div className="front">
          <img src="frontphot.jpg" alt="Welcome" />
          <div className="text">
            <span className="text-1">
              <h4>WELCOME TO</h4>
              <h2>LSEED Insight</h2>
            </span>
            <span className="text-2">Let's get started</span>
          </div>
        </div>
        <div className="back">
          <img src="backphot.png" alt="Join Us" />
          <div className="text">
            <span className="text-1">
              Want to become part of the <br /> Team?
            </span>
          </div>
        </div>
      </div>

      <div className="forms">
        <div className="form-content">
          {!isFlipped ? (
            <div className="login-form">
              <div className="title">
                <h2>LOGIN</h2>
              </div>
              <form onSubmit={handleLogin}>
                <div className="input-boxes">
                  <div className="input-box">
                    <i className="fas fa-envelope"></i>
                    <input
                      type="email"
                      name="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="input-box">
                    <i className="fas fa-lock"></i>
                    <input
                      type="password"
                      name="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="text">
                    <Link to="/forgot-password">Forgot password?</Link>
                  </div>
                  <div className="button input-box">
                    <input type="submit" value="Log-In" />
                  </div>
                  {errorMessage && (
                    <div className="error-message">{errorMessage}</div>
                  )}
                  <div className="separator">OR</div>
                  <div className="text sign-up-text">
                    Don't have an account?{" "}
                    <label htmlFor="flip">Sign up now</label>
                  </div>
                </div>
              </form>
            </div>
          ) : (
            <div className="signup-form">
              <div className="title">
                <h2>SIGN UP</h2>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="input-boxes">
                  <div className="input-box">
                    <i className="fas fa-user"></i>
                    <input
                      type="text"
                      name="firstName"
                      placeholder="Enter your first name"
                      required
                      value={formData.firstName}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="input-box">
                    <i className="fas fa-user"></i>
                    <input
                      type="text"
                      name="lastName"
                      placeholder="Enter your last name"
                      required
                      value={formData.lastName}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="input-box">
                    <i className="fas fa-envelope"></i>
                    <input
                      type="email"
                      name="email"
                      placeholder="Enter your email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="input-box">
                    <i className="fas fa-lock"></i>
                    <input
                      type="password"
                      name="password"
                      placeholder="Enter your password"
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="checkbox-wrapper terms-checkbox">
                    <input type="checkbox" id="terms" name="terms" required />
                    <label htmlFor="terms" onClick={() => setOpenDialog(true)}>
                      Terms and Conditions
                    </label>
                  </div>
                  <div className="button input-box">
                    <input type="submit" value="Register" />
                  </div>

                  <Button
                    onClick={handleMentorSignupClick}
                    variant="contained"
                    disableElevation
                    sx={{
                      width: "100%", // Make the button stretch to full width
                      color: "#fff",
                      backgroundColor: "#126636",
                      borderRadius: "6px",
                      padding: "12px 24px",
                      fontSize: "16px",
                      textTransform: "none",
                      transition: "all 0.4s ease",
                      cursor: "pointer",
                      "&:hover": {
                        backgroundColor: "#0d4c28",
                      },
                    }}
                  >
                    Mentorship Sign up
                  </Button>

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
                          Good day, Volunteer Mentors! Thank you once again for
                          your interest in joining our panel of mentors for
                          LSEED Mentoring. We truly appreciate it! ...
                        </Typography>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={mentorForm.agree}
                              onChange={(e) =>
                                handleMentorFormChange(
                                  "agree",
                                  e.target.checked
                                )
                              }
                              sx={{
                                color: "#000",
                                "&.Mui-checked": { color: "#000" },
                              }}
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
                            handleMentorFormChange(
                              "businessAreas",
                              e.target.value
                            )
                          }
                          renderValue={(selected) => selected.join(", ")}
                          sx={{
                            color: "#000",
                            "& .MuiOutlinedInput-notchedOutline": {
                              borderColor: "#000",
                            },
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
                              <Checkbox
                                checked={mentorForm.businessAreas.includes(
                                  area
                                )}
                              />
                              <Typography color="white">{area}</Typography>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <FormControl fullWidth required>
                        <InputLabel sx={{ color: "#000" }}>
                          Preferred Time
                        </InputLabel>
                        <Select
                          value={mentorForm.preferredTime}
                          onChange={(e) =>
                            handleMentorFormChange(
                              "preferredTime",
                              e.target.value
                            )
                          }
                          sx={{
                            color: "#000",
                            "& .MuiOutlinedInput-notchedOutline": {
                              borderColor: "#000",
                            },
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
                            handleMentorFormChange(
                              "specificTime",
                              e.target.value
                            )
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
                        <InputLabel sx={{ color: "#000" }}>
                          Communication Modes
                        </InputLabel>
                        <Select
                          multiple
                          value={mentorForm.communicationMode}
                          onChange={(e) =>
                            handleMentorFormChange(
                              "communicationMode",
                              e.target.value
                            )
                          }
                          renderValue={(selected) => selected.join(", ")}
                          sx={{
                            color: "#000",
                            "& .MuiOutlinedInput-notchedOutline": {
                              borderColor: "#000",
                            },
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
                                checked={mentorForm.communicationMode.includes(
                                  mode
                                )}
                              />
                              <Typography color="white">{mode}</Typography>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      {mentorFormError && (
                        <Alert severity="error">{mentorFormError}</Alert>
                      )}
                    </DialogContent>

                    <DialogActions
                      sx={{ padding: "16px", borderTop: "1px solid #000" }}
                    >
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
                          backgroundColor: isMentorFormValid()
                            ? "#1E4D2B"
                            : "#A0A0A0",
                          color: "#fff",
                          "&:hover": {
                            backgroundColor: isMentorFormValid()
                              ? "#145A32"
                              : "#A0A0A0",
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
                  {errorMessage && (
                    <div className="error-message">{errorMessage}</div>
                  )}
                  <div className="separator">OR</div>
                  <div className="text sign-up-text">
                    Already have an account?{" "}
                    <label htmlFor="flip">Login now</label>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        className="custom-dialog"
      >
        <DialogTitle className="custom-dialog-title">
          Terms and Conditions
        </DialogTitle>
        <DialogContent className="custom-dialog-content">
          <Typography className="custom-dialog-text">
            Here are the terms and conditions for using this service...
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Accept</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Login;

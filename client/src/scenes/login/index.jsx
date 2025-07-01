import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../../styles/Login.css";
import { useAuth } from "../../context/authContext";
import {
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Checkbox,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Alert,
  Snackbar,
  OutlinedInput,
  ListItemText,
  Box,
} from "@mui/material";

const Login = () => {
  const { login } = useAuth();
  const [isFlipped, setIsFlipped] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [passwordStrength, setPasswordStrength] = useState("");
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const [passwordChecklist, setPasswordChecklist] = useState({
    length: false,
    uppercase: false,
    number: false,
    specialChar: false,
  });
  const [formData, setFormData] = useState({
    // General Sign-Up Info
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    contactno: "",

    // Mentor-Specific Info
    affiliation: "", // Position/Organization
    motivation: "", // Reason to volunteer
    expertise: "", // Areas of Expertise
    businessAreas: [], // Multiple choice
    preferredTime: [], // Dropdown selection
    specificTime: "", // If preferredTime is "Other"
    communicationMode: [], // Multiple choice
  });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success"); // or "error", "info", etc.
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);

  const businessAreasList = [
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

  const preferredTimeList = [
    "Weekday (Morning) 8AM - 12NN",
    "Weekday (Afternoon) 1PM - 5PM",
    "Other",
  ];

  const communicationModes = [
    "Face to Face",
    "Facebook Messenger",
    "Google Meet",
    "Zoom",
    "Other",
  ];

  const [menuOpen, setMenuOpen] = useState(false);
  const [menuOpenCommunicationModes, setMenuOpenCommunicationModes] =
    useState(false);
  const [menuOpenPreferredTime, setMenuOpenPreferredTime] = useState(false);

  const handleDonePreferredTime = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpenPreferredTime(false);
  };

  const handleDoneCommunicationModes = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpenCommunicationModes(false);
  };

  const handleDoneClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setMenuOpen(false);
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // 🔥 this enables sending/receiving cookies
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

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
    const { name, value, type, checked } = e.target;

    const updatedForm = {
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    };

    setFormData(updatedForm);

    // If user starts fixing the confirm password, and it now matches, clear the red border
    if (name === "confirmPassword" && hasSubmitted) {
      setHasSubmitted(false); // Remove red border and helper text
    }

    if (name === "password") {
      setPasswordStrength(getPasswordStrength(value));
      setPasswordChecklist(getPasswordChecklist(value));
    }
  };

  const getPasswordStrength = (password) => {
    if (password.length < 6) return "Weak";
    if (
      /[A-Z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[\W_]/.test(password)
    )
      return "Strong";
    return "Moderate";
  };

  const getPasswordChecklist = (password) => ({
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    specialChar: /[\W_]/.test(password),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setHasSubmitted(true); // Mark that the user tried submitting

    // Validate password match
    if (formData.password !== formData.confirmPassword) {
      setSnackbarMessage(
        "Passwords do not match. Please correct them before submitting."
      );
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    console.log("Success");

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/signup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();
      if (response.ok) {
        setSnackbarMessage(
          "Signup successful! Check email on application status"
        );
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
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
              <div className="signup-scroll">
                <div className="title">
                  <h2>SIGN UP</h2>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="input-boxes">
                    {[
                      { label: "First Name", name: "firstName", type: "text" },
                      { label: "Last Name", name: "lastName", type: "text" },
                      { label: "Email", name: "email", type: "email" },
                      { label: "Contact No.", name: "contactno", type: "text" },
                      { label: "Password", name: "password", type: "password" },
                    ].map(({ label, name, type }) => (
                      <TextField
                        key={name}
                        label={label}
                        name={name}
                        type={type}
                        fullWidth
                        required
                        value={formData[name]}
                        onChange={handleInputChange}
                        InputProps={{ style: { color: "#000" } }}
                        InputLabelProps={{ style: { color: "#000" } }}
                        sx={{
                          mt: 2,
                          "& .MuiOutlinedInput-root": {
                            "& fieldset": { borderColor: "#000" },
                            "&:hover fieldset": { borderColor: "#000" },
                            "&.Mui-focused fieldset": { borderColor: "#000" },
                          },
                        }}
                      />
                    ))}
                    {formData.password && (
                      <Box sx={{ mt: 1, ml: 1 }}>
                        <Typography
                          variant="body2"
                          sx={{ color: "#000", mb: 0.5 }}
                        >
                          Your password must contain:
                        </Typography>
                        <ul style={{ paddingLeft: "20px", marginTop: 0 }}>
                          <li
                            style={{
                              color: passwordChecklist.length ? "green" : "red",
                            }}
                          >
                            At least 8 characters
                          </li>
                          <li
                            style={{
                              color: passwordChecklist.uppercase
                                ? "green"
                                : "red",
                            }}
                          >
                            At least one uppercase letter
                          </li>
                          <li
                            style={{
                              color: passwordChecklist.number ? "green" : "red",
                            }}
                          >
                            At least one number
                          </li>
                          <li
                            style={{
                              color: passwordChecklist.specialChar
                                ? "green"
                                : "red",
                            }}
                          >
                            At least one special character (!@#$%^&*)
                          </li>
                        </ul>
                      </Box>
                    )}
                    <TextField
                      label="Confirm Password"
                      name="confirmPassword"
                      type="password"
                      fullWidth
                      required
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      error={
                        hasSubmitted &&
                        formData.password !== formData.confirmPassword
                      }
                      helperText={
                        hasSubmitted &&
                        formData.password !== formData.confirmPassword
                          ? "Passwords do not match"
                          : ""
                      }
                      InputProps={{ style: { color: "#000" } }}
                      InputLabelProps={{ style: { color: "#000" } }}
                      sx={{
                        mt: 2,
                        "& .MuiOutlinedInput-root": {
                          "& fieldset": { borderColor: "#000" },
                          "&:hover fieldset": { borderColor: "#000" },
                          "&.Mui-focused fieldset": { borderColor: "#000" },
                        },
                      }}
                    />
                    {[
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
                        name={field.key}
                        label={field.label}
                        fullWidth
                        required
                        multiline={field.multiline}
                        minRows={field.multiline ? 2 : undefined}
                        value={formData[field.key]}
                        onChange={(e) => handleInputChange(e, field.key)}
                        InputProps={{ style: { color: "#000" } }}
                        InputLabelProps={{ style: { color: "#000" } }}
                        sx={{
                          mt: 2,
                          "& .MuiOutlinedInput-root": {
                            "& fieldset": { borderColor: "#000" },
                            "&:hover fieldset": { borderColor: "#000" },
                            "&.Mui-focused fieldset": { borderColor: "#000" },
                          },
                        }}
                      />
                    ))}

                    {/* Business Areas */}
                    <FormControl fullWidth sx={{ mt: 2 }}>
                      <InputLabel sx={{ color: "#000" }}>
                        Business Areas
                      </InputLabel>
                      <Select
                        multiple
                        value={formData.businessAreas}
                        onChange={(e) => {
                          const selected = e.target.value.filter(Boolean); // 💡 remove undefined/null/empty
                          setFormData((prev) => ({
                            ...prev,
                            businessAreas: selected,
                          }));
                        }}
                        input={<OutlinedInput label="Business Areas" />}
                        open={menuOpen}
                        onOpen={() => setMenuOpen(true)}
                        onClose={() => setMenuOpen(false)}
                        renderValue={(selected) => (
                          <span style={{ color: "#000" }}>
                            {selected.join(", ")}
                          </span>
                        )}
                        sx={{
                          color: "#000", // Changed from "#fff" to "#000"
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#000",
                          },
                        }}
                      >
                        {businessAreasList.filter(Boolean).map((area) => (
                          <MenuItem
                            key={area}
                            value={area}
                            onClick={() => setMenuOpen(true)}
                          >
                            <Checkbox
                              checked={formData.businessAreas.includes(area)}
                            />
                            <ListItemText
                              primary={area}
                              sx={{ color: "white" }}
                            />
                          </MenuItem>
                        ))}

                        {/* Done Button */}
                        <MenuItem
                          disableRipple
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={handleDoneClick}
                          sx={{ justifyContent: "center" }}
                        >
                          <Button
                            variant="contained"
                            color="primary"
                            sx={{ width: "100%" }}
                          >
                            Done
                          </Button>
                        </MenuItem>
                      </Select>
                    </FormControl>

                    {/* Preferred Time Selection */}
                    <FormControl fullWidth required sx={{ mt: 2 }}>
                      <InputLabel sx={{ color: "#000" }}>
                        Preferred Time
                      </InputLabel>
                      <Select
                        multiple
                        value={formData.preferredTime}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            preferredTime: e.target.value.filter(Boolean), // filter out undefined
                          }))
                        }
                        input={<OutlinedInput label="Preferred Time" />}
                        open={menuOpenPreferredTime}
                        onOpen={() => setMenuOpenPreferredTime(true)}
                        onClose={() => setMenuOpenPreferredTime(false)}
                        renderValue={(selected) => (
                          <span style={{ color: "#000" }}>
                            {selected.join(", ")}
                          </span>
                        )}
                        sx={{
                          color: "#000", // Changed from "#fff" to "#000"
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#000",
                          },
                        }}
                      >
                        {preferredTimeList.filter(Boolean).map((time) => (
                          <MenuItem key={time} value={time}>
                            <Checkbox
                              checked={formData.preferredTime.includes(time)}
                            />
                            <ListItemText
                              primary={time}
                              sx={{ color: "white" }}
                            />
                          </MenuItem>
                        ))}

                        {/* Done button */}
                        <MenuItem
                          disableRipple
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={handleDonePreferredTime}
                          sx={{ justifyContent: "center" }}
                        >
                          <Button variant="contained" color="primary" fullWidth>
                            Done
                          </Button>
                        </MenuItem>
                      </Select>
                    </FormControl>

                    {formData.preferredTime.includes("Other") && (
                      <TextField
                        label="Specify preferred time"
                        fullWidth
                        required
                        value={formData.specificTime}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            specificTime: e.target.value,
                          }))
                        }
                        InputProps={{ style: { color: "#000" } }}
                        InputLabelProps={{ style: { color: "#000" } }}
                        sx={{
                          mt: 2,
                          "& .MuiOutlinedInput-root": {
                            "& fieldset": { borderColor: "#000" },
                            "&:hover fieldset": { borderColor: "#000" },
                            "&.Mui-focused fieldset": { borderColor: "#000" },
                          },
                        }}
                      />
                    )}

                    {/* Communication Modes */}
                    <FormControl fullWidth required sx={{ mt: 2 }}>
                      <InputLabel sx={{ color: "#000" }}>
                        Communication Modes
                      </InputLabel>
                      <Select
                        multiple
                        open={menuOpenCommunicationModes}
                        onOpen={() => setMenuOpenCommunicationModes(true)}
                        onClose={() => setMenuOpenCommunicationModes(false)}
                        value={formData.communicationMode}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            communicationMode: e.target.value.filter(Boolean),
                          }))
                        }
                        input={<OutlinedInput label="Communication Modes" />}
                        renderValue={(selected) => (
                          <span style={{ color: "#000" }}>
                            {selected.join(", ")}
                          </span>
                        )}
                        sx={{
                          color: "#000", // Changed from "#fff" to "#000"
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
                        {communicationModes.filter(Boolean).map((mode) => (
                          <MenuItem key={mode} value={mode}>
                            <Checkbox
                              checked={formData.communicationMode.includes(
                                mode
                              )}
                            />
                            <ListItemText
                              primary={mode}
                              sx={{ color: "white" }}
                            />
                          </MenuItem>
                        ))}
                        <MenuItem
                          disableRipple
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={handleDoneCommunicationModes}
                          sx={{ justifyContent: "center" }}
                        >
                          <Button
                            variant="contained"
                            color="primary"
                            sx={{ width: "100%" }}
                          >
                            Done
                          </Button>
                        </MenuItem>
                      </Select>
                    </FormControl>
                    {/* Terms and Submit */}
                    <div
                      className="checkbox-wrapper terms-checkbox"
                      style={{ marginTop: "30px" }}
                    >
                      <input type="checkbox" id="terms" name="terms" required />
                      <label
                        htmlFor="terms"
                        onClick={() => setOpenDialog(true)}
                      >
                        Terms and Conditions
                      </label>
                    </div>

                    <div className="button input-box">
                      <input type="submit" value="Register" />
                    </div>

                    {errorMessage && (
                      <div className="error-message">{errorMessage}</div>
                    )}

                    <div className="separator">OR</div>
                    <div
                      className="text sign-up-text"
                      style={{ marginBottom: "40px" }}
                    >
                      Already have an account?{" "}
                      <label htmlFor="flip">Login now</label>
                    </div>
                  </div>
                </form>
              </div>
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
          <Box sx={{ color: "#000", textAlign: "justify" }}>
            <Typography variant="body1" paragraph>
              <strong>Good day, Volunteer Mentors!</strong>
            </Typography>

            <Typography variant="body1" paragraph>
              Thank you once again for your interest in joining our panel of
              mentors for <strong>LSEED Mentoring</strong>. We truly appreciate
              it!
            </Typography>

            <Typography variant="body1" paragraph>
              For an overview, LSEED Mentoring is a three-phase online coaching
              & mentoring initiative of the{" "}
              <strong>
                Lasallian Social Enterprise for Economic Development (LSEED)
                Center
              </strong>
              , for Lasallian social entrepreneurs and partners. It also serves
              as a strategy to help Lasallian social enterprises develop new
              mechanisms to adapt to the ever-changing landscape of social
              entrepreneurship in the country.
            </Typography>

            <Typography variant="body1" paragraph>
              In order to properly coordinate mentoring session schedules, we
              would like to inquire about your availability this Academic Year.
              Your response to this survey will serve as available options for
              our students/mentees when selecting mentoring session schedules.
            </Typography>

            <Typography variant="body1" paragraph>
              For questions and/or clarifications, you may get in touch with us
              through email:{" "}
              <a href="mailto:lseed@dlsu.edu.ph">lseed@dlsu.edu.ph</a> or{" "}
              <a href="mailto:norby.salonga@dlsu.edu.ph">
                norby.salonga@dlsu.edu.ph
              </a>
              .
            </Typography>

            <Typography variant="body1" paragraph>
              <strong>Privacy and Confidentiality Note:</strong> All collected
              information through this form will only be used for LSEED Online
              Mentoring.
            </Typography>

            <Typography variant="body1" paragraph>
              By filling out this form, I understand that I have the
              responsibility as a volunteer mentor to keep all information
              (shared and entrusted to me) with utmost
              confidentiality—specifically the SE ideas and information of
              students/social entrepreneurs participating in LSEED Mentoring.
            </Typography>

            <Typography variant="body1">
              <strong>Do you agree?</strong>
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Accept</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Login;

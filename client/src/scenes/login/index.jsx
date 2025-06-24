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
  OutlinedInput,
  ListItemText,
} from "@mui/material";

const Login = () => {
  const { login } = useAuth();
  const [isFlipped, setIsFlipped] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState({
    // General Sign-Up Info
    firstName: "",
    lastName: "",
    email: "",
    password: "",

    // Mentor-Specific Info
    affiliation: "",           // Position/Organization
    motivation: "",            // Reason to volunteer
    expertise: "",             // Areas of Expertise
    businessAreas: [],         // Multiple choice
    preferredTime: [],         // Dropdown selection
    specificTime: "",          // If preferredTime is "Other"
    communicationMode: [],     // Multiple choice
  });
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
  const [menuOpenCommunicationModes, setMenuOpenCommunicationModes] = useState(false);
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
      const response = await fetch("http://localhost:4000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // 🔥 this enables sending/receiving cookies
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
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch("http://localhost:4000/signup", {
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

                    {[ 
                      { label: "Affiliation (Position/Organization)", key: "affiliation" },
                      { label: "Reason/Motivation to volunteer", key: "motivation", multiline: true },
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
                      <InputLabel sx={{ color: "#000" }}>Business Areas</InputLabel>
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
                          <span style={{ color: "#fff" }}>{selected.join(", ")}</span>
                        )}
                        sx={{
                          color: "#fff",
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#000",
                          },
                        }}
                      >
                        {businessAreasList
                          .filter(Boolean)
                          .map((area) => (
                            <MenuItem
                              key={area}
                              value={area}
                              onClick={() => setMenuOpen(true)}
                            >
                              <Checkbox checked={formData.businessAreas.includes(area)} />
                              <ListItemText primary={area} sx={{ color: "#000" }} />
                            </MenuItem>
                          ))}

                        {/* Done Button */}
                        <MenuItem
                          disableRipple
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={handleDoneClick}
                          sx={{ justifyContent: "center" }}
                        >
                          <Button variant="contained" color="primary" sx={{ width: "100%" }}>
                            Done
                          </Button>
                        </MenuItem>
                      </Select>
                    </FormControl>


                    {/* Preferred Time Selection */}
                    <FormControl fullWidth required sx={{ mt: 2 }}>
                      <InputLabel sx={{ color: "#000" }}>Preferred Time</InputLabel>
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
                          <span style={{ color: "#fff" }}>{selected.join(", ")}</span>
                        )}
                        sx={{
                          color: "#fff",
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#000",
                          },
                        }}
                      >
                        {preferredTimeList
                          .filter(Boolean)
                          .map((time) => (
                          <MenuItem key={time} value={time}>
                            <Checkbox checked={formData.preferredTime.includes(time)} />
                            <ListItemText primary={time} sx={{ color: "#000" }} />
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
                        onChange={(e) => setFormData((prev) => ({
                          ...prev,
                          specificTime: e.target.value,
                        }))}
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
                      <InputLabel sx={{ color: "#000" }}>Communication Modes</InputLabel>
                      <Select
                        multiple
                        open={menuOpenCommunicationModes}
                        onOpen={() => setMenuOpenCommunicationModes(true)}
                        onClose={() => setMenuOpenCommunicationModes(false)}
                        value={formData.communicationMode}
                        onChange={(e) => setFormData((prev) => ({
                          ...prev,
                          communicationMode: e.target.value.filter(Boolean),
                        }))}
                        input={<OutlinedInput label="Communication Modes" />}
                        renderValue={(selected) => (
                          <span style={{ color: "#fff" }}>{selected.join(", ")}</span>
                        )}
                        sx={{
                          color: "#fff",
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#000",
                          },
                          "&:hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#000" },
                          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#000" },
                        }}
                      >
                        {communicationModes
                          .filter(Boolean)
                          .map((mode) => (
                            <MenuItem key={mode} value={mode}>
                              <Checkbox checked={formData.communicationMode.includes(mode)} />
                              <ListItemText primary={mode} sx={{ color: "#000" }} />
                            </MenuItem>
                        ))}
                        <MenuItem
                          disableRipple
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={handleDoneCommunicationModes}
                          sx={{ justifyContent: "center" }}
                        >
                          <Button variant="contained" color="primary" sx={{ width: "100%" }}>
                            Done
                          </Button>
                        </MenuItem>
                      </Select>
                    </FormControl>

                    {/* Terms and Submit */}
                    <div className="checkbox-wrapper terms-checkbox" style={{ marginTop: "30px" }}>
                      <input type="checkbox" id="terms" name="terms" required />
                      <label htmlFor="terms" onClick={() => setOpenDialog(true)}>
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
                    <div className="text sign-up-text" style={{ marginBottom: "40px" }}>
                      Already have an account? <label htmlFor="flip">Login now</label>
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

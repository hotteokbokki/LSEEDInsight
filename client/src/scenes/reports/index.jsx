import React, { useRef, useState } from "react";
import {
  Box,
  Button,
  Typography,
  useTheme,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
} from "@mui/material";
import Header from "../../components/Header";
import { tokens } from "../../theme";
import Papa from "papaparse";
import * as XLSX from "xlsx";

const Reports = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const fileInputRef = useRef(null);
  const [parsedData, setParsedData] = useState([]);
  const [fileName, setFileName] = useState("");

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setFileName(file.name);

    const isCSV = file.name.endsWith(".csv");
    const isXLSX = file.name.endsWith(".xlsx");

    if (isCSV) {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          setParsedData(results.data);
        },
      });
    } else if (isXLSX) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(worksheet);
        setParsedData(json);
      };
      reader.readAsArrayBuffer(file);
    } else {
      alert("Please upload a .csv or .xlsx file.");
    }
  };

  const handleImport = () => {
    console.log("Importing to database:", parsedData);
    alert("Imported successfully!");
    setParsedData([]);
    setFileName("");
  };

  const handleCancel = () => {
    setParsedData([]);
    setFileName("");
  };

  const handleGoogleDriveImport = () => {
    alert("Google Drive import not yet implemented. Placeholder button.");
    // TODO: Integrate Google Picker API
  };
  const [selectedSE, setSelectedSE] = useState("");

  const handleSEChange = (event) => {
    setSelectedSE(event.target.value);
  };

  // Sample list of SEs — replace with actual data
  const socialEnterprises = [
    "Galing LNC",
    "Green Earth",
    "Agos ng Buhay",
    "Bayanihan Builders",
  ];

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Header title="Reports" subtitle="Generate Reports" />
      </Box>

      {/* Dropdown on top */}
      <Box
        display="flex"
        flexDirection="column"
        alignItems="left"
        gap={4}
        mt={4}
      >
        <Box
          width="27%"
          bgcolor={colors.primary[400]}
          display="flex"
          padding={2}
          gap={2}
        >
          <FormControl
            fullWidth
            sx={{
              maxWidth: "500px",
              backgroundColor: colors.blueAccent[500],
            }}
          >
            <InputLabel id="se-select-label" sx={{ color: "white" }}>
              Select Social Enterprise
            </InputLabel>
            <Select
              labelId="se-select-label"
              value={selectedSE}
              label="Select Social Enterprise"
              onChange={handleSEChange}
              sx={{
                color: "black",
                ".MuiOutlinedInput-notchedOutline": { border: 0 },
                "& .MuiSvgIcon-root": { color: "white" },
              }}
            >
              {socialEnterprises.map((se, index) => (
                <MenuItem key={index} value={se} sx={{ color: "white" }}>
                  {se}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Upload Section */}
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
            variant="contained"
            color="secondary"
            sx={{ fontSize: "16px", py: "10px", flexGrow: 1 }}
            onClick={handleButtonClick}
          >
            Upload from Device
          </Button>

          <Button
            variant="contained"
            color="info"
            sx={{ fontSize: "16px", py: "10px", flexGrow: 1 }}
            onClick={handleGoogleDriveImport}
          >
            Choose from Google Drive
          </Button>

          <input
            type="file"
            accept=".xlsx, .csv"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
        </Box>

        {/* Preview Table */}
        {parsedData.length > 0 && (
          <Box mt={2} width="100%" bgcolor={colors.primary[400]} p={2}>
            <Typography variant="h4" color={colors.greenAccent[500]} mb={2}>
              Preview: {fileName}
            </Typography>

            <Box
              sx={{
                overflowX: "auto",
                maxHeight: "300px",
                border: "1px solid #ccc",
                borderRadius: "8px",
                padding: "10px",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {Object.keys(parsedData[0]).map((key) => (
                      <th
                        key={key}
                        style={{
                          border: "1px solid #ddd",
                          padding: "8px",
                          background: "#222",
                          color: "#fff",
                        }}
                      >
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsedData.slice(0, 5).map((row, index) => (
                    <tr key={index}>
                      {Object.values(row).map((val, i) => (
                        <td
                          key={i}
                          style={{
                            border: "1px solid #ddd",
                            padding: "8px",
                            color: "#eee",
                          }}
                        >
                          {val}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>

            {/* Action Buttons */}
            <Box display="flex" gap={2} mt={2}>
              <Button
                variant="contained"
                color="success"
                onClick={handleImport}
              >
                Import to Database
              </Button>
              <Button variant="outlined" color="error" onClick={handleCancel}>
                Cancel
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Reports;

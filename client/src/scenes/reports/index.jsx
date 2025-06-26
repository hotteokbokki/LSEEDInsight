import { useEffect } from "react";
import axios from "axios";
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
  const requiredCols = expectedColumns[selectedReportType] || [];
  const actualCols = Object.keys(parsedData[0] || {});
  const missingCols = requiredCols.filter((col) => !actualCols.includes(col));

  console.log("Sending to backend:", {
  se_id: selectedSE,
  data: parsedData,
});

  if (missingCols.length > 0) {
    alert(`Missing required columns: ${missingCols.join(", ")}`);
    return;
  }

  // Proceed to API call with selectedSE and parsedData
  axios.post(
  `http://localhost:4000/api/import/${selectedReportType}`,
  {
    se_id: selectedSE,
    data: parsedData,
  },
  {
    withCredentials: true, // very important for session to work!
  }
)

  .then(() => {
    alert("Import successful!");
    setParsedData([]);
    setFileName("");
  })
  .catch((err) => {
  console.error("Import error:", err);

  if (err.response && err.response.status === 400 && err.response.data?.message === "Missing required columns") {
    alert(`File upload failed: ${err.response.data.message}. Missing: ${err.response.data.missingFields?.join(", ")}`);
  } else if (err.response && err.response.status === 400) {
    alert(`File upload failed: ${err.response.data.message}`);
  } else {
    alert("Import failed due to server error.");
  }
});
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

  const [socialEnterprises, setSocialEnterprises] = useState([]);

  useEffect(() => {
    const fetchSEs = async () => {
      try {
        const response = await axios.get("http://localhost:4000/getAllSocialEnterprisesForComparison");
        setSocialEnterprises(response.data); // Assuming response contains [{ se_id, abbr }, ...]
      } catch (error) {
        console.error("Error fetching SE list:", error);
      }
    };

    fetchSEs();
  }, []);

  const reportTables = [
  "reports",
  "financial_statements",
  "cash_in",
  "cash_out",
  "inventory_report",
];

const formatTableName = (name) => {
  return name
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const expectedColumns = {
  reports: ["reportType","dateCreated", "companyName", "month"],
  financial_statements: ["date","total_revenue","total_expenses","net_income","total_assets","total_liabilities","owner_equity"],
  inventory_report: ["item_name", "qty", "price", "amount"],
  cash_in: ["date", "sales", "otherRevenue", "assets", "liability", "ownerCapital", "notes", "cash"],
  cash_out: ["date", "cash", "expenses", "assets", "inventory", "liability", "ownerWithdrawal", "notes"],

};

const [selectedReportType, setSelectedReportType] = useState("");

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
                color: "white",
                ".MuiOutlinedInput-notchedOutline": { border: 0 },
                "& .MuiSvgIcon-root": { color: "white" },
              }}
            >
              {socialEnterprises.map((se) => (
                <MenuItem
                  key={se.se_id}
                  value={se.se_id}
                  sx={{ color: "white" }}
                >
                  {se.abbr}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
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
            <InputLabel id="report-type-label" sx={{ color: "white" }}>
              Select Report Type
            </InputLabel>
            <Select
              labelId="report-type-label"
              value={selectedReportType}
              label="Select Report Type"
              onChange={(e) => setSelectedReportType(e.target.value)}
              sx={{
                color: "white",
                ".MuiOutlinedInput-notchedOutline": { border: 0 },
                "& .MuiSvgIcon-root": { color: "white" },
              }}
            >
              {reportTables.map((table) => (
                <MenuItem key={table} value={table} sx={{ color: "white" }}>
                  {formatTableName(table)}
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

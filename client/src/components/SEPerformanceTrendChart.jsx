import { useState, useEffect } from "react";
import { Box, Typography } from "@mui/material";
import LineChart from "./LineChart"; // Import the reusable chart component
import { useTheme } from "@mui/material"; // ✅ Fix: Import useTheme from MUI
import { tokens } from "../theme"; // ✅ Fix: Ensure tokens is imported from your theme file

const SEPerformanceTrendChart = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const [topPerformers, setTopPerformers] = useState([]);

  useEffect(() => {
    const fetchTopPerformers = async () => {
        try {
            const response = await fetch("http://localhost:4000/api/top-se-performance");
            const data = await response.json();

            if (!Array.isArray(data) || !data.length) {
                console.warn("Unexpected response:", data);
                setTopPerformers([]); // Always set an array
                return;
            }
          
            setTopPerformers(data);
        } catch (error) {
            console.error("Error fetching top SE performance:", error);
            setTopPerformers([]);
        }
    };

    fetchTopPerformers();
    }, []);

    const formatChartData = (data) => {
        const groupedData = {};
        const colorList = [
            colors.blueAccent[500],  // Primary Blue
            colors.greenAccent[500], // Primary Green
            colors.redAccent[500],   // Primary Red
            colors.primary[500],     // Primary Theme Color
            colors.grey[500],        // Neutral Grey
        ];
    
        // Step 1: Return "No Data" if input is empty or undefined
        if (!data || data.length === 0) {
          return "Insufficient data";
        }
    
        // Step 1: Get Today's Date & Calculate Start Date (30 days before today)
        const today = new Date();
        //const today = new Date("2025-03-27"); // Force today's date
        const startDate = new Date();
        startDate.setMonth(today.getMonth() - 1); // Move 1 month back (30 days approx)
        startDate.setDate(1); // Ensure we start at the beginning of the month
    
        const next60Days = new Date();
        next60Days.setDate(today.getDate() + 60);
    
        console.log("Today:", today.toISOString().substring(0, 10));
        console.log("Start Month (30 days before today):", startDate.toISOString().substring(0, 7));
        console.log("Next 60 Days:", next60Days.toISOString().substring(0, 10));
    
        // Step 2: Extract Months from Database Data
        const dbMonths = new Set(data.map((se) => se.month.substring(0, 7))); // Unique months from data
    
        // Step 3: Generate X-Axis Months (Starting 30 Days Prior)
        const allMonths = new Set([startDate.toISOString().substring(0, 7)]); // ✅ Start dynamically
    
        let current = new Date(startDate);
        while (current <= next60Days) {
            allMonths.add(current.toISOString().substring(0, 7)); // Add alternating month
            current.setMonth(current.getMonth() + 2); // Skip one month
        }
    
        // Step 4: Merge Database Months into X-Axis
        dbMonths.forEach((month) => allMonths.add(month));
    
        // Convert Set to Sorted Array (ensures correct ordering)
        let xAxisMonths = [...allMonths].sort();
    
        console.log("Generated Months for X-Axis:", xAxisMonths);
    
        // Step 5: Find the last recorded month for each SE
        const lastEvaluations = {};
        data.forEach((se) => {
            if (!se || !se.social_enterprise || !se.month) return;
    
            const seName = se.social_enterprise;
            const evalMonth = se.month.substring(0, 7);
    
            if (!lastEvaluations[seName] || evalMonth > lastEvaluations[seName]) {
                lastEvaluations[seName] = evalMonth;
            }
        });
    
        // Step 6: Initialize SEs and Assign X-Axis Range
        data.forEach((se) => {
            if (!se || !se.social_enterprise || !se.month) return;
    
            const seName = se.social_enterprise;
            const lastMonth = lastEvaluations[seName] || "2025-01"; // Default to 2025-01 if no evaluation found
    
            if (!groupedData[seName]) {
                groupedData[seName] = xAxisMonths
                    .filter((month) => month <= lastMonth) // ✅ Remove months beyond last evaluation
                    .map((month) => ({
                        x: month,
                        y: new Date(month) < today ? 0 : null, // ✅ Past months default to 0, future months to null
                    }));
            }
    
            // Update y-values with actual ratings
            groupedData[seName] = groupedData[seName].map((point) => ({
                x: point.x,
                y: point.x === se.month.substring(0, 7) ? parseFloat(se.avg_rating) || 0 : point.y,
            }));
        });
    
        const formattedData = Object.keys(groupedData).map((seName, index) => ({
            id: seName,
            color: colorList[index % colorList.length], // ✅ Now 'index' is defined properly
            data: groupedData[seName] || [],
        }));
        
        console.log("Final Chart Data:", JSON.stringify(formattedData, null, 2));
        return formattedData;
    };
    
    // Apply formatting to fetched data
    const chartData = formatChartData(topPerformers);
    console.log("Chart Data: ", chartData);
    
    // Determine Top Performer
    const getTopPerformer = (data) => {
        const avgRatings = {};
    
        data.forEach(({ social_enterprise, avg_rating }) => {
            if (!avgRatings[social_enterprise]) {
                avgRatings[social_enterprise] = { total: 0, count: 0 };
            }
            avgRatings[social_enterprise].total += parseFloat(avg_rating);
            avgRatings[social_enterprise].count += 1;
        });
    
        let topPerformer = null;
        let highestAvg = 0;
    
        Object.keys(avgRatings).forEach((se) => {
            const avg = avgRatings[se].total / avgRatings[se].count;
            if (avg > highestAvg) {
                highestAvg = avg;
                topPerformer = se;
            }
        });
    
        return topPerformer;
    };
    
    const topPerformerName = getTopPerformer(topPerformers); // FIXED: Pass raw data, not formatted chart data
    
    console.log("Top performer: ", topPerformerName);

    return (
        <Box gridColumn="span 12" gridRow="span 2" backgroundColor={colors.primary[400]}>
          <Box mt="25px" p="0 30px" display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h3" fontWeight="bold" color={colors.greenAccent[500]}>
                {chartData === "Insufficient data" ? "" : "Top Performer"} 
                {/* ✅ Show "Top Performer" only when data is available */}
              </Typography>
              <Typography variant="h5" fontWeight="600" color={colors.grey[100]}>
                {chartData === "Insufficient data" ? "No Available Data" : topPerformerName} 
                {/* ✅ Show Team Abbreviation if data is available */}
              </Typography>
            </Box>
          </Box>
          
          <Box height="250px" m="-20px 0 0 0">
            {chartData === "Insufficient data" ? (
              <Typography 
                variant="h6" 
                color={colors.grey[300]}
                display="flex"
                justifyContent="center"
                alignItems="center"
                height="100%"
                textAlign="center"
              >
                No data available for plotting.
              </Typography>
            ) : (
              <LineChart isDashboard={true} data={chartData} />
            )}
          </Box>
        </Box>
      );
      
};

export default SEPerformanceTrendChart;

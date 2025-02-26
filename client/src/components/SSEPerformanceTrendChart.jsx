import { Box, Typography } from "@mui/material";
import LineChart from "./LineChart"; // Reusable chart component
import { useTheme } from "@mui/material"; 
import { tokens } from "../theme"; 

const SSEPerformanceTrendChart = ({ lineData }) => {  // Accept lineData as a prop
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);

    const formatChartData = (data) => {
        console.log("Raw Data Received:", JSON.stringify(data, null, 2));
    
        if (!data || data.length === 0 || (typeof data === "object" && data.message)) {
            console.warn("No data available for formatting or received error message:", data?.message);
            return "Insufficient data";
          }
    
        const groupedData = {};
        const colorList = [
            colors.blueAccent[500],  
            colors.greenAccent[500], 
            colors.redAccent[500],   
            colors.primary[500],     
            colors.grey[500],        
        ];
    
        // Step 1: Get Today's Date & Calculate Start Date (30 days before today)
        const today = new Date();
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
    
        // Step 5: Initialize groupedData with all SEs having default 0 values for all months
        const seNames = new Set(data.map((se) => se.social_enterprise));
        seNames.forEach((seName) => {
            groupedData[seName] = xAxisMonths.map((month) => ({ x: month, y: 0 }));
        });
    
        // Step 6: Fill in actual ratings where available
        data.forEach((se) => {
            if (!se || !se.social_enterprise || !se.month) {
                console.warn("Skipping invalid entry:", se);
                return;
            }
    
            const seName = se.social_enterprise;
            const monthStr = se.month.substring(0, 7);
            const rating = parseFloat(se.avg_rating) || 0;
    
            // Replace 0 with actual rating if present
            const index = xAxisMonths.indexOf(monthStr);
            if (index !== -1) {
                groupedData[seName][index].y = rating;
            }
        });
    
        // Step 7: Format data for chart
        const formattedData = Object.keys(groupedData).map((seName, index) => ({
            id: seName,
            color: colorList[index % colorList.length],
            data: groupedData[seName],
        }));
    
        console.log("Final Chart Data:", JSON.stringify(formattedData, null, 2));
        return formattedData;
    };
    
    const chartData = formatChartData(lineData);
    
    return (
        <Box
        gridColumn="span 12"
        gridRow="span 2"
        backgroundColor={colors.primary[400]}
        >
            <Box
                mt="25px"
                p="0 30px"
                display="flex "
                justifyContent="space-between"
                alignItems="center"
            >
                <Box>
                <Typography
                    variant="h3"
                    fontWeight="bold"
                    color={colors.greenAccent[500]}
                    >
                {chartData !== "Insufficient data"
                    ? `${chartData[0]?.id}`
                    : "Performance Trend"}
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

export default SSEPerformanceTrendChart;

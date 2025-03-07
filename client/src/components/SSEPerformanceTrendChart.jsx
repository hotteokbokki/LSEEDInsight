import { Box, Typography } from "@mui/material";
import LineChart from "./LineChart"; // Reusable chart component
import { useTheme } from "@mui/material"; 
import { tokens } from "../theme"; 

const SSEPerformanceTrendChart = ({ lineData }) => {  
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

        // 📌 Step 1: Extract all unique quarters from dataset
        const uniqueQuarters = new Set();
        data.forEach((se) => {
            if (se.quarter) {
                const date = new Date(se.quarter);
                const year = date.getFullYear();
                const quarter = Math.floor(date.getMonth() / 3) + 1;
                uniqueQuarters.add(`${year}-Q${quarter}`);
            }
        });

        // Convert to sorted array (oldest to newest)
        const quarters = [...uniqueQuarters].sort();
        console.log("Generated Quarters for X-Axis:", quarters);

        // 📌 Step 2: Initialize groupedData with default 0 values
        const seNames = new Set(data.map((se) => se.social_enterprise));
        seNames.forEach((seName) => {
            groupedData[seName] = quarters.map((q) => ({ x: q, y: 0 }));
        });

        // 📌 Step 3: Fill in actual ratings where available
        data.forEach((se) => {
            if (!se || !se.social_enterprise || !se.quarter) {
                console.warn("Skipping invalid entry:", se);
                return;
            }

            const seName = se.social_enterprise;
            const date = new Date(se.quarter);
            const quarterStr = `${date.getFullYear()}-Q${Math.floor(date.getMonth() / 3) + 1}`;
            const rating = parseFloat(se.avg_rating) || 0;

            const index = quarters.indexOf(quarterStr);
            if (index !== -1) {
                groupedData[seName][index].y = rating;
            }
        });

        // 📌 Step 4: Format data for the chart
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
        <Box gridColumn="span 12" gridRow="span 2" backgroundColor={colors.primary[400]}>
            <Box
                mt="25px"
                p="0 30px"
                display="flex "
                justifyContent="space-between"
                alignItems="center"
            >
                <Box>
                    <Typography variant="h3" fontWeight="bold" color={colors.greenAccent[500]}>
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
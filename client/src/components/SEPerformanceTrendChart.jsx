import { useState, useEffect } from "react";
import { Box, Typography } from "@mui/material";
import LineChart from "./LineChart";
import { useTheme } from "@mui/material";
import { tokens } from "../theme";

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
                    setTopPerformers([]);
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
            colors.blueAccent[500],
            colors.greenAccent[500],
            colors.redAccent[500],
            colors.primary[500],
            colors.grey[500],
        ];

        if (!data || data.length === 0) {
            return "Insufficient data";
        }

        const allQuarters = new Set();
        data.forEach((se) => {
            if (!se || !se.social_enterprise || !se.quarter) return;
            const date = new Date(se.quarter);
            const quarter = Math.floor(date.getMonth() / 3) + 1;
            allQuarters.add(`${date.getFullYear()}-Q${quarter}`);
        });

        let xAxisQuarters = [...allQuarters].sort();

        const lastEvaluations = {};
        data.forEach((se) => {
            if (!se || !se.social_enterprise || !se.quarter) return;
            const date = new Date(se.quarter);
            const quarter = Math.floor(date.getMonth() / 3) + 1;
            const evalQuarter = `${date.getFullYear()}-Q${quarter}`;
            const seName = se.social_enterprise;
            if (!lastEvaluations[seName] || evalQuarter > lastEvaluations[seName]) {
                lastEvaluations[seName] = evalQuarter;
            }
        });

        data.forEach((se) => {
            if (!se || !se.social_enterprise || !se.quarter) return;
            const seName = se.social_enterprise;
            const lastQuarter = lastEvaluations[seName] || "2025-Q1";

            if (!groupedData[seName]) {
                groupedData[seName] = xAxisQuarters
                    .filter((qtr) => qtr <= lastQuarter)
                    .map((qtr) => ({ x: qtr, y: null }));
            }

            groupedData[seName] = groupedData[seName].map((point) => ({
                x: point.x,
                y: point.x === `${se.quarter.split("-")[0]}-Q${Math.floor((parseInt(se.quarter.split("-")[1]) - 1) / 3) + 1}`
                    ? parseFloat(se.avg_rating) || 0
                    : point.y,
            }));
        });

        return Object.keys(groupedData).map((seName, index) => ({
            id: seName,
            color: colorList[index % colorList.length],
            data: groupedData[seName] || [],
        }));
    };

    const chartData = formatChartData(topPerformers);
    
    const getTopPerformer = (data) => {
        const avgRatings = {};
        data.forEach(({ social_enterprise, avg_rating }) => {
            if (!avgRatings[social_enterprise]) {
                avgRatings[social_enterprise] = { total: 0, count: 0 };
            }
            avgRatings[social_enterprise].total += parseFloat(avg_rating);
            avgRatings[social_enterprise].count += 1;
        });

        return Object.keys(avgRatings).reduce((top, se) => {
            const avg = avgRatings[se].total / avgRatings[se].count;
            return avg > (avgRatings[top]?.total / avgRatings[top]?.count || 0) ? se : top;
        }, null);
    };

    const topPerformerName = getTopPerformer(topPerformers);

    return (
        <Box gridColumn="span 12" gridRow="span 2" backgroundColor={colors.primary[400]}>
            <Box mt="25px" p="0 30px" display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                    <Typography variant="h3" fontWeight="bold" color={colors.greenAccent[500]}>
                        {chartData === "Insufficient data" ? "" : "Top Performer"}
                    </Typography>
                    <Typography variant="h5" fontWeight="600" color={colors.grey[100]}>
                        {chartData === "Insufficient data" ? "No Available Data" : topPerformerName}
                    </Typography>
                </Box>
            </Box>

            <Box height="250px" m="-20px 0 0 0">
                {chartData === "Insufficient data" ? (
                    <Typography variant="h6" color={colors.grey[300]} display="flex" justifyContent="center" alignItems="center" height="100%" textAlign="center">
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
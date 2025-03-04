import { useState, useEffect } from "react";
import { Box, Typography } from "@mui/material";
import LineChart from "./LineChart"; // Import the reusable chart component
import { useTheme } from "@mui/material"; // ✅ Fix: Import useTheme from MUI
import { tokens } from "../theme"; // ✅ Fix: Ensure tokens is imported from your theme file

const SEPerformanceTrendChartByMentorship = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    
    const [topPerformers, setTopPerformers] = useState([]);
    const [chartData, setChartData] = useState(null);
    const [userSession, setUserSession] = useState(null);

    useEffect(() => {
        const session = JSON.parse(localStorage.getItem("user"));
        if (session) {
            setUserSession(session);
        }
    }, []);

    useEffect(() => {
        const fetchTopPerformers = async () => {
            try {
                if (!userSession || !userSession.id) {
                    console.warn("User session not found.");
                    return;
                }

                const mentor_id = userSession.id;
                const response = await fetch(
                    `http://localhost:4000/api/top-se-performance-with-mentorships?mentor_id=${mentor_id}`
                );

                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const data = await response.json();
                console.log("Fetched Data:", data); // ✅ Debugging step

                if (!Array.isArray(data) || data.length === 0) {
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

        if (userSession) {
            fetchTopPerformers();
        }
    }, [userSession]); // ✅ Fetch only when `userSession` is available

    useEffect(() => {
        if (topPerformers.length === 0) {
            setChartData("Insufficient data");
            return;
        }

        const formatChartData = (data) => {
            const groupedData = {};
            const colorList = [
                colors.blueAccent[500],  // Primary Blue
                colors.greenAccent[500], // Primary Green
                colors.redAccent[500],   // Primary Red
                colors.primary[500],     // Primary Theme Color
                colors.grey[500],        // Neutral Grey
            ];

            if (!data || data.length === 0) {
                return "Insufficient data";
            }

            const today = new Date();
            const startDate = new Date();
            startDate.setMonth(today.getMonth() - 1);
            startDate.setDate(1);

            const next60Days = new Date();
            next60Days.setDate(today.getDate() + 60);

            const dbMonths = new Set(data.map((se) => se.month.substring(0, 7)));

            const allMonths = new Set([startDate.toISOString().substring(0, 7)]);
            let current = new Date(startDate);
            while (current <= next60Days) {
                allMonths.add(current.toISOString().substring(0, 7));
                current.setMonth(current.getMonth() + 2);
            }

            dbMonths.forEach((month) => allMonths.add(month));
            let xAxisMonths = [...allMonths].sort();

            const lastEvaluations = {};
            data.forEach((se) => {
                if (!se || !se.social_enterprise || !se.month) return;

                const seName = se.social_enterprise;
                const evalMonth = se.month.substring(0, 7);

                if (!lastEvaluations[seName] || evalMonth > lastEvaluations[seName]) {
                    lastEvaluations[seName] = evalMonth;
                }
            });

            data.forEach((se) => {
                if (!se || !se.social_enterprise || !se.month) return;

                const seName = se.social_enterprise;
                const lastMonth = lastEvaluations[seName] || "2025-01";

                if (!groupedData[seName]) {
                    groupedData[seName] = xAxisMonths
                        .filter((month) => month <= lastMonth)
                        .map((month) => ({
                            x: month,
                            y: new Date(month) < today ? 0 : null,
                        }));
                }

                groupedData[seName] = groupedData[seName].map((point) => ({
                    x: point.x,
                    y: point.x === se.month.substring(0, 7) ? parseFloat(se.avg_rating) || 0 : point.y,
                }));
            });

            return Object.keys(groupedData).map((seName, index) => ({
                id: seName,
                color: colorList[index % colorList.length],
                data: groupedData[seName] || [],
            }));
        };

        setChartData(formatChartData(topPerformers));
    }, [topPerformers]); // ✅ Format chart data only when `topPerformers` is updated

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

export default SEPerformanceTrendChartByMentorship;

import { useState, useEffect } from "react";
import { Box, Typography } from "@mui/material";
import LineChart from "./LineChart";
import { useTheme } from "@mui/material";
import { tokens } from "../theme";

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
                console.log("Fetched Data:", data);

                if (!Array.isArray(data) || data.length === 0) {
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

        if (userSession) {
            fetchTopPerformers();
        }
    }, [userSession]);

    useEffect(() => {
        if (topPerformers.length === 0) {
            setChartData("Insufficient data");
            return;
        }

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
                if (se && se.quarter) {
                    const date = new Date(se.quarter);
                    const year = date.getFullYear();
                    const quarter = Math.floor(date.getMonth() / 3) + 1;
                    allQuarters.add(`${year}-Q${quarter}`);
                }
            });

            let xAxisQuarters = [...allQuarters].sort((a, b) => {
                const [yearA, qtrA] = a.split("-Q").map(Number);
                const [yearB, qtrB] = b.split("-Q").map(Number);
                return yearA === yearB ? qtrA - qtrB : yearA - yearB;
            });

            data.forEach((se) => {
                if (!se || !se.social_enterprise || !se.quarter) return;

                const date = new Date(se.quarter);
                const year = date.getFullYear();
                const quarter = Math.floor(date.getMonth() / 3) + 1;
                const formattedQuarter = `${year}-Q${quarter}`;
                const seName = se.social_enterprise;

                if (!groupedData[seName]) {
                    groupedData[seName] = xAxisQuarters.map((qtr) => ({
                        x: qtr,
                        y: null,
                    }));
                }

                groupedData[seName] = groupedData[seName].map((point) => ({
                    x: point.x,
                    y: point.x === formattedQuarter ? (se.avg_rating !== null ? parseFloat(se.avg_rating) : null) : point.y,
                }));
            });

            return Object.keys(groupedData).map((seName, index) => ({
                id: seName,
                color: colorList[index % colorList.length],
                data: groupedData[seName] || [],
            }));
        };

        setChartData(formatChartData(topPerformers));
    }, [topPerformers]);

    return (
        <Box gridColumn="span 12" gridRow="span 2" backgroundColor={colors.primary[400]}>
            <Box mt="25px" p="0 30px" display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                    <Typography variant="h3" fontWeight="bold" color={colors.greenAccent[500]}>
                        {chartData === "Insufficient data" ? "" : "Top Performer"}
                    </Typography>
                    <Typography variant="h5" fontWeight="600" color={colors.grey[100]}>
                        {chartData === "Insufficient data" ? "No Available Data" : topPerformers[0]?.social_enterprise}
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

export default SEPerformanceTrendChartByMentorship;
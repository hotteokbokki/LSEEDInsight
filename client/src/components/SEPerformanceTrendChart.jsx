import { useState, useEffect } from "react";
import { Box, Typography, Select, MenuItem } from "@mui/material";
import LineChart from "./LineChart";
import { useTheme } from "@mui/material";
import { tokens } from "../theme";

const SEPerformanceTrendChart = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const [topPerformers, setTopPerformers] = useState([]);
    const [period, setPeriod] = useState("overall");
    const [topPerformer, setTopPerformer] = useState(null);

    useEffect(() => {
        const fetchTopPerformers = async () => {
            try {
                const response = await fetch(`http://localhost:4000/api/top-se-performance?period=${period}`);
                const data = await response.json();
                console.log("Fetched data:", data); // Debugging log
                const formattedData = Array.isArray(data) ? data : [];

                setTopPerformers(formattedData);
                
                // Determine top performer dynamically for selected period
                if (formattedData.length > 0) {
                    const averageRatings = formattedData.reduce((acc, { social_enterprise, avg_rating }) => {
                        if (!acc[social_enterprise]) {
                            acc[social_enterprise] = { total: 0, count: 0 };
                        }
                        acc[social_enterprise].total += parseFloat(avg_rating);
                        acc[social_enterprise].count += 1;
                        return acc;
                    }, {});

                    const topSE = Object.entries(averageRatings).reduce((top, [seName, { total, count }]) => {
                        const avg = total / count;
                        return !top || avg > top.avg ? { name: seName, avg } : top;
                    }, null);

                    console.log("Top performer for", period, ":", topSE?.name); // Debugging log
                    setTopPerformer(topSE ? topSE.name : null);
                } else {
                    setTopPerformer(null);
                }
            } catch (error) {
                console.error("Error fetching top SE performance:", error);
                setTopPerformers([]);
                setTopPerformer(null);
            }
        };
        fetchTopPerformers();
    }, [period]); // Only depends on period

    const formatChartData = (data) => {
        if (!data.length) return [];

        const groupedData = {};
        const colorList = [
            colors.blueAccent[500],
            colors.greenAccent[500],
            colors.redAccent[500],
            colors.primary[500],
            colors.grey[500],
        ];

        data.forEach(({ social_enterprise, month, avg_rating }) => {
            const date = new Date(month);
            const periodLabel = `${date.getFullYear()}-Q${Math.floor(date.getMonth() / 3) + 1}`;

            if (!groupedData[social_enterprise]) {
                groupedData[social_enterprise] = [];
            }
            groupedData[social_enterprise].push({ x: periodLabel, y: parseFloat(avg_rating) });
        });

        return Object.keys(groupedData).map((seName, index) => ({
            id: seName,
            color: colorList[index % colorList.length],
            data: groupedData[seName].sort((a, b) => a.x.localeCompare(b.x)),
        }));
    };

    const chartData = formatChartData(topPerformers);

    return (
        <Box gridColumn="span 12" gridRow="span 2" backgroundColor={colors.primary[400]}>
            <Box display="flex" justifyContent="flex-end" mb={2} p="10px">
                <Select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    sx={{ minWidth: 120, backgroundColor: colors.primary[300], color: colors.grey[100] }}
                >
                    <MenuItem value="quarterly">Quarterly</MenuItem>
                    <MenuItem value="yearly">Yearly</MenuItem>
                    <MenuItem value="overall">Overall</MenuItem>
                </Select>
            </Box>

            <Box mt="25px" p="0 30px" display="flex" flexDirection="column">
                <Typography variant="h3" fontWeight="bold" color={colors.greenAccent[500]}>
                    {chartData.length === 0 ? "No Data" : "SE Performance Trend"}
                </Typography>

                {topPerformer && (
                    <Typography variant="h5" fontWeight="bold" color={colors.blueAccent[500]} mt={1}>
                        Top Performer ({period}): {topPerformer}
                    </Typography>
                )}
            </Box>

            <Box height="250px" m="-20px 0 0 0" display="flex" justifyContent="center" alignItems="center">
                {chartData.length === 0 ? (
                    <Typography variant="h6" color={colors.grey[300]} textAlign="center">
                        No data available for plotting.
                    </Typography>
                ) : (
                    <LineChart data={chartData} />
                )}
            </Box>
        </Box>
    );
};

export default SEPerformanceTrendChart;

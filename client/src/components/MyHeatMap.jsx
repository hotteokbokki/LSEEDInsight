import { ResponsiveHeatMap } from "@nivo/heatmap";
import { useTheme } from "@mui/material";
import { tokens } from "../theme";
import { useState, useEffect } from "react";

const HeatmapWrapper = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode); // colors from theme tokens
    const [heatMapStats, setHeatMapStats] = useState([]);

    useEffect(() => {
        const fetchHeatMapStats = async () => {
            try {
                const response = await fetch("http://localhost:4000/test-api");
                const data = await response.json();
    
                console.log("Fetched Data:", data); 
    
                if (!Array.isArray(data) || !data.length) {
                    console.warn("Unexpected response:", data);
                    setHeatMapStats([]);
                    return;
                }
    
                setHeatMapStats(data);
            } catch (error) {
                console.error("Error fetching heat map stats:", error);
                setHeatMapStats([]);
            }
        };
    
        fetchHeatMapStats();
    }, []);

    const transformedData = heatMapStats.map(({ abbr, team_name, ...scores }) => ({
        id: abbr,
        team_name,  
        data: Object.keys(scores).map((category) => ({
            x: category,
            y: scores[category],
            team_name,
        })),
    }));

    console.log(transformedData);

    return (
        <div style={{ height: 550, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ height: 500, width: "100%" }}>
                <ResponsiveHeatMap
                    data={transformedData}
                    margin={{ top: 60, right: 90, bottom: 60, left: 90 }}
                    valueFormat=">-.2f"
                    axisTop={{ tickSize: 5, tickPadding: 5, tickRotation: -90, truncateTickAt: 0 }}
                    axisRight={{ tickSize: 5, tickPadding: 5, legend: "Category", legendPosition: "middle", legendOffset: 70 }}
                    axisLeft={{ tickSize: 5, tickPadding: 5, legend: "Team Name", legendPosition: "middle", legendOffset: -72 }}
                    colors={({ value }) => {
                        if (value <= 1.5) return theme.palette.mode === "dark" ? colors.redAccent[300] : colors.redAccent[500];
                        if (value <= 3) return theme.palette.mode === "dark" ? colors.primary[300] : colors.grey[700]; // Updated for light mode contrast
                        return theme.palette.mode === "dark" ? colors.greenAccent[300] : colors.greenAccent[500];
                    }}
                    emptyColor={colors.grey[600]}
                    tooltip={({ cell }) => {
                        console.log("Tooltip Data:", cell);
                    
                        const categoryMapping = {
                            "Teamwork": "Teamwork",
                            "Logistics": "Logistics",
                            "Marketing Plan/Execution": "Marketing",
                            "Human Resource Management": "HR",
                            "Financial Planning/Management": "Finance",
                            "Product/Service Design/Planning": "Product",
                        };
                    
                        const category = categoryMapping[cell.data.x] || cell.data.x;
                        const formattedValue = parseFloat(cell.data.y).toFixed(2);
                    
                        return (
                            <div
                                style={{
                                    background: theme.palette.mode === "dark" 
                                        ? colors.primary[500] 
                                        : colors.grey[900],
                                    padding: "10px",
                                    borderRadius: "5px",
                                    boxShadow: "0px 0px 10px rgba(0, 0, 0, 0.1)",
                                }}
                            >
                                <strong>{cell.data.team_name}</strong>
                                <br />
                                {category}: {formattedValue}
                            </div>
                        );
                    }}
                    theme={{
                        axis: { ticks: { text: { fill: theme.palette.mode === "dark" ? colors.grey[100] : colors.grey[200] } } },
                        legends: { text: { fill: theme.palette.mode === "dark" ? colors.grey[100] : colors.grey[900] } },
                    }}
                />
            </div>
            
            {/* Color Legend */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <div style={{ width: 20, height: 20, backgroundColor: theme.palette.mode === "dark" ? colors.redAccent[300] : colors.redAccent[500], borderRadius: 4 }}></div>
                    <span style={{ fontSize: 14, color: theme.palette.mode === "dark" ? colors.grey[100] : colors.grey[200] }}>Low Performance (≤ 1.5)</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <div style={{ width: 20, height: 20, backgroundColor: theme.palette.mode === "dark" ? colors.primary[300] : colors.grey[700], borderRadius: 4 }}></div>
                    <span style={{ fontSize: 14, color: theme.palette.mode === "dark" ? colors.grey[100] : colors.grey[200] }}>Moderate Performance (1.5 - 3)</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <div style={{ width: 20, height: 20, backgroundColor: theme.palette.mode === "dark" ? colors.greenAccent[300] : colors.greenAccent[500], borderRadius: 4 }}></div>
                    <span style={{ fontSize: 14, color: theme.palette.mode === "dark" ? colors.grey[100] : colors.grey[200] }}>High Performance (&gt; 3)</span>
                </div>
            </div>
        </div>
    );
};

export default HeatmapWrapper;
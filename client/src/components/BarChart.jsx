import { ResponsiveBar } from "@nivo/bar";
import { useTheme } from "@mui/material";
import { tokens } from "../theme";

const BarChart = ({ data, isDashboard = false }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  // Determine appropriate text color based on theme mode
  const textColor = theme.palette.mode === "dark" ? "#FFFFFF" : "#333333";
  const backgroundColor = theme.palette.mode === "dark" ? colors.grey[900] : "#FFFFFF";

  // Ensure data is valid before processing
  if (!data || !Array.isArray(data)) return null;

  // Aggregate ratings per category
  const categoryMap = data.reduce((acc, { category_name, rating }) => {
    if (!acc[category_name]) {
      acc[category_name] = { total: 0, count: 0 };
    }
    acc[category_name].total += rating;
    acc[category_name].count += 1;
    return acc;
  }, {});

  // Compute average rating per category
  const formattedData = Object.entries(categoryMap).map(([category, { total, count }]) => ({
    category,
    avg_rating: (total / count).toFixed(2),
  }));

  return (
    <ResponsiveBar
      data={formattedData}
      keys={["avg_rating"]}
      indexBy="category"
      margin={{ top: 40, right: 40, bottom: 70, left: 60 }}
      padding={0.3}
      colors={({ index }) => colors.blueAccent[400]} // Use theme colors for bars
      axisBottom={null}
      axisLeft={{
        legend: isDashboard ? undefined : "Average Score",
        legendPosition: "middle",
        legendOffset: -40,
        tickValues: [1, 2, 3, 4, 5],
        format: (v) => Math.round(v),
        tickTextColor: textColor, // Ensure visibility
      }}
      tooltip={({ value, indexValue }) => (
        <div
          style={{
            background: backgroundColor,
            color: textColor,
            padding: "5px",
            borderRadius: "5px",
            boxShadow: "0px 0px 10px rgba(0, 0, 0, 0.1)", // Improve tooltip readability
          }}
        >
          <strong>{indexValue}</strong>
          <div>Avg Rating: {value}</div>
        </div>
      )}
      theme={{
        axis: {
          domain: { line: { stroke: textColor } },
          legend: { text: { fill: textColor } },
          ticks: {
            line: { stroke: textColor, strokeWidth: 1 },
            text: { fill: textColor },
          },
        },
        legends: {
          text: { fill: textColor },
        },
        tooltip: {
          container: {
            background: backgroundColor,
            color: textColor,
          },
        },
      }}
      layout="vertical"
      labelSkipWidth={12}
      labelSkipHeight={12}
      labelTextColor={textColor} // Ensuring bar labels are visible
    />
  );
};

export default BarChart;

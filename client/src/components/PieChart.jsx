import { ResponsivePie } from "@nivo/pie";
import { useTheme } from "@mui/material";
import { tokens } from "../theme";

const PieChart = ({ data, isDashboard = false }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  // Ensure valid data
  if (!data || !Array.isArray(data) || data.length === 0) return <p>No data available</p>;

  return (
    <ResponsivePie
      data={data}
      margin={{ top: 40, right: 100, bottom: 80, left: 100 }}
      innerRadius={0.4} // Slight inner radius for better aesthetics
      padAngle={2}
      cornerRadius={6}
      activeOuterRadiusOffset={10}
      colors={{ scheme: "category10" }} // Uses a diverse color scheme
      borderWidth={2}
      borderColor={{ from: "color", modifiers: [["darker", 0.3]] }}
      enableArcLabels={false} // ❌ Hides numbers inside pie chart
      arcLinkLabelsSkipAngle={10}
      arcLinkLabelsTextColor={theme.palette.mode === "dark" ? "#fff" : "#333"}
      arcLinkLabelsThickness={2}
      arcLinkLabelsColor={{ from: "color" }}
      theme={{
        axis: {
          ticks: { text: { fill: theme.palette.mode === "dark" ? "#fff" : "#333" } },
        },
        legends: {
          text: { fill: theme.palette.mode === "dark" ? "#fff" : "#333" },
        },
        tooltip: {
          container: {
            background: theme.palette.mode === "dark" ? "#333" : "#fff",
            color: theme.palette.mode === "dark" ? "#fff" : "#333",
            padding: "10px",
            borderRadius: "5px",
            boxShadow: "0px 0px 10px rgba(0, 0, 0, 0.1)",
          },
        },
      }}
      tooltip={({ datum }) => (
        <div
          style={{
            background: theme.palette.mode === "dark" ? "#222" : "#fff",
            color: theme.palette.mode === "dark" ? "#fff" : "#333",
            padding: "8px",
            borderRadius: "5px",
            boxShadow: "0px 2px 10px rgba(0, 0, 0, 0.1)",
          }}
        >
          <strong>{datum.data.comment}</strong>
          <div>Percentage: {datum.label}</div> {/* ✅ Shows only category & percentage */}
        </div>
      )}
      legends={[
        {
          anchor: "bottom",
          direction: "row",
          justify: false,
          translateX: 0,
          translateY: 56,
          itemsSpacing: 10,
          itemWidth: 120,
          itemHeight: 18,
          itemTextColor: theme.palette.mode === "dark" ? "#fff" : "#333",
          symbolSize: 18,
          symbolShape: "circle",
        },
      ]}
    />
  );
};

export default PieChart;

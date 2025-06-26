import { useTheme } from "@mui/material";
import { ResponsivePie } from "@nivo/pie";
import { tokens } from "../theme";

// 🔹 Mock Data
const inventoryValueData = [
  { id: "SE01", value: 1500 },
  { id: "SE02", value: 2300 },
  { id: "SE03", value: 1100 },
];

const InventoryValuePie = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  return (
    <ResponsivePie
      data={inventoryValueData}
      margin={{ top: 40, right: 100, bottom: 80, left: 100 }}
      innerRadius={0.4}
      padAngle={2}
      cornerRadius={6}
      activeOuterRadiusOffset={10}
      colors={{ scheme: "category10" }}
      borderWidth={2}
      borderColor={{ from: "color", modifiers: [["darker", 0.3]] }}
      enableArcLabels={false}
      arcLinkLabelsSkipAngle={10}
      arcLinkLabelsTextColor={theme.palette.mode === "dark" ? "#fff" : "#333"}
      arcLinkLabelsThickness={2}
      arcLinkLabelsColor={{ from: "color" }}
      theme={{
        axis: {
          ticks: {
            text: { fill: theme.palette.mode === "dark" ? "#fff" : "#333" },
          },
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
      tooltip={({ datum }) => {
        const total = inventoryValueData.reduce((sum, d) => sum + d.value, 0);
        const percent = ((datum.data.value / total) * 100).toFixed(2);
        return (
          <div
            style={{
              background: theme.palette.mode === "dark" ? "#222" : "#fff",
              color: theme.palette.mode === "dark" ? "#fff" : "#333",
              padding: "8px",
              borderRadius: "5px",
              boxShadow: "0px 2px 10px rgba(0, 0, 0, 0.1)",
            }}
          >
            <strong>{datum.id}</strong>
            <div>₱{datum.value.toLocaleString()}</div>
            <div>{percent}% of total</div>
          </div>
        );
      }}
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

export default InventoryValuePie;

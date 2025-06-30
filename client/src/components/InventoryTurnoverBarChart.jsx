import { useTheme } from "@mui/material";
import { ResponsiveBar } from "@nivo/bar";
import { tokens } from "../theme";

const InventoryTurnoverBar = ({ data }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  return (
    <ResponsiveBar
      data={data}
      keys={["turnover"]}
      indexBy="name"   // note: use "name" instead of "se" to match your data
      margin={{ top: 40, right: 20, bottom: 70, left: 60 }}
      padding={0.3}
      colors={colors.greenAccent[500]}
      borderRadius={5}
      axisLeft={{
        legend: "Turnover Ratio",
        legendPosition: "middle",
        legendOffset: -50,
      }}
      axisBottom={{
        tickRotation: 0,
        legend: "Social Enterprises",
        legendPosition: "middle",
        legendOffset: 40,
      }}
      labelSkipHeight={12}
      labelTextColor={colors.grey[100]}
      theme={{
        axis: {
          ticks: {
            text: {
              fill: colors.grey[100],
            },
          },
          legend: {
            text: {
              fill: colors.grey[100],
            },
          },
        },
        legends: {
          text: {
            fill: colors.grey[100],
          },
        },
      }}
      tooltip={({ indexValue, value }) => (
        <div
          style={{
            background: theme.palette.mode === "dark" ? "#333" : "#fff",
            color: theme.palette.mode === "dark" ? "#fff" : "#333",
            padding: "10px",
            borderRadius: "5px",
            boxShadow: "0px 2px 6px rgba(0,0,0,0.2)",
          }}
        >
          <strong>{indexValue}</strong>: {value}
        </div>
      )}
    />
  );
};

export default InventoryTurnoverBar;

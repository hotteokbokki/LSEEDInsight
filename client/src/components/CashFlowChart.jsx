import { ResponsiveBar } from "@nivo/bar";
import { useTheme } from "@mui/material";
import { tokens } from "../theme";

const CashFlowBarChart = ({ data, isExporting = false }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  // Use black colors when exporting for better PDF visibility
  const textColor = isExporting ? "#000000" : colors.grey[100];
  const axisColor = isExporting ? "#000000" : colors.grey[100];

  // Custom colors for cash flow: Green for Inflow, Red for Outflow
  const getBarColor = (bar) => {
    if (bar.id === "Inflow") return "#4CAF50"; // Green
    if (bar.id === "Outflow") return "#f44336"; // Red
    return "#333333"; // Default
  };

  return (
    <ResponsiveBar
      data={data}
      keys={["Inflow", "Outflow"]}
      indexBy="quarter"
      margin={{ top: 40, right: 130, bottom: 60, left: 80 }}
      padding={0.3}
      groupMode="grouped"
      colors={getBarColor}
      borderColor={{ from: "color", modifiers: [["darker", 1.6]] }}
      axisTop={null}
      axisRight={null}
      axisBottom={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: "Quarter",
        legendPosition: "middle",
        legendOffset: 40,
      }}
      axisLeft={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        format: (value) => `₱${value.toLocaleString()}`,
        legend: "Amount",
        legendPosition: "middle",
        legendOffset: -60,
      }}
      labelSkipWidth={12}
      labelSkipHeight={12}
      labelTextColor="#000000"
      label={(d) => `₱${d.value.toLocaleString()}`}
      labelFormat={(label) => label}
      valueFormat={(value) => `₱${value.toLocaleString()}`}
      theme={{
        axis: {
          domain: {
            line: {
              stroke: axisColor,
              strokeWidth: isExporting ? 2 : 1,
            },
            labels: {
              text: {
                fontSize: isExporting ? 14 : 12,
                fontWeight: "bold",
                fill: "#000000",
              },
            },
          },
          ticks: {
            line: {
              stroke: axisColor,
              strokeWidth: isExporting ? 2 : 1,
            },
            text: {
              fill: textColor,
              fontSize: isExporting ? 14 : 11,
              fontWeight: isExporting ? "bold" : "normal",
            },
          },
          legend: {
            text: {
              fill: textColor,
              fontSize: isExporting ? 16 : 12,
              fontWeight: isExporting ? "bold" : "normal",
            },
          },
        },
        legends: {
          text: {
            fill: textColor,
            fontSize: isExporting ? 14 : 11,
            fontWeight: isExporting ? "bold" : "normal",
          },
        },
        grid: {
          line: {
            stroke: axisColor,
            strokeWidth: isExporting ? 1 : 0.5,
            strokeOpacity: isExporting ? 0.8 : 0.5,
          },
        },
        tooltip: {
          container: {
            background: isExporting ? "#ffffff" : colors.primary[400],
            color: isExporting ? "#000000" : "#ffffff",
          },
        },
      }}
      legends={[
        {
          dataFrom: "keys",
          anchor: "bottom-right",
          direction: "column",
          translateX: 120,
          itemWidth: 100,
          itemHeight: 20,
          itemsSpacing: 2,
          symbolSize: 20,
          itemTextColor: textColor,
          symbolBorderColor: textColor,
          effects: [
            {
              on: "hover",
              style: {
                itemOpacity: 1,
              },
            },
          ],
        },
      ]}
    />
  );
};

export default CashFlowBarChart;

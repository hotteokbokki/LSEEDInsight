import { ResponsiveLine } from "@nivo/line"; // ✅ Import ResponsiveLine for charts
import { useTheme } from "@mui/material"; // ✅ Import useTheme from MUI
import { tokens } from "../theme"; // ✅ Ensure tokens is imported from your theme file

const DualAxisLineChart = ({ data, isDashboard = false }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  // ✅ Ensure data is not undefined before flattening
  const allYValues = data?.flatMap((d) => d.data.map((point) => point.y)) || [];
  const minY = allYValues.length ? Math.min(...allYValues, -5) : -5;
  const maxY = allYValues.length ? Math.max(...allYValues, 5) : 5;

  return (
    <ResponsiveLine
      data={data || []} // ✅ Default to empty array if data is undefined
      theme={{
        axis: {
          domain: { line: { stroke: colors.grey[100] } },
          legend: { text: { fill: colors.grey[100] } },
          ticks: {
            line: { stroke: colors.grey[100], strokeWidth: 1 },
            text: { fill: colors.grey[100] },
          },
        },
        legends: { text: { fill: colors.grey[100] } },
        tooltip: { container: { color: colors.primary[500] } },
      }}
      colors={isDashboard ? { datum: "color" } : { scheme: "nivo" }}
      margin={{ top: 50, right: 210, bottom: 50, left: 60 }}
      xScale={{ type: "point" }}
      yScale={{
        type: "linear",
        min: minY, // ✅ Ensure zero baseline
        max: maxY,
        stacked: false,
        reverse: false,
      }}
      yFormat=" >-.2f"
      curve="catmullRom"
      axisTop={null}
      axisRight={null}
      axisBottom={{
        orient: "bottom",
        tickSize: 0,
        tickPadding: 5,
        tickRotation: 0,
        legend: isDashboard ? undefined : "Month",
        legendOffset: 36,
        legendPosition: "middle",
      }}
      axisLeft={{
        orient: "left",
        tickValues: [-5, -3, -1, 0, 1, 3, 5], // ✅ Y-axis centered at zero
        tickSize: 3,
        tickPadding: 5,
        tickRotation: 0,
        legend: isDashboard ? undefined : "Improvement Score",
        legendOffset: -40,
        legendPosition: "middle",
      }}
      enableGridX={false}
      enableGridY={true}
      pointSize={8}
      pointColor={{ theme: "background" }}
      pointBorderWidth={2}
      pointBorderColor={{ from: "serieColor" }}
      pointLabelYOffset={-12}
      useMesh={true}
      legends={[
        {
          anchor: "bottom-right", // ✅ Move legend to bottom-right
          direction: "column",
          justify: false,
          translateX: 110, // ✅ Adjust position horizontally
          translateY: -30, // ✅ Move down
          itemsSpacing: 4,
          itemDirection: "left-to-right",
          itemWidth: 80,
          itemHeight: 10,
          itemOpacity: 1,
          symbolSize: 12,
          symbolShape: "circle",
          symbolBorderColor: "rgba(0, 0, 0, .5)",
          effects: [
            {
              on: "hover",
              style: {
                itemBackground: "rgba(0, 0, 0, .03)",
                itemOpacity: 1,
              },
            },
          ],
        },
      ]}
    />
  );
};

export default DualAxisLineChart;

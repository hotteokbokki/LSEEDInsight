import { ResponsiveScatterPlot } from "@nivo/scatterplot";
import { useTheme } from "@mui/material";
import { tokens } from "../theme";

const ScatterPlot = ({ data, isDashboard = false }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  return (
    <ResponsiveScatterPlot
      data={data || []}
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
      margin={{ top: 40, right: 40, bottom: 70, left: 90 }}
      xScale={{ type: "linear" }}
      yScale={{ type: "linear" }}
      blendMode="multiply"
      axisTop={null}
      axisRight={null}
      axisBottom={{
        orient: "bottom",
        tickSize: 0,
        tickPadding: 5,
        tickRotation: 0,
        legend: isDashboard ? undefined : "X Axis",
        legendOffset: 36,
        legendPosition: "middle",
      }}
      axisLeft={{
        orient: "left",
        tickSize: 3,
        tickPadding: 5,
        tickRotation: 0,
        legend: isDashboard ? undefined : "Y Axis",
        legendOffset: -50,
        legendPosition: "middle",
      }}
      nodeSize={9}
      colors={isDashboard ? { datum: "color" } : { scheme: "category10" }}
      tooltip={({ node }) => (
        <div className="p-2 bg-white border rounded shadow">
          <strong>{node.serieId}</strong>
          <div>X: {node.data.xFormatted}</div>
          <div>Y: {node.data.yFormatted}</div>
        </div>
      )}
      legends={[
        {
          anchor: "bottom-right",
          direction: "column",
          justify: false,
          translateX: 110,
          translateY: -30,
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

export default ScatterPlot;

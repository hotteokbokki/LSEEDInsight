import { ResponsiveLine } from "@nivo/line";
import { useTheme } from "@mui/material";
import { tokens } from "../theme";
import { format, addDays } from "date-fns";

const POTLineChart = ({ data, isDashboard = false, dateRange = 60 }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  // ✅ Generate future months (or customize as needed)
  const generateDateRange = (numDays) => {
    const today = new Date();
    return Array.from(
      { length: numDays },
      (_, i) => format(addDays(today, i), "MMMM yyyy")
    );
  };

  const xAxisDates = generateDateRange(dateRange);

  // ✅ Filter and clean the data to ensure all points are valid
  const safeData = Array.isArray(data)
    ? data
        .filter((series) => series && Array.isArray(series.data))
        .map((series) => ({
          ...series,
          data: series.data
            .filter(
              (point) =>
                point &&
                typeof point.x === "string" &&
                typeof point.y === "number" &&
                !isNaN(point.y)
            )
            .map((point) => ({
              x: point.x,
              y: point.y,
            })),
        }))
        .filter((series) => series.data.length > 0)
    : [];

  const allYValues = safeData.flatMap((d) => d.data.map((p) => p.y));
  const minY = allYValues.length ? Math.min(...allYValues, 0) : 0;
  const maxY = allYValues.length ? Math.max(...allYValues, 5) : 5; // Ensure max is at least 5 for 0-5 scale

  if (safeData.length === 0) {
    return (
      <div
        style={{
          height: "400px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: colors.grey[300],
        }}
      >
        No valid data to display.
      </div>
    );
  }

  return (
    <ResponsiveLine
      data={safeData}
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
      xScale={{
        type: "point",
        domain: safeData.flatMap((s) => s.data.map((p) => p.x)),
      }}
      yScale={{
        type: "linear",
        min: minY, // Keep dynamic min, but ensure it's at least 0 if relevant
        max: maxY, // Keep dynamic max, but ensure it's at least 5 for the scale
        stacked: false,
        reverse: false,
      }}
      yFormat=" >-.2f" // This formats the tooltip, not the axis labels directly
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
        tickSize: 3,
        tickPadding: 5,
        tickRotation: 0,
        tickValues: [0, 1, 2, 3, 4, 5],
        format: (value) => {
          if (value === 0) return "0";
          if (value === 1) return "1";
          if (value === 2) return "2";
          if (value === 3) return "3";
          if (value === 4) return "4";
          if (value === 5) return "5";
          return value;
        },
        legend: isDashboard ? undefined : "Profit Rating",
        legendOffset: -40,
        legendPosition: "middle",
      }}
      enableGridX={false}
      enableGridY={false}
      pointSize={8}
      pointColor={{ theme: "background" }}
      pointBorderWidth={2}
      pointBorderColor={{ from: "serieColor" }}
      pointLabelYOffset={-12}
      useMesh={true}
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

export default POTLineChart;
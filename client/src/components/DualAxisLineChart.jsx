import { ResponsiveLine } from "@nivo/line";
import { useTheme } from "@mui/material";
import { tokens } from "../theme";

const DualAxisLineChart = ({ data, isDashboard = false, isExporting = false }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const chartPrimaryColor = isExporting
    ? "#00796b"
    : theme.palette.mode === "dark"
    ? colors.greenAccent[500]
    : colors.greenAccent[400];

  const chartSecondaryColor = isExporting
    ? "#004d40"
    : theme.palette.mode === "dark"
    ? colors.blueAccent[500]
    : colors.blueAccent[400];

  const axisAndGridColor = isExporting
    ? "#000000"
    : theme.palette.mode === "dark"
    ? colors.grey[100]
    : "#ffffff";

  const textColor = isExporting ? "#000000" : "#ffffff";

  const allYValues = data?.flatMap((d) => d.data.map((point) => point.y)) || [];
  const minDataY = allYValues.length ? Math.min(...allYValues) : 0;
  const maxDataY = allYValues.length ? Math.max(...allYValues) : 1;
  const yBuffer = (maxDataY - minDataY) * 0.1;
  const minY = minDataY - yBuffer;
  const maxY = maxDataY + yBuffer;

  const colorMap = {
    Revenue: chartPrimaryColor,
    Expenses: chartSecondaryColor,
  };

  return (
    <div
      style={{
        width: isExporting ? "100%" : "80%",
        height: "100%",
        margin: "0 auto",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
      }}
    >
      <ResponsiveLine
        data={data || []}
        theme={{
          axis: {
            domain: {
              line: {
                stroke: axisAndGridColor,
                strokeWidth: isExporting ? 1.5 : 1,
              },
            },
            legend: {
              text: {
                fill: textColor,
                fontSize: isExporting ? 16 : 12,
              },
            },
            ticks: {
              line: {
                stroke: axisAndGridColor,
                strokeWidth: isExporting ? 1.5 : 1,
              },
              text: {
                fill: textColor,
                fontSize: isExporting ? 14 : 11,
              },
            },
          },
          grid: {
            line: {
              stroke: axisAndGridColor,
              strokeWidth: isExporting ? 1.5 : 1,
              strokeOpacity: 1,
            },
          },
          legends: {
            text: {
              fill: textColor,
              fontSize: isExporting ? 14 : 11,
            },
          },
          tooltip: {
            container: {
              background: isExporting ? "#ffffff" : colors.primary[500],
              color: isExporting ? "#000000" : "#ffffff",
              padding: "10px",
              borderRadius: "5px",
              fontSize: isExporting ? 14 : 12,
            },
          },
        }}
        colors={({ id }) => colorMap[id] || chartPrimaryColor}
        margin={
          isExporting
            ? { top: 80, right: 240, bottom: 100, left: 100 }
            : { top: 60, right: 100, bottom: 80, left: 80 }
        }
        xScale={{ type: "point" }}
        yScale={{
          type: "linear",
          min: minY,
          max: maxY,
          stacked: false,
          reverse: false,
        }}
        yFormat=" >-.2f"
        curve= "catmullRom" 
        axisTop={null}
        axisRight={null}
        axisBottom={{
          orient: "bottom",
          tickSize: 0,
          tickPadding: 14,
          tickRotation: data?.length > 6 ? -30 : 0,
          legend: isExporting ? undefined : (isDashboard ? undefined : "Quarter"),
          legendOffset: isExporting ? 0 : 50,
          legendPosition: "middle",
        }}
        axisLeft={{
          orient: "left",
          tickValues: 7,
          tickSize: 3,
          tickPadding: 5,
          legend: isExporting ? undefined : (isDashboard ? undefined : "Amount (₱)"),
          legendOffset: -50,
          legendPosition: "middle",
        }}
        enableGridX={false}
        enableGridY={true}
        pointSize={isExporting ? 14 : 8}
        lineWidth={isExporting ? 4 : 2}
        pointColor={{ theme: "background" }}
        pointBorderWidth={2}
        pointBorderColor={{ from: "serieColor" }}
        pointLabelYOffset={-12}
        useMesh={true}
        legends={[
          {
            anchor: "bottom-right",
            direction: "column",
            translateX: isExporting ? 120 : 150,
            translateY: isExporting ? 0 : 0,
            itemsSpacing: 6,
            itemDirection: "left-to-right",
            itemWidth: 120,
            itemHeight: 20,
            itemOpacity: 1,
            symbolSize: isExporting ? 16 : 12,
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
    </div>
  );
};

export default DualAxisLineChart;

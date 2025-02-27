import { ResponsiveRadar } from "@nivo/radar";
import { useTheme } from "@mui/material";
import { tokens } from "../theme";

const RadarChart = ({ radarData = [], isDashboard = false }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  // Ensure radarData is formatted correctly for Nivo
  const formattedData =
    radarData?.map((item) => ({
      category: item.category,
      Overview: parseFloat(item.score),
    })) || [];

  // Adjust colors based on theme mode
  const chartColor =
    theme.palette.mode === "dark"
      ? colors.greenAccent[300]
      : colors.greenAccent[400];
  const borderChartColor =
    theme.palette.mode === "dark" ? colors.primary[300] : "#333333"; // Darker border in light mode

  // Dynamically set grid and axis colors based on theme mode
  const gridLineColor =
    theme.palette.mode === "dark" ? colors.grey[100] : "black"; // Black in light mode
  const axisTextColor =
    theme.palette.mode === "dark" ? colors.grey[100] : "black"; // Black in light mode

  return (
    <ResponsiveRadar
      data={formattedData}
      keys={["Overview"]}
      indexBy="category"
      maxValue={5}
      margin={{ top: 50, right: 80, bottom: 40, left: 80 }}
      curve="linearClosed"
      borderWidth={2}
      borderColor={borderChartColor} // Brighter border in dark mode, darker in light mode
      gridLevels={5}
      gridShape="circular"
      gridLabelOffset={36}
      enableDots={true}
      dotSize={8}
      dotColor={chartColor} // Brighter dots in dark mode
      dotBorderWidth={2}
      dotBorderColor={borderChartColor} // Consistent with border color
      colors={chartColor} // More visible chart color
      fillOpacity={0.6} // Increased fill opacity for better visibility
      blendMode="multiply"
      motionConfig="wobbly"
      theme={{
        axis: {
          domain: {
            line: { stroke: gridLineColor }, // Grid lines color
          },
          ticks: {
            line: { stroke: gridLineColor }, // Tick lines color
            text: { fill: axisTextColor }, // Axis text color
          },
        },
        legends: {
          text: { fill: colors.grey[100] },
        },
        tooltip: {
          container: {
            background: colors.primary[500], // Tooltip background color
            color: "#ffffff", // Tooltip text color (white)
          },
        },
      }}
      legends={[
        {
          anchor: "top-left",
          direction: "column",
          translateX: -50,
          translateY: -40,
          itemWidth: 80,
          itemHeight: 20,
          itemOpacity: 0.9, // Make legend more visible
          symbolSize: 12,
          symbolShape: "circle",
          symbolBorderColor: colors.grey[700],
          effects: [
            {
              on: "hover",
              style: {
                itemBackground: "rgba(0, 0, 0, 0.7)", // Dark background on hover
                itemOpacity: 1,
                color: "#ffffff", // White text color on hover
              },
            },
          ],
        },
      ]}
    />
  );
};

export default RadarChart;

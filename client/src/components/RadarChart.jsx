import { ResponsiveRadar } from "@nivo/radar";
import { useTheme } from "@mui/material";
import { tokens } from "../theme";

const RadarChart = ({ radarData = [], isDashboard = false }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  // Ensure radarData is formatted correctly for Nivo
  const formattedData = radarData?.map((item) => ({
    category: item.category, 
    Overview: parseFloat(item.score),
  })) || [];

  // Adjust colors based on theme mode
  const chartColor = theme.palette.mode === "dark" ? colors.greenAccent[300] : colors.greenAccent[400];
  const borderChartColor = theme.palette.mode === "dark" ? colors.primary[300] : colors.primary[500];

  return (
    <ResponsiveRadar
      data={formattedData}
      keys={["Overview"]}
      indexBy="category"
      maxValue={5}
      margin={{ top: 50, right: 80, bottom: 40, left: 80 }}
      curve="linearClosed"
      borderWidth={2}
      borderColor={borderChartColor} // Brighter border in dark mode
      gridLevels={5}
      gridShape="circular"
      gridLabelOffset={36}
      enableDots={true}
      dotSize={8}
      dotColor={chartColor} // Brighter dots in dark mode
      dotBorderWidth={2}
      dotBorderColor={borderChartColor}
      colors={chartColor} // More visible chart color
      fillOpacity={0.6} // Increased fill opacity for better visibility
      blendMode="multiply"
      motionConfig="wobbly"
      theme={{
        axis: {
          domain: {
            line: { stroke: colors.grey[100] },
          },
          ticks: {
            line: { stroke: colors.grey[100] },
            text: { fill: colors.grey[100] },
          },
        },
        legends: {
          text: { fill: colors.grey[100] },
        },
        tooltip: {
          container: {
            background: colors.primary[500],
            color: colors.grey[100],
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
          symbolBorderColor: colors.grey[100],
          effects: [
            {
              on: "hover",
              style: {
                itemBackground: "rgba(255, 255, 255, 0.1)", // Slightly lighter background on hover
                itemOpacity: 1,
              },
            },
          ],
        },
      ]}
    />
  );
};

export default RadarChart;

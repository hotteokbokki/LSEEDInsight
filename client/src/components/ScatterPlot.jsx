// components/ScatterPlot.jsx
import { ResponsiveScatterPlot } from "@nivo/scatterplot";
import { useTheme } from "@mui/material";
import { tokens } from "../theme";

const ScatterPlot = ({ data }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  return (
    <ResponsiveScatterPlot
      data={data}
      margin={{ top: 40, right: 130, bottom: 70, left: 90 }}
      xScale={{ type: "point" }}
      yScale={{ type: "linear", min: "auto", max: "auto" }}
      blendMode="multiply"
      axisTop={null}
      axisRight={null}
      axisBottom={{
        orient: "bottom",
        legend: "X Axis",
        legendPosition: "middle",
        legendOffset: 46,
      }}
      axisLeft={{
        orient: "left",
        legend: "Y Axis",
        legendPosition: "middle",
        legendOffset: -60,
      }}
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
        tooltip: {
          container: {
            background: colors.primary[400],
            color: "#ffffff",
          },
        },
      }}
      legends={[
        {
          anchor: "bottom-right",
          direction: "column",
          translateX: 130,
          itemWidth: 100,
          itemHeight: 12,
          symbolSize: 12,
          symbolShape: "circle",
        },
      ]}
    />
  );
};

export default ScatterPlot;

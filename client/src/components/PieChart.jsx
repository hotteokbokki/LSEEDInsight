import { ResponsivePie } from "@nivo/pie";
import { tokens } from "../theme";
import { useTheme } from "@mui/material";

const PieChart = ({ data }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  // Ensure proper text contrast for both modes
  const textColor = theme.palette.mode === "dark" ? "#FFFFFF" : "#333333"; // Strong contrast
  const backgroundColor = theme.palette.mode === "dark" ? colors.grey[900] : "#FFFFFF";

  return (
    <ResponsivePie
      data={data}
      tooltip={({ datum }) => (
        <div
          style={{
            background: backgroundColor,
            color: textColor,
            padding: "5px",
            borderRadius: "5px",
            boxShadow: "0px 0px 10px rgba(0, 0, 0, 0.1)", // Add slight shadow for visibility
          }}
        >
          {datum.data.category}
        </div>
      )}
      theme={{
        axis: {
          domain: {
            line: { stroke: textColor },
          },
          legend: {
            text: { fill: textColor },
          },
          ticks: {
            line: { stroke: textColor, strokeWidth: 1 },
            text: { fill: textColor },
          },
        },
        legends: {
          text: { fill: textColor }, // Ensure strong contrast in legends
        },
        tooltip: {
          container: {
            background: backgroundColor,
            color: textColor,
          },
        },
      }}
      margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
      innerRadius={0.5}
      padAngle={0.7}
      cornerRadius={3}
      activeOuterRadiusOffset={8}
      borderColor={{ from: "color", modifiers: [["darker", 0.3]] }}
      arcLinkLabelsSkipAngle={10}
      arcLinkLabelsTextColor={textColor} // Ensure arc link text is visible
      arcLinkLabelsThickness={2}
      arcLinkLabelsColor={{ from: "color" }}
      arcLabelsSkipAngle={10}
      arcLabelsComponent={() => null} // **Removes the numbers inside the pie chart**
      arcLabelsTextColor={textColor} // Stronger contrast for arc labels
      legends={[
        {
          anchor: "bottom",
          direction: "row",
          translateX: 0,
          translateY: 56,
          itemsSpacing: 0,
          itemWidth: 100,
          itemHeight: 18,
          itemTextColor: textColor, // Ensure legend text is visible
          itemDirection: "left-to-right",
          itemOpacity: 1,
          symbolSize: 18,
          symbolShape: "circle",
          effects: [
            {
              on: "hover",
              style: {
                itemTextColor: theme.palette.mode === "dark" ? colors.grey[300] : colors.grey[800], // Stronger hover contrast
              },
            },
          ],
        },
      ]}
    />
  );
};

export default PieChart;

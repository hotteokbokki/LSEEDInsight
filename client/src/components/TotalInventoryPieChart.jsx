import { ResponsivePie } from "@nivo/pie";
import { useTheme } from "@mui/material";
import { tokens } from "../theme";

const InventoryValuePie = ({ data }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  console.log("PieChart data:", data);

  return (
    <ResponsivePie
      data={data}
      margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
      innerRadius={0.5}
      padAngle={0.7}
      cornerRadius={3}
      colors={{ scheme: "nivo" }}
      borderWidth={1}
      borderColor={{ from: "color", modifiers: [["darker", 0.2]] }}
      arcLinkLabelsTextColor={colors.grey[100]}
      arcLinkLabelsThickness={2}
      arcLinkLabelsColor={{ from: "color" }}
      arcLabelsSkipAngle={10}
      arcLabelsTextColor={colors.grey[100]}
      tooltip={({ datum }) => {
  const id = datum?.id ?? "No SE";
  const value = typeof datum?.value === "number" && !isNaN(datum?.value)
    ? datum.value
    : 0;

  return (
    <div
      style={{
        background: theme.palette.mode === "dark" ? "#333" : "#fff",
        color: theme.palette.mode === "dark" ? "#fff" : "#333",
        padding: "10px",
        borderRadius: "5px",
        boxShadow: "0px 2px 6px rgba(0,0,0,0.2)",
      }}
    >
      <strong>{id}</strong> has ₱{value.toLocaleString()} total inventory
    </div>
  );
}}
    />
  );
};

export default InventoryValuePie;
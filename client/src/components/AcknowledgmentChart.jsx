import { ResponsiveBar } from '@nivo/bar';
import { Box, Typography } from '@mui/material';
import { useState, useEffect } from "react";
import axios from "axios";

const AcknowledgmentChart = () => {
  const [ackData, setAckData] = useState([]);

  useEffect(() => {
    const fetchAckData = async () => {
      try {
        const response = await axios.get("http://localhost:4000/ack-data");
        console.log("✅ Raw Data:", response.data);

        const rawData = response.data;
        const formattedData = rawData.map(item => ({
          batch: item.se_name,  // 🔹 Use SE name instead of batch ID
          acknowledged: Number(item.acknowledged_percentage) || 0,
          pending: Number(item.pending_percentage) || 0
        }));

        console.log("✅ Formatted Data:", formattedData);
        setAckData(formattedData);
      } catch (error) {
        console.error("❌ Error fetching acknowledgment data:", error);
        setAckData([]);  
      }
    };

    fetchAckData();
  }, []);

  if (!ackData?.length) {
    return <Typography variant="h6" textAlign="center">No data available</Typography>;
  }

  return (
    <Box sx={{ height: 400, width: '100%' }}>
      <Typography variant="h6" textAlign="center" sx={{ mb: 2 }}>
        Acknowledgment & Pending Evaluations
      </Typography>
      <ResponsiveBar
        data={ackData}
        keys={['acknowledged', 'pending']}
        indexBy='batch'
        margin={{ top: 50, right: 100, bottom: 80, left: 60 }}
        padding={0.4}
        layout="vertical"  // 🔹 Makes labels more readable
        colors={{ scheme: 'set2' }}
        borderRadius={4}
        enableLabel={true}
        labelSkipWidth={12}
        labelSkipHeight={12}
        labelTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
        axisBottom={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: -15,  // 🔹 Rotates to prevent overlap
          legend: 'Social Enterprises',
          legendPosition: 'middle',
          legendOffset: 60,
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          legend: 'Percentage',
          legendPosition: 'middle',
          legendOffset: -40,
        }}
        legends={[
          {
            dataFrom: 'keys',
            anchor: 'bottom-right',
            direction: 'column',
            translateX: 80,
            itemWidth: 100,
            itemHeight: 20,
            itemsSpacing: 2,
            symbolSize: 18,
          },
        ]}
        groupMode="grouped"  // 🔹 Grouped bars for better comparison
      />
    </Box>
  );
};

export default AcknowledgmentChart;
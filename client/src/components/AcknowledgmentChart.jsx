import { ResponsiveBar } from '@nivo/bar';
import { Box, Typography } from '@mui/material';

const mockData = [
  { batch: 'Batch 1', acknowledged: 45, pending: 10 },
  { batch: 'Batch 2', acknowledged: 30, pending: 15 },
  { batch: 'Batch 3', acknowledged: 50, pending: 5 },
  { batch: 'Batch 4', acknowledged: 20, pending: 25 },
  { batch: 'Batch 5', acknowledged: 35, pending: 10 },
];

const AcknowledgmentChart = ({ data = mockData }) => {
  if (!data || data.length === 0) {
    return <Typography>No data available</Typography>;
  }

  return (
      <ResponsiveBar
        data={data}
        keys={['acknowledged', 'pending']}
        indexBy='batch'
        margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
        padding={0.3}
        colors={{ scheme: 'set2' }}
        borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: 'Batch',
          legendPosition: 'middle',
          legendOffset: 32,
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: 'Evaluations',
          legendPosition: 'middle',
          legendOffset: -40,
        }}
        labelSkipWidth={12}
        labelSkipHeight={12}
        labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
        legends={[
          {
            dataFrom: 'keys',
            anchor: 'bottom-right',
            direction: 'column',
            justify: false,
            translateX: 120,
            itemWidth: 100,
            itemHeight: 20,
            itemsSpacing: 2,
            symbolSize: 20,
            effects: [
              {
                on: 'hover',
                style: {
                  itemOpacity: 0.85,
                },
              },
            ],
          },
        ]}
      />
  );
};

export default AcknowledgmentChart;
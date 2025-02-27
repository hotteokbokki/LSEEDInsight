import { ResponsiveBar } from '@nivo/bar';
import { useTheme } from '@mui/material';
import { tokens } from '../theme';
import { Box, Typography } from '@mui/material';

const LeaderboardChart = ({ data }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  // Ensure text contrast for both modes
  const textColor = theme.palette.mode === 'dark' ? '#FFFFFF' : '#333333';
  const backgroundColor = theme.palette.mode === 'dark' ? colors.grey[900] : '#FFFFFF';

  // Ensure data is valid before processing
  if (!data || !Array.isArray(data)) return null;

  const chartData = data.map((se) => ({
    social_enterprise: se.social_enterprise,
    rating: parseFloat(se.most_recent_avg_rating),
  }));

  return (
    <Box m="20px" height="100%" display="flex" flexDirection="column">
      <Box height="100%">
        <ResponsiveBar
          data={chartData}
          keys={['rating']}
          indexBy="social_enterprise"
          margin={{ top: 40, right: 40, bottom: 70, left: 60 }}
          padding={0.3}
          colors={({ index }) => colors.blueAccent[400]} // Use consistent theme colors
          axisBottom={null}
          axisLeft={{
            legend: 'Rating',
            legendPosition: 'middle',
            legendOffset: -40,
            tickValues: [1, 2, 3, 4, 5],
            format: (v) => Math.round(v),
            tickTextColor: textColor,
          }}
          tooltip={({ value, indexValue }) => (
            <div
              style={{
                background: backgroundColor,
                color: textColor,
                padding: '5px',
                borderRadius: '5px',
                boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.1)',
              }}
            >
              <strong>{indexValue}</strong>
              <div>Avg Rating: {value}</div>
            </div>
          )}
          layout="vertical"
          labelSkipWidth={12}
          labelSkipHeight={12}
          labelTextColor={textColor}
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
              text: { fill: textColor },
            },
            tooltip: {
              container: {
                background: backgroundColor,
                color: textColor,
              },
            },
          }}
        />
      </Box>
    </Box>
  );
};

export default LeaderboardChart;

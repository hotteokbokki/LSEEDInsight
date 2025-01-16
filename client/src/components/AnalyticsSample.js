import React from 'react';
import { PieChart, Pie, Cell, Tooltip } from 'recharts';

const data = [
  { name: 'Sales', value: 80 },
  { name: 'Earnings', value: 15 },
  { name: 'Exposure', value: 5 },
];

const COLORS = ['#8884d8', '#82ca9d', '#ffc658'];

const AnalyticsChart = () => {
  return (
    <PieChart width={300} height={300}>
      <Pie
        data={data}
        dataKey="value"
        nameKey="name"
        cx="50%"
        cy="50%"
        outerRadius={80}
        fill="#8884d8"
        label
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
      <Tooltip />
    </PieChart>
  );
};

export default AnalyticsChart;

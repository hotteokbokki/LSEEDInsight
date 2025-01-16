import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const data = [
  { time: '10am', sales: 40 },
  { time: '11am', sales: 60 },
  { time: '12pm', sales: 20 },
  { time: '1pm', sales: 80 },
  { time: '2pm', sales: 2678 },
  { time: '3pm', sales: 60 },
  { time: '4pm', sales: 80 },
];

const GEMSSalesReport = () => {
  return (
    <LineChart width={600} height={300} data={data}>
      <XAxis dataKey="time" />
      <YAxis />
      <Tooltip />
      <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
      <Line type="monotone" dataKey="sales" stroke="#8884d8" />
    </LineChart>
  );
};

export default GEMSSalesReport;

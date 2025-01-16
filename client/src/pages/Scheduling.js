import React, { useState } from 'react';
import Calendar from 'react-calendar';
import Layout from '../components/Layout';
import '../styles/Scheduling.css';
import 'react-calendar/dist/Calendar.css';

const Scheduling = () => {
  const [date, setDate] = useState(new Date());

  return (
    <Layout>
      <div className="scheduling-container">
        <h2>Scheduling</h2>
        <Calendar onChange={setDate} value={date} />
        <p>Selected Date: {date.toDateString()}</p>
      </div>
    </Layout>
  );
};

export default Scheduling;

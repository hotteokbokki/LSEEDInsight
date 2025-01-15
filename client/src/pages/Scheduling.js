// src/pages/Scheduling.js
import React, { useState, useEffect } from 'react';
import '../styles/Scheduling.css'; // Import the Scheduling CSS

const Scheduling = () => {
  const [schedule, setSchedule] = useState([]);

  useEffect(() => {
    fetch("/api/schedule")
      .then(response => response.json())
      .then(data => setSchedule(data));
  }, []);

  return (
    <div className="scheduling-container">
      <h2>Scheduling</h2>
      {schedule.length === 0 ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {schedule.map((event, index) => (
            <li key={index}>{event.name} - {event.date}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Scheduling;

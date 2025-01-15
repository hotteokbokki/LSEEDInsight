// src/pages/Scheduling.js
import React, { useState, useEffect } from 'react';

const Scheduling = () => {
  const [schedule, setSchedule] = useState([]);

  useEffect(() => {
    // Fetch scheduled events data
    fetch("/api/schedule")
      .then(response => response.json())
      .then(data => setSchedule(data));
  }, []);

  return (
    <div>
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

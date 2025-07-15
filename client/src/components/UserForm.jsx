import React, { useState } from 'react';

const UserForm = () => {
  const [location, setLocation] = useState('');
  const [preference, setPreference] = useState('');
  const [gptResult, setGptResult] = useState('');  // 👈 Save the content returned by gpt

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:3001/api/generate-route', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ location, preference }),
      });

      const data = await response.json();

      if (response.ok) {
        setGptResult(data.result);  // 👈 // Save GPT response to state
      } else {
        console.error('Server error:', data.error);
        alert('Failed to fetch route: ' + data.error);
      }

      console.log('GPT returning data:', data);
    } catch (err) {
      console.error('Error:', err);
      alert('Something went wrong');
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Starting Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <input
          type="text"
          placeholder="Your Preference"
          value={preference}
          onChange={(e) => setPreference(e.target.value)}
        />
        <button type="submit">Generate</button>
      </form>

      {/* 👇 Display GPT return results */}
      {gptResult && (
        <div style={{ marginTop: '20px', whiteSpace: 'pre-wrap' }}>
          <h3>Suggested Itinerary:</h3>
          <p>{gptResult}</p>
        </div>
      )}
    </div>
  );
};

export default UserForm;

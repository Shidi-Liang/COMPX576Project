// src/components/UserForm.jsx
import React, { useState } from 'react';

const UserForm = ({ onResults }) => {
  const [start, setstart] = useState('');
  const [end, setend] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3001/api/route/generate-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start, end }),
      });
      const data = await response.json();
      if (response.ok) {
        const parsedResult = JSON.parse(data.result);
        onResults(parsedResult);
      } else {
        alert('Failed to fetch route: ' + data.error);
      }
    } catch (err) {
      alert('Something went wrong');
    }
  };

  return (
    // 工具条外层：卡片+投影+固定在标题下方
    <div className="toolbar toolbar-sticky">
      <form onSubmit={handleSubmit} className="controls controls-lg">
        <input
          type="text"
          className="input input-lg"
          placeholder="Starting Location"
          value={start}
          onChange={(e) => setstart(e.target.value)}
          required
        />
        <input
          type="text"
          className="input input-lg"
          placeholder="destination"
          value={end}
          onChange={(e) => setend(e.target.value)}
          required
        />
        <button type="submit" className="btn btn-primary btn-lg btn-cta">
          Generate
        </button>
      </form>

      {/* 你有 POI 的小药丸按钮的话，也放在 toolbar 里更协调 */}
      {/* <div className="btn-group pills-scroll">
        ...
      </div> */}
    </div>
  );
};

export default UserForm;



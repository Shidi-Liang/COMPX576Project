/*import React from 'react';

const TimelineView = ({ stops }) => {
  return (
    <div style={{ padding: '1rem' }}>
      <h2>🕰️ Timeline View</h2>
      {stops.map((stop, index) => (
        <div key={index} style={{ marginBottom: '1.5rem' }}>
          <h3>{stop.time} – {stop.place}</h3>
          <p>{stop.description}</p>
        </div>
      ))}
    </div>
  );
};

export default TimelineView;*/


import React from "react";

const TimelineView = ({ stops }) => {
  if (!stops || stops.length === 0) {
    return <div className="auth-msg">No stops available.</div>;
  }

  return (
    <div className="tl">
      {stops.map((stop, index) => (
        <div key={index} className="tl-item">
          {/* 左边的时间线圆点+竖线 */}
          <div className="tl-dot">
            {index !== stops.length - 1 && <div className="tl-line"></div>}
          </div>

          {/* 右边的内容卡片 */}
          <div className="tl-card">
            <div className="tl-head">
              <span className="tl-place">{stop.place}</span>
              {stop.time && <span className="tl-time">{stop.time}</span>}
            </div>
            {stop.description && (
              <div className="tl-desc">{stop.description}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TimelineView;









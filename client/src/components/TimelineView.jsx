import React from "react";

const TimelineView = ({ stops }) => {
  if (!stops || stops.length === 0) {
    return <div className="auth-msg">No stops available.</div>;
  }

  return (
    <div className="tl">
      {stops.map((stop, index) => (
        <div key={index} className="tl-item">
          {/* Timeline dot + vertical line on the left */}
          <div className="tl-dot">
            {index !== stops.length - 1 && <div className="tl-line"></div>}
          </div>

          {/* Content card on the right */}
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









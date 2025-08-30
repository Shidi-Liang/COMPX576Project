/*import React from 'react';

const TimelineView = ({ route }) => {
  if (!route || route.length === 0) return null;

  return (
    <div className="bg-white shadow-md rounded-md p-4 mt-4">
      <h2 className="text-xl font-bold mb-3">🕐 Timeline View</h2>
      <div className="space-y-4 border-l-2 border-gray-300 pl-4">
        {route.map((stop, idx) => (
          <div key={idx} className="relative">
            <div className="absolute -left-2 top-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
            <div>
              <p className="font-semibold text-blue-700">{stop.time} – {stop.place}</p>
              <p className="text-sm text-gray-600">{stop.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimelineView;*/



import React from 'react';

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

export default TimelineView;



/*import React from 'react';

const TimelineView = ({ route }) => {
  if (!route || !Array.isArray(route.stops)) return null;

  return (
    <div style={{ padding: '20px' }}>
      <h2>🕒 Timeline View</h2>
      <div style={{ borderLeft: '3px solid #aaa', marginLeft: '15px', paddingLeft: '15px' }}>
        {route.stops.map((stop, index) => (
          <div key={index} style={{ marginBottom: '30px', position: 'relative' }}>
            <div style={{
              width: '10px',
              height: '10px',
              backgroundColor: '#555',
              borderRadius: '50%',
              position: 'absolute',
              left: '-19px',
              top: '5px'
            }} />
            <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
              {stop.time} — {stop.place}
            </div>
            <div style={{ color: '#ccc', marginTop: '5px' }}>{stop.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimelineView;*/



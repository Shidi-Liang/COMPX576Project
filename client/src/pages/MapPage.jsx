/*import React, { useState } from 'react';
import UserForm from '../components/UserForm';
import Map from '../components/MapComponent';

const MapPage = () => {
  const [places, setPlaces] = useState([]);

  return (
    <div>
      <h1>Smart Travel Buddy</h1>
      <UserForm onResults={setPlaces} />
      <Map places={places} />

    </div>
  );
};

export default MapPage;*/

// client/src/pages/MapPage.jsx
/*import React, { useState } from 'react';
import UserForm from '../components/UserForm';
import MapComponent from '../components/MapComponent';

const MapPage = () => {
  const [routeOptions, setRouteOptions] = useState([]); // 多条路线，每条含多个 stop

  return (
    <div>
      <h1>Smart Travel Buddy</h1>
      <UserForm onResults={setRouteOptions} /> {/* GPT 生成后返回 setRouteOptions *///}
      /*<MapComponent routeOptions={routeOptions} />
    </div>
  );
};

export default <MapPage></MapPage>*/


/*import React, { useState } from 'react';
import UserForm from '../components/UserForm';
import MapComponent from '../components/MapComponent';
import TimelineView from '../components/TimelineView';  // ✅ 记得引入！

const MapPage = () => {
  const [routeOptions, setRouteOptions] = useState([]); // 多条路线，每条含多个 stop

  return (
    <div>
      <h1>Smart Travel Buddy</h1>

      {/* 表单生成路线 *///}
      /*<UserForm onResults={setRouteOptions} />

      {/* 时间线视图：显示第一条路线 *///}
      /*{routeOptions.length > 0 && (
        <>
          <h2>Timeline View:</h2>
          <TimelineView route={routeOptions[0].stops} />
        </>
      )}

      {/* 地图路线视图 *///}
      /*<MapComponent routeOptions={routeOptions} />
    </div>
  );
};

export default MapPage;*/



/*import React, { useState } from 'react';
import UserForm from '../components/UserForm';
import MapComponent from '../components/MapComponent';
import TimelineView from '../components/TimelineView'; // 引入 TimelineView

const MapPage = () => {
  const [routeOptions, setRouteOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(0); // 当前选择的 Option 索引（0 表示第一个）

  return (
    <div>
      <h1>Smart Travel Buddy</h1>
      <UserForm onResults={setRouteOptions} />
      {routeOptions.length > 0 && (
        <>
          {/* 切换按钮 *///}
          /*<div style={{ marginBottom: '10px' }}>
            {routeOptions.map((option, index) => (
              <button
                key={index}
                onClick={() => setSelectedOption(index)}
                style={{
                  marginRight: '10px',
                  fontWeight: selectedOption === index ? 'bold' : 'normal',
                }}
              >
                Option {index + 1}
              </button>
            ))}
          </div>

          {/* 展示 Timeline *///}
          /*<TimelineView stops={routeOptions[selectedOption].stops} />
          {/* 展示地图 *///}
          /*<MapComponent routeOptions={routeOptions} />
        </>
      )}
    </div>
  );
};

export default MapPage;*/


/*import React, { useState } from 'react';
import UserForm from '../components/UserForm';
import MapComponent from '../components/MapComponent';
import TimelineView from '../components/TimelineView';

const MapPage = () => {
  const [routeOptions, setRouteOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(0);

  return (
    <div>
      <h1>Smart Travel Buddy</h1>
      <UserForm onResults={setRouteOptions} />

      {/* Timeline 和按钮：只有在有结果时才显示 *///}
      /*{routeOptions.length > 0 && (
        <>
          <div style={{ marginBottom: '10px' }}>
            {routeOptions.map((option, index) => (
              <button
                key={index}
                onClick={() => setSelectedOption(index)}
                style={{
                  marginRight: '10px',
                  fontWeight: selectedOption === index ? 'bold' : 'normal',
                }}
              >
                Option {index + 1}
              </button>
            ))}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <TimelineView stops={routeOptions[selectedOption].stops} />
          </div>
        </>
      )}

      {/* 地图总是显示（即使没有 routeOptions） *///}
      /*<div style={{ height: '500px' }}>
        <MapComponent routeOptions={routeOptions} />

      </div>
    </div>
  );
};

export default MapPage;*/

import React, { useState } from 'react';
import UserForm from '../components/UserForm';
import MapComponent from '../components/MapComponent';
import TimelineView from '../components/TimelineView';

const MapPage = ({ user }) => {  // ✅ 接收 user
  const [routeOptions, setRouteOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(0);

  const saveRoute = async () => {
    const selectedRoute = routeOptions[selectedOption]; // ✅ 从选中的选项取出路线
    if (!selectedRoute) return alert('No route selected');

    const response = await fetch('http://localhost:3001/api/route/save-route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user._id,  // ✅ 使用从 App 传进来的 user
        title: `My Trip - ${new Date().toLocaleString()}`,
        stops: selectedRoute.stops,
      }),
    });

    const data = await response.json();
    if (data.success) alert('Route saved successfully!');
    else alert('Failed to save route');
  };

  return (
    <div>
      <h1>Smart Travel Buddy</h1>
      <UserForm onResults={setRouteOptions} />

      {/* Timeline 和按钮：只有在有结果时才显示 */}
      {routeOptions.length > 0 && (
        <>
          <div style={{ marginBottom: '10px' }}>
            {routeOptions.map((option, index) => (
              <button
                key={index}
                onClick={() => setSelectedOption(index)}
                style={{
                  marginRight: '10px',
                  fontWeight: selectedOption === index ? 'bold' : 'normal',
                }}
              >
                Option {index + 1}
              </button>
            ))}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <TimelineView stops={routeOptions[selectedOption].stops} />
          </div>

          {/* ✅ Save Route 按钮 */}
          <button onClick={saveRoute}>Save Route</button>
        </>
      )}

      {/* 地图总是显示 */}
      <div style={{ height: '500px' }}>
        <MapComponent routeOptions={routeOptions} />
      </div>
    </div>
  );
};

export default MapPage;









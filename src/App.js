import React, { useState } from "react";
import ReactScene from "./ReactScene";
import "./styles.css";

const App = () => {
  const [eqFilterVal, setEqFilterVal] = useState(0.0);
  const [layerToggle, setLayerToggle] = useState(true);
  return (
    <div className="app-container">
      <ReactScene eqFilterVal={eqFilterVal} layerToggle={layerToggle} />

      {/* 🔹 React UI Overlay */}
      <div className="ui-overlay">
        <h1>Filter Earthquakes</h1>
        <input
          type="range"
          min="0"
          max="5"
          step="0.1"
          value={eqFilterVal}
          onChange={(e) => setEqFilterVal(parseFloat(e.target.value))}
        />
        <p>Magnitude Filter: {eqFilterVal}</p>
        <label>
          <input
            type="checkbox"
            checked={layerToggle}
            onChange={() => setLayerToggle(prev => !prev)}
          />
          Toggle Earthquake Visibility
        </label>
      </div>
    </div>
  );
};

export default App;
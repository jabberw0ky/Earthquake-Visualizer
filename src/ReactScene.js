import React, { useEffect, useState } from "react";
import ThreeScene from "./ThreeMapScene";

const ReactScene = ({ eqFilterVal, layerToggle }) => {
  const [threeMap, setThreeMap] = useState(null);

  useEffect(() => {
    const container = document.getElementById("three-container");
    const mapInstance = new ThreeScene(container, eqFilterVal);
    setThreeMap(mapInstance);

    return () => {
      mapInstance.dispose();
    };
  }, []);

  useEffect(() => {
    if (threeMap) {
      threeMap.updateMagnitudeFilter(eqFilterVal);
    }
  }, [eqFilterVal]);

  useEffect(() => {
    if (threeMap) {
      threeMap.updateEarthquakeLayerVisibility(layerToggle);
    }
  }, [layerToggle]);

  return <div id="three-container" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }} />;
};

export default ReactScene;
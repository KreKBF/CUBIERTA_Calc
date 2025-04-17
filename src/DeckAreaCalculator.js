import InteractiveDeckSelector from "./InteractiveDeckSelector";
import React, { useState } from "react";
import "./InteractiveDeckSelector.css"; // подключим стили прямо тут

export default function DeckAreaCalculator() {
  const [length, setLength] = useState(10);
  const [beam, setBeam] = useState(3.5);
  const [zones, setZones] = useState({
    cockpit: true,
    sideDecks: true,
    foredeck: false,
    swimPlatform: false,
    flybridge: false,
  });

  const zoneFactors = {
    cockpit: 0.1,
    sideDecks: 0.15,
    foredeck: 0.1,
    swimPlatform: 0.05,
    flybridge: 0.1,
  };

  const pricePerSqM = 18;

  const selectedFactor = Object.entries(zones)
    .filter(([_, active]) => active)
    .reduce((acc, [zone, _]) => acc + zoneFactors[zone], 0);

  const area = Math.round(length * beam * selectedFactor * 10) / 10;
  const price = Math.round(area * pricePerSqM);

  const handleZoneToggle = (zone) => {
    setZones((prev) => ({ ...prev, [zone]: !prev[zone] }));
  };

  return (
    <div className="container">
      <div className="calculator">
        <h2>Calculadora: Kit de inicio para cubierta</h2>
        <label>
         Length (m):
         <input
          type="number"
          value={length}
          onChange={(e) => setLength(parseFloat(e.target.value))}
     />
       </label>
       <label>
        Width (m):
        <input
          type="number"
          value={beam}
          onChange={(e) => setBeam(parseFloat(e.target.value))}
     />
        </label>
        <h4>¿Qué zonas deseas incluir?</h4>
        <p>
          <strong>Superficie estimada:</strong> {area} m²
        </p>
        <p>
          <strong>Precio estimado del kit:</strong> €{price}
        </p>
      </div>

      <InteractiveDeckSelector
        zones={zones}
        onZoneToggle={handleZoneToggle}
      />
    </div>
  );
}


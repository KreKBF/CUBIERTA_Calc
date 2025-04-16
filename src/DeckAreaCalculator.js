import React, { useState } from "react";

export default function DeckAreaCalculator() {
  const [length, setLength] = useState(10); // в метрах
  const [beam, setBeam] = useState(3.5); // ширина лодки
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

  const pricePerSqM = 18; // €/м²

  const selectedFactor = Object.entries(zones)
    .filter(([_, active]) => active)
    .reduce((acc, [zone, _]) => acc + zoneFactors[zone], 0);

  const area = Math.round(length * beam * selectedFactor * 10) / 10;
  const price = Math.round(area * pricePerSqM);

  const handleZoneToggle = (zone) => {
    setZones((prev) => ({ ...prev, [zone]: !prev[zone] }));
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <h2>Calculadora: Kit de inicio para cubierta</h2>
      <div>
        <label>
          Boat Length (m):
          <input
            type="number"
            value={length}
            onChange={(e) => setLength(parseFloat(e.target.value))}
          />
        </label>
      </div>
      <div>
        <label>
          Boat Width (Beam, m):
          <input
            type="number"
            value={beam}
            onChange={(e) => setBeam(parseFloat(e.target.value))}
          />
        </label>
      </div>
      <div>
        {Object.keys(zones).map((zone) => (
          <label key={zone}>
            <input
              type="checkbox"
              checked={zones[zone]}
              onChange={() => handleZoneToggle(zone)}
            />
            {zone}
          </label>
        ))}
      </div>
      <div>
        <p>
          <strong>Estimated Area:</strong> {area} m²
        </p>
        <p>
          <strong>Estimated Price:</strong> €{price}
        </p>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import "./InteractiveDeckSelector.css";

export default function InteractiveDeckSelector({ zones, onZoneToggle }) {
  const zoneList = [
    { id: "cockpit", label: "Cockpit" },
    { id: "sideDecks", label: "Side Decks" },
    { id: "foredeck", label: "Foredeck" },
    { id: "swimPlatform", label: "Swim Platform" },
    { id: "flybridge", label: "Flybridge" }
  ];

  return (
    <svg
      viewBox="0 0 400 800"
      xmlns="http://www.w3.org/2000/svg"
      className="deck-schematic"
    >
      {/* Background silhouette (placeholder shape) */}
      <rect x="80" y="50" width="240" height="700" rx="40" ry="40" fill="#f2f2f2" />

      {zoneList.map((zone, index) => {
        const zonePositions = {
          cockpit: { x: 120, y: 400, w: 160, h: 120 },
          sideDecks: { x: 90, y: 300, w: 220, h: 300 },
          foredeck: { x: 120, y: 100, w: 160, h: 100 },
          swimPlatform: { x: 140, y: 620, w: 120, h: 50 },
          flybridge: { x: 120, y: 20, w: 160, h: 40 }
        };

        const pos = zonePositions[zone.id];

        return (
          <g
            key={zone.id}
            onClick={() => onZoneToggle(zone.id)}
            style={{ cursor: "pointer" }}
          >
            <rect
              x={pos.x}
              y={pos.y}
              width={pos.w}
              height={pos.h}
              fill={zones[zone.id] ? "#0077b6" : "#d9d9d9"}
              stroke="#333"
              strokeWidth="2"
              rx="8"
            />
            <text
              x={pos.x + pos.w / 2}
              y={pos.y + pos.h / 2}
              textAnchor="middle"
              alignmentBaseline="middle"
              fill="#fff"
              fontSize="12"
              fontWeight="bold"
            >
              {zone.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

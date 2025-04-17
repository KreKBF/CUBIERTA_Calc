import React from "react";
import "./InteractiveDeckSelector.css";

export default function InteractiveDeckSelector({ zones, onZoneToggle }) {
  return (
    <svg
      viewBox="0 0 300 700"
      xmlns="http://www.w3.org/2000/svg"
      className="deck-schematic"
    >
      {/* Корпус лодки */}
      <path
        d="M150,0 C180,20 200,80 200,350 C200,620 180,680 150,700 C120,680 100,620 100,350 C100,80 120,20 150,0 Z"
        fill="#f2f2f2"
        stroke="#333"
        strokeWidth="2"
      />

      {/* Foredeck */}
      <g onClick={() => onZoneToggle("foredeck")}
         style={{ cursor: "pointer" }}>
        <rect
          x="120"
          y="60"
          width="60"
          height="80"
          fill={zones.foredeck ? "#0077b6" : "#d9d9d9"}
          stroke="#333"
          rx="6"
        />
        <text x="150" y="100" textAnchor="middle" fill="#fff" fontSize="10">
          Foredeck
        </text>
      </g>

      {/* Cockpit */}
      <g onClick={() => onZoneToggle("cockpit")}
         style={{ cursor: "pointer" }}>
        <rect
          x="110"
          y="160"
          width="80"
          height="120"
          fill={zones.cockpit ? "#0077b6" : "#d9d9d9"}
          stroke="#333"
          rx="6"
        />
        <text x="150" y="220" textAnchor="middle" fill="#fff" fontSize="10">
          Cockpit
        </text>
      </g>

      {/* Side Decks */}
      <g onClick={() => onZoneToggle("sideDecks")}
         style={{ cursor: "pointer" }}>
        <rect
          x="85"
          y="300"
          width="130"
          height="180"
          fill={zones.sideDecks ? "#0077b6" : "#d9d9d9"}
          stroke="#333"
          rx="6"
        />
        <text x="150" y="390" textAnchor="middle" fill="#fff" fontSize="10">
          Side Decks
        </text>
      </g>

      {/* Swim Platform */}
      <g onClick={() => onZoneToggle("swimPlatform")}
         style={{ cursor: "pointer" }}>
        <rect
          x="120"
          y="510"
          width="60"
          height="40"
          fill={zones.swimPlatform ? "#0077b6" : "#d9d9d9"}
          stroke="#333"
          rx="6"
        />
        <text x="150" y="535" textAnchor="middle" fill="#fff" fontSize="10">
          Swim Platform
        </text>
      </g>
    </svg>
  );
}

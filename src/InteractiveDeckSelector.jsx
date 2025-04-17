import React from "react";
import "./InteractiveDeckSelector.css";

export default function InteractiveDeckSelector({ zones, onZoneToggle }) {
  return (
    <svg
      viewBox="0 0 400 800"
      xmlns="http://www.w3.org/2000/svg"
      className="deck-schematic"
    >
      {/* Foredeck */}
      <g onClick={() => onZoneToggle("foredeck")} style={{ cursor: "pointer" }}>
        <polygon
          points="200,5 300,140 100,140"
          fill={zones.foredeck ? "#0077b6" : "#d9d9d9"}
          stroke="#333"
        />
        <text x="200" y="110" textAnchor="middle" fill="#fff" fontSize="14">
          Foredeck
        </text>
      </g>

      {/* Cockpit */}
      <g onClick={() => onZoneToggle("cockpit")} style={{ cursor: "pointer" }}>
        <rect
          x="140"
          y="140"
          width="120"
          height="240"
          fill={zones.cockpit ? "#0077b6" : "#d9d9d9"}
          stroke="#333"
        />
        <text x="200" y="330" textAnchor="middle" fill="#fff" fontSize="14">
          Cockpit
        </text>
      </g>

      {/* Flybridge */}
      <g onClick={() => onZoneToggle("flybridge")} style={{ cursor: "pointer" }}>
        <rect
          x="160"
          y="165"
          width="80"
          height="120"
          fill={zones.flybridge ? "#023e8a" : "#bdbdbd"}
          stroke="#333"
        />
        <text x="200" y="230" textAnchor="middle" fill="#fff" fontSize="10">
          Flybridge
        </text>
      </g>

      {/* Side Decks */}
      <g onClick={() => onZoneToggle("sideDecks")} style={{ cursor: "pointer" }}>
        <polygon
          points="100,140 140,140 140,380 100,380"
          fill={zones.sideDecks ? "#0077b6" : "#d9d9d9"}
          stroke="#333"
        />
        <polygon
          points="300,140 260,140 260,380 300,380"
          fill={zones.sideDecks ? "#0077b6" : "#d9d9d9"}
          stroke="#333"
        />
        <text
          x="115"
          y="260"
          transform="rotate(-90 115,260)"
          textAnchor="middle"
          fill="#fff"
          fontSize="12"
        >
          Side Deck
        </text>
        <text
          x="285"
          y="260"
          transform="rotate(90 285,260)"
          textAnchor="middle"
          fill="#fff"
          fontSize="12"
        >
          Side Deck
        </text>
      </g>
      
    {/* Swim Platform */}
      <g onClick={() => onZoneToggle("swimPlatform")} style={{ cursor: "pointer" }}>
       <polygon
         points="100,380 300,380 280,490 120,490"
         fill={zones.swimPlatform ? "#0077b6" : "#d9d9d9"}
         stroke="#333"
        />
      <text x="200" y="420" textAnchor="middle" fill="#fff" fontSize="14">
      Swim Platform
      </text>
      </g>
    </svg>
  );
}

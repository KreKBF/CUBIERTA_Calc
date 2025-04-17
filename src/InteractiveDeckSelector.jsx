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
          points="200,40 260,140 140,140"
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
          height="200"
          fill={zones.cockpit ? "#0077b6" : "#d9d9d9"}
          stroke="#333"
        />
        <text x="200" y="210" textAnchor="middle" fill="#fff" fontSize="14">
          Cockpit
        </text>
      </g>

      {/* Flybridge */}
      <g onClick={() => onZoneToggle("flybridge")} style={{ cursor: "pointer" }}>
        <rect
          x="170"
          y="165"
          width="60"
          height="60"
          fill={zones.flybridge ? "#023e8a" : "#bdbdbd"}
          stroke="#333"
        />
        <text x="200" y="200" textAnchor="middle" fill="#fff" fontSize="10">
          Flybridge
        </text>
      </g>

      {/* Side Decks */}
      <g onClick={() => onZoneToggle("sideDecks")} style={{ cursor: "pointer" }}>
        <polygon
          points="100,140 140,140 140,280 100,280"
          fill={zones.sideDecks ? "#0077b6" : "#d9d9d9"}
          stroke="#333"
        />
        <polygon
          points="300,140 260,140 260,280 300,280"
          fill={zones.sideDecks ? "#0077b6" : "#d9d9d9"}
          stroke="#333"
        />
        <text x="200" y="350" textAnchor="middle" fill="#fff" fontSize="14">
          Side Decks
        </text>
      </g>

      {/* Swim Platform */}
      <g
        onClick={() => onZoneToggle("swimPlatform")}
        style={{ cursor: "pointer" }}
      >
        <polygon
          points="140,520 260,520 240,580 160,580"
          fill={zones.swimPlatform ? "#0077b6" : "#d9d9d9"}
          stroke="#333"
        />
        <text x="200" y="560" textAnchor="middle" fill="#fff" fontSize="14">
          Swim Platform
        </text>
      </g>
    </svg>
  );
}

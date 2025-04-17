import React from "react";
import "./InteractiveDeckSelector.css";

export default function InteractiveDeckSelector({ zones, onZoneToggle }) {
  return (
    <svg
      viewBox="0 0 300 600"
      xmlns="http://www.w3.org/2000/svg"
      className="deck-schematic"
    >
      {/* Foredeck (triangle) */}
      <g onClick={() => onZoneToggle("foredeck")}
         style={{ cursor: "pointer" }}>
        <polygon
          points="150,20 190,80 110,80"
          fill={zones.foredeck ? "#0077b6" : "#d9d9d9"}
          stroke="#333"
        />
        <text x="150" y="60" textAnchor="middle" fill="#fff" fontSize="10">
          Foredeck
        </text>
      </g>

      {/* Cockpit (rectangle) */}
      <g onClick={() => onZoneToggle("cockpit")}
         style={{ cursor: "pointer" }}>
        <rect
          x="110"
          y="80"
          width="80"
          height="100"
          fill={zones.cockpit ? "#0077b6" : "#d9d9d9"}
          stroke="#333"
        />
        <text x="150" y="130" textAnchor="middle" fill="#fff" fontSize="10">
          Cockpit
        </text>
      </g>

      {/* Flybridge (square inside cockpit) */}
      <g onClick={() => onZoneToggle("flybridge")}
         style={{ cursor: "pointer" }}>
        <rect
          x="130"
          y="95"
          width="40"
          height="40"
          fill={zones.flybridge ? "#023e8a" : "#bdbdbd"}
          stroke="#333"
        />
        <text x="150" y="118" textAnchor="middle" fill="#fff" fontSize="8">
          Flybridge
        </text>
      </g>

      {/* Side Decks (trapezoids) */}
      <g onClick={() => onZoneToggle("sideDecks")}
         style={{ cursor: "pointer" }}>
        <polygon
          points="90,80 105,80 105,300 90,320"
          fill={zones.sideDecks ? "#0077b6" : "#d9d9d9"}
          stroke="#333"
        />
        <polygon
          points="195,80 190,80 190,300 195,320"
          fill={zones.sideDecks ? "#0077b6" : "#d9d9d9"}
          stroke="#333"
        />
        <text x="150" y="250" textAnchor="middle" fill="#fff" fontSize="10">
          Side Decks
        </text>
      </g>

      {/* Swim Platform (trapezoid bottom) */}
      <g onClick={() => onZoneToggle("swimPlatform")}
         style={{ cursor: "pointer" }}>
        <polygon
          points="100,320 200,320 180,360 120,360"
          fill={zones.swimPlatform ? "#0077b6" : "#d9d9d9"}
          stroke="#333"
        />
        <text x="150" y="345" textAnchor="middle" fill="#fff" fontSize="10">
          Swim Platform
        </text>
      </g>
    </svg>
  );
}

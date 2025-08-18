import InteractiveDeckSelector from "./InteractiveDeckSelector";
import React, {
  useState,
  useRef,
  useLayoutEffect,
  useEffect,
  useCallback,
} from "react";
import "./InteractiveDeckSelector.css";

export default function DeckAreaCalculator() {
  const containerRef = useRef(null);
  const calcRef = useRef(null);

  const [length, setLength] = useState(10);
  const [beam, setBeam] = useState(3.5);
  const [zones, setZones] = useState({
    cockpit: true,
    sideDecks: true,
    foredeck: false,
    swimPlatform: false,
    flybridge: false,
  });

  // стабильный колбэк (использует только refs, они стабильны)
  const syncHeights = useCallback(() => {
    if (!calcRef.current || !containerRef.current) return;
    const h = calcRef.current.offsetHeight;
    containerRef.current.style.setProperty("--calc-h", `${h}px`);
  }, []);

  // пересчёт при изменении данных формы/зон
  useLayoutEffect(() => {
    syncHeights();
  }, [length, beam, zones, syncHeights]);

  // пересчёт при ресайзе и изменении высоты левой колонки
  useEffect(() => {
    syncHeights();
    const onResize = () => syncHeights();
    window.addEventListener("resize", onResize);

    let ro;
    if (window.ResizeObserver && calcRef.current) {
      ro = new ResizeObserver(syncHeights);
      ro.observe(calcRef.current);
    }

    return () => {
      window.removeEventListener("resize", onResize);
      if (ro) ro.disconnect();
    };
  }, [syncHeights]);

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
    .reduce((acc, [zone]) => acc + zoneFactors[zone], 0);

  const area = Math.round(length * beam * selectedFactor * 10) / 10;
  const price = Math.round(area * pricePerSqM);

  const handleZoneToggle = (zone) => {
    setZones((prev) => ({ ...prev, [zone]: !prev[zone] }));
  };

  // (опционально) аккуратно парсим запятую в десятичной части
  const toNumber = (v) => {
    const n = parseFloat(String(v).replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  };

  return (
    <>
      <h2 className="main-title">Calculadora: Kit de inicio para cubierta</h2>
      <div className="container" ref={containerRef}>
        <div className="calculator" ref={calcRef}>
          <label>
            Length (m):
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              value={length}
              onChange={(e) => setLength(toNumber(e.target.value))}
            />
          </label>
          <label>
            Width (m):
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              value={beam}
              onChange={(e) => setBeam(toNumber(e.target.value))}
            />
          </label>

          <h4>¿Qué zonas deseas incluir?</h4>
          <div className="zone-checkboxes">
            {Object.entries(zones).map(([zone, active]) => (
              <label key={zone} className="zone-option">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => handleZoneToggle(zone)}
                />
                <span>{zone.charAt(0).toUpperCase() + zone.slice(1)}</span>
              </label>
            ))}
          </div>

          <p>
            <strong>Superficie estimada:</strong> {area} m²
          </p>
          <p>
            <strong>Precio estimado del kit:</strong> €{price}
          </p>
        </div>

        <InteractiveDeckSelector zones={zones} onZoneToggle={handleZoneToggle} />
      </div>
    </>
  );
}

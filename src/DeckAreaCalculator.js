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

  // === Настройки расчёта (менять здесь) ===
  const UNIT_PRICE_EUR_NO_IVA = 396;   // €/m², sin IVA — cámbialo aquí
  const INITIAL_DEPOSIT_RATE = 0.10;  // 10% de anticipo

  const [length, setLength] = useState(10);
  const [beam, setBeam] = useState(3.5);
  const [zones, setZones] = useState({
    cockpit: true,
    sideDecks: true,
    foredeck: false,
    swimPlatform: false,
    flybridge: false,
  });

  // устойчивый парсинг чисел с запятой
  const toNumber = (v) => {
    const n = parseFloat(String(v).replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  };

  // валюта/площадь для ES
  const eur = new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });
  const m2 = (v) =>
    v.toLocaleString("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  // синхронизация высоты левой колонки в CSS-переменную --calc-h
  const syncHeights = useCallback(() => {
    if (!calcRef.current || !containerRef.current) return;
    const h = calcRef.current.offsetHeight;
    containerRef.current.style.setProperty("--calc-h", `${h}px`);
  }, []);

  useLayoutEffect(() => {
    syncHeights();
  }, [length, beam, zones, syncHeights]);

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

  // коэффициенты зон
  const zoneFactors = {
    cockpit: 0.1,
    sideDecks: 0.15,
    foredeck: 0.1,
    swimPlatform: 0.05,
    flybridge: 0.1,
  };

  const selectedFactor = Object.entries(zones)
    .filter(([_, active]) => active)
    .reduce((acc, [zone]) => acc + zoneFactors[zone], 0);

  const area = Math.round(length * beam * selectedFactor * 10) / 10; // м²
  const totalNoIVA = Math.round(area * UNIT_PRICE_EUR_NO_IVA);       // €
  const initialCost = Math.round(totalNoIVA * INITIAL_DEPOSIT_RATE); // €

  const handleZoneToggle = (zone) => {
    setZones((prev) => ({ ...prev, [zone]: !prev[zone] }));
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
              onChange={(e) => setLength(Math.max(0, toNumber(e.target.value)))}
            />
          </label>

          <label>
            Width (m):
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              value={beam}
              onChange={(e) => setBeam(Math.max(0, toNumber(e.target.value)))}
            />
          </label>

          {/* Подсказка под полями длины/ширины */}
          <p className="hint">
            <em>
              Si no conoces las medidas exactas, introduce las del pasaporte de la embarcación.
            </em>
          </p>

          <h4>¿Qué zonas deseas incluir?</h4>
          {/* Подсказка под заголовком зон */}
          <p className="hint">
            <em>
              Nota: puedes seleccionar una o varias zonas. El coste se calcula automáticamente.
            </em>
          </p>

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

          {/* Итоги */}
          <p>
            <strong>Superficie estimada:</strong> {m2(area)} m²
          </p>
          <p>
            <strong>Coste aproximado del conjunto (IVA no incluido):</strong>{" "}
            {eur.format(totalNoIVA)}
          </p>
          <p>
            <strong>Coste inicial del proyecto (10%):</strong> {eur.format(initialCost)}
          </p>

          {/* Подсказка под итогами */}
          <p className="hint">
            <em>
              Incluye la compra de materiales para la plantilla y la toma de plantilla en tu marina.
              El anticipo confirma tu compromiso con el proyecto y reserva un hueco en el calendario.
            </em>
          </p>
        </div>

        <InteractiveDeckSelector zones={zones} onZoneToggle={handleZoneToggle} />
      </div>
    </>
  );
}

// src/DeckAreaCalculator.js
import InteractiveDeckSelector from "./InteractiveDeckSelector";
import React, {
  useState,
  useRef,
  useLayoutEffect,
  useEffect,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import "./InteractiveDeckSelector.css";

export default function DeckAreaCalculator() {
  const containerRef = useRef(null);
  const calcRef = useRef(null);
  const navigate = useNavigate();

  /* === Настройки расчёта (менять здесь) === */
  const UNIT_PRICE_EUR_NO_IVA = 396;   /* €/m², sin IVA */
  const INITIAL_DEPOSIT_RATE = 0.10;   /* 10% anticipo */

  // Храним строки, чтобы позволить пустое значение и не «подставлять» 0
  const [lengthRaw, setLengthRaw] = useState("10");
  const [beamRaw, setBeamRaw] = useState("3.5");

  const [zones, setZones] = useState({
    cockpit: true,
    sideDecks: true,
    foredeck: false,
    swimPlatform: false,
    flybridge: false,
  });

  /* === Парсинг/очистка === */
  // в число (разрешаем запятую); пустое/минус трактуем как 0 для расчёта
  const toNumber = (s) => {
    if (s === "" || s === "-" || s == null) return 0;
    const n = parseFloat(String(s).replace(",", "."));
    return Number.isFinite(n) ? Math.max(0, n) : 0;
  };

  // мягкая очистка во время ввода (не навязываем формат)
  const cleanWhileTyping = (v) => {
    if (v === "" || v === "-") return v; // разрешаем пустое/минус при наборе
    v = v.replace(",", ".").replace(/[^\d.]/g, ""); // только цифры и одна точка
    v = v.replace(/^(\d*\.\d*).*$/, "$1"); // отсекаем всё после второй точки
    const [int = "", frac] = v.split(".");
    const intNoZeros = int.replace(/^0+(?=\d)/, ""); // убираем лидирующие нули (кроме "0.")
    return frac !== undefined ? `${intNoZeros}.${frac}` : intNoZeros;
  };

  // финальная нормализация по blur
  const normalizeOnBlur = (v) => {
    if (v === "") return ""; // пустое остаётся пустым
    const n = toNumber(v);   // 0, если было "-" или мусор
    return String(n).replace(/^0+(?=\d)/, "");
  };

  /* валюта/площадь для ES */
  const eur = new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });
  const m2 = (v) =>
    v.toLocaleString("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  /* синхронизация высоты левой колонки в CSS-переменную --calc-h */
  const syncHeights = useCallback(() => {
    if (!calcRef.current || !containerRef.current) return;
    const h = calcRef.current.offsetHeight;
    containerRef.current.style.setProperty("--calc-h", `${h}px`);
  }, []);

  useLayoutEffect(() => {
    syncHeights();
  }, [lengthRaw, beamRaw, zones, syncHeights]);

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

  /* коэффициенты зон */
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

  const L = toNumber(lengthRaw);
  const W = toNumber(beamRaw);
  const area = Math.round(L * W * selectedFactor * 10) / 10;         /* м² */
  const totalNoIVA = Math.round(area * UNIT_PRICE_EUR_NO_IVA);       /* € (целое число) */
  const initialCost = Math.round(totalNoIVA * INITIAL_DEPOSIT_RATE); /* € (целое число) */

  const handleZoneToggle = (zone) => {
    setZones((prev) => ({ ...prev, [zone]: !prev[zone] }));
  };

  // Кнопка «Оставить заявку»: передаём расчёт в /start?quote=... (base64(JSON))
  const goToStartForm = () => {
    const payload = {
      areaM2: area,
      estimatedCostCents: totalNoIVA * 100,
      depositCents: initialCost * 100,
      currency: "eur",
    };
    const quote = btoa(JSON.stringify(payload));
    navigate(`/start?quote=${encodeURIComponent(quote)}`);
  };

  return (
    <>
      <h2 className="main-title">Calculadora: Kit de inicio para cubierta</h2>
      <div className="container" ref={containerRef}>
        <div className="calculator" ref={calcRef}>
          <label>
            Length (m):
            <input
              type="text"                 /* текст — полный контроль над форматированием */
              inputMode="decimal"         /* цифровая клавиатура на мобилках */
              placeholder="ej. 6,76"
              value={lengthRaw}
              onChange={(e) => setLengthRaw(cleanWhileTyping(e.target.value))}
              onBlur={() => setLengthRaw((v) => normalizeOnBlur(v))}
            />
          </label>

          <label>
            Width (m):
            <input
              type="text"
              inputMode="decimal"
              placeholder="ej. 2,56"
              value={beamRaw}
              onChange={(e) => setBeamRaw(cleanWhileTyping(e.target.value))}
              onBlur={() => setBeamRaw((v) => normalizeOnBlur(v))}
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
            <strong>Coste inicial del proyecto:</strong> {eur.format(initialCost)}
          </p>

          {/* Кнопка перехода к форме заявки */}
          <div style={{ marginTop: 16 }}>
            <button
              type="button"
              onClick={goToStartForm}
              className="cta-btn"
            >
              Enviar solicitud
            </button>
          </div>

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

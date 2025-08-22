 import InteractiveDeckSelector from "./InteractiveDeckSelector";
 import React, {
   useState,
   useRef,
   useLayoutEffect,
   useEffect,
   useCallback,
 } from "react";
 import { useNavigate } from "react-router-dom"; /* ⬅ добавили роутер для перехода на /start */
 import "./InteractiveDeckSelector.css";
 
 export default function DeckAreaCalculator() {
   const containerRef = useRef(null);
   const calcRef = useRef(null);
   const navigate = useNavigate(); /* ⬅ хук навигации */
 
   /* === Настройки расчёта (менять здесь) === */
   const UNIT_PRICE_EUR_NO_IVA = 396;   /* €/m², sin IVA */
   const INITIAL_DEPOSIT_RATE = 0.10;   /* 10% anticipo */
 
-  const [length, setLength] = useState(10);
-  const [beam, setBeam] = useState(3.5);
+  /* Храним СТРОКИ, чтобы позволить пустое значение и не «подставлять» 0 */
+  const [lengthRaw, setLengthRaw] = useState("10");
+  const [beamRaw,   setBeamRaw]   = useState("3.5");
   const [zones, setZones] = useState({
     cockpit: true,
     sideDecks: true,
     foredeck: false,
     swimPlatform: false,
     flybridge: false,
   });
 
-  /* устойчивый парсинг чисел с запятой */
-  const toNumber = (v) => {
-    const n = parseFloat(String(v).replace(",", "."));
-    return Number.isFinite(n) ? n : 0;
-  };
+  /* === Парсинг/очистка === */
+  // в число (разрешаем запятую); пустое/минус трактуем как 0 для расчёта
+  const toNumber = (s) => {
+    if (s === "" || s === "-" || s == null) return 0;
+    const n = parseFloat(String(s).replace(",", "."));
+    return Number.isFinite(n) ? Math.max(0, n) : 0;
+  };
+  // мягкая очистка во время ввода (не навязываем формат)
+  const cleanWhileTyping = (v) => {
+    if (v === "" || v === "-") return v;                    // разрешаем пустое/минус при наборе
+    v = v.replace(",", ".").replace(/[^\d.]/g, "");         // только цифры и одна точка
+    v = v.replace(/^(\d*\.\d*).*$/, "$1");                  // отсекаем всё после второй точки
+    const [int = "", frac] = v.split(".");
+    const intNoZeros = int.replace(/^0+(?=\d)/, "");        // убираем ведущие нули (кроме "0.")
+    return frac !== undefined ? `${intNoZeros}.${frac}` : intNoZeros;
+  };
+  // финальная нормализация по blur
+  const normalizeOnBlur = (v) => {
+    if (v === "") return "";                                // пустое остаётся пустым
+    const n = toNumber(v);                                  // 0, если было "-" или мусор
+    return String(n).replace(/^0+(?=\d)/, "");
+  };
 
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
-  }, [length, beam, zones, syncHeights]);
+  }, [lengthRaw, beamRaw, zones, syncHeights]);
 
   useEffect(() => {
     syncHeights();
     const onResize = () => syncHeights();
     window.addEventListener("resize", onResize);
@@
   const selectedFactor = Object.entries(zones)
     .filter(([_, active]) => active)
     .reduce((acc, [zone]) => acc + zoneFactors[zone], 0);
 
-  const area = Math.round(length * beam * selectedFactor * 10) / 10; /* м² */
+  const L = toNumber(lengthRaw);
+  const W = toNumber(beamRaw);
+  const area = Math.round(L * W * selectedFactor * 10) / 10;         /* м² */
   const totalNoIVA = Math.round(area * UNIT_PRICE_EUR_NO_IVA);       /* € (целое число) */
   const initialCost = Math.round(totalNoIVA * INITIAL_DEPOSIT_RATE); /* € (целое число) */
@@
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
-            <input
-              type="number"
-              inputMode="decimal"
-              step="0.1"
-              value={length}
-              onChange={(e) => setLength(Math.max(0, toNumber(e.target.value)))}
-            />
+            <input
+              type="text"                 /* текст — полный контроль над форматированием */
+              inputMode="decimal"         /* цифровая клавиатура на мобилках */
+              placeholder="ej. 6,76"
+              value={lengthRaw}
+              onChange={(e) => setLengthRaw(cleanWhileTyping(e.target.value))}
+              onBlur={() => setLengthRaw((v) => normalizeOnBlur(v))}
+            />
           </label>
 
           <label>
             Width (m):
-            <input
-              type="number"
-              inputMode="decimal"
-              step="0.1"
-              value={beam}
-              onChange={(e) => setBeam(Math.max(0, toNumber(e.target.value)))}
-            />
+            <input
+              type="text"
+              inputMode="decimal"
+              placeholder="ej. 2,56"
+              value={beamRaw}
+              onChange={(e) => setBeamRaw(cleanWhileTyping(e.target.value))}
+              onBlur={() => setBeamRaw((v) => normalizeOnBlur(v))}
+            />
           </label>
 
           {/* Подсказка под полями длины/ширины */}
           <p className="hint">
             <em>
               Si no conoces las medidas exactas, introduce las del pasaporte de la embarcación.
             </em>
           </p>
@@
           <p>
             <strong>Coste inicial del proyecto:</strong> {eur.format(initialCost)}
           </p>
@@
         </div>
 
         <InteractiveDeckSelector zones={zones} onZoneToggle={handleZoneToggle} />
       </div>
     </>
   );
 }

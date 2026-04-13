import { useMemo, useState, useEffect } from 'react';
import { useSorteo } from '../contexts/SorteoContext';

export function MapaInteractivo({ tipo, onSelect, turnoActual }) {
  const { parqueaderos, asignaciones } = useSorteo();
  const [svgMarkup, setSvgMarkup] = useState(null);

  const usuarioYaAsigno = useMemo(() => {
    if (!turnoActual) return false;
    return asignaciones.some(a => a.usuario === turnoActual);
  }, [turnoActual, asignaciones]);

  const mapConfig = useMemo(() => {
    if (tipo === 'motos') {
      return { src: '/mapa moto.svg', width: 2068, height: 1211 };
    }
    if (tipo === 'carros') {
      return { src: '/mapa carro.svg', width: 2138, height: 1211 };
    }
    return { src: '/mapita.png', width: 2138, height: 1211 };
  }, [tipo]);

  const carLayout = useMemo(() => {
    const items = [];
    
    // 1-9 compartidos abajo de Torre 5 (el antiguo "10" compartido ahora es "10c")
    for (let i = 0; i < 5; i++) {
      items.push({ numero: String(i * 2 + 1), x: 1395, y: 505 + i * 43, width: 45, height: 35 });
      const parNumero = String(i * 2 + 2);
      items.push({ numero: parNumero === '10' ? '10c' : parNumero, x: 1445, y: 505 + i * 43, width: 45, height: 35 });
    }
    
    // 01-10 individuales (Al lado de Torre 8)
    for (let i = 1; i <= 10; i++) {
      items.push({
        numero: String(i).padStart(2, '0'),
        x: 1610 + (i * 3.5),
        y: 990 - ((i - 1) * 45),
        width: 50,
        height: 38
      });
    }
    
    // 12-20 vertical (debajo de torre 7)
    for (let i = 12; i <= 20; i++) {
      items.push({
        numero: String(i),
        x: 1640 + ((i - 12) * 2.5),
        y: 485 - ((i - 12) * 45),
        width: 50,
        height: 38
      });
    }
    
    // 26-38 tramo inferior (con espacio reservado donde el SVG tiene el texto 'No')
    const bottomIds = ['26', '27', '28', '29', '30', '31', '32', '33', '34', '35', '36', '37', '38'];
    bottomIds.forEach((id, index) => {
      let offset = index;
      if (index >= 6) offset += 1.1; // Gap después de 30 para evitar el 'No'
      items.push({ 
        numero: id, 
        x: 1545 - offset * 51, 
        y: 995, 
        width: 45, 
        height: 40 
      });
    });
    return items;
  }, []);

  const motoLayout = useMemo(() => {
    const items = [];
    // M1-M7 bottom right
    for (let i = 1; i <= 7; i++) {
      items.push({ numero: `M${i}`, x: 1105 + (i - 1) * 20, y: 1100, width: 18, height: 30 });
    }
    // M8, M9
    items.push({ numero: 'M8', x: 1250, y: 1100, width: 18, height: 30 });
    items.push({ numero: 'M9', x: 1270, y: 1100, width: 18, height: 30 });
    items.push({ numero: 'M10', x: 1290, y: 1100, width: 18, height: 30 });
    // M11
    items.push({ numero: '11', x: 1045, y: 480, width: 40, height: 28 });
    // M12-M20 vertical
    for (let i = 12; i <= 20; i++) {
      items.push({ numero: `M${i}`, x: 1060, y: 925 - (i - 12) * 39, width: 40, height: 28 });
    }
    // M21, M22 horizontal
    items.push({ numero: 'M21', x: 1005, y: 755, width: 40, height: 28 });
    items.push({ numero: 'M22', x: 1005, y: 715, width: 40, height: 28 });
    // M23-M26 top right
    items.push({ numero: 'M25', x: 1110, y: 110, width: 28, height: 40 });
    items.push({ numero: 'M24', x: 1145, y: 110, width: 28, height: 40 });
    items.push({ numero: 'M23', x: 1180, y: 110, width: 28, height: 40 });
    items.push({ numero: 'M26', x: 1110, y: 155, width: 60, height: 28 });
    return items;
  }, []);

  const slots = useMemo(() => {
    if (tipo === 'general') return []; 
    const tipoInterno = tipo === 'carros' ? 'carro' : 'moto';
    const base = parqueaderos.filter(p => p.tipo === tipoInterno);
    const layout = tipoInterno === 'carro' ? carLayout : motoLayout;
    const mapByNum = new Map(base.map(p => [p.numero, p]));
    return layout
      .filter(l => mapByNum.has(l.numero))
      .map(l => {
        const p = mapByNum.get(l.numero);
        const capacidad = p.capacidad || 1;
        const ocupadosArr = Array.isArray(p.ocupadoPor) ? p.ocupadoPor : (p.ocupadoPor ? [p.ocupadoPor] : []);
        const ocupados = ocupadosArr.length;
        const compartido = capacidad > 1;
        const disponible = ocupados < capacidad;
        return { ...l, capacidad, ocupados, compartido, disponible, p };
      });
  }, [tipo, parqueaderos, carLayout, motoLayout]);

  const encontrarSlotPorEtiqueta = (rawLabel) => {
    const raw = String(rawLabel || '').trim();
    if (!raw) return null;
    if (tipo === 'carros') {
      // Match estricto para todos los numeros: "9" !== "09", y soporta "10c".
      const rawLower = raw.toLowerCase();
      return slots.find(x => String(x.numero).toLowerCase() === rawLower) || null;
    }
    if (tipo === 'motos') {
      // En motos mantenemos la regla existente: "11" es especial, el resto usa prefijo M.
      if (/^M\d+$/i.test(raw)) {
        const up = raw.toUpperCase();
        return slots.find(x => x.numero === up) || null;
      }
      if (/^\d+$/.test(raw)) {
        if (raw === '11') return slots.find(x => x.numero === '11') || null;
        return slots.find(x => x.numero === `M${raw}`) || null;
      }
      return null;
    }
    return null;
  };

  useEffect(() => {
    let active = true;
    if (tipo === 'carros' || tipo === 'motos') {
      fetch(mapConfig.src)
        .then(r => r.text())
        .then(t => {
          if (!active) return;
          try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(t, 'image/svg+xml');
            const svg = doc.documentElement;
            svg.setAttribute('width', String(mapConfig.width));
            svg.setAttribute('height', String(mapConfig.height));
            
            // Reemplazar color rojo de la base si existiera por negro o algo neutral, o dejar como esté
            // para que no haya falsos ocupados
            const paths = Array.from(svg.querySelectorAll('path, rect, polygon, polyline'));
            paths.forEach(el => {
              if (el.getAttribute('fill') === '#ff0000' || el.getAttribute('fill') === 'red') {
                el.setAttribute('fill', '#e2e8f0'); // color base claro
              }
            });

            const texts = Array.from(svg.querySelectorAll('text'));
            texts.forEach(el => {
              // Obtener todo el texto contenido, incluso si está en tspans
              let raw = (el.textContent || '').trim();
              
              // Si el texto está vacío o es solo espacio, intentamos buscar en tspans
              if (!raw) {
                raw = Array.from(el.querySelectorAll('tspan'))
                  .map(t => (t.textContent || '').trim())
                  .join('');
              }

              // Normalizar el texto (quitar ceros a la izquierda si es solo número para el match)
              if (!raw || (!/^\d+$/.test(raw) && !/^M\d+$/.test(raw) && !/^M\d+$/.test(raw.toUpperCase()))) return;
              
              let id = raw;
              // Si el tipo es motos y el raw es un número, le anteponemos M (excepto para el 11 que parece ser especial)
              if (tipo === 'motos' && /^\d+$/.test(raw) && raw !== '11') {
                id = `M${raw}`;
              }

              // Resolver ambiguedad de "10" en carros: uno es 10 normal y otro es 10c compartido.
              const textX = parseFloat(el.getAttribute('x') || '0');
              const lookupId = (tipo === 'carros' && raw === '10' && Number.isFinite(textX))
                ? (textX < 1500 ? '10c' : '10')
                : raw;
              
              // Buscamos si está ocupado
              const slotEncontrado = encontrarSlotPorEtiqueta(lookupId) || encontrarSlotPorEtiqueta(id);
              
              el.setAttribute('data-parqueo', slotEncontrado ? slotEncontrado.numero : lookupId);

              const bg = doc.createElementNS('http://www.w3.org/2000/svg', 'rect');
              const transform = el.getAttribute('transform');
              let x = parseFloat(el.getAttribute('x') || 0);
              let y = parseFloat(el.getAttribute('y') || 0);
              if (transform && transform.includes('translate')) {
                const match = transform.match(/translate\(([-\d.]+)\s+([-\d.]+)\)/);
                if (match) {
                  x += parseFloat(match[1]);
                  y += parseFloat(match[2]);
                }
              }
              const isRotated = transform && transform.includes('rotate(-90)');
              let finalX = x;
              let finalY = y;
              let rectWidth = 35;
              let rectHeight = 35;
              if (isRotated) {
                finalX -= 25;
                finalY -= 15;
                rectWidth = 30;
                rectHeight = 40;
              } else {
                finalX -= 15;
                finalY -= 25;
                rectWidth = 40;
                rectHeight = 30;
              }

              bg.setAttribute('x', finalX);
              bg.setAttribute('y', finalY);
              bg.setAttribute('width', rectWidth);
              bg.setAttribute('height', rectHeight);
              bg.setAttribute('rx', '4');
              bg.setAttribute('data-parqueo', slotEncontrado ? slotEncontrado.numero : id);

              const ocupados = slotEncontrado ? slotEncontrado.ocupados : 0;
              const capacidad = slotEncontrado ? slotEncontrado.capacidad : 1;
              const ocupantes = slotEncontrado
                ? (Array.isArray(slotEncontrado.p?.ocupadoPor) ? slotEncontrado.p.ocupadoPor : [])
                : [];
              const tieneAlguien = ocupados > 0;
              const lleno = slotEncontrado ? ocupados >= capacidad : false;

              if (lleno) {
                bg.setAttribute('fill', '#ef4444');
                bg.setAttribute('fill-opacity', '1');
                el.setAttribute('fill', '#ffffff');
                el.setAttribute('font-weight', 'bold');
              } else if (tieneAlguien) {
                bg.setAttribute('fill', '#f59e0b');
                bg.setAttribute('fill-opacity', '1');
                el.setAttribute('fill', '#111827');
                el.setAttribute('font-weight', 'bold');
              } else {
                bg.setAttribute('fill', '#000000');
                bg.setAttribute('fill-opacity', '0');
              }

              bg.setAttribute('style', 'pointer-events:all;');
              if (slotEncontrado) {
                const title = doc.createElementNS('http://www.w3.org/2000/svg', 'title');
                title.textContent = ocupantes.length
                  ? `Parqueadero ${slotEncontrado.numero} - Asignado a: ${ocupantes.join(', ')}`
                  : `Parqueadero ${slotEncontrado.numero} - Disponible`;
                bg.appendChild(title);
              }
              el.parentNode.insertBefore(bg, el);

              if (slotEncontrado && ocupantes.length > 0) {
                const badge = doc.createElementNS('http://www.w3.org/2000/svg', 'text');
                const nombre = String(ocupantes[0] || '').slice(0, 10);
                const extra = ocupantes.length > 1 ? ` +${ocupantes.length - 1}` : '';
                badge.textContent = `${nombre}${extra}`;
                badge.setAttribute('x', String(finalX + rectWidth / 2));
                badge.setAttribute('y', String(finalY + rectHeight + 10));
                badge.setAttribute('text-anchor', 'middle');
                badge.setAttribute('font-size', '8');
                badge.setAttribute('font-weight', '700');
                badge.setAttribute('fill', '#1f2937');
                badge.setAttribute('data-parqueo', slotEncontrado.numero);
                badge.setAttribute('style', 'pointer-events:none;');
                el.parentNode.insertBefore(badge, el.nextSibling);
              }

              if (slotEncontrado && slotEncontrado.disponible) {
                el.setAttribute('style', (el.getAttribute('style') || '') + ';cursor:pointer;');
              } else if (slotEncontrado && !slotEncontrado.disponible) {
                el.setAttribute('style', (el.getAttribute('style') || '') + ';cursor:not-allowed;');
              }
            });
            const style = doc.createElementNS('http://www.w3.org/2000/svg', 'style');
            style.textContent = '[data-parqueo]{pointer-events:auto}';
            svg.insertBefore(style, svg.firstChild);
            const serializer = new XMLSerializer();
            const serialized = serializer.serializeToString(svg);
            setSvgMarkup(serialized);
          } catch (err) {
            console.error('Error parseando SVG', err);
            setSvgMarkup(null);
          }
        })
        .catch((err) => {
          console.error('Error cargando SVG', err);
          setSvgMarkup(null);
        });
    } else {
      setSvgMarkup(null);
    }
    return () => { active = false; };
  }, [tipo, mapConfig.src, mapConfig.width, mapConfig.height, slots]);

  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerClass = isFullscreen 
    ? "fixed inset-0 z-[100] bg-white w-screen h-screen flex flex-col p-4 overflow-auto" 
    : "w-full h-full flex flex-col overflow-auto relative";

  const svgContainerClass = isFullscreen
    ? "w-full flex-1 border-2 border-gray-300 rounded-xl bg-gray-50 relative flex items-center justify-center min-w-[1400px] min-h-[900px]"
    : "w-full flex-1 border rounded-xl bg-white relative flex items-center justify-center min-w-[1200px] min-h-[800px]";

  const handleSvgClick = (e) => {
    if (!onSelect || usuarioYaAsigno) return;
    const el = e.target && e.target.closest ? e.target.closest('[data-parqueo]') : null;
    let candidates = [];
    if (el && el.getAttribute) {
      const v = el.getAttribute('data-parqueo');
      if (v) candidates.push(v);
    }
    if (candidates.length === 0) {
      const tag = e.target && e.target.tagName ? e.target.tagName.toLowerCase() : '';
      if (tag !== 'text' && tag !== 'tspan') return;
      const rawText = (e.target.textContent || '').trim();
      if (!/^\d+$/.test(rawText)) return;
      if (tipo === 'carros') {
        candidates = [rawText];
      } else if (tipo === 'motos') {
        if (rawText === '11') {
          candidates = ['11'];
        } else {
          candidates = [`M${rawText}`];
        }
      }
    }
    const s = slots.find(x => candidates.includes(x.numero) && x.disponible)
      || candidates.map(encontrarSlotPorEtiqueta).find(x => x && x.disponible);
    if (s) onSelect(s);
  };

  return (
    <div className={containerClass}>
      <div className="flex justify-end mb-2 shrink-0">
        <button 
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="px-4 py-2 bg-brand-c4 text-white rounded-lg font-bold shadow-md hover:bg-brand-c5 transition-colors flex items-center gap-2"
        >
          {isFullscreen ? (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              Cerrar Vista Ampliada
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
              Agrandar Mapa
            </>
          )}
        </button>
      </div>
      <div className={svgContainerClass}>
        <svg
          viewBox={`0 0 ${mapConfig.width} ${mapConfig.height}`}
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
          onClick={handleSvgClick}
          style={{ cursor: usuarioYaAsigno ? 'not-allowed' : 'default' }}
        >
          {tipo === 'carros' || tipo === 'motos' ? (
            svgMarkup ? (
              <g dangerouslySetInnerHTML={{ __html: svgMarkup }} />
            ) : (
              <g>
                <rect x="0" y="0" width={mapConfig.width} height={mapConfig.height} fill="#f8fafc" />
                <text x={mapConfig.width/2} y={mapConfig.height/2} textAnchor="middle" fontSize="24" fill="#475569">Cargando mapa…</text>
              </g>
            )
          ) : (
            <image href={mapConfig.src} x="0" y="0" width={mapConfig.width} height={mapConfig.height} preserveAspectRatio="none" />
          )}
          
        </svg>
      </div>
    </div>
  );
}

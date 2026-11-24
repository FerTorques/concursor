import * as pdfjsLib from 'pdfjs-dist';
import { aplicarReglasNormativas } from './normativeRules';

// Configurar Worker de PDF.js de forma resiliente
if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.0.379'}/pdf.worker.min.mjs`;
  } catch (err) {
    console.warn('PDF.js worker fallback notice:', err);
  }
}

/**
 * Parsea el texto extraído de las páginas del PDF de Planilla Anexa I
 * usando las coordenadas X/Y de cada celda de la tabla oficial:
 * N° (<65) | NOMBRE (65..152) | B.P. (152..180) | MOD. (180..240) |
 * CAT. (240..265) | ZONA (265..307) | JORNADA (307..350) |
 * LOCALIDAD (350..421) | ORIGEN DE LA VACANTE (>=421)
 */
export async function parsearPdfPlanilla(fileOrBuffer) {
  let arrayBuffer;
  if (fileOrBuffer instanceof ArrayBuffer) {
    arrayBuffer = fileOrBuffer;
  } else if (fileOrBuffer instanceof Blob || fileOrBuffer instanceof File) {
    arrayBuffer = await fileOrBuffer.arrayBuffer();
  } else {
    throw new Error('Tipo de archivo no soportado para parsear PDF');
  }

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    useSystemFonts: true,
  });

  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  let currentRegion = 'REGION I - Misión Nueva Pompeya';
  const rawRows = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();

    const lineMap = new Map();
    const allItems = [];

    for (const item of textContent.items) {
      if (!item.str || !item.str.trim()) continue;
      const x = item.transform[4];
      const y = item.transform[5];
      const text = item.str.trim();
      allItems.push({ text, x, y });

      const ry = Math.round(y / 3) * 3;
      if (!lineMap.has(ry)) lineMap.set(ry, []);
      lineMap.get(ry).push({ text, x, y });
    }

    const anchors = [];
    const regions = [];
    let headerY = null;

    const sortedYs = Array.from(lineMap.keys()).sort((a, b) => b - a);
    for (const ry of sortedYs) {
      const items = lineMap.get(ry).sort((a, b) => a.x - b.x);
      const lineText = items.map((i) => i.text).join(' ');

      if (/^\s*N[°º]\s+NOMBRE\s+B\.?P\.?/i.test(lineText)) {
        headerY = ry;
        continue;
      }

      if (/^REGI[OÓ]N\s+/i.test(lineText) && items[0].x > 100 && items[0].x < 320) {
        regions.push({ y: items[0].y, text: lineText.trim() });
        continue;
      }

      const first = items[0];
      if (first && first.x < 65 && /^\d{1,3}$/.test(first.text)) {
        anchors.push({
          orden: parseInt(first.text, 10),
          y: first.y
        });
      }
    }

    anchors.sort((a, b) => b.y - a.y);
    regions.sort((a, b) => b.y - a.y);

    const dataItems = allItems.filter((it) => {
      if (headerY !== null && it.y >= headerY - 2) return false;
      if (regions.some((r) => Math.abs(it.y - r.y) < 3 && it.x > 100 && it.x < 350)) return false;
      if (/^Página\s+\d+/i.test(it.text)) return false;
      return true;
    });

    for (let i = 0; i < anchors.length; i++) {
      const anchor = anchors[i];

      let reg = currentRegion;
      for (const r of regions) {
        if (r.y > anchor.y) {
          reg = r.text;
        }
      }

      let effectiveUpper = i === 0 ? Infinity : (anchors[i - 1].y + anchor.y) / 2;
      for (const r of regions) {
        if (r.y > anchor.y && r.y < effectiveUpper) {
          effectiveUpper = r.y;
        }
      }

      let effectiveLower = i === anchors.length - 1 ? -Infinity : (anchor.y + anchors[i + 1].y) / 2;
      for (const r of regions) {
        if (r.y < anchor.y && r.y > effectiveLower) {
          effectiveLower = r.y;
        }
      }

      const rowItems = dataItems
        .filter((it) => it.y <= effectiveUpper && it.y > effectiveLower)
        .sort((a, b) => (Math.abs(b.y - a.y) > 2 ? b.y - a.y : a.x - b.x));

      const cols = {
        nombre: [],
        bp: [],
        mod: [],
        cat: [],
        zona: [],
        jornada: [],
        localidad: [],
        origen: []
      };

      for (const it of rowItems) {
        if (it.x < 65) continue;
        else if (it.x < 152) cols.nombre.push(it.text);
        else if (it.x < 180) cols.bp.push(it.text);
        else if (it.x < 240) cols.mod.push(it.text);
        else if (it.x < 265) cols.cat.push(it.text);
        else if (it.x < 307) cols.zona.push(it.text);
        else if (it.x < 350) cols.jornada.push(it.text);
        else if (it.x < 421) cols.localidad.push(it.text);
        else cols.origen.push(it.text);
      }

      const clean = (arr) => arr.join(' ').replace(/\s+/g, ' ').trim();
      const jornada = clean(cols.jornada).replace(/^Complet\s+a$/i, 'Completa') || 'Simple';

      rawRows.push({
        id: `cargo-pdf-${anchor.orden}`,
        orden: anchor.orden,
        region: reg,
        nombre: clean(cols.nombre),
        bp: clean(cols.bp),
        cat: clean(cols.cat) || '1ª',
        mod: clean(cols.mod) || 'Pública',
        zona: clean(cols.zona) || 'ZU 1',
        jornada,
        localidad: clean(cols.localidad),
        origen: clean(cols.origen) || 'CONCURSO GENERAL - MECCYT',
        estado: 'disponible',
        titular_nombre: '',
        titular_dni: '',
        reserva_nombre: '',
        reserva_dni: '',
        etiqueta_normativa: '',
        observaciones: ''
      });
    }

    if (regions.length > 0) {
      currentRegion = regions[regions.length - 1].text;
    }
  }

  // Aplicar motor de reglas normativas automáticas
  const resultado = aplicarReglasNormativas(rawRows);

  return {
    rawRows,
    cargos: resultado.cargos,
    reporte: resultado.reporte,
    numPages
  };
}
